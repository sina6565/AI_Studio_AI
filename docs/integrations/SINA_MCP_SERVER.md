# SINA AI STUDIO MCP Server

SINA exposes a read-only Model Context Protocol endpoint from its own backend. The SINA Orchestrator remains the execution authority; MCP clients do not replace it.

## Endpoint

- MCP Streamable HTTP JSON request endpoint: `POST /api/v1/mcp`
- Connection monitor: `GET /api/v1/mcp/clients`
- Authentication: the existing SINA JWT as `Authorization: Bearer <token>`
- Optional client identity headers: `X-MCP-Client-Name` and `X-MCP-Client-Id`

The MCP route is protected by the same JWT authentication middleware as the SINA API. Project and job tools always filter by the authenticated JWT user ID. No write, generation, cancellation, or administrative tools are exposed.

## Initial tools

- `sina_get_capabilities`
- `sina_list_providers`
- `sina_get_provider_status`
- `sina_list_projects`
- `sina_list_jobs`
- `sina_get_connection_status`

The initial transport is stateless Streamable HTTP in JSON response mode. A successful `initialize` request records the client identity and logs `[MCP] CLIENT_CONNECTED`. The initialize response also includes the `CLIENT_CONNECTED` instruction and SINA server identity.

## Connection visibility and limits

`GET /api/v1/mcp/clients` reports clients seen during the last five minutes as connected and older entries as stale. The registry is intentionally in-memory and per backend process in this first slice; it is not a durable audit log and does not synchronize across multiple replicas. Deployments with multiple backend instances should use sticky routing or move the registry to shared storage before treating the list as a global connection inventory.

## Client setup

Configure a remote MCP client with the deployed SINA MCP endpoint and the JWT in its Authorization header. Use a distinct `X-MCP-Client-Id` for each independent client connection (for example, `n8n-main`, `gemini-workspace-a`, and `gemini-workspace-b`).

Important: the Gemini model/API is not automatically an MCP client. A Gemini-powered application must explicitly support MCP or run a client-side MCP bridge that connects to this endpoint and exposes the returned tools to Gemini. n8n can connect directly only when its MCP client node/version supports remote Streamable HTTP and custom Authorization headers.

## Security

- Never put JWTs in source control, URLs, query strings, or logs.
- Use a dedicated, least-privilege SINA account for integrations.
- Rotate/revoke the JWT if an integration is compromised.
- Treat this initial integration as read-only. Mutating tools require separate scopes, approval, audit logging, and explicit implementation.
