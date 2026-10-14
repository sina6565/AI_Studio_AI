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
});
