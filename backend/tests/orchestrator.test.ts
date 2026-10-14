/**
 * Orchestrator integration tests
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator';
import { JobType, JobPriority, JobStatus } from '../src/types';

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
});
