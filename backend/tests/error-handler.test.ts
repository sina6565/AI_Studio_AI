/**
 * Error handler tests.
 *
 * There used to be two error handlers: the inline one in app.ts served
 * requests and dropped `error.details`, while middleware/errorHandler.ts —
 * which forwards them — was never mounted. These tests pin the contract that
 * made the duplication dangerous: field-level `details` must reach the client,
 * and a 500 must not leak internals in production.
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

jest.mock('../src/database/models', () => {
  const store: any[] = [];
  return {
    User: {
      __store: store,
      exists: jest.fn(async () => false),
      create: jest.fn(async (doc: any) => {
        const user: any = { role: 'user', preferences: {}, ...doc, _id: `user-${store.length + 1}` };
        user.save = jest.fn(async () => user);
        store.push(user);
        return user;
      }),
      findOne: jest.fn(async () => null),
      findById: jest.fn(async () => null),
    },
    Job: {},
    // The project route is used to raise an *unexpected* error.
    Project: { findOne: jest.fn() },
  };
});

import request from 'supertest';
import { createApp } from '../src/app';
import { Project } from '../src/database/models';
import { generateToken } from '../src/api/middleware/auth';

const app = createApp();
const token = generateToken('user-1', 'ada@example.com', 'user');
const auth = { Authorization: `Bearer ${token}` };

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  jest.clearAllMocks();
});

beforeEach(() => {
  // clearAllMocks keeps implementations, so reset the rejection explicitly:
  // otherwise a failing mock leaks into the tests that expect a 404.
  (Project.findOne as jest.Mock).mockReset();
  (Project.findOne as jest.Mock).mockResolvedValue(null);
});

describe('validation details reach the client', () => {
  it('returns error.details naming the offending field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', username: 'ada', password: 'long-enough-password' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');

    // This is the contract the duplicate handler silently broke.
    expect(res.body.error.details).toBeDefined();
    expect(Array.isArray(res.body.error.details.errors)).toBe(true);
    expect(res.body.error.details.errors[0]).toMatchObject({
      path: 'email',
      code: 'invalid_string',
    });
  });

  it('reports every offending field, not just the first', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});

    expect(res.status).toBe(400);
    const paths = res.body.error.details.errors.map((e: any) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'username', 'password']));
  });
});

describe('unexpected errors', () => {
  const boom = () =>
    new Error('connect ECONNREFUSED 10.0.0.5:27017 (mongodb://admin:hunter2@db)');

  it('is reported as a 500 with a generic code', async () => {
    (Project.findOne as jest.Mock).mockRejectedValue(boom());

    const res = await request(app).get('/api/v1/projects/anything').set(auth);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('exposes the message outside production, for debugging', async () => {
    process.env.NODE_ENV = 'test';
    (Project.findOne as jest.Mock).mockRejectedValue(boom());

    const res = await request(app).get('/api/v1/projects/anything').set(auth);

    expect(res.body.error.message).toContain('ECONNREFUSED');
  });

  it('masks the message in production so internals are not disclosed', async () => {
    process.env.NODE_ENV = 'production';
    (Project.findOne as jest.Mock).mockRejectedValue(boom());

    const res = await request(app).get('/api/v1/projects/anything').set(auth);

    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Internal Server Error');
    // The connection string in the error must not travel.
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    expect(JSON.stringify(res.body)).not.toContain('10.0.0.5');
  });

  it('never returns a stack trace', async () => {
    process.env.NODE_ENV = 'test';
    (Project.findOne as jest.Mock).mockRejectedValue(boom());

    const res = await request(app).get('/api/v1/projects/anything').set(auth);

    expect(res.body.error.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('at Object.');
  });

  it('does not leak details for errors we did not raise', async () => {
    (Project.findOne as jest.Mock).mockRejectedValue(boom());

    const res = await request(app).get('/api/v1/projects/anything').set(auth);

    expect(res.body.error.details).toBeUndefined();
  });
});

describe('AppError passthrough', () => {
  it('keeps the intended status and code', async () => {
    const res = await request(app)
      .get('/api/v1/projects/does-not-exist')
      .set(auth);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('shows the message even in production, since we wrote it', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .get('/api/v1/projects/does-not-exist')
      .set(auth);

    expect(res.body.error.message).toBe('Project not found');
  });
});

describe('authentication failures', () => {
  it('returns 401 through the same handler', async () => {
    const res = await request(app).get('/api/v1/projects/anything');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBeTruthy();
  });
});

describe('unmatched routes', () => {
  it('returns a structured 404', async () => {
    const res = await request(app).get('/api/v1/nope');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });
});
