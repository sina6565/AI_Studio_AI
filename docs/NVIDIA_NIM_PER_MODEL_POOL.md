# NVIDIA NIM per-model capacity pool

NVIDIA NIM is an optional text provider behind SINA's Provider Pool. It does not replace the Orchestrator or own cross-provider routing.

## Eight configured model candidates

1. `meta/llama-4-maverick-17b-128e-instruct`
2. `meta/llama-3.1-8b-instruct`
3. `openai/gpt-oss-20b`
4. `nvidia/nvidia-nemotron-nano-9b-v2`
5. `nvidia/llama-3.3-nemotron-super-49b-v1`
6. `meta/llama-3.3-70b-instruct`
7. `mistralai/mixtral-8x22b-instruct-v0.1`
8. `openai/gpt-oss-120b`

The configured `NVIDIA_NIM_DEFAULT_MODEL` is attempted first, then the remaining allowlisted model IDs. The list contains eight supplied models; no ninth model is invented. Verify exact current catalog availability for the NVIDIA account before relying on any model.

## Configuration

Set secrets only in the backend runtime secret manager:

- `NVIDIA_NIM_ENABLED=true`
- `NVIDIA_NIM_API_KEY=<secret>`
- `NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1`
- `NVIDIA_NIM_DEFAULT_MODEL=openai/gpt-oss-20b`
- `NVIDIA_NIM_RPM_PER_MODEL=40` (local in-process safety budget, not an NVIDIA quota guarantee)
- `NVIDIA_NIM_BILLING_MODE=free` only after verifying the account's active free entitlement and that quota exhaustion cannot trigger billable usage.
- `NVIDIA_NIM_ALLOW_PAID_USAGE=false`

The registry fails closed when billing mode is unknown. A paid route is not activated unless `NVIDIA_NIM_ALLOW_PAID_USAGE=true` is explicitly set. The environment flag is a deployment guard, not a substitute for checking the provider account's billing controls.

## Fallback behavior

The cross-provider text order is Gemini 2.5 Flash first, NVIDIA NIM second, then any other compatible adapter explicitly registered and listed in `TEXT_PROVIDER_FALLBACK_ORDER`. Gemini 429/quota exhaustion and transient network/5xx failures advance to the next provider. Invalid input and 400/401/403 failures stop immediately. The NIM model pool advances between model IDs after model-scoped throttling/transient errors; it never rotates credentials or attempts to bypass provider limits.

The 40 RPM setting is a local protective throttle only. It is not a distributed quota ledger. Do not advertise 8 × 40 as guaranteed aggregate throughput; account-level limits, model availability, latency, concurrency and provider policy apply.

## Scope and verification

This adapter implements text generation only. It does not implement image, video, audio, speech, character, game or 3D generation. Live NVIDIA access, free entitlement, model availability and account billing behavior require an owner-provided credential and a controlled smoke test.

Official API reference: https://docs.api.nvidia.com/nim/reference/llm-apis
