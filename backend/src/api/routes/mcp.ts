import { timingSafeEqual } from 'crypto';
import { Request, Response, Router } from 'express';
import registry from '../providers/registry';

const router = Router();
const PROTOCOL_VERSION = '2026-07-28';
const SUPPORTED_PROTOCOL_VERSIONS = [PROTOCOL_VERSION, '2025-11-25'];
const SERVER_INFO = { name: 'sina-ai-studio-mcp', version: '0.1.0' };

type JsonRpcId = string | number | null;
interface JsonRpcRequest {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, any>;
}

function responseVersion(req: Request, fallback = PROTOCOL_VERSION): string {
  const requested = req.header('MCP-Protocol-Version');
  return requested && SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : fallback;
}

function sendRpc(res: Response, req: Request, id: JsonRpcId, result: unknown, version = responseVersion(req)): void {
  res.setHeader('MCP-Protocol-Version', version);
  res.status(200).type('application/json').json({ jsonrpc: '2.0', id, result });
}

function sendRpcError(res: Response, req: Request, id: JsonRpcId, code: number, message: string): void {
  res.setHeader('MCP-Protocol-Version', responseVersion(req));
  res.status(200).type('application/json').json({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  });
}

function configuredApiKey(): string | undefined {
  const expected = process.env.SINA_MCP_API_KEY;
  return expected && Buffer.byteLength(expected, 'utf8') >= 32 ? expected : undefined;
}

function hasValidApiKey(req: Request): boolean {
  const expected = configuredApiKey();
  if (!expected) return false;
  const authorization = req.header('authorization') || '';
  const separator = authorization.indexOf(' ');
  const scheme = separator > 0 ? authorization.slice(0, separator) : '';
  const credential = separator > 0 ? authorization.slice(separator + 1).trim() : '';
  const bearer = scheme.toLowerCase() === 'bearer' ? credential : '';
  const supplied = bearer || req.header('x-sina-mcp-key') || '';
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
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
      const providers = registry.getAvailableProviders().map((provider) => ({ name: provider.name }));
      return { count: providers.length, providers };
    }
    default:
      throw new Error('Unknown tool');
  }
}

router.post('/', async (req: Request, res: Response) => {
  if (!hasValidApiKey(req)) {
    const configured = Boolean(configuredApiKey());
    res.status(configured ? 401 : 503).json({
      error: configured
        ? 'Unauthorized'
        : 'MCP authentication requires SINA_MCP_API_KEY with at least 32 bytes',
    });
    return;
  }

  const message = req.body as JsonRpcRequest;
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    sendRpcError(res, req, message?.id ?? null, -32600, 'Invalid JSON-RPC request');
    return;
  }

  const id = message.id;
  const isNotification = id === undefined;
  const requestVersion = req.header('MCP-Protocol-Version');
  if (message.method !== 'initialize' && requestVersion && !SUPPORTED_PROTOCOL_VERSIONS.includes(requestVersion)) {
    res.status(400).json({ error: 'Unsupported MCP-Protocol-Version' });
    return;
  }

  try {
    switch (message.method) {
      case 'initialize': {
        const requested = message.params?.protocolVersion;
        const negotiated = typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : PROTOCOL_VERSION;
        sendRpc(res, req, id ?? null, {
          protocolVersion: negotiated,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: 'SINA MCP exposes read-only platform status and provider discovery. It does not replace the SINA Orchestrator.',
        }, negotiated);
        return;
      }
      case 'notifications/initialized':
        res.setHeader('MCP-Protocol-Version', requestVersion || PROTOCOL_VERSION);
        res.status(202).end();
        return;
      case 'ping':
        sendRpc(res, req, id ?? null, {});
        return;
      case 'tools/list':
        sendRpc(res, req, id ?? null, { tools: toolDefinitions });
        return;
      case 'tools/call': {
        const name = message.params?.name;
        if (typeof name !== 'string') {
          sendRpcError(res, req, id ?? null, -32602, 'Tool name is required');
          return;
        }
        try {
          const result = await callTool(name);
          sendRpc(res, req, id ?? null, textResult(result));
        } catch {
          sendRpc(res, req, id ?? null, {
            content: [{ type: 'text', text: 'Unknown tool or tool execution failed' }],
            isError: true,
          });
        }
        return;
      }
      default:
        if (isNotification) {
          res.setHeader('MCP-Protocol-Version', requestVersion || PROTOCOL_VERSION);
          res.status(202).end();
          return;
        }
        sendRpcError(res, req, id ?? null, -32601, 'Method not found');
    }
  } catch {
    if (isNotification) {
      res.setHeader('MCP-Protocol-Version', requestVersion || PROTOCOL_VERSION);
      res.status(202).end();
      return;
    }
    sendRpcError(res, req, id ?? null, -32603, 'Internal error');
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
