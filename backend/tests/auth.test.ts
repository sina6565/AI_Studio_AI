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
  User: {
    exists: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  },
  Project: {},
  Job: {},
}));

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/database/models';

const mockedUser = User as unknown as {
  exists: jest.Mock;
  create: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
};

const safeUser = {
  _id: { toString: () => 'user-1' },
  email: 'sina@example.com',
  username: 'sinauser',
  role: 'user',
  preferences: { language: 'en', theme: 'dark', notificationsEnabled: true },
};

describe('authentication routes', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUser.exists.mockResolvedValue(null);
    mockedUser.create.mockImplementation(async (input: any) => ({
      ...safeUser,
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
    }));
  });

  it('registers a user and never returns passwordHash', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'SINA@example.com', username: 'sinauser', password: 'StrongPass123!' });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      id: 'user-1',
      email: 'sina@example.com',
      username: 'sinauser',
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(mockedUser.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'sina@example.com',
      username: 'sinauser',
      passwordHash: expect.any(String),
    }));
  });

  it('returns 409 for a duplicate email or username', async () => {
    mockedUser.exists.mockResolvedValue({ _id: 'existing-user' });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'sina@example.com', username: 'sinauser', password: 'StrongPass123!' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
    expect(mockedUser.create).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials without exposing passwordHash', async () => {
    const passwordHash = await bcrypt.hash('StrongPass123!', 4);
    const user = {
      ...safeUser,
      passwordHash,
      save: jest.fn(async () => undefined),
    };
    mockedUser.findOne.mockResolvedValue(user);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'SINA@example.com', password: 'StrongPass123!' });

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe('user-1');
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  it('uses the same login error for unknown users and wrong passwords', async () => {
    mockedUser.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'missing@example.com', password: 'WrongPassword' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('rejects malformed registration payloads with 400', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', username: 'x', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.details.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'email' }),
      expect.objectContaining({ path: 'username' }),
      expect.objectContaining({ path: 'password' }),
    ]));
  });
});
