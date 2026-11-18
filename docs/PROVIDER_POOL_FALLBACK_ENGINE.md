# Provider Pool & Fallback Engine

## Status and intent

This document adds a provider-management layer to the SINA AI STUDIO architecture. It is an architectural specification, not a claim that the runtime implementation is complete.

The **Provider Pool & Fallback Engine** sits between the SINA Orchestrator and concrete provider adapters. The Orchestrator expresses task intent and constraints; the pool resolves an eligible provider/credential route, executes the adapter call, and returns a normalized result. Provider selection, quota accounting, credential rotation, health tracking, and fallback policy must not be implemented as provider-specific branching inside the Orchestrator.

## Position in the request path

```text
Client / API
    |
SINA Orchestrator
    |  Task + capability + policy constraints
    v
Provider Pool & Fallback Engine
    |-- Capability / policy resolver
    |-- Eligible provider & credential-pool selector
    |-- Quota and rate-limit ledger
    |-- Health checks / circuit breaker
    |-- Retry and fallback-chain executor
    |-- Usage, cost, and audit recorder
    |
    v
Provider Adapter Interface
    |-- Ollama
    |-- ComfyUI
    |-- Whisper
    |-- Piper
    |-- Agnes (when configured)
    |-- Other explicitly enabled adapters
    |
Provider API / Local Runtime
```

The pool is an orchestration boundary for providers, not a second task planner. It does not replace the SINA Orchestrator, Agent Registry, Tool Registry, or existing Redis/Bull job system.

## Core responsibilities

1. **Capability-aware selection:** choose only providers that support the requested modality, operation, input/output format, model constraints, region, privacy policy, and quality requirements.
2. **Credential-pool management:** maintain references to multiple explicitly authorized credentials or accounts per provider. Secret values remain in environment configuration or a secrets manager and are never stored in source control, logs, job payloads, or this registry.
3. **Quota ledger:** track provider-reported quota, rate limits, reset windows, usage estimates, and observed 429/limit responses. Distinguish hard quota exhaustion from transient throttling, authentication errors, billing restrictions, and provider outages.
4. **Automatic rotation:** when a credential reaches a configured threshold or receives a confirmed quota-exhaustion response, mark that credential temporarily ineligible and select the next eligible credential/provider in the configured fallback chain.
5. **Health and circuit breaking:** track success rate, latency, timeout/error classes, cooldown windows, and circuit state per provider endpoint and credential route.
6. **Fallback execution:** retry only when the operation is safe to retry; use bounded attempts, exponential backoff with jitter, and an overall job deadline.
7. **Observability and audit:** record the selected provider/credential reference (never the secret), reason for selection, fallback transitions, usage, latency, normalized errors, and final outcome.
8. **Policy enforcement:** enforce user/project limits, data residency, privacy, allowed-provider lists, cost ceilings, and local-first preferences before any provider call.

## Selection and rotation policy

The selector should rank eligible routes using an explicit policy, for example:

- capability and request constraints must match;
- locally available providers are preferred when configured and suitable;
- routes with exhausted quota, open circuit, invalid credentials, or disabled status are excluded;
- remaining routes are ranked by configured priority, health, latency, and usage/cost policy;
- selection can use weighted round-robin or least-used balancing among equivalent eligible routes;
- the chosen route and decision reason are attached to the job trace.

Rotation is permitted only across credentials/accounts and endpoints that the project owner is authorized to use and whose provider terms permit the usage. It must not be used to evade provider rate limits, free-tier restrictions, account suspensions, billing controls, identity checks, or other provider safeguards. If no authorized route remains, return a structured `PROVIDER_UNAVAILABLE` or `QUOTA_EXHAUSTED` result and explain the next reset/configuration action. Do not silently switch to a paid provider or incur charges.

## Fallback chain

Each capability may define an ordered, policy-filtered chain, such as:

```text
image.generate:
  local ComfyUI route(s)
  -> explicitly enabled Agnes route(s)
  -> other explicitly enabled routes

speech.transcribe:
  local Whisper route(s)
  -> explicitly enabled compatible route(s)
```

These are examples of routing shape, not assertions that each route is currently configured or operational. A chain must be built dynamically from the Provider Registry and project policy; it must not hard-code credentials or assume a cloud provider exists.

Fallback must preserve the original task contract. The pool must verify that the fallback route supports the required parameters and output contract. It must not silently downgrade quality, change model semantics, alter privacy guarantees, or use a different modality without an explicit policy allowing that change.

## Error classification

- **Quota exhausted:** mark the credential route unavailable until the provider reset time or a conservative configured cooldown; continue to the next authorized route.
- **Rate limited / 429:** honor provider retry hints such as `Retry-After`; apply bounded backoff. Rotate only if policy and provider terms permit another authorized route.
- **Transient network / 5xx / timeout:** retry within the bounded retry budget, then evaluate the next eligible route.
- **Invalid credentials / 401 / 403:** quarantine the affected credential route and raise an operator-visible configuration alert; do not loop through it.
- **Unsupported request / validation error:** do not retry the same invalid request against every provider. Return the normalized validation failure unless a compatible transformation is explicitly defined.
- **Content or safety rejection:** do not treat a rejection as quota exhaustion; preserve the provider's safety outcome and apply SINA policy.
- **Unknown error:** fail closed after bounded attempts and retain a diagnostic trace without exposing secrets or private inputs.

## State and integration

- Keep provider capabilities, endpoint metadata, priority, policy flags, and credential references in the Provider Registry.
- Keep dynamic quota/health/circuit state in a concurrency-safe shared store. Redis is a candidate because SINA already uses Redis/Bull, but the implementation must confirm the existing Redis configuration and provide a safe degraded mode.
- Use atomic reservation/update operations to prevent concurrent jobs from over-consuming a known quota.
- Treat provider-reported usage as authoritative when available; local estimates are advisory and must be reconciled.
- Integrate with existing Bull jobs through a stable pool interface. The queue owns job lifecycle; the pool owns provider-route selection and provider-call fallback.
- Expose a provider-neutral result and error contract to the Orchestrator. Do not leak provider SDK types into task-planning logic.

Suggested interface shape (illustrative; adapt to repository conventions):

```ts
interface ProviderPool {
  execute<TInput, TOutput>(
    request: ProviderTask<TInput>,
    policy: ProviderExecutionPolicy
  ): Promise<ProviderExecutionResult<TOutput>>;
}
```

## Security and governance

- Never commit API keys, tokens, cookies, or credential files.
- Never log secret values or full authorization headers.
- Apply per-user/project authorization and usage limits before dispatch.
- Make paid routes opt-in and require explicit configuration/approval; no silent paid fallback.
- Keep a complete audit trail of route selection and fallback decisions without retaining unnecessary sensitive prompt or file content.
- Protect quota and credential state against race conditions and cross-tenant access.
- Add administrative controls to disable a provider, credential route, model, or fallback edge immediately.

## Required tests before claiming implementation complete

- capability and policy filtering;
- deterministic priority and balancing behavior;
- concurrent quota reservation without over-allocation;
- quota exhaustion and reset/cooldown handling;
- 429 with `Retry-After`, timeout, 5xx, 401/403, validation, and safety-rejection classification;
- fallback bounded by attempt count and job deadline;
- idempotency / duplicate-job protection for non-idempotent generation calls;
- no paid route selected without explicit opt-in;
- no unauthorized credential rotation or limit-evasion behavior;
- secret redaction in logs, traces, and persisted state;
- Redis unavailable/degraded behavior;
- end-to-end job result and error propagation to the existing API/UI.

## Rollout

Implement behind a feature flag and preserve the existing provider-routing path as a compatibility adapter until parity tests pass. Start with read-only route selection/telemetry, then enable controlled fallback for a single capability, and expand only after tests and live-provider evidence. Update the README and provider documentation when code, tests, and operational behavior are verified.


## NVIDIA NIM and per-model cost optimization

NVIDIA NIM may be registered as an **optional provider family** behind the same Provider Pool interface. It must not become a mandatory dependency, replace the SINA Orchestrator, or bypass the existing local-first and explicit-consent policies. Initial integration is documentation/design only; no NIM endpoint, credential, GPU workload, or paid service is enabled by this specification.

### Separate model registry

Maintain a model catalog independently from provider credentials and provider health. Each model entry should declare:

- stable model ID, provider, supported capabilities/modalities, input/output contracts, context or resolution limits, and supported parameters;
- quality profile and task suitability (for example: lightweight classification, planning, code generation, deep reasoning, vision, embeddings, or review);
- deployment mode: local, hosted API, or self-hosted NIM;
- eligibility, region/data-handling constraints, model/runtime license metadata, and whether production use requires a separate entitlement;
- observed latency, availability, token/image/frame usage units, and current price/estimated cost where applicable.

The Model Registry describes models; the Provider Registry describes endpoints, credentials, capabilities, and health. The Pool joins these records at dispatch time. Do not assume that all models exposed by one provider share the same limits, price, license, or capability contract.

### Task-to-model routing

For each task, select the least-cost model that satisfies the required quality, modality, privacy, latency, and output-contract constraints. A policy may route lightweight planning/classification to a smaller model, code tasks to a code-capable model, complex reasoning to a stronger model, visual tasks to a vision model, embeddings to an embedding model, and independent review to a suitably capable low-cost model. These are routing examples, not fixed model assignments. Evaluate candidates using benchmarked task quality and total cost, not model size or advertised speed alone.

Fallback should prefer another compatible model/provider route, not merely another API key for the same exhausted account. Any model substitution must pass contract and quality thresholds; otherwise return a clear unavailable/quota error rather than silently degrading results.

### NVIDIA NIM deployment and commercial-use gates

Support NIM in two distinct deployment patterns when configured:

1. **NVIDIA-hosted API/catalog:** treat each model endpoint as its own route with model-specific availability, quotas, rate limits, and terms. Free developer/prototyping access must not be represented as unlimited or production-free.
2. **Self-hosted NIM microservice:** register the deployed model/runtime endpoint as a provider route only after hardware, driver/runtime compatibility, capacity, security, and operational health are verified. GPU infrastructure is not assumed to be free.

Before enabling any NIM model, verify the current terms for that exact NIM offering and the underlying model. NIM software/runtime rights and model-weight licenses may be separate. Distinguish developer/prototyping entitlements, NIM Certified or other no-charge offerings, and production entitlements; do not generalize one offering's license to all NIM containers or models. Record the verified license/entitlement source and review date in provider metadata. Production activation is blocked until the required rights are confirmed.

### Cost and quota safeguards

- Track limits and cost per model/endpoint, not only per provider or credential.
- Estimate cost before dispatch where pricing is available; enforce project/user budgets and hard cost ceilings.
- Keep hosted free-tier routes explicitly marked as prototype/development unless their current terms state otherwise.
- Do not rotate keys/accounts to evade rate limits, shared free-tier quotas, billing controls, or provider safeguards. Honor `Retry-After` and provider reset information.
- Paid hosted inference, paid GPU hosting, or production entitlements require explicit owner approval and configuration. No automatic paid fallback.
- If model pricing, quota, entitlement, or license status is unknown or stale, mark the route ineligible for production dispatch until verified.

### Validation before rollout

Add tests for per-model quota isolation, model-specific cost ceilings, task-quality thresholds during model fallback, license/entitlement gating, hosted-versus-self-hosted route metadata, and proof that no paid NIM route is selected without explicit opt-in. Benchmark representative SINA tasks across eligible local and NIM models, recording quality, latency, throughput, and estimated cost before recommending a default route.


### Strategic provider priority: NVIDIA NIM for capacity, OpenRouter for model diversity

For the hosted-model layer, the proposed SINA strategy is:

- **Primary capacity route: NVIDIA NIM.** Prefer eligible NIM-hosted model routes for routine inference capacity when the exact model is available, compatible with the task, within its verified quota, and permitted by the applicable terms.
- **Complementary diversity route: OpenRouter.** Use OpenRouter to broaden model/vendor choice, cover capability gaps, and provide a compatible fallback when an eligible NIM route is unavailable. OpenRouter is not the default primary capacity assumption.
- **SINA remains the control plane.** The SINA Model Registry and Provider Pool make the final choice using task capability, quality thresholds, verified quota, latency, privacy, licensing, and cost policy. Neither NIM nor OpenRouter owns orchestration or provider-selection policy.

#### Candidate NVIDIA NIM model catalog

The following eight model IDs were supplied as candidates for evaluation in the proposed multi-model pool:

| Candidate model ID | Initial registry status |
| --- | --- |
| `meta/llama-4-maverick-17b-128e-instruct` | Candidate; verify exact catalog ID and availability |
| `meta/llama-3.1-8b-instruct` | Candidate; verify exact catalog ID and availability |
| `openai/gpt-oss-20b` | Candidate; verify exact catalog ID and availability |
| `nvidia/nemotron-nano-9b-v2` | Candidate; verify exact catalog ID and availability |
| `nvidia/llama-3.3-nemotron-super-49b-v1` | Candidate; verify exact catalog ID and availability |
| `meta/llama-3.3-70b-instruct` | Candidate; verify exact catalog ID and availability |
| `mistralai/mixtral-8x22b-instruct-v0.1` | Candidate; verify exact catalog ID and availability |
| `openai/gpt-oss-120b` | Candidate; verify exact catalog ID and availability |

The supplied list contains **eight** entries, not nine. Do not infer or invent a ninth model. Confirm every exact model identifier against the live NVIDIA API catalog before registering it; the identifiers above are normalization candidates and may need correction to match the current catalog.

#### Per-model quota hypothesis and safe capacity planning

The proposal supplied for evaluation is that hosted NIM rate limits may be applied independently per model, with a reported allowance of 40 requests per minute (RPM) per model. This is **not yet verified as a universal or guaranteed NVIDIA quota**. Limits may vary by model, account entitlement, endpoint, traffic conditions, and current NVIDIA policy. The implementation must discover or measure the actual documented limit for each model and retain its source and verification timestamp.

If, and only if, NVIDIA confirms 40 RPM independently for each of the eight listed models under the project's applicable entitlement, the arithmetic ceiling would be 8 × 40 = **320 RPM**, before accounting for concurrency, token throughput, request duration, shared infrastructure limits, or other restrictions. A ninth eligible model at the same confirmed limit would produce a theoretical 360 RPM, but no ninth model is currently specified. These figures are planning arithmetic, not a promise of available throughput.

The pool may distribute **distinct eligible tasks** across different models when each model independently satisfies the task's capability and quality contract. It must not spray duplicate requests across models, rotate identities or credentials, or cascade requests for the purpose of evading rate limits, shared quotas, account restrictions, or provider safeguards. On 429 responses, honor `Retry-After` and documented reset behavior; route to another model only when the request is independently eligible there and the provider's terms permit it.

#### Implementation and rollout implications

1. Add NIM as the highest-priority hosted capacity family in the default provider policy, subject to local-first preference where a suitable local route is available and configured.
2. Register each NIM model as a separate model/endpoint record with its own verified capability contract, quota state, rate-limit metadata, health, and license/entitlement status.
3. Register OpenRouter as a complementary multi-model provider family for diversity and capability coverage; do not treat it as the primary capacity pool by default.
4. Keep model-level scheduling fair and quality-aware. Measure RPM, tokens per minute, concurrency, latency, error rates, and task success separately; RPM alone is not a sufficient capacity metric.
5. Keep all cloud routes disabled until the owner explicitly configures credentials and approves the applicable usage. Free/prototyping access must not be assumed unlimited, production-authorized, or guaranteed to remain free.
6. Before changing production defaults, verify live catalog IDs, per-model quota documentation, current terms, and representative benchmarks. Record evidence and review dates in the registry.

This section establishes the intended provider strategy and evaluation plan; it does not claim that the eight models are currently enabled, that a 40-RPM limit has been confirmed for each, or that runtime routing code has been implemented.
