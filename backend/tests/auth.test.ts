/**
 * Authentication route tests: register, login, logout and /me.
 *
 * The User model is replaced with a small in-memory store so the routes can be
 * exercised over real HTTP without MongoDB. Passwords are still hashed with
 * real bcrypt, so the hash/compare path is genuinely covered.
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

  const User = {
    __store: store,
    exists: jest.fn(async (query: any) => {
      const clauses: any[] = query?.$or ?? [];
      return store.some((user) =>
        clauses.some(
          (clause) =>
            (clause.email && clause.email === user.email) ||
            (clause.username && clause.username === user.username),
        ),
      );
    }),
    create: jest.fn(async (doc: any) => {
      const user: any = {
        role: 'user',
        preferences: {},
        ...doc,
        _id: `user-${store.length + 1}`,
      };
      user.save = jest.fn(async () => user);
      store.push(user);
      return user;
    }),
    findOne: jest.fn(async (query: any) => {
      return store.find((user) => user.email === query.email) || null;
    }),
    findById: jest.fn(async (id: any) => {
      return store.find((user) => user._id === id) || null;
    }),
  };

  return { User, Job: {}, Project: {} };
});

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/database/models';
import { generateToken } from '../src/api/middleware/auth';

const store = (User as unknown as { __store: any[] }).__store;
const app = createApp();

const validRegistration = {
  email: 'Ada@Example.com',
  username: 'ada',
  password: 'correct-horse-battery',
};

beforeEach(() => {
  store.length = 0;
  jest.clearAllMocks();
});

describe('POST /api/v1/auth/register', () => {
  it('creates the user, returns a token and never echoes the password hash', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validRegistration);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.user.email).toBe('ada@example.com');
    expect(res.body.data.user.username).toBe('ada');

    // The credential must not travel in any form.
    const serialised = JSON.stringify(res.body);
    expect(serialised).not.toContain('passwordHash');
    expect(serialised).not.toContain(validRegistration.password);
  });

  it('stores the password as a bcrypt hash, not plaintext', async () => {
    await request(app).post('/api/v1/auth/register').send(validRegistration);

    expect(store).toHaveLength(1);
    const stored = store[0].passwordHash;
    expect(stored).not.toBe(validRegistration.password);
    expect(stored).toMatch(/^\$2[aby]\$/);
    await expect(bcrypt.compare(validRegistration.password, stored)).resolves.toBe(true);
  });

  it('normalises the email to lowercase', async () => {
    await request(app).post('/api/v1/auth/register').send(validRegistration);

    expect(store[0].email).toBe('ada@example.com');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/v1/auth/register').send(validRegistration);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validRegistration, username: 'someone-else' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects a malformed payload with 400 and names the field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', username: 'ada', password: 'correct-horse-battery' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect(res.body.error.message).toContain('email');
  });

  it('rejects a password below the minimum length with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validRegistration, password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('password');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(validRegistration);
  });

  it('returns a token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: validRegistration.password });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe('string');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('accepts a differently-cased email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ADA@EXAMPLE.COM', password: validRegistration.password });

    expect(res.status).toBe(200);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'not-the-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an unknown email with the same message as a wrong password', async () => {
    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever-value' });
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'not-the-password' });

    expect(unknown.status).toBe(401);
    // Identical wording so the endpoint cannot be used to enumerate accounts.
    expect(unknown.body.error.message).toBe(wrongPassword.body.error.message);
  });

  it('rejects a malformed payload with 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'ada@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  let userId: string;

  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(validRegistration);
    userId = store[0]._id;
  });

  it('returns the current user for a valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${generateToken(userId, 'ada@example.com', 'user')}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('ada@example.com');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-jwt');

    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = generateToken(userId, 'ada@example.com', 'user').split('.');
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${forged[0]}.${forged[1]}.tampered-signature`);

    expect(res.status).toBe(401);
  });

  it('ignores a non-Bearer authorization header', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', generateToken(userId, 'ada@example.com', 'user'));

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
  });
});
