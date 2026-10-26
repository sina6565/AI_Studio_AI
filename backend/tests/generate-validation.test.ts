jest.mock('../src/orchestrator/Orchestrator', () => ({
  __esModule: true,
  default: {
    createJob: jest.fn(async () => ({
      jobId: 'job-test',
      status: 'queued',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })),
  },
}));

import request from 'supertest';
import { createApp } from '../src/app';
import { generateToken } from '../src/api/middleware/auth';
import orchestrator from '../src/orchestrator/Orchestrator';

describe('generation input validation', () => {
  const app = createApp();
  const token = generateToken('beta-user', 'beta@example.com', 'user');
  const auth = { Authorization: `Bearer ${token}` };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects blank prompts before creating a generation job', async () => {
    const res = await request(app)
      .post('/api/v1/generate/image')
      .set(auth)
      .send({ prompt: '   ' });

    expect(res.status).toBe(400);
    expect(orchestrator.createJob).not.toHaveBeenCalled();
  });

  it('rejects out-of-range video parameters', async () => {
    const res = await request(app)
      .post('/api/v1/generate/video')
      .set(auth)
      .send({ prompt: 'A cinematic space journey', duration: 999, fps: 24 });

    expect(res.status).toBe(400);
    expect(orchestrator.createJob).not.toHaveBeenCalled();
  });

  it('rejects unknown fields instead of passing them to the provider', async () => {
    const res = await request(app)
      .post('/api/v1/generate/audio')
      .set(auth)
      .send({ prompt: 'Rain on a window', admin: true });

    expect(res.status).toBe(400);
    expect(orchestrator.createJob).not.toHaveBeenCalled();
  });

  it('accepts a valid image request and queues only validated input', async () => {
    const res = await request(app)
      .post('/api/v1/generate/image')
      .set(auth)
      .send({ prompt: 'A glowing planet', size: '1024x1024', quality: 'standard' });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(orchestrator.createJob).toHaveBeenCalledWith({
      userId: 'beta-user',
      jobType: 'image_generation',
      input: { prompt: 'A glowing planet', size: '1024x1024', quality: 'standard' },
    });
  });

  it('rejects unauthenticated generation attempts', async () => {
    const res = await request(app)
      .post('/api/v1/generate/image')
      .send({ prompt: 'A glowing planet' });

    expect(res.status).toBe(401);
    expect(orchestrator.createJob).not.toHaveBeenCalled();
  });
});
