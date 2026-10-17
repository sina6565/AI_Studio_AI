/**
 * Error handling and auth middleware tests.
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
  Project: { findOne: jest.fn(async () => null) },
  Job: {},
  User: {},
}));

import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app';
import config from '../src/config';
import { generateToken } from '../src/api/middleware/auth';
import orchestrator from '../src/orchestrator/Orchestrator';

describe('error handling', () => {
  const app = createApp();
  const token = generateToken('user-1', 'user@example.com', 'user');

  it('generateToken signs a verifiable token carrying the user identity', () => {
    const decoded = jwt.verify(token, config.jwt.secret) as Record<string, unknown>;
    expect(decoded.userId).toBe('user-1');
    expect(decoded.email).toBe('user@example.com');
    expect(decoded.role).toBe('user');
  });

  it('maps a thrown AppError to its status and error code', async () => {
    const res = await request(app)
      .get('/api/v1/projects/does-not-exist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an invalid token with 401', async () => {
    const res = await request(app)
      .get('/api/v1/projects/does-not-exist')
      .set('Authorization', 'Bearer not-a-valid-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/projects/does-not-exist');
    expect(res.status).toBe(401);
  });
  it('includes structured field-level details for validation errors', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'not-a-supported-type', input: {} });

    expect(res.status).toBe(400);
    expect(res.body.error.details.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'type' }),
    ]));
  });

  it('does not expose persisted stack traces in job API responses', async () => {
    jest.spyOn(orchestrator, 'getJobStatus').mockResolvedValue({
      id: 'job-1',
      userId: 'user-1',
      type: 'image_generation',
      status: 'failed',
      priority: 'normal',
      input: { prompt: 'test' },
      error: { code: 'EXECUTION_ERROR', message: 'provider failed', stack: 'internal/path/secret.ts:123' },
      metadata: { retryCount: 0, maxRetries: 3, requestedAt: new Date() },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await request(app)
      .get('/api/v1/jobs/job-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.error).toEqual({
      code: 'EXECUTION_ERROR',
      message: 'provider failed',
    });
    expect(JSON.stringify(res.body)).not.toContain('internal/path/secret.ts');
  });

});
