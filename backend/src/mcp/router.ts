import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../api/middleware/auth';
import { Job, Project } from '../database/models';
import registry from '../providers/registry';
import orchestrator from '../orchestrator/Orchestrator';
import logger from '../utils/logger';

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, any>;
}

interface ConnectedClient {
  clientId: string;
  name: string;
  version: string;
  userId: string;
  connectedAt: string;
  lastSeenAt: string;
  protocolVersion: string;
  status: 'connected' | 'stale';
}

const clients = new Map<string, ConnectedClient>();
const CLIENT_STALE_AFTER_MS = 5 * 60 * 1000;
const MCP_PROTOCOL_VERSION = '2025-11-25';

function touchClient(req: AuthenticatedRequest, clientInfo?: Record<string, any>): ConnectedClient {
  const userId = req.user!.userId;
  const suppliedId = String(req.header('x-mcp-client-id') || '').trim().slice(0, 100);
  const name = String(clientInfo?.name || req.header('x-mcp-client-name') || 'MCP client').slice(0, 100);
  const version = String(clientInfo?.version || 'unknown').slice(0, 50);
  const clientId = suppliedId ? `${userId}:${suppliedId}` : `${userId}:${name}`;
  const now = new Date().toISOString();
  const previous = clients.get(clientId);
  const client: ConnectedClient = {
    clientId,
    name,
    version,
    userId,
    connectedAt: previous?.connectedAt || now,
    lastSeenAt: now,
    protocolVersion: MCP_PROTOCOL_VERSION,
    status: 'connected',
  };
  clients.set(clientId, client);
  if (!previous) logger.info(`[MCP] CLIENT_CONNECTED name=${name} version=${version} userId=${userId}`);
  return client;
}

function listClients(userId: string): ConnectedClient[] {
  const cutoff = Date.now() - CLIENT_STALE_AFTER_MS;
  const retentionCutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, client] of clients) {
    if (new Date(client.lastSeenAt).getTime() < retentionCutoff) clients.delete(id);
  }
  return Array.from(clients.values())
    .filter((client) => client.userId === userId)
    .map((client) => ({
      ...client,
      status: new Date(client.lastSeenAt).getTime() >= cutoff ? 'connected' : 'stale',
    }));
}

function rpcError(id: RpcRequest['id'], code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function rpcResult(id: RpcRequest['id'], result: Record<string, any>) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

const tools = [
  {
    name: 'sina_get_capabilities',
    description: 'Return the capabilities exposed by the SINA AI Studio backend.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sina_list_providers',
    description: 'List provider names and capabilities currently registered in SINA.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sina_get_provider_status',
    description: 'Read the current provider health status.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sina_list_projects',
    description: 'List the authenticated user\'s projects only.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', minimum: 1, maximum: 50 } },
      additionalProperties: false,
    },
  },
  {
    name: 'sina_list_jobs',
    description: 'List the authenticated user\'s recent jobs only.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', minimum: 1, maximum: 50 }, status: { type: 'string' } },
      additionalProperties: false,
    },
  },
  {
    name: 'sina_get_connection_status',
    description: 'Show MCP clients recently connected to this SINA backend instance.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

async function callTool(name: string, args: Record<string, any>, userId: string) {
  switch (name) {
    case 'sina_get_capabilities':
      return {
        platform: 'SINA AI STUDIO',
        architecture: 'SINA-owned Orchestrator with provider registry',
        capabilities: ['image', 'video', 'audio', 'speech', 'character', 'game', '3d', 'website', 'projects', 'jobs'],
        executionPolicy: 'Read-only MCP tools; mutations require a separate approval-gated interface.',
      };
    case 'sina_list_providers':
      return orchestrator.getAvailableProviders().map((provider) => ({
        name: provider.name,
        capabilities: provider.capabilities,
      }));
    case 'sina_get_provider_status':
      return registry.getStatus();
    case 'sina_list_projects': {
      const limit = Math.min(50, Math.max(1, Number(args.limit) || 20));
      return Project.find({ userId }).sort({ updatedAt: -1 }).limit(limit).select('name type description createdAt updatedAt').lean();
    }
    case 'sina_list_jobs': {
      const limit = Math.min(50, Math.max(1, Number(args.limit) || 20));
      const filter: Record<string, any> = { userId };
      if (typeof args.status === 'string' && args.status.length <= 30) filter.status = args.status;
      return Job.find(filter).sort({ createdAt: -1 }).limit(limit).select('_id type status priority progress metadata createdAt updatedAt').lean();
    }
    case 'sina_get_connection_status':
      return listClients(userId);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const router = Router();
router.use(authenticateToken);

/** Operational view for the authenticated owner; registry is per process instance. */
router.get('/clients', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    server: 'sina-mcp',
    status: 'running',
    persistence: 'in-memory-per-instance',
    clients: listClients(req.user!.userId),
  });
});

/**
 * MCP Streamable HTTP JSON response mode.
 * This deliberately exposes read-only tools and uses the platform JWT boundary.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const message = req.body as RpcRequest;
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    res.status(400).json(rpcError(message?.id, -32600, 'Invalid JSON-RPC request'));
    return;
  }

  try {
    if (message.method === 'initialize') {
      const client = touchClient(req, message.params?.clientInfo);
      const protocolVersion = MCP_PROTOCOL_VERSION;
      client.protocolVersion = protocolVersion;
      clients.set(client.clientId, client);
      res.setHeader('MCP-Protocol-Version', protocolVersion);
      res.json(rpcResult(message.id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'sina-ai-studio', version: '1.0.0' },
        instructions: 'CLIENT_CONNECTED: SINA MCP accepted this client. This server is read-only. Use SINA authentication. Project and job data are scoped to the authenticated user.',
      }));
      return;
    }

    // Initialize notifications have no JSON-RPC response by specification.
    if (message.method === 'notifications/initialized' || message.method.startsWith('notifications/')) {
      res.status(202).end();
      return;
    }

    if (req.header('x-mcp-client-id') || req.header('x-mcp-client-name')) touchClient(req);
    if (message.method === 'ping') {
      res.json(rpcResult(message.id, {}));
      return;
    }
    if (message.method === 'tools/list') {
      res.json(rpcResult(message.id, { tools }));
      return;
    }
    if (message.method === 'tools/call') {
      const name = String(message.params?.name || '');
      const args = message.params?.arguments && typeof message.params.arguments === 'object'
        ? message.params.arguments as Record<string, any>
        : {};
      const data = await callTool(name, args, req.user!.userId);
      res.json(rpcResult(message.id, {
        content: [{ type: 'text', text: JSON.stringify(data) }],
        isError: false,
      }));
      return;
    }
    res.status(200).json(rpcError(message.id, -32601, `Method not found: ${message.method}`));
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'MCP request failed';
    res.status(200).json(rpcResult(message.id, {
      content: [{ type: 'text', text: messageText }],
      isError: true,
    }));
  }
});

export default router;
