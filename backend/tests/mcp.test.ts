import request from 'supertest';
import { createApp } from '../src/app';

jest.mock('../src/providers/registry', () => ({
  __esModule: true,
  default: {
    getAvailableProviders: jest.fn(() => [{ name: 'fake-local-provider' }]),
  },
}));

describe('SINA MCP endpoint', () => {
  const originalKey = process.env.SINA_MCP_API_KEY;
  const app = createApp();

  afterAll(() => {
    if (originalKey === undefined) delete process.env.SINA_MCP_API_KEY;
    else process.env.SINA_MCP_API_KEY = originalKey;
  });

  it('fails closed when the MCP secret is not configured', async () => {
    delete process.env.SINA_MCP_API_KEY;
    const response = await request(app)
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });

    expect(response.status).toBe(503);
  });

  it('rejects an invalid MCP secret', async () => {
    process.env.SINA_MCP_API_KEY = 'expected-secret';
    const response = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer incorrect-secret')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });

    expect(response.status).toBe(401);
  });

  it('negotiates MCP and lists only read-only tools', async () => {
    process.env.SINA_MCP_API_KEY = 'expected-secret';
    const response = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer expected-secret')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
      });

    expect(response.status).toBe(200);
    expect(response.body.result.capabilities.tools).toBeDefined();
    expect(response.body.result.serverInfo.name).toBe('sina-ai-studio-mcp');

    const tools = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer expected-secret')
      .send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });

    expect(tools.body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'sina_backend_status',
      'sina_list_providers',
    ]);
  });

  it('executes read-only provider discovery and returns structured content', async () => {
    process.env.SINA_MCP_API_KEY = 'expected-secret';
    const response = await request(app)
      .post('/mcp')
      .set('x-sina-mcp-key', 'expected-secret')
      .send({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'sina_list_providers', arguments: {} },
      });

    expect(response.status).toBe(200);
    expect(response.body.result.structuredContent).toEqual({
      count: 1,
      providers: [{ name: 'fake-local-provider' }],
    });
  });

  it('returns a tool error for an unknown tool', async () => {
    process.env.SINA_MCP_API_KEY = 'expected-secret';
    const response = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer expected-secret')
      .send({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'unknown_tool', arguments: {} },
      });

    expect(response.body.result.isError).toBe(true);
  });
});
