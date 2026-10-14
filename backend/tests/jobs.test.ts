/**
 * Jobs route + recovery tests.
 */

jest.mock('../src/jobs/JobQueueProcessor', () => ({
  __esModule: true,
  default: {
    getConnectionStatus: () => ({ connected: false, state: 'connecting' }),
    enqueueJob: jest.fn(async () => undefined),
    getStats: jest.fn(async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })),
    close: jest.fn(async () => undefined),
  },
}));

jest.mock('../src/database/models', () => ({
  Job: {
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

import request from 'supertest';
import { createApp } from '../src/app';
import { Job } from '../src/database/models';
import { generateToken } from '../src/api/middleware/auth';
import { recoverStuckJobs } from '../src/jobs/recovery';

const mockJob = Job as unknown as {
  updateMany: jest.Mock;
  countDocuments: jest.Mock;
};

describe('GET /api/v1/jobs/stats', () => {
  const app = createApp();
  const token = generateToken('user-1', 'user@example.com', 'user');

  it('returns accurate per-status counts for the authenticated user', async () => {
    mockJob.countDocuments.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/v1/jobs/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ total: 2, queued: 2, processing: 2, completed: 2, failed: 2 });
    // counts must be scoped to the caller
    expect(mockJob.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/jobs/stats');
    expect(res.status).toBe(401);
  });
});

describe('recoverStuckJobs', () => {
  beforeEach(() => {
    mockJob.updateMany.mockReset();
  });

  it('marks interrupted processing jobs as failed', async () => {
    mockJob.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const count = await recoverStuckJobs();

    expect(count).toBe(3);
    const [filter, update] = mockJob.updateMany.mock.calls[0];
    expect(filter.status).toBe('processing');
    expect(update.$set.status).toBe('failed');
    expect(update.$set.error.code).toBe('INTERRUPTED');
  });

  it('returns 0 when nothing is stuck', async () => {
    mockJob.updateMany.mockResolvedValue({ modifiedCount: 0 });
    expect(await recoverStuckJobs()).toBe(0);
  });

  it('swallows database errors and returns 0', async () => {
    mockJob.updateMany.mockRejectedValue(new Error('database unavailable'));
    expect(await recoverStuckJobs()).toBe(0);
  });
});
