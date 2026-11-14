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

jest.mock('../src/orchestrator/Orchestrator', () => ({
  __esModule: true,
  default: {
    createJob: jest.fn(async () => ({
      jobId: 'created-job-1',
      status: 'queued',
      createdAt: new Date('2026-11-12T00:00:00.000Z'),
    })),
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
import orchestrator from '../src/orchestrator/Orchestrator';

const mockJob = Job as unknown as {
  updateMany: jest.Mock;
  countDocuments: jest.Mock;
  find: jest.Mock;
};

describe('POST /api/v1/jobs prompt builders', () => {
  const app = createApp();
  const token = generateToken('user-1', 'user@example.com', 'user');
  const createJob = (orchestrator as unknown as { createJob: jest.Mock }).createJob;

  beforeEach(() => createJob.mockClear());

  it('accepts a single prompt for a provider-free playable game build', async () => {
    const input = { prompt: 'Build a 2D maze game where a hero collects gems and reaches the exit.' };
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'game_build', input });

    expect(res.status).toBe(201);
    expect(createJob).toHaveBeenCalledWith(expect.objectContaining({
      jobType: 'game_build',
      input,
      userId: 'user-1',
    }));
  });

  it('accepts a single prompt for a local website build', async () => {
    const input = { prompt: 'Create a responsive website for a handmade ceramics studio with product and contact sections.', language: 'en' };
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'website_build', input });

    expect(res.status).toBe(201);
    expect(createJob).toHaveBeenCalledWith(expect.objectContaining({
      jobType: 'website_build',
      input,
      userId: 'user-1',
    }));
  });

  it('rejects malformed prompt payloads before queueing', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'game_build', input: { prompt: 'short', executable: 'alert(1)' } });

    expect(res.status).toBe(400);
    expect(createJob).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/jobs', () => {
  const app = createApp();
  const token = generateToken('user-1', 'user@example.com', 'user');

  it('normalizes Mongo job ids for Jobs and Projects clients', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'job-1', userId: 'user-1', type: 'game_build' }]),
    };
    mockJob.find.mockReturnValue(query);

    const res = await request(app)
      .get('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe('job-1');
    expect(mockJob.find).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});

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
