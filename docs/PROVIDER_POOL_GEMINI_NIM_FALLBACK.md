# Provider Pool: Gemini → NVIDIA NIM fallback

SINA exposes one stable `provider-pool` to the Orchestrator for text generation. Concrete providers remain registered and health-checked internally; the Pool Provider owns ordered selection and bounded fallback.

## Default text route

1. Gemini 2.5 Flash (`GEMINI_ENABLED=true`) is the first route while its configured quota is available.
2. NVIDIA NIM (`NVIDIA_NIM_ENABLED=true`) is the next route after a retryable quota/rate-limit or transient service failure from Gemini.
3. Other explicitly registered compatible text providers may follow according to `TEXT_PROVIDER_FALLBACK_ORDER`. OpenRouter and Ollama are skipped unless their concrete adapters are registered and configured.

The default order is `gemini,nvidia-nim,openrouter,ollama`. Providers absent from the registry are skipped. The Orchestrator sees only the Pool Provider for text tasks; it does not contain provider-specific fallback branches.

## Error policy

- 429, explicit quota exhaustion, timeout/network errors, 408 and 5xx: advance to the next eligible route.
- 400, 401, 403, invalid input, unsupported capability, and safety/policy rejection: stop; do not mask these errors by switching providers.
- Attempts are bounded by `PROVIDER_POOL_MAX_ATTEMPTS` (default: number of eligible providers).
- No credential rotation is performed. Upstream limits and reset instructions are respected.

## NVIDIA model pool

The NIM adapter contains the eight supplied model IDs. Within NVIDIA NIM, the configured `NVIDIA_NIM_DEFAULT_MODEL` is tried first, followed by the remaining allowlisted models. The local 40 RPM/model value is a protective in-process throttle, not a guarantee of NVIDIA account quota. It is not a distributed quota ledger and no aggregate RPM is promised.

## Backend secrets

Set secrets only in the backend runtime secret manager. Never commit them or paste them into source files.

- `GEMINI_ENABLED=true`
- `GOOGLE_API_KEY=<secret>` or `GEMINI_API_KEY=<secret>`
- `GEMINI_MODEL=gemini-2.5-flash`
- `NVIDIA_NIM_ENABLED=true` only after verifying account access and billing entitlement
- `NVIDIA_NIM_API_KEY=<secret>`
- `NVIDIA_NIM_DEFAULT_MODEL=openai/gpt-oss-20b`
- `NVIDIA_NIM_BILLING_MODE=free` only after verifying active free entitlement
- `NVIDIA_NIM_ALLOW_PAID=false` (default; do not enable paid usage without explicit owner approval)
- `NVIDIA_NIM_RPM_PER_MODEL=40` (local safety budget only)
- `TEXT_PROVIDER_FALLBACK_ORDER=gemini,nvidia-nim,openrouter,ollama`
- `PROVIDER_POOL_MAX_ATTEMPTS=3`

A live provider smoke test requires the owner's keys and confirmation that the NVIDIA route is covered by an active free entitlement. No live API call or quota claim is implied by CI. GitHub Actions secrets are separate from backend runtime secrets and must be configured independently.

## Scope

This Pool Provider currently governs text generation only. Image, video, audio, speech, character, game and 3D workflows continue to use their capability-specific providers. The architecture is designed to expand by capability without putting provider-specific routing logic in the Orchestrator.
