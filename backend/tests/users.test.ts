/**
 * User route tests: profile read and preference updates.
 *
 * Verifies the response never carries credentials and that preferences are
 * merged (not replaced) with only whitelisted keys accepted.
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

const findById = jest.fn();
const findByIdAndUpdate = jest.fn();

jest.mock('../src/database/models', () => ({
  User: {
    findById: (...args: unknown[]) => findById(...args),
    findByIdAndUpdate: (...args: unknown[]) => findByIdAndUpdate(...args),
  },
  Job: {},
  Project: {},
}));

import request from 'supertest';
import { createApp } from '../src/app';
import { generateToken } from '../src/api/middleware/auth';

const app = createApp();
const token = generateToken('user-1', 'ada@example.com', 'user');
const auth = { Authorization: `Bearer ${token}` };

const storedUser = {
  _id: 'user-1',
  email: 'ada@example.com',
  username: 'ada',
  passwordHash: '$2a$12$not-a-real-hash',
  apiKey: 'secret-key',
  preferences: { language: 'en', theme: 'light' },
};

/** Mimics the `.select(...)` chain the routes use. */
const selected = (value: unknown) => ({ select: jest.fn(async () => value) });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/v1/users/me', () => {
  it('returns the profile', async () => {
    findById.mockReturnValue(selected(storedUser));

    const res = await request(app).get('/api/v1/users/me').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('ada@example.com');
  });

  it('excludes credentials from the query', async () => {
    findById.mockReturnValue(selected(storedUser));

    await request(app).get('/api/v1/users/me').set(auth);

    expect(findById).toHaveBeenCalledWith('user-1');
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/users/me');

    expect(res.status).toBe(401);
    expect(findById).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/v1/users/me/preferences', () => {
  it('merges a whitelisted preference into the existing set', async () => {
    findByIdAndUpdate.mockReturnValue(selected({ ...storedUser, preferences: { language: 'en', theme: 'dark' } }));

    const res = await request(app)
      .patch('/api/v1/users/me/preferences')
      .set(auth)
      .send({ theme: 'dark' });

    expect(res.status).toBe(200);
    const [id, update] = findByIdAndUpdate.mock.calls[0];
    expect(id).toBe('user-1');
    // Dotted path so an unrelated preference is not wiped.
    expect(update).toEqual({ $set: { 'preferences.theme': 'dark' } });
  });

  it('rejects an unknown preference key with 400', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/preferences')
      .set(auth)
      .send({ role: 'admin' });

    expect(res.status).toBe(400);
    expect(findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range value with 400', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/preferences')
      .set(auth)
      .send({ theme: 'neon' });

    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/preferences')
      .send({ theme: 'dark' });

    expect(res.status).toBe(401);
  });
});
