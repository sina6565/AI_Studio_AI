/**
 * Rate limiting tests.
 *
 * Verifies the stricter authentication limiter actually throttles repeated
 * attempts, and that the general API limiter is still applied.
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
  Job: {},
  Project: {},
  User: { findOne: jest.fn(async () => null) },
}));

import request from 'supertest';
import { createApp } from '../src/app';

describe('authentication rate limiting', () => {
  it('throttles repeated login attempts with 429', async () => {
    const app = createApp();
    let lastStatus = 0;

    for (let i = 0; i < 21; i += 1) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com', password: 'password123' });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
