/**
 * Orchestrator integration tests
 */

import { Orchestrator } from '../src/orchestrator/Orchestrator';
import { JobType, JobPriority, JobStatus } from '../src/types';
import { Job } from '../src/database/models';

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

  describe('local website jobs', () => {
    it('queues website builds without registering an AI provider', async () => {
      const localOrchestrator = new Orchestrator();
      const response = await localOrchestrator.createJob({
        userId: 'test-user-1',
        jobType: JobType.WEBSITE_BUILD,
        input: {
          name: 'SINA Studio',
          tagline: 'Build a universe',
          description: 'A creative studio.',
          kind: 'business',
          palette: 'midnight',
          language: 'en',
        },
      });

      expect(response.status).toBe(JobStatus.QUEUED);
    });
  });

  describe('manifest-based game builds', () => {

    it('executes a manifest-based game build when no AI provider is registered', async () => {
      const localOrchestrator = new Orchestrator();
      const save = jest.fn(async () => undefined);
      const manifest = {
        version: '1.0',
        title: 'Scene Project',
        description: 'Explore a collection of illustrated scenes.',
        genre: 'adventure',
        artStyle: 'pixel art',
        scenes: [{
          id: 'scene-1',
          name: 'Ruins',
          description: 'An ancient courtyard.',
          imageUrl: 'https://cdn.test/ruins.png',
        }],
        assets: [{
          sceneId: 'scene-1',
          url: 'https://cdn.test/ruins.png',
          format: 'png',
          provider: 'previous-provider',
        }],
        assetCount: 1,
        playable: false,
        engine: { type: 'scene-viewer', runtime: 'html5' },
        generatedAt: '2026-11-05T00:00:00.000Z',
        notes: 'Existing scene manifest',
      };
      const job = {
        id: 'game-job-1',
        _id: 'game-job-1',
        userId: 'test-user-1',
        type: JobType.GAME_BUILD,
        status: JobStatus.QUEUED,
        priority: JobPriority.NORMAL,
        input: manifest,
        metadata: {
          requestedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          provider: 'manifest-game-builder',
        },
        createdAt: new Date(),
        save,
      };
      const findById = Job.findById as jest.Mock;
      findById.mockResolvedValue(job);

      await localOrchestrator.executeJob('game-job-1');

      expect(job.status).toBe(JobStatus.COMPLETED);
      expect(job.save).toHaveBeenCalled();
      expect((job as any).result.format).toBe('text/html');
      expect((job as any).result.metadata).not.toHaveProperty('playableGame');
      expect((job as any).result.metadata.artifact.gameplayMechanics).toBe(false);
    });

    it('queues an existing game manifest without requiring an AI provider', async () => {
      const localOrchestrator = new Orchestrator();
      const createJob = Job.create as jest.Mock;
      createJob.mockClear();
      const manifest = {
        version: '1.0',
        title: 'Crystal Run',
        description: 'Collect the crystals and escape.',
        genre: 'adventure',
        artStyle: 'pixel art',
        scenes: [{
          id: 'scene-1',
          name: 'Ruins',
          description: 'An ancient courtyard.',
          imageUrl: 'https://cdn.test/ruins.png',
        }],
        assets: [{
          sceneId: 'scene-1',
          url: 'https://cdn.test/ruins.png',
          format: 'png',
          provider: 'previous-provider',
        }],
        assetCount: 1,
        playable: false,
        engine: { type: 'scene-viewer', runtime: 'html5' },
        generatedAt: '2026-11-05T00:00:00.000Z',
        notes: 'Existing scene manifest',
      };

      const response = await localOrchestrator.createJob({
        userId: 'test-user-1',
        jobType: JobType.GAME_BUILD,
        input: manifest,
      });

      expect(response.status).toBe(JobStatus.QUEUED);
      expect(createJob).toHaveBeenCalledWith(expect.objectContaining({
        type: JobType.GAME_BUILD,
        metadata: expect.objectContaining({ provider: 'manifest-game-builder' }),
      }));
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
