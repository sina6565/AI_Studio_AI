import { v4 as uuidv4 } from 'uuid';
import { IJob, JobStatus, JobType, JobPriority, UserPreferences } from '../types';
import { IProvider } from '../providers/interfaces/IProvider';
import { Router } from '../routing/Router';
import { Job as JobModel } from '../database/models';
import jobQueueProcessor from '../jobs/JobQueueProcessor';
import logger from '../utils/logger';
import { AppError, ValidationError } from '../types/errors';
import { GameService } from '../game/GameService';
import { gameJobCapability, isGameJobType, GameSpec } from '../game/types';

export interface OrchestratorRequest {
  userId: string;
  jobType: JobType;
  input: Record<string, any>;
  priority?: JobPriority;
  webhookUrl?: string;
  userPreferences?: UserPreferences;
}

export interface OrchestratorResponse {
  jobId: string;
  status: JobStatus;
  createdAt: Date;
}

export class Orchestrator {
  private router = new Router();
  private providers = new Map<string, IProvider>();
  private gameService = new GameService(this.router);

  /**
   * Register an AI provider with the orchestrator
   */
  registerProvider(provider: IProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
    logger.info(`[Orchestrator] Registered provider: ${provider.name}`);
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): IProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): IProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  /**
   * Create a new job and enqueue it for processing
   */
  async createJob(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    if (
      !request.userId ||
      !request.jobType ||
      !request.input ||
      !Object.keys(request.input).length
    ) {
      throw new ValidationError(
        'User, job type and input are required',
      );
    }

    const providers = this.getAvailableProviders();
    if (!providers.length) {
      throw new AppError(
        'NO_PROVIDERS',
        'No AI providers are currently available',
        503,
      );
    }

    // Game jobs are composite: route on the capability the pipeline needs
    // rather than asking a single provider to "create a game".
    const routingCapability = gameJobCapability(request.jobType);
    const decision = await this.router.route(routingCapability, providers, {
      jobType: request.jobType,
      capabilities: [routingCapability as any],
      userPreferences: request.userPreferences,
    });

    const job = await JobModel.create({
      _id: uuidv4(),
      userId: request.userId,
      type: request.jobType,
      status: JobStatus.QUEUED,
      priority: request.priority || JobPriority.NORMAL,
      input: request.input,
      metadata: {
        requestedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        provider: decision.providerName,
      },
      webhookUrl: request.webhookUrl,
    });

    logger.info(
      `[Orchestrator] Job created: ${job.id} (type: ${request.jobType}, provider: ${decision.providerName})`,
    );

    // Enqueue job to Bull queue for async processing
    try {
      await jobQueueProcessor.enqueueJob(
        job.id as string,
        request.userId,
        request.jobType,
      );
      logger.info(`[Orchestrator] Job ${job.id} enqueued to Bull queue`);
    } catch (error) {
      logger.error(
        `[Orchestrator] Failed to enqueue job ${job.id} to Bull queue`,
        error,
      );
      // Update job status to failed if queue enqueue fails
      job.status = JobStatus.FAILED;
      job.error = {
        code: 'QUEUE_ENQUEUE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to enqueue job',
      };
      await job.save();
      throw new AppError(
        'QUEUE_ENQUEUE_FAILED',
        'Failed to queue job for processing',
        503,
      );
    }

    return {
      jobId: job.id as string,
      status: job.status as JobStatus,
      createdAt: job.createdAt,
    };
  }

  /**
   * Execute a job asynchronously
   */
  async executeJob(jobId: string): Promise<void> {
    const job = await JobModel.findById(jobId);
    if (!job) {
      throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
    }

    // Skip jobs cancelled while queued: the Bull job may already be gone,
    // but the worker can still be handed a stale job id.
    if (job.status === JobStatus.CANCELLED) {
      logger.info(`[Orchestrator] Skipping cancelled job ${jobId}`);
      return;
    }

    const providerName = String(job.metadata?.provider || '').toLowerCase();
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new AppError('PROVIDER_NOT_FOUND', 'Provider not found', 503);
    }

    try {
      // Update job status to processing
      job.status = JobStatus.PROCESSING;
      job.progress = { percentage: 10, stage: 'started' };
      job.metadata.startedAt = new Date();
      await job.save();
      logger.info(`[Orchestrator] Processing job: ${jobId}`);

      // Validate input with provider
      const validation = await provider.validateInput(job.type, job.input);
      if (!validation.valid) {
        throw new ValidationError(
          `Invalid input for ${job.type}`,
          { errors: validation.errors },
        );
      }

      job.progress = { percentage: 20, stage: 'validated' };
      await job.save();

      // Execute task based on job type
      let output: any;
      if (isGameJobType(job.type)) {
        job.progress = { percentage: 10, stage: 'validating_game_spec' };
        await job.save();

        const report = async (percentage: number, stage: string) => {
          // Cancellation is checked at each stage boundary so a cancel during a
          // long multi-scene run stops before the next provider call instead of
          // being ignored until the whole pipeline finishes.
          const current = await JobModel.findById(jobId);
          if (current && current.status === JobStatus.CANCELLED) {
            throw new AppError('JOB_CANCELLED', 'Job was cancelled', 409);
          }
          job.progress = { percentage, stage };
          await job.save();
        };

        if (job.type === JobType.GAME_BUILD) {
          // Build a runnable scene-viewer artifact from a spec or a manifest
          // produced by an earlier game_creation job.
          const build = await this.gameService.buildGame(
            job.input as unknown as GameSpec,
            this.getAvailableProviders(),
            report,
          );

          output = {
            id: jobId,
            url: build.dataUrl,
            format: 'text/html',
            size: build.size,
            metadata: {
              manifest: build.manifest,
              artifact: {
                filename: build.filename,
                format: 'text/html',
                runtime: 'html5',
                navigation: 'click-through',
                sceneCount: build.manifest.scenes.length,
                // A scene viewer over a game definition: no gameplay mechanics.
                gameplayMechanics: false,
              },
            },
          };
        } else {
          const manifest = await this.gameService.createGame(
            job.input as unknown as GameSpec,
            this.getAvailableProviders(),
            report,
          );

          output = {
            id: jobId,
            url: manifest.assets[0]?.url || '',
            format: 'application/json',
            size: 0,
            metadata: { manifest },
          };
        }
      } else {
        switch (job.type) {
        case JobType.IMAGE_GENERATION:
          job.progress = { percentage: 30, stage: 'generating_image' };
          await job.save();
          output = await provider.generateImage(job.input as any);
          break;

        case JobType.VIDEO_GENERATION:
          job.progress = { percentage: 30, stage: 'generating_video' };
          await job.save();
          output = await provider.generateVideo(job.input as any);
          break;

        case JobType.AUDIO_GENERATION:
          job.progress = { percentage: 30, stage: 'generating_audio' };
          await job.save();
          output = await provider.generateAudio(job.input as any);
          break;

        case JobType.TEXT_TO_SPEECH:
          job.progress = { percentage: 30, stage: 'synthesizing_speech' };
          await job.save();
          output = await provider.synthesizeSpeech(job.input as any);
          break;

        default:
          throw new Error(`Unsupported job type: ${job.type}`);
        }
      }

      // Update job with result
      job.status = JobStatus.COMPLETED;
      job.progress = { percentage: 100, stage: 'completed' };
      job.output = output;
      job.result = {
        contentUrl: output.url,
        format: output.format,
        size: output.size || 0,
        duration: output.duration,
        metadata: output.metadata,
      };
      job.metadata.completedAt = new Date();
      job.metadata.executionTime =
        job.metadata.completedAt.getTime() -
        (job.metadata.startedAt?.getTime() || 0);

      await job.save();
      logger.info(
        `[Orchestrator] Job completed: ${jobId} (execution time: ${job.metadata.executionTime}ms)`,
      );
    } catch (error) {
      // A cancellation is not a failure: never retry it, and never overwrite
      // the cancelled status with a failure or a re-queue.
      if ((error as any)?.code === 'JOB_CANCELLED') {
        logger.info(`[Orchestrator] Job cancelled during execution: ${jobId}`);
        const current = await JobModel.findById(jobId);
        if (current && current.status !== JobStatus.CANCELLED) {
          current.status = JobStatus.CANCELLED;
          current.metadata.cancelledAt = new Date();
          await current.save();
        }
        return;
      }

      // Handle execution error with retry logic
      const shouldRetry =
        (job.metadata.retryCount || 0) <
        (job.metadata.maxRetries || 3);

      job.metadata.retryCount = (job.metadata.retryCount || 0) + 1;
      job.error = {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      };

      if (shouldRetry) {
        // Re-enqueue job to Bull queue for retry
        try {
          job.status = JobStatus.QUEUED;
          await job.save();
          
          await jobQueueProcessor.enqueueJob(jobId, job.userId, job.type);
          logger.info(
            `[Orchestrator] Job re-enqueued for retry (${job.metadata.retryCount}/${job.metadata.maxRetries}): ${jobId}`,
          );
        } catch (queueError) {
          logger.error(
            `[Orchestrator] Failed to re-enqueue job ${jobId} for retry`,
            queueError,
          );
          job.status = JobStatus.FAILED;
          await job.save();
        }
      } else {
        // Max retries exceeded
        job.status = JobStatus.FAILED;
        await job.save();
        logger.error(
          `[Orchestrator] Job execution failed after ${job.metadata.retryCount} retries: ${jobId}`,
          error,
        );
      }
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<IJob> {
    const job = await JobModel.findById(jobId);
    if (!job) {
      throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
    }
    return job as IJob;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await JobModel.findById(jobId);
    if (!job) {
      throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
    }

    if (
      [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED].includes(
        job.status as JobStatus,
      )
    ) {
      throw new AppError(
        'INVALID_JOB_STATE',
        `Cannot cancel job in status: ${job.status}`,
        400,
      );
    }

    // Remove the job from the queue so it cannot start after cancellation.
    await jobQueueProcessor.removeJob(jobId);
    job.status = JobStatus.CANCELLED;
    job.metadata.completedAt = new Date();
    await job.save();

    logger.info(`[Orchestrator] Job cancelled: ${jobId}`);
  }
}

export default new Orchestrator();
