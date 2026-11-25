# OpenCode provider family

SINA keeps three distinct integration paths. They are optional and disabled by default.

- `opencode-free`: local OpenCode CLI bridge. This does **not** make hosted inference free; configure a local/free model/provider in the OpenCode installation and set `OPENCODE_FREE_MODEL`.
- `opencode-zen`: direct OpenCode Zen Chat Completions adapter. Zen requires an API key and may incur per-request charges. Do not enable without reviewing account billing. Only models that expose `/chat/completions` are compatible with this adapter; Responses/Anthropic models require protocol-specific adapters.
- `opencode-acp`: separate Agent Client Protocol stdio bridge to `opencode acp`. ACP is an agent protocol, not a model endpoint. It is registered as a text-capable provider adapter for the existing provider interface.

All three remain independent registry entries; none replaces the SINA Orchestrator or existing providers. Capability declarations are text-only. Image, video, audio and TTS are not claimed.

## Configuration

See `backend/.env.example`. All three are opt-in. No credential is required for the local CLI or ACP bridge; Zen requires `OPENCODE_ZEN_API_KEY`.

## Operational notes

- The OpenCode CLI must be installed and available to the backend process for Free/ACP.
- Configure OpenCode's own model/provider for the local CLI path. Availability, quotas and price are determined by that configured provider.
- Zen model IDs and protocol mappings change. Verify the live Zen model catalog and billing before use.
- ACP launches one subprocess per request in this initial bridge. Restrict execution environment and working directory in production.
