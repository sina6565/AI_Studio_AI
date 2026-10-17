/**
 * Orchestrator integration tests
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator';
import { JobType, JobPriority, JobStatus } from '../src/types';
import { Job } from '../src/database/models';
import jobQueueProcessor from '../src/jobs/JobQueueProcessor';

// Mock external I/O boundaries so the suite runs without MongoDB or Redis.
jest.mock('../src/database/models', () => ({
  Job: {
    create: jest.fn(async (doc: any) => ({
      ...doc,
      id: doc._id,
      createdAt: new Date(),
      save: jest.fn(async () => undefined),
    })),
    findById: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('../src/jobs/JobQueueProcessor', () => ({
  __esModule: true,
  default: {
    enqueueJob: jest.fn(async () => undefined),
    getStats: jest.fn(async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })),
    close: jest.fn(async () => undefined),
  },
}));

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeAll(async () => {
    orchestrator = new Orchestrator();

    // Mock provider for testing
    const mockProvider = {
      name: 'TestProvider',
      capabilities: ['image_generation'],
      initialize: async () => {},
      healthCheck: async () => ({
        healthy: true,
        responseTime: 100,
        timestamp: new Date(),
      }),
      getRateLimitStatus: async () => ({
        remaining: 100,
        reset: new Date(),
        limit: 100,
      }),
      executeJob: async (_job: any) => ({
        output: {
          imageUrl: 'https://example.com/image.png',
          format: 'png',
        },
      }),
      validateInput: async () => ({ valid: true }),
      validateCredentials: async () => true,
      getSupportedModels: async () => ({ image_generation: ['v1'] }),
    };

    orchestrator.registerProvider(mockProvider as any);
  });

  describe('createJob', () => {
    it('should create a job successfully', async () => {
      const response = await orchestrator.createJob({
        userId: 'test-user-1',
        jobType: JobType.IMAGE_GENERATION,
        input: {
          prompt: 'A beautiful sunset',
          size: '1024x1024',
        },
        priority: JobPriority.NORMAL,
      });

      expect(response).toBeDefined();
      expect(response.jobId).toBeDefined();
      expect(response.status).toBe(JobStatus.QUEUED);
      expect(response.createdAt).toBeInstanceOf(Date);
    });

    it('should reject job creation without userId', async () => {
      expect(
        orchestrator.createJob({
          userId: '',
          jobType: JobType.IMAGE_GENERATION,
          input: { prompt: 'test' },
        }),
      ).rejects.toThrow();
    });

    it('should reject job creation without jobType', async () => {
      expect(
        orchestrator.createJob({
          userId: 'test-user-1',
          jobType: '' as any,
          input: { prompt: 'test' },
        }),
      ).rejects.toThrow();
    });

    it('should reject job creation with empty input', async () => {
      expect(
        orchestrator.createJob({
          userId: 'test-user-1',
          jobType: JobType.IMAGE_GENERATION,
          input: {},
        }),
      ).rejects.toThrow();
    });
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      const mockProvider = {
        name: 'AnotherProvider',
        capabilities: ['video_generation'],
        initialize: async () => {},
        healthCheck: async () => ({
          healthy: true,
          responseTime: 100,
          timestamp: new Date(),
        }),
        getRateLimitStatus: async () => ({
          remaining: 100,
          reset: new Date(),
          limit: 100,
        }),
        executeJob: async () => ({ output: {} }),
        validateInput: async () => ({ valid: true }),
        validateCredentials: async () => true,
        getSupportedModels: async () => ({}),
      } as any;

      orchestrator.registerProvider(mockProvider);
      const providers = orchestrator.getAvailableProviders();

      expect(providers).toContainEqual(mockProvider);
    });
  });
  describe('executeJob retry behavior', () => {
    it('delegates retry scheduling to Bull and rejects the failed attempt', async () => {
      const job = {
        _id: 'job-retry-1',
        id: 'job-retry-1',
        userId: 'test-user-1',
        type: JobType.IMAGE_GENERATION,
        status: JobStatus.QUEUED,
        input: { prompt: 'test image' },
        progress: { percentage: 0, stage: 'queued' },
        metadata: { provider: 'FlakyProvider', retryCount: 0, maxRetries: 3 },
        save: jest.fn(async () => undefined),
      };
      (Job.findById as jest.Mock).mockResolvedValue(job);
      const flakyProvider = {
        name: 'FlakyProvider',
        capabilities: ['image_generation'],
        validateInput: jest.fn(async () => ({ valid: true })),
        generateImage: jest.fn(async () => { throw new Error('provider temporarily unavailable'); }),
      } as any;
      orchestrator.registerProvider(flakyProvider);
      (jobQueueProcessor.enqueueJob as jest.Mock).mockClear();

      await expect(orchestrator.executeJob('job-retry-1', { attemptsMade: 0, attempts: 3 }))
        .rejects.toThrow('provider temporarily unavailable');

      expect(job.status).toBe(JobStatus.QUEUED);
      expect(job.metadata.retryCount).toBe(1);
      expect(jobQueueProcessor.enqueueJob).not.toHaveBeenCalled();
      expect(job.save).toHaveBeenCalled();
    });
  });

});
