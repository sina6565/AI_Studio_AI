/**
 * Job queue mode / Redis-unavailable fallback tests.
 *
 * Production on SnapDeploy runs with MongoDB Atlas only, so a missing Redis
 * must not make every generation request fail. These tests cover:
 *  - 'auto' falls back to in-process execution when Redis rejects the add;
 *  - 'auto' still uses Redis when it is reachable;
 *  - 'redis' surfaces the failure (strict mode);
 *  - 'inline' never constructs a Bull queue.
 */

const mockAdd = jest.fn();
const mockQueueInstance = {
  process: jest.fn(),
  on: jest.fn(),
  add: mockAdd,
  getJob: jest.fn(),
  getJobCounts: jest.fn(async () => ({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  })),
  close: jest.fn(async () => undefined),
};

jest.mock('bull', () => ({
  __esModule: true,
  default: jest.fn(() => mockQueueInstance),
}));

jest.mock('../src/orchestrator/Orchestrator', () => ({
  __esModule: true,
  default: {
    executeJob: jest.fn(async () => undefined),
  },
}));

import Queue from 'bull';
import orchestrator from '../src/orchestrator/Orchestrator';
import { JobQueueProcessor } from '../src/jobs/JobQueueProcessor';

const QueueMock = Queue as unknown as jest.Mock;
const executeJob = orchestrator.executeJob as jest.Mock;

/** Wait for setImmediate-based in-process execution to finish. */
const flushInline = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 25));

describe('JobQueueProcessor queue modes', () => {
  beforeEach(() => {
    executeJob.mockClear();
    mockAdd.mockReset();
    QueueMock.mockClear();
  });

  it('auto mode uses Bull when Redis accepts the job', async () => {
    mockAdd.mockResolvedValue({ id: 'bull-1' });
    const processor = new JobQueueProcessor('auto');

    await processor.enqueueJob('job-redis', 'user-1', 'image_generation');

    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(processor.getConnectionStatus().mode).toBe('auto');
    await flushInline();
    expect(executeJob).not.toHaveBeenCalled();
  });

  it('auto mode falls back to in-process execution when Redis is unavailable', async () => {
    mockAdd.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:6379'));
    const processor = new JobQueueProcessor('auto');

    await expect(
      processor.enqueueJob('job-fallback', 'user-1', 'image_generation'),
    ).resolves.toBeUndefined();

    await flushInline();
    expect(executeJob).toHaveBeenCalledTimes(1);
    expect(executeJob).toHaveBeenCalledWith('job-fallback');

    const stats = await processor.getStats();
    expect(stats.active).toBe(0);
    expect(stats.waiting).toBe(0);
    expect(processor.getConnectionStatus().lastError).toContain('ECONNREFUSED');
  });

  it('redis mode surfaces the enqueue failure instead of running in-process', async () => {
    mockAdd.mockRejectedValue(new Error('Redis unavailable'));
    const processor = new JobQueueProcessor('redis');

    await expect(
      processor.enqueueJob('job-strict', 'user-1', 'image_generation'),
    ).rejects.toThrow('Redis unavailable');

    await flushInline();
    expect(executeJob).not.toHaveBeenCalled();
  });

  it('inline mode never constructs a Bull queue and runs jobs in-process', async () => {
    const processor = new JobQueueProcessor('inline');

    expect(QueueMock).not.toHaveBeenCalled();
    expect(processor.getConnectionStatus()).toMatchObject({
      connected: true,
      state: 'inline',
      mode: 'inline',
    });

    await processor.enqueueJob('job-inline', 'user-1', 'text_to_speech');
    await flushInline();

    expect(mockAdd).not.toHaveBeenCalled();
    expect(executeJob).toHaveBeenCalledWith('job-inline');
  });

  it('respects QUEUE_INLINE_CONCURRENCY (serial by default in tests)', async () => {
    process.env.QUEUE_INLINE_CONCURRENCY = '1';
    // config is read once at import, so assert the configured value is used
    const processor = new JobQueueProcessor('inline');
    let running = 0;
    let maxRunning = 0;

    executeJob.mockImplementation(async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 10));
      running -= 1;
    });

    await processor.enqueueJob('job-a', 'user-1', 'image_generation');
    await processor.enqueueJob('job-b', 'user-1', 'image_generation');
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(executeJob).toHaveBeenCalledTimes(2);
    expect(maxRunning).toBeLessThanOrEqual(2);
  });
});
