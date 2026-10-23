/**
 * Job Queue Processor
 *
 * Preferred backend: Bull queue on Redis.
 *
 * SnapDeploy runs this platform as a single container backed by MongoDB Atlas
 * only. Requiring Redis there made every generation request fail with
 * QUEUE_ENQUEUE_FAILED, so the processor supports three modes:
 *
 *   auto   (default) - try Redis; if it is unavailable, run the job
 *                      in-process so the product keeps working.
 *   redis  - strict: fail job creation when Redis is unavailable.
 *   inline - never connect to Redis; always run in-process.
 *
 * In-process execution is sequential per slot (QUEUE_INLINE_CONCURRENCY,
 * default 2) and keeps the same job lifecycle: the job is persisted in MongoDB
 * first and Orchestrator.executeJob updates queued -> processing -> completed
 * or failed. On restart, recoverStuckJobs() fails interrupted jobs.
 */

import Queue from 'bull';
import config from '../config';
import logger from '../utils/logger';
import orchestrator from '../orchestrator/Orchestrator';

export interface JobQueueData {
  jobId: string;
  userId: string;
  type: string;
}

export interface QueueConnectionStatus {
  connected: boolean;
  state: string;
  mode: 'auto' | 'redis' | 'inline';
  lastError?: string;
}

/** How long a single enqueue may block while Redis is unavailable. */
const ENQUEUE_TIMEOUT_MS = 5000;
/** Shorter budget in 'auto' mode so a missing Redis never delays a request. */
const AUTO_FALLBACK_TIMEOUT_MS = 2000;
/** Minimum interval between repeated connection-error log lines. */
const ERROR_LOG_THROTTLE_MS = 30000;

export class JobQueueProcessor {
  private queue: Queue.Queue<JobQueueData> | null = null;
  private lastError?: string;
  private lastErrorLoggedAt = 0;
  private readonly mode: 'auto' | 'redis' | 'inline';

  /** Job ids waiting for an in-process slot. */
  private inlinePending: string[] = [];
  /** Number of in-process jobs currently executing. */
  private inlineActive = 0;

  constructor(modeOverride?: 'auto' | 'redis' | 'inline') {
    this.mode = modeOverride || config.jobQueue.mode;

    if (this.mode === 'inline') {
      logger.info(
        '[Queue] Inline mode: jobs run in-process, no Redis connection is opened',
      );
      return;
    }

    this.queue = new Queue(config.jobQueue.name, config.redis.url, {
      // Keep the HTTP process responsive when Redis is unavailable instead of
      // blocking requests on the offline command queue.
      redis: {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
    });
    this.setupEventHandlers();
  }

  /**
   * Setup queue event handlers
   */
  private setupEventHandlers(): void {
    if (!this.queue) return;

    // Job processing
    this.queue.process(config.jobQueue.maxAttempts, async (job) => {
      logger.info(`[Queue] Processing job ${job.data.jobId}`);

      try {
        await orchestrator.executeJob(job.data.jobId);
        logger.info(`[Queue] Job ${job.data.jobId} completed`);
        return { status: 'completed' };
      } catch (error) {
        logger.error(`[Queue] Job ${job.data.jobId} failed`, error);
        throw error;
      }
    });

    // Job completed
    this.queue.on('completed', (job) => {
      logger.info(`[Queue] Job completed: ${job.data.jobId}`);
    });

    // Job failed
    this.queue.on('failed', (job, err) => {
      logger.error(`[Queue] Job failed after retries: ${job.data.jobId}`, err);
    });

    // Job error — Redis connection problems can repeat every second, so
    // throttle the log to keep container logs useful.
    this.queue.on('error', (error) => {
      this.lastError = error instanceof Error ? error.message : String(error);
      const now = Date.now();
      if (now - this.lastErrorLoggedAt >= ERROR_LOG_THROTTLE_MS) {
        logger.error('[Queue] Queue error', error);
        this.lastErrorLoggedAt = now;
      } else {
        logger.debug(`[Queue] Queue error (throttled): ${this.lastError}`);
      }
    });

    logger.info('[Queue] Job queue processor initialized (Bull/Redis)');
  }

  /**
   * Non-blocking connection status derived from the underlying ioredis client.
   * Safe to call when Redis is down (does not await a connection).
   */
  getConnectionStatus(): QueueConnectionStatus {
    if (this.mode === 'inline') {
      return { connected: true, state: 'inline', mode: this.mode };
    }
    const client = (this.queue as unknown as { client?: { status?: string } })
      ?.client;
    const state = client?.status || 'unknown';
    return {
      connected: state === 'ready',
      state,
      mode: this.mode,
      lastError: this.lastError,
    };
  }

  /**
   * Enqueue a job for processing.
   *
   * Redis enqueue is bounded by a timeout, so a Redis outage cannot hang the
   * request that created the job. In 'auto' mode an unavailable Redis falls
   * back to in-process execution instead of failing the request.
   */
  async enqueueJob(jobId: string, userId: string, jobType: string): Promise<void> {
    if (this.mode === 'inline' || !this.queue) {
      this.enqueueInline(jobId);
      return;
    }

    const timeoutMs =
      this.mode === 'auto' ? AUTO_FALLBACK_TIMEOUT_MS : ENQUEUE_TIMEOUT_MS;

    const addPromise = this.queue.add(
      { jobId, userId, type: jobType },
      {
        // Use the application job id as the Bull job id so the job can be
        // located and removed when it is cancelled.
        jobId,
        priority: 1, // Default priority
        attempts: config.jobQueue.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: config.jobQueue.backoffDelay,
        },
        timeout: config.jobQueue.timeout,
        removeOnComplete: false, // Keep job history
      },
    );

    // The timeout handle is cleared in `finally` so a successful enqueue does
    // not leave a pending 2-5s timer behind in the process.
    let timeoutHandle: NodeJS.Timeout | undefined;
    try {
      const job = await Promise.race([
        addPromise,
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(
            () =>
              reject(
                new Error(
                  `Queue enqueue timed out after ${timeoutMs}ms (Redis unavailable)`,
                ),
              ),
            timeoutMs,
          );
        }),
      ]);

      logger.info(`[Queue] Job ${jobId} enqueued with ID ${job.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;

      if (this.mode === 'redis') {
        logger.error(`[Queue] Failed to enqueue job ${jobId}: ${message}`);
        throw error;
      }

      logger.warn(
        `[Queue] Redis enqueue failed for job ${jobId} (${message}) - falling back to in-process execution`,
      );

      // The Bull add may still resolve later, when Redis reconnects. Remove
      // that duplicate so the job is not executed twice.
      void addPromise
        .then((job) => job?.remove().catch(() => undefined))
        .catch(() => undefined);

      this.enqueueInline(jobId);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  /**
   * Queue a job for in-process execution and start draining if a slot is free.
   */
  private enqueueInline(jobId: string): void {
    if (this.inlinePending.includes(jobId)) return;
    this.inlinePending.push(jobId);
    logger.info(
      `[Queue] Job ${jobId} queued in-process (pending: ${this.inlinePending.length})`,
    );
    this.drainInline();
  }

  /**
   * Start in-process jobs up to the configured concurrency.
   * setImmediate keeps job execution off the HTTP request path.
   */
  private drainInline(): void {
    while (
      this.inlineActive < config.jobQueue.inlineConcurrency &&
      this.inlinePending.length > 0
    ) {
      const jobId = this.inlinePending.shift();
      if (!jobId) return;
      this.inlineActive += 1;
      setImmediate(async () => {
        try {
          await orchestrator.executeJob(jobId);
        } catch (error) {
          logger.error(`[Queue] In-process job ${jobId} failed`, error);
        } finally {
          this.inlineActive -= 1;
          this.drainInline();
        }
      });
    }
  }

  /**
   * Remove a job from the queue. Used when a job is cancelled before it runs.
   *
   * Safe to call when Redis is unavailable: returns false and the worker will
   * still skip the job because its database status is already terminal.
   */
  async removeJob(jobId: string): Promise<boolean> {
    const pendingIndex = this.inlinePending.indexOf(jobId);
    if (pendingIndex !== -1) {
      this.inlinePending.splice(pendingIndex, 1);
      logger.info(`[JobQueue] Removed cancelled in-process job ${jobId}`);
      return true;
    }

    try {
      if (!this.queue) {
        return false;
      }
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return false;
      }
      await job.remove();
      logger.info(`[JobQueue] Removed cancelled job ${jobId}`);
      return true;
    } catch (error) {
      logger.warn(
        `[JobQueue] Failed to remove job ${jobId}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    if (!this.queue) {
      return {
        waiting: this.inlinePending.length,
        active: this.inlineActive,
        completed: 0,
        failed: 0,
      };
    }
    const counts = await this.queue.getJobCounts();
    return {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
    };
  }

  /**
   * Clean up queue (close connection)
   */
  async close(): Promise<void> {
    if (!this.queue) return;
    await this.queue.close();
    logger.info('[Queue] Job queue processor closed');
  }
}

// Create singleton instance
const jobQueueProcessor = new JobQueueProcessor();

export default jobQueueProcessor;
