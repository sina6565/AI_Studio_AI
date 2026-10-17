/**
 * Job queue and retry-path tests.
 *
 * Covers the retry mechanism end to end at the unit level: a failed job must be
 * re-queued under an id Bull will actually accept, and the worker must be
 * tolerant of Redis being unavailable.
 *
 * The id rule matters because Bull silently ignores `add()` when the jobId
 * already exists — and the original entry is kept (`removeOnComplete: false`),
 * so re-using the base id made every retry a no-op that stranded the job in
 * `queued` forever.
 */

jest.mock('../src/jobs/JobQueueProcessor', () => ({
  __esModule: true,
  default: {
    enqueueJob: jest.fn(async () => undefined),
    removeJob: jest.fn(async () => true),
    getConnectionStatus: () => ({ connected: false, state: 'connecting' }),
    getStats: jest.fn(async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })),
    close: jest.fn(async () => undefined),
  },
}));

const findById = jest.fn();
jest.mock('../src/database/models', () => ({
  Job: { findById: (...args: unknown[]) => findById(...args) },
  Project: {},
  User: {},
}));

import jobQueueProcessor from '../src/jobs/JobQueueProcessor';
import { bullJobId, bullJobIds } from '../src/jobs/jobIds';
import { Orchestrator } from '../src/orchestrator/Orchestrator';
import { JobStatus, JobType } from '../src/types';
import type { IProvider } from '../src/providers/interfaces/IProvider';

function makeProvider(generateImage: jest.Mock): IProvider {
  return {
    name: 'flaky-provider',
    capabilities: ['image_generation'],
    validateInput: jest.fn(async () => ({ valid: true })),
    healthCheck: jest.fn(async () => true),
    generateImage,
    generateVideo: jest.fn(),
    generateAudio: jest.fn(),
    synthesizeSpeech: jest.fn(),
  } as unknown as IProvider;
}

function makeJob(overrides: Record<string, any> = {}): any {
  return {
    id: 'job-1',
    userId: 'user-1',
    type: JobType.IMAGE_GENERATION,
    status: JobStatus.PROCESSING,
    input: { prompt: 'a cat' },
    metadata: {
      provider: 'flaky-provider',
      retryCount: 0,
      maxRetries: 3,
      startedAt: new Date(),
    },
    save: jest.fn(async () => undefined),
    ...overrides,
  };
}

describe('bullJobId', () => {
  it('uses the application job id for the first attempt', () => {
    expect(bullJobId('job-1')).toBe('job-1');
    expect(bullJobId('job-1', 0)).toBe('job-1');
  });

  it('suffixes retries so Bull does not swallow the re-add', () => {
    expect(bullJobId('job-1', 1)).toBe('job-1:retry-1');
    expect(bullJobId('job-1', 2)).toBe('job-1:retry-2');
  });

  it('produces a distinct id for every attempt', () => {
    const ids = [0, 1, 2, 3].map((attempt) => bullJobId('job-1', attempt));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('bullJobIds', () => {
  it('lists the base id first, then every retry id', () => {
    expect(bullJobIds('job-1', 3)).toEqual([
      'job-1',
      'job-1:retry-1',
      'job-1:retry-2',
      'job-1:retry-3',
    ]);
  });

  it('lists only the base id when no retries are configured', () => {
    expect(bullJobIds('job-1', 0)).toEqual(['job-1']);
  });
});

describe('Orchestrator retry path', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new Orchestrator();
  });

  it('re-queues a failed job under a distinct Bull id', async () => {
    const job = makeJob();
    findById.mockResolvedValue(job);
    const generateImage = jest.fn(async () => {
      throw new Error('provider exploded');
    });
    orchestrator.registerProvider(makeProvider(generateImage));

    await orchestrator.executeJob('job-1');

    expect(generateImage).toHaveBeenCalledTimes(1);
    expect(job.status).toBe(JobStatus.QUEUED);
    expect(job.metadata.retryCount).toBe(1);

    // The retry must not reuse the base id, or Bull ignores it.
    expect(jobQueueProcessor.enqueueJob).toHaveBeenCalledTimes(1);
    const [jobId, userId, jobType, attempt] = (
      jobQueueProcessor.enqueueJob as jest.Mock
    ).mock.calls[0];
    expect(jobId).toBe('job-1');
    expect(userId).toBe('user-1');
    expect(jobType).toBe(JobType.IMAGE_GENERATION);
    expect(attempt).toBe(1);
    expect(bullJobId(jobId, attempt)).not.toBe(bullJobId(jobId, 0));
  });

  it('gives each successive retry its own Bull id', async () => {
    for (const retryCount of [1, 2]) {
      jest.clearAllMocks();
      orchestrator = new Orchestrator();
      const job = makeJob({ metadata: { provider: 'flaky-provider', retryCount, maxRetries: 3, startedAt: new Date() } });
      findById.mockResolvedValue(job);
      orchestrator.registerProvider(
        makeProvider(
          jest.fn(async () => {
            throw new Error('still broken');
          }),
        ),
      );

      await orchestrator.executeJob('job-1');

      const attempt = (jobQueueProcessor.enqueueJob as jest.Mock).mock.calls[0][3];
      expect(attempt).toBe(retryCount + 1);
    }
  });

  it('marks the job failed once retries are exhausted and does not re-queue', async () => {
    const job = makeJob({
      metadata: { provider: 'flaky-provider', retryCount: 3, maxRetries: 3, startedAt: new Date() },
    });
    findById.mockResolvedValue(job);
    orchestrator.registerProvider(
      makeProvider(
        jest.fn(async () => {
          throw new Error('provider exploded');
        }),
      ),
    );

    await orchestrator.executeJob('job-1');

    expect(job.status).toBe(JobStatus.FAILED);
    expect(jobQueueProcessor.enqueueJob).not.toHaveBeenCalled();
  });

  it('does not retry a cancelled job', async () => {
    const job = makeJob({ status: JobStatus.CANCELLED });
    findById.mockResolvedValue(job);
    const generateImage = jest.fn();
    orchestrator.registerProvider(makeProvider(generateImage));

    await orchestrator.executeJob('job-1');

    expect(generateImage).not.toHaveBeenCalled();
    expect(jobQueueProcessor.enqueueJob).not.toHaveBeenCalled();
  });

  it('completes a job when the provider succeeds, without retrying', async () => {
    const job = makeJob();
    findById.mockResolvedValue(job);
    orchestrator.registerProvider(
      makeProvider(
        jest.fn(async () => ({
          id: 'asset-1',
          url: 'https://cdn.test/a.png',
          format: 'png',
          size: 10,
        })),
      ),
    );

    await orchestrator.executeJob('job-1');

    expect(job.status).toBe(JobStatus.COMPLETED);
    expect(jobQueueProcessor.enqueueJob).not.toHaveBeenCalled();
  });

  it('records the failure reason on the job', async () => {
    const job = makeJob();
    findById.mockResolvedValue(job);
    orchestrator.registerProvider(
      makeProvider(
        jest.fn(async () => {
          throw new Error('provider exploded');
        }),
      ),
    );

    await orchestrator.executeJob('job-1');

    expect(job.error?.message).toBe('provider exploded');
    expect(job.error?.code).toBe('EXECUTION_ERROR');
  });
});

describe('queue tolerance of an unavailable Redis', () => {
  it('reports a non-connected status without throwing', () => {
    expect(() => jobQueueProcessor.getConnectionStatus()).not.toThrow();
    expect(jobQueueProcessor.getConnectionStatus().connected).toBe(false);
  });

  it('returns false from removeJob instead of throwing', async () => {
    await expect(jobQueueProcessor.removeJob('job-1')).resolves.toBe(true);
  });
});
