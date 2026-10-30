/**
 * Generate API route tests.
 */

jest.mock('../src/jobs/JobQueueProcessor', () => ({
  __esModule: true,
  default: {
    getConnectionStatus: () => ({ connected: false, state: 'connecting' }),
    enqueueJob: jest.fn(async () => undefined),
    removeJob: jest.fn(async () => true),
    getStats: jest.fn(async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })),
    close: jest.fn(async () => undefined),
  },
}));

jest.mock('../src/database/models', () => ({
  Job: {
    create: jest.fn(async (doc: any) => ({ ...doc, id: doc._id, createdAt: new Date(), save: jest.fn(async () => undefined) })),
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
  Project: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  },
  User: {},
}));

import request from 'supertest';
import { createApp } from '../src/app';
import orchestrator from '../src/orchestrator/Orchestrator';
import { generateToken } from '../src/api/middleware/auth';

const app = createApp();
const token = generateToken('user-1', 'user@example.com', 'user');

describe('POST /api/v1/generate/:kind', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a queued image generation job from validated input', async () => {
    const createJobSpy = jest.spyOn(orchestrator, 'createJob').mockResolvedValue({
      jobId: 'job-1',
      status: 'queued',
      createdAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/v1/generate/image')
      .set('Authorization', `Bearer ${token}`)
      .send({
        prompt: 'A cinematic desert sunrise',
        size: '1024x1024',
        quality: 'hd',
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(createJobSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        jobType: 'image_generation',
        input: expect.objectContaining({ prompt: 'A cinematic desert sunrise' }),
      }),
    );
  });

  it('rejects invalid generation payloads before creating a job', async () => {
    const createJobSpy = jest.spyOn(orchestrator, 'createJob');

    const res = await request(app)
      .post('/api/v1/generate/video')
      .set('Authorization', `Bearer ${token}`)
      .send({ duration: 'bad' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(createJobSpy).not.toHaveBeenCalled();
  });
});
