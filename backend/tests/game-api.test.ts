/**
 * Game creation API integration tests.
 *
 * Verifies the game job is accepted through the existing authenticated jobs
 * endpoint, that invalid game specs are rejected with a clear message, and that
 * authentication is still required.
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
    create: jest.fn(async (doc: any) => ({ ...doc, id: doc._id })),
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
  Project: {},
  User: {},
}));

import request from 'supertest';
import { createApp } from '../src/app';
import orchestrator from '../src/orchestrator/Orchestrator';
import { generateToken } from '../src/api/middleware/auth';
import type { IProvider } from '../src/providers/interfaces/IProvider';

const fakeProvider = {
  name: 'fake-image',
  capabilities: ['image_generation'],
  initialize: async () => undefined,
  generateImage: async () => ({
    id: 'a',
    url: 'https://cdn.test/a.png',
    format: 'png',
    size: 1,
  }),
  generateVideo: async () => ({ id: 'v', url: '', format: 'mp4', size: 0 }),
  generateAudio: async () => ({ id: 'au', url: '', format: 'mp3', size: 0 }),
  synthesizeSpeech: async () => ({ id: 's', url: '', format: 'mp3', size: 0 }),
  healthCheck: async () => true,
  getRateLimit: async () => ({ remaining: 10, resetTime: 0, limit: 10 }),
  validateInput: async () => ({ valid: true }),
  validateCredentials: async () => true,
} as unknown as IProvider;

const validSpec = {
  title: 'Dungeon of Echoes',
  description: 'A short dungeon-crawling adventure.',
  genre: 'dungeon crawler',
  artStyle: 'pixel art',
  scenes: [{ name: 'Entrance', description: 'A mossy stone doorway.' }],
};

describe('POST /api/v1/jobs with a game spec', () => {
  const app = createApp();
  const token = generateToken('user-1', 'user@example.com', 'user');

  beforeAll(() => {
    orchestrator.registerProvider(fakeProvider);
  });

  it('accepts a valid game spec and returns a queued job', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'game_creation', input: validSpec });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.jobId).toBe('string');
    expect(res.body.data.status).toBe('queued');
  });

  it('rejects a game spec with no scenes and explains why', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'game_creation',
        input: { title: 'x', description: 'y', scenes: [] },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(String(res.body.error.message)).toMatch(/scenes/i);
  });

  it('rejects a game spec with a missing title', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'game_creation',
        input: { ...validSpec, title: '' },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .send({ type: 'game_creation', input: validSpec });

    expect(res.status).toBe(401);
  });
});
