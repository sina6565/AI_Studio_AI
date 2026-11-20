# NVIDIA NIM per-model capacity pool

NVIDIA NIM is the preferred optional cloud text-capacity provider for SINA. The API is OpenAI-compatible:
`https://integrate.api.nvidia.com/v1/chat/completions`.

## Configuration

Set these only in the backend runtime secret manager (never in frontend variables or committed .env files):

- `NVIDIA_NIM_ENABLED=true`
- `NVIDIA_NIM_API_KEY=<secret>`
- `NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1`
- `NVIDIA_NIM_DEFAULT_MODEL=openai/gpt-oss-20b`
- `NVIDIA_NIM_RPM_PER_MODEL=40` (local safety budget; not a promise that NVIDIA grants 40 RPM)
- `NVIDIA_NIM_TIMEOUT=120000`

The provider is optional. Missing credentials or failed health checks must not prevent backend startup. Existing local providers and other configured providers remain available.

## Model pool

The initial catalog contains the eight model entries supplied for the proposed pool, represented with NVIDIA's namespaced API identifiers:

1. `meta/llama-4-maverick-17b-128e-instruct`
2. `meta/llama-3.1-8b-instruct`
3. `openai/gpt-oss-20b`
4. `nvidia/nvidia-nemotron-nano-9b-v2`
5. `nvidia/llama-3.3-nemotron-super-49b-v1`
6. `meta/llama-3.3-70b-instruct`
7. `mistralai/mixtral-8x22b-instruct-v0.1`
8. `openai/gpt-oss-120b`

The supplied list contains **eight** model names, not nine. A ninth model must not be invented; add it only after its exact NVIDIA catalog ID and access are confirmed.

## Routing and fallback policy

- Orchestrator remains the decision-making layer; NVIDIA NIM is a provider, not an orchestrator.
- NVIDIA NIM is preferred for cloud text capacity. OpenRouter remains available for model diversity/fallback; Ollama remains the local-first path.
- The model pool tries the requested model first, then the remaining configured models. It records per-model attempts and moves on after rate-limit or transient/provider errors.
- Invalid request, authentication, and authorization errors stop fallback immediately. Credentials are never rotated to evade provider limits.
- The in-process 40-RPM budget is a protective throttle only. It is not a distributed quota ledger and does not assert NVIDIA's current per-model limits. Multi-instance deployments need a shared atomic limiter before relying on aggregate capacity.
- No fixed aggregate RPM is promised. Theoretical arithmetic (8 x 40 = 320; 9 x 40 = 360) is not guaranteed throughput: upstream quotas, concurrency, latency, model availability, and service policy apply.
- Only text generation is implemented by this adapter. Image, video, audio, speech, character, game, and 3D remain on their existing capability-specific providers and must not be routed to this text adapter.

## Verification still required

- Confirm each model is currently listed and callable under the user's NVIDIA account.
- Run a small sequential smoke test for each model; record HTTP status, latency, response validity, and quota headers where provided.
- Run controlled 429 and transient-error tests against mocked HTTP responses.
- Run backend type-check, lint, unit tests, and end-to-end tests.
- Verify multi-instance quota coordination before advertising aggregate RPM.

Official API reference: https://docs.api.nvidia.com/nim/reference/llm-apis
