import express from 'express';
import request from 'supertest';
import router from './router';
import { generateToken } from '../api/middleware/auth';

jest.mock('../database/models', () => ({
  Job: { find: jest.fn() },
  Project: { find: jest.fn() },
}));

jest.mock('../providers/registry', () => ({
  __esModule: true,
  default: { getStatus: jest.fn(() => ({ agnes: { initialized: true, healthy: true } })) },
}));

jest.mock('../orchestrator/Orchestrator', () => ({
  __esModule: true,
  default: { getAvailableProviders: jest.fn(() => [{ name: 'local-test', capabilities: ['text_generation'] }]) },
}));

describe('SINA MCP HTTP endpoint', () => {
  const app = express();
  const token = generateToken('mcp-test-user', 'mcp-test@example.invalid', 'user');

  app.use(express.json());
  app.use('/mcp', router);

  it('requires SINA JWT authentication', async () => {
    const response = await request(app).post('/mcp').send({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-11-25', clientInfo: { name: 'jest-client', version: '1.0' } },
    });
    expect(response.status).toBe(401);
  });

  it('completes MCP initialize and announces the client', async () => {
    const response = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('X-MCP-Client-Id', 'jest-client')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-11-25', clientInfo: { name: 'jest-client', version: '1.0' } },
      });

    expect(response.status).toBe(200);
    expect(response.body.result.serverInfo.name).toBe('sina-ai-studio');
    expect(response.body.result.instructions).toContain('CLIENT_CONNECTED');
    expect(response.headers['mcp-protocol-version']).toBe('2025-11-25');
  });

  it('lists only the read-only SINA tools', async () => {
    const response = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });

    expect(response.status).toBe(200);
    expect(response.body.result.tools.map((tool: { name: string }) => tool.name)).toContain('sina_list_jobs');
    expect(response.body.result.tools.map((tool: { name: string }) => tool.name)).not.toContain('sina_create_job');
  });

  it('exposes the in-process client connection status', async () => {
    const response = await request(app)
      .get('/mcp/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.server).toBe('sina-mcp');
    expect(response.body.clients.some((client: { name: string }) => client.name === 'jest-client')).toBe(true);
  });
});
