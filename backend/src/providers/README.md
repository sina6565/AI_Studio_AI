# Provider integration status

SINA keeps its existing ProviderRegistry, IProvider contract, Router and Orchestrator as the canonical integration points.

## Existing adapters
- Agnes: optional multimodal adapter.
- Gemini: optional text adapter.
- Ollama and FakeProvider: currently used by the vertical-slice agent runtime; not yet unified with the main IProvider registry.

## New OpenAI-compatible text adapters
- OpenRouter
- Together
- Pollinations
- Hugging Face Inference Providers

These adapters are opt-in and text-only in this increment. Each requires its own credential and an explicitly configured model where no safe default exists. A provider is not considered available merely because its adapter class exists.

## Not included in this increment
- Anthropic ACP and Gemini ACP: ACP is an agent-client protocol integration, not a drop-in chat-completions endpoint. Implement as a separate agent transport after protocol/version and permission-boundary review.
- TLS/client fingerprint spoofing ("stealth"): excluded. Integrations must use documented APIs and comply with provider terms.
- Image, video, audio, speech, pools, LP, billing, governance, auction and smart contracts: separate implementation phases; no operational capability is implied by design documents.
