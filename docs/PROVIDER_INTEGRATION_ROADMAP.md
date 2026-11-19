# SINA AI STUDIO — Provider integration roadmap

This plan extends the existing SINA provider architecture. It does not replace the Orchestrator, ProviderRegistry, IProvider contract, Router, job queue, or local-first provider strategy.

## Integrated in the current branch
- OpenRouter: OpenAI-compatible text adapter.
- Together: OpenAI-compatible text adapter.
- Pollinations: OpenAI-compatible text adapter.
- Hugging Face Inference Providers: OpenAI-compatible chat adapter.
- Each adapter is opt-in, uses its own credential, requires a model selection (except the OpenRouter auto route), and is registered only after initialization and a health/credential check.
- Provider failures are isolated; an optional upstream failure must not prevent SINA from starting.

## Existing capabilities to preserve
- Agnes and Gemini remain existing optional providers.
- Ollama and FakeProvider remain in the agent vertical slice; unifying them with the main IProvider registry is a separate change.
- Local-first execution remains preferred when an appropriate local provider is available.

## Next implementation phases
1. Add model/capability/health/quota metadata and a timestamped price catalog. Never infer free or unlimited quotas.
2. Extend routing to consider task capability, health, quota, price freshness, quality, latency, SLA, user preference and budget. Do not claim cheapest routing until price data and ranking are implemented and tested.
3. Add usage metering, cost-per-success, idempotent usage events and upstream reconciliation.
4. Add media adapters for image, video, audio and speech only after verifying each provider's current official API contract and terms.
5. Add Anthropic ACP and Gemini ACP as separate agent transports after protocol/version and permission-boundary review. They are not interchangeable with OpenAI Chat Completions.
6. Evaluate OpenCode Zen against its official API contract and commercial terms before adding an adapter.
7. Consider capacity pools, LP positions, governance, auctions and smart contracts only as separate, gated phases. No funds, LP deposits, APY or token are active.

## Security boundary
No TLS/client fingerprint spoofing or other attempt to impersonate another client or bypass provider controls. Use official API authentication, respect rate limits and terms, and keep credentials in server-side secret configuration.
