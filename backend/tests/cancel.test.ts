/**
 * Orchestrator cancellation tests.
 *
 * Verifies that cancelling a job removes it from the queue and that a job which
 * was cancelled while queued is never executed.
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
import { Orchestrator } from '../src/orchestrator/Orchestrator';

describe('Orchestrator cancellation', () => {
  const orchestrator = new Orchestrator();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks a queued job cancelled and removes it from the queue', async () => {
    const save = jest.fn(async () => undefined);
    findById.mockResolvedValue({ status: 'queued', metadata: {}, save });

    await orchestrator.cancelJob('job-1');

    expect(jobQueueProcessor.removeJob).toHaveBeenCalledWith('job-1');
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('refuses to cancel a job that already reached a terminal state', async () => {
    findById.mockResolvedValue({
      status: 'completed',
      metadata: {},
      save: jest.fn(async () => undefined),
    });

    await expect(orchestrator.cancelJob('job-2')).rejects.toThrow();
    expect(jobQueueProcessor.removeJob).not.toHaveBeenCalled();
  });

  it('throws when the job does not exist', async () => {
    findById.mockResolvedValue(null);
    await expect(orchestrator.cancelJob('missing')).rejects.toThrow();
  });

  it('skips execution of a job that was cancelled while queued', async () => {
    findById.mockResolvedValue({ status: 'cancelled', metadata: {} });

    await expect(orchestrator.executeJob('job-3')).resolves.toBeUndefined();
  });
});
