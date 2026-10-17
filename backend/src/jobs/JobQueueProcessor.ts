/**
 * Job Queue Processor
 * Processes jobs using Bull queue with Redis backend
 * Integrates with Orchestrator for job execution
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
  lastError?: string;
}

/** How long a single enqueue may block while Redis is unavailable. */
const ENQUEUE_TIMEOUT_MS = 5000;
/** Minimum interval between repeated connection-error log lines. */
const ERROR_LOG_THROTTLE_MS = 30000;

class JobQueueProcessor {
  private queue: Queue.Queue<JobQueueData>;
  private lastError?: string;
  private lastErrorLoggedAt = 0;

  constructor() {
    this.queue = new Queue('ai-jobs', config.redis.url, {
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
    // Job processing
    this.queue.process(config.jobQueue.concurrency, async (job) => {
      logger.info(`[Queue] Processing job ${job.data.jobId}`);

      try {
        await orchestrator.executeJob(job.data.jobId, {
          attemptsMade: job.attemptsMade,
          attempts: Number(job.opts.attempts) || 1,
        });
        logger.info(`[Queue] Job ${job.data.jobId} completed`);
        return { status: 'completed' };
      } catch (error) {
        logger.error(`[Queue] Job ${job.data.jobId} failed: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });

    // Job completed
    this.queue.on('completed', (job) => {
      logger.info(`[Queue] Job completed: ${job.data.jobId}`);
    });

    // Job failed
    this.queue.on('failed', (job, err) => {
      logger.error(`[Queue] Job attempt failed: ${job.data.jobId}: ${err instanceof Error ? err.message : String(err)}`);
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

    logger.info('[Queue] Job queue processor initialized');
  }

  /**
   * Non-blocking connection status derived from the underlying ioredis client.
   * Safe to call when Redis is down (does not await a connection).
   */
  getConnectionStatus(): QueueConnectionStatus {
    const client = (this.queue as unknown as { client?: { status?: string } }).client;
    const state = client?.status || 'unknown';
    return {
      connected: state === 'ready',
      state,
      lastError: this.lastError,
    };
  }

  /**
   * Enqueue a job for processing.
   *
   * Bounded by ENQUEUE_TIMEOUT_MS so a Redis outage cannot hang the request
   * that created the job.
   */
  async enqueueJob(jobId: string, userId: string, jobType: string): Promise<void> {
    try {
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

      const job = await Promise.race([
        addPromise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Queue enqueue timed out after ${ENQUEUE_TIMEOUT_MS}ms (Redis unavailable)`)),
            ENQUEUE_TIMEOUT_MS,
          ),
        ),
      ]);

      logger.info(`[Queue] Job ${jobId} enqueued with ID ${job.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      logger.error(`[Queue] Failed to enqueue job ${jobId}: ${message}`);
      throw error;
    }
  }

  /**
   * Remove a job from the queue. Used when a job is cancelled before it runs.
   *
   * Safe to call when Redis is unavailable: returns false and the worker will
   * still skip the job because its database status is already terminal.
   */
  async removeJob(jobId: string): Promise<boolean> {
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
  async getStats(): Promise<{ waiting: number; active: number; completed: number; failed: number }> {
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
    await this.queue.close();
    logger.info('[Queue] Job queue processor closed');
  }
}

// Create singleton instance
const jobQueueProcessor = new JobQueueProcessor();

export default jobQueueProcessor;
