# SINA MCP Server

## Purpose

The SINA MCP endpoint exposes a controlled, standards-based tool interface for MCP-compatible clients. It is an integration boundary only: the existing SINA Orchestrator remains responsible for planning, provider routing, jobs, and execution.

## Current scope

- Transport: stateless Streamable HTTP-style JSON-RPC endpoint at `POST /mcp`.
- Protocol negotiation: MCP protocol version `2025-11-25`.
- Authentication: dedicated bearer token (`SINA_MCP_API_KEY`) or `x-sina-mcp-key` header.
- Tools: `sina_backend_status` and `sina_list_providers` (read-only).
- No MCP session state is stored.
- GET and DELETE are not supported; this endpoint does not provide SSE streams or session resumption.

The initial release intentionally exposes read-only tools. It does not expose arbitrary shell, filesystem, database, deployment, game-engine, or job-creation operations. Such tools require per-tool authorization, input validation, audit logging, and explicit approval design before they are enabled.

## Configuration

Generate a unique random secret of at least 32 bytes and set it as a deployment secret:

```env
SINA_MCP_API_KEY=<strong-random-secret>
```

Do not put the real value in source control, client-side code, logs, or screenshots. If the variable is absent, `/mcp` returns HTTP 503 rather than running without authentication. Invalid credentials return HTTP 401.

## Endpoint

```text
POST https://<your-sina-api-host>/mcp
Authorization: Bearer <SINA_MCP_API_KEY>
Content-Type: application/json
Accept: application/json, text/event-stream
```

Initialize:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {},
    "clientInfo": { "name": "your-mcp-client", "version": "1.0.0" }
  }
}
```

Then send `notifications/initialized`, followed by `tools/list` or `tools/call` requests. For example:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": { "name": "sina_backend_status", "arguments": {} }
}
```

## Security and operational boundaries

- Keep the endpoint behind HTTPS in any non-local deployment.
- Use a dedicated MCP secret; do not reuse JWT, provider, database, or webhook secrets.
- Rotate the MCP secret if a client/device is lost or access is revoked.
- Apply network-level restrictions where possible. The endpoint is additionally subject to the backend's request body limit.
- The initial tools are read-only and reveal only service reachability and provider names; they do not reveal credentials, environment values, user data, or job payloads.
- Do not expose this endpoint publicly until a secret has been configured and the deployment smoke test has passed.
- The MCP endpoint is not yet a general outbound MCP client/connector. Connecting external MCP servers is a separate future capability.

## Verification checklist

1. With no `SINA_MCP_API_KEY`, POST `/mcp` returns 503.
2. With an incorrect key, POST `/mcp` returns 401.
3. With a valid key, `initialize` returns server metadata and tool capability.
4. `tools/list` returns the two read-only tools.
5. `tools/call` for each tool returns structured content.
6. Unknown methods return JSON-RPC method-not-found; unknown tools return an MCP tool error.
7. Existing `/health`, `/api/v1` routes, and startup behavior remain unchanged.

A successful unit test does not prove that a production host, reverse proxy, or external MCP client can reach the endpoint. Complete a deployment smoke test before calling the integration live.
