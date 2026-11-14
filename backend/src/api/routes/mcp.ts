import { timingSafeEqual } from 'crypto';
import { Request, Response, Router } from 'express';
import registry from '../providers/registry';

const router = Router();
const PROTOCOL_VERSION = '2025-11-25';
const SERVER_INFO = { name: 'sina-ai-studio-mcp', version: '0.1.0' };

type JsonRpcId = string | number | null;
interface JsonRpcRequest {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, any>;
}

function sendRpc(res: Response, id: JsonRpcId, result: unknown): void {
  res.status(200).type('application/json').json({ jsonrpc: '2.0', id, result });
}

function sendRpcError(
  res: Response,
  id: JsonRpcId,
  code: number,
  message: string,
): void {
  res.status(200).type('application/json').json({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  });
}

function hasValidApiKey(req: Request): boolean {
  const expected = process.env.SINA_MCP_API_KEY;
  if (!expected) return false;
  const authorization = req.header('authorization') || '';
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const supplied = bearer || req.header('x-sina-mcp-key') || '';
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function textResult(value: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

const toolDefinitions = [
  {
    name: 'sina_backend_status',
    description: 'Return the reachability and basic runtime status of the SINA AI STUDIO backend. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sina_list_providers',
    description: 'List AI providers currently registered and available in this backend process. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

async function callTool(name: string): Promise<unknown> {
  switch (name) {
    case 'sina_backend_status': {
      const providers = registry.getAvailableProviders();
      return {
        service: 'SINA AI STUDIO',
        status: 'reachable',
        apiVersion: 'v1',
        mcpServer: SERVER_INFO,
        registeredProviderCount: providers.length,
        checkedAt: new Date().toISOString(),
      };
    }
    case 'sina_list_providers': {
      const providers = registry.getAvailableProviders().map((provider) => ({
        name: provider.name,
      }));
      return { count: providers.length, providers };
    }
    default:
      throw new Error('Unknown tool');
  }
}

router.post('/', async (req: Request, res: Response) => {
  if (!hasValidApiKey(req)) {
    const configured = Boolean(process.env.SINA_MCP_API_KEY);
    res.status(configured ? 401 : 503).json({
      error: configured ? 'Unauthorized' : 'MCP authentication is not configured',
    });
    return;
  }

  const message = req.body as JsonRpcRequest;
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    sendRpcError(res, message?.id ?? null, -32600, 'Invalid JSON-RPC request');
    return;
  }

  const id = message.id;
  const isNotification = id === undefined;

  try {
    switch (message.method) {
      case 'initialize': {
        const requested = message.params?.protocolVersion;
        const supported = typeof requested === 'string' ? requested : PROTOCOL_VERSION;
        sendRpc(res, id ?? null, {
          protocolVersion: supported,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: 'SINA MCP exposes read-only platform status and provider discovery. It does not replace the SINA Orchestrator.',
        });
        return;
      }
      case 'notifications/initialized':
        res.status(202).end();
        return;
      case 'ping':
        sendRpc(res, id ?? null, {});
        return;
      case 'tools/list':
        sendRpc(res, id ?? null, { tools: toolDefinitions });
        return;
      case 'tools/call': {
        const name = message.params?.name;
        if (typeof name !== 'string') {
          sendRpcError(res, id ?? null, -32602, 'Tool name is required');
          return;
        }
        try {
          const result = await callTool(name);
          sendRpc(res, id ?? null, textResult(result));
        } catch {
          sendRpc(res, id ?? null, {
            content: [{ type: 'text', text: 'Unknown tool or tool execution failed' }],
            isError: true,
          });
        }
        return;
      }
      default:
        if (isNotification) {
          res.status(202).end();
          return;
        }
        sendRpcError(res, id ?? null, -32601, 'Method not found');
    }
  } catch {
    if (isNotification) {
      res.status(202).end();
      return;
    }
    sendRpcError(res, id ?? null, -32603, 'Internal error');
  }
});

router.get('/', (_req, res) => {
  res.setHeader('Allow', 'POST');
  res.status(405).json({ error: 'MCP Streamable HTTP endpoint accepts POST requests only' });
});

router.delete('/', (_req, res) => {
  res.setHeader('Allow', 'POST');
  res.status(405).json({ error: 'This stateless MCP endpoint does not use sessions' });
});

export default router;
