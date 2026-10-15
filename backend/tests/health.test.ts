/**
 * Health endpoint tests.
 *
 * Verifies the liveness/readiness split: liveness must stay 200 even when
 * dependencies are unavailable, while readiness must report 503 so the
 * application is never falsely reported as healthy.
 */

jest.mock('../src/jobs/JobQueueProcessor', () => ({
  __esModule: true,
  default: {
    getConnectionStatus: () => ({ connected: false, state: 'connecting', lastError: 'ECONNREFUSED' }),
    enqueueJob: jest.fn(async () => undefined),
    getStats: jest.fn(async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })),
    close: jest.fn(async () => undefined),
  },
}));

import request from 'supertest';
import { createApp } from '../src/app';

describe('health endpoints', () => {
  const app = createApp();

  it('liveness GET /health is always 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('liveness GET /health/live is 200', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
  });

  it('readiness GET /api/v1/health/ready is 503 when the database is down', async () => {
    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not_ready');
    expect(res.body.database.connected).toBe(false);
  });

  it('detailed health reports database, providers and queue', async () => {
    const res = await request(app).get('/api/v1/health/detailed');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.queue).toBeDefined();
    expect(res.body.queue.connected).toBe(false);
    expect(res.body.providers).toBeDefined();
  });

  it('protected routes reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/jobs');
    expect(res.status).toBe(401);
  });

  it('unknown routes return a structured 404', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('root GET / is 200 so a default platform health probe succeeds', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.health).toBe('/health');
  });

  it('CORS allows the default frontend origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });
});
