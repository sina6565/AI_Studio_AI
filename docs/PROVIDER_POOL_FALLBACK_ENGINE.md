# Provider Pool & Fallback Engine

## Current project scope — RAG deferred

**RAG is explicitly out of scope for the current implementation phase.** Do not build, integrate, provision, or add runtime dependencies for `trace_index`, `asset_index`, `pipeline_traces`, vector databases, embeddings, or `query_rag`. Any RAG material elsewhere in this document is retained only as deferred design context and is not an active requirement, implementation task, acceptance criterion, or release dependency. Revisit it only after the project owner explicitly reopens the scope.

The active focus is the existing TypeScript platform: inspect the canonical repository first, then implement and verify the mandatory Provider Pool / Fallback Engine, quota tracking, the approved capability-specific fallback policy, and the SINA-controlled MCP Gateway without replacing or duplicating the SINA Orchestrator. No parallel Python subsystem and no speculative architecture rewrite.

---

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


## Free and local provider expansion candidates

The project may evaluate a broader provider set inspired by the external **FreeRide-H** catalog. Its published README describes a manager for nine provider families and 43+ free-model entries, including OpenRouter, OpenCode Zen, Mistral, Groq, Cerebras, SambaNova, NVIDIA NIM, Ollama Local, and Ollama Cloud. This is a third-party catalog snapshot, not an authoritative guarantee that every listed model or quota remains free, available, production-permitted, or reachable in SINA's deployment regions. Treat it as a discovery input only; verify each provider's current first-party pricing, rate-limit documentation, model catalog, terms, and data-handling policy before activation.

### Candidate provider registry

| Provider family | Proposed SINA role | Initial status / gate |
| --- | --- | --- |
| NVIDIA NIM | Primary hosted capacity candidate | Preferred hosted route after per-model quota, catalog, and license verification |
| Groq | Fast inference candidate | Verify current free-tier quotas, model availability, and tool-calling/streaming support |
| Cerebras | High-throughput inference candidate | Verify quota type, model set, and service terms |
| Mistral | General and code-model diversity | Verify current free-tier conditions and model-specific capabilities |
| SambaNova | Alternative hosted inference | Verify free access, quotas, and production terms |
| OpenCode Zen | Additional model catalog | Verify service terms, model availability, and compatibility |
| OpenRouter | Cross-provider model diversity and coverage | Complementary route; verify each underlying model/provider's terms and actual price |
| Ollama Local | Local-first inference | Preferred when a suitable model and local hardware are available; no hosted API key |
| Ollama Cloud | Optional hosted inference | Treat as a separate cloud provider; verify free GPU-time limits and terms |

Do not encode claims such as "~30M tokens/month" as constants. Store quota type, amount, reset window, scope (account/model/endpoint), source URL, checked-at timestamp, and confidence per provider/model. Free tiers can change or be withdrawn. Provider onboarding must be opt-in, and no paid route may be enabled as a side effect of discovery or fallback.

FreeRide-H is a possible research reference, not a runtime dependency or a component to install blindly. Before adopting any code or operational behavior, review its source, license, security posture, credential handling, rotation semantics, and compatibility with SINA's own Provider Pool. SINA must retain its own policy engine and must not inherit quota-evasion behavior.



## RAG architecture: orchestration traces and production assets

SINA RAG has two distinct indexes with separate retention, access policy, and retrieval purpose. They may share underlying infrastructure, but their schemas, namespaces, authorization, and retrieval pipelines must remain logically isolated.

### 1. Trace RAG for Orchestrator learning

- Store pipeline execution traces in a `pipeline_traces` record family: normalized user/task intent, modality, task profile, selected tool/agent sequence, provider/model route references, policy version, retry/fallback events, sandbox verification evidence, outcome, quality/acceptance result, latency, and metered usage.
- Do not store raw credentials, authorization headers, or unnecessary sensitive prompt/file content. Apply tenant/project scoping, redaction, retention limits, and deletion policies.
- Index approved, redacted task/trace representations in a dedicated `trace_index` for similarity retrieval. Retrieve prior successful and failed patterns as decision-support evidence, not as instructions that override current policy.
- The Orchestrator decides whether to query trace memory and how to use the results. Similarity alone must never authorize a tool, provider, model, budget, or access path.
- Capture feedback from actual outcomes and sandbox acceptance tests. Do not label an execution successful merely because generation returned a response.

### 2. Asset RAG for generation context

- Maintain a separate `asset_index` for user-authorized project files, generated assets, templates, documentation, prior project artifacts, and reusable components.
- Enforce tenant, project, ownership, file-permission, and lifecycle filters before retrieval. Preserve source references and provenance so generated outputs can be traced to the assets used.
- The Orchestrator selects when asset retrieval is needed and supplies only authorized, relevant context to the generation workflow.

### 3. Exposure through MCP Gateway

Expose retrieval to runtime Agents through a narrowly scoped MCP tool such as `query_rag`, with an explicit index selector (`trace_index` or `asset_index`), project scope, query limits, and typed result schema. The MCP Gateway re-checks user/project authorization on every invocation. Models and tools must not connect directly to vector stores, MongoDB, filesystems, or trace databases.

Suggested initial module boundaries are `backend/rag/trace_index` and `backend/rag/asset_index` (adapt paths to the repository's actual stack and conventions). The trace store may use the existing database and vector-search capability if present; do not add a new database or paid service without inspecting the current implementation and obtaining owner approval.

### RAG acceptance tests

- cross-tenant and cross-project retrieval is denied;
- trace retrieval excludes secrets and redacts sensitive fields;
- asset retrieval respects file/project permissions and provenance;
- trace similarity cannot override access, provider, budget, or safety policy;
- failed/unverified sandbox runs are not recorded as accepted successes;
- `query_rag` is accessible only through the MCP Gateway and is authorized at invocation time;
- trace and asset indexes cannot accidentally query or expose each other's namespaces.

## MCP Gateway and tool authorization architecture

MCP servers extend SINA's tools, but **no MCP server or tool is exposed directly to a model by default**. All MCP connections and tool invocations must pass through a SINA-controlled MCP Gateway / Tool Access Layer.

### Candidate MCP integrations and SINA responsibilities

| MCP server / integration | Intended SINA use | Required controls |
| --- | --- | --- |
| Playwright | Automated browser testing and acceptance checks for generated websites | Isolated browser session, allowed-origin policy, test-only credentials, download/upload restrictions, human approval for external side effects |
| Filesystem | Read/write generated project files in a sandbox | Strict workspace-root allowlist, path traversal protection, per-project isolation, no host/home/root access |
| Fetch / Web search | External context acquisition for research and RAG | URL/domain policy, SSRF and private-network blocking, content-size/time limits, provenance and source citations |
| GitHub | Manage user-authorized project repositories, branches, issues, and pull requests | OAuth/token scopes, repository allowlist, tenant isolation, read/write separation, approval for commits, PRs, merges, and destructive operations |
| PostgreSQL / SQLite | Controlled access to project data, credit ledger, and entitlement state | Prefer narrow application services for credit/entitlement mutations; parameterized queries, least-privilege DB roles, tenant scoping, audit log, and read-only access by default |
| Sentry | Error and trace inspection for generation pipelines | Project-scoped access, secret/PII redaction, read-only default, explicit approval for issue mutations |

The table identifies candidate integrations and security requirements; it does not claim that these MCP servers are installed, connected, or production-ready. Prefer maintained official implementations and verify their repository ownership, license, release activity, transport/authentication model, and security advisories before selection.

### Gateway authorization flow

1. Authenticate the user and resolve tenant, project, session, and subscription/entitlement state.
2. Resolve the requested product capability and its access policy (for example: free, ad-unlocked, or paid/Plus).
3. Build a per-request tool allowlist. Only tools authorized for this user, project, task, and entitlement may be advertised to the model.
4. Enforce authorization again at invocation time; hiding a tool from the model is not an access-control boundary.
5. Validate arguments against schemas and policy; enforce workspace, repository, URL, database, and resource scopes.
6. Apply risk-based approval for writes, external side effects, deployments, spending, destructive operations, or access to sensitive data.
7. Execute with short-lived scoped credentials where supported; never pass raw provider or user secrets into model context.
8. Record actor, project, tool/server, approved scope, decision, invocation result, and redacted audit metadata.

### Product entitlement rule

A tool such as **Website Builder** is exposed only after the user has successfully authenticated and the entitlement service confirms that the relevant access path is satisfied (for example, an active Plus entitlement or a valid ad-unlock grant, if that is the product policy). Client-side UI visibility is not sufficient. The backend MCP Gateway must re-check entitlement on every tool invocation and enforce expiry, usage limits, and revocation. Ad views or ad-unlock grants must be verified server-side; never trust a client-supplied "ad watched" flag.

Entitlements must be represented by a central SINA policy/entitlement service, not scattered provider-specific checks. The model may request a tool, but it cannot grant itself access or alter the user's entitlement. Denied calls return a structured authorization error and do not execute.

### MCP rollout and tests

Start with read-only, low-risk tools and a single isolated capability. Before enabling writes, test:
- unauthorized user/project/tenant cannot discover or invoke a tool;
- free, ad-unlocked, and Plus entitlements are checked server-side and expiry/revocation take effect immediately;
- tool invocation is denied even if the model fabricates or replays a previously seen tool call;
- filesystem path traversal, symlink escape, and cross-project access are blocked;
- Fetch blocks localhost, private, link-local, and cloud-metadata destinations and revalidates redirects;
- GitHub write/merge/delete actions require appropriate scopes and explicit approval;
- database access uses least-privilege roles and cannot mutate credit/entitlement records outside approved application services;
- Playwright runs in an isolated browser context and cannot access unrelated user sessions;
- Sentry output is redacted and scoped;
- audit records are complete without storing secrets or unnecessary personal data.

No MCP integration should be considered active until its server, transport, credentials, authorization policy, isolation boundary, and tests have been verified.


## Project backlog: provider expansion and MCP integrations

The following items are accepted into the SINA AI STUDIO **project architecture and implementation backlog**. Recording them here means they are planned candidates, not that packages have been installed, services connected, credentials configured, or runtime behavior implemented.

### Provider expansion backlog

Evaluate and add adapters through the existing Provider Adapter Interface and Provider Registry for:

- NVIDIA NIM — primary hosted-capacity candidate, subject to verified model-level limits and applicable terms.
- Groq — hosted inference candidate.
- Cerebras — hosted inference candidate.
- Mistral — hosted inference candidate.
- SambaNova — hosted inference candidate.
- OpenCode Zen — hosted model catalog candidate.
- OpenRouter — complementary model diversity and coverage.
- Ollama Local — local-first inference route.
- Ollama Cloud — optional hosted route, separately gated from local Ollama.

Implementation requirements:
1. Use one provider-neutral adapter contract and the SINA Provider Pool; do not add provider-specific routing branches to the Orchestrator.
2. Discover and verify current model IDs, supported capabilities, API compatibility, rate limits, quota scope/reset, data handling, license, and free/paid status from first-party sources.
3. Store quota and health per actual scope (provider/account/model/endpoint as documented); do not assume a quota is per-model unless verified.
4. Keep local Ollama preferred when it satisfies the task and local-first policy.
5. Require explicit owner configuration/approval for cloud credentials and any paid usage. Never silently enable paid fallback.
6. Add contract tests, quota/error classification tests, secret-redaction tests, and capability/quality benchmarks before enabling each adapter.
7. Keep FreeRide-H as an optional research/catalog reference only; do not add it as a runtime dependency or blindly inherit its credential-rotation behavior.

### MCP integration backlog

Implement a SINA-controlled MCP Gateway / Tool Access Layer, then evaluate these MCP server integrations:

- Playwright — isolated automated browser testing and generated-site acceptance criteria.
- Filesystem — sandbox-scoped project file read/write.
- Fetch and Web Search — controlled external context acquisition for approved research tasks (not RAG in the current phase).
- GitHub — user-authorized repository/project operations.
- PostgreSQL and SQLite — scoped data access; credit and entitlement mutations remain behind trusted application services.
- Sentry — project-scoped pipeline error and trace inspection.

Implementation requirements:
1. Every MCP server connection and tool invocation must pass through the SINA MCP Gateway; models must never connect directly to arbitrary MCP servers.
2. Authenticate the user and resolve tenant/project scope and entitlement on the backend for every invocation.
3. Construct a per-task tool allowlist; re-check authorization at invocation time even if a tool was previously advertised to the model.
4. Enforce least-privilege credentials, schema validation, resource scoping, isolation, rate/size/time limits, and redacted audit logs.
5. Require explicit approval for external side effects and high-risk writes (for example repository writes/merges, deployments, destructive file/database actions, or spending).
6. Website Builder and other gated capabilities may be exposed only after the backend entitlement service confirms the required Plus entitlement or valid ad-unlock grant. UI visibility or a client-provided ad-watched flag is never authorization.
7. Begin with read-only and isolated test integrations; expand to writes only after security and acceptance tests pass.

### Suggested implementation sequence

1. **Foundation:** Provider Registry schema, model catalog, quota/health metadata, MCP Gateway interfaces, central entitlement checks, audit events, and feature flags.
2. **Low-risk providers:** Ollama Local first, then hosted adapters only after credentials, free-tier terms, and capability contracts are verified.
3. **Hosted capacity and diversity:** NIM as the primary hosted-capacity candidate; evaluate Groq, Cerebras, Mistral, and SambaNova; use OpenRouter and OpenCode Zen for complementary coverage; keep Ollama Cloud separately opt-in.
4. **MCP read-only tools:** Fetch/Web Search and Sentry read-only, followed by GitHub read-only and isolated Playwright acceptance tests.
5. **Sandboxed project tools:** Filesystem with strict workspace isolation; then scoped PostgreSQL/SQLite access through application services.
6. **Controlled write actions:** GitHub writes, generated-project file changes, and other side effects only with explicit approval, authorization, and audit.
7. **Release gate:** provider contract tests, MCP security tests, entitlement bypass tests, isolation tests, regression suite, and documented live verification.

Do not interpret this backlog as permission to spend money, create paid resources, enable production traffic, or merge the pull request. Each integration must remain feature-flagged and disabled until its owner-approved configuration and release gates are complete.


### Server-side quota tracker requirements

Quota availability must be checked before provider dispatch by a server-side Quota Tracker; catching a 429 in application code is not a quota-management strategy.

- Track counters and reset windows at the actual documented scope: provider, account, model, endpoint, or shared pool. Do not assume per-model isolation unless verified.
- Support at least requests-per-minute (RPM) and requests-per-day (RPD) windows where the provider exposes or imposes those limits. Extend to token/image/frame/concurrency budgets where relevant.
- Use Redis-backed atomic counters/reservations for shared production backend instances. An in-memory implementation is acceptable for isolated unit tests and single-process development only; it must not be mistaken for globally coordinated production quota state.
- Reserve capacity atomically before dispatch to prevent concurrent jobs from over-allocating a known quota. Reconcile reservations with actual usage and provider responses; handle cancellation and uncertain outcomes safely.
- Keep provider-reported limits/reset headers authoritative when available. Store source, scope, checked-at time, and confidence for configured limits. Unknown or stale quota data must use conservative policy, not fabricated free capacity.
- On 429, classify the typed rate-limit error, honor `Retry-After`, update the correct quota bucket, and move to the next independently eligible route. Do not use account/key rotation to evade shared quotas.
- Emit typed errors such as `LLMQuotaError` and `LLMRateLimitError` at the adapter boundary, then normalize them into provider-neutral Pool errors for callers.
- Quota tracking must not grant permission to call a provider: policy, entitlement, budget, license, capability, and provider allowlists are checked independently.

## Mandatory architectural decision: Provider Pool is a core SINA platform component

The **Provider Pool & Fallback Engine is mandatory core infrastructure** for SINA AI STUDIO. It is not an optional integration, experimental add-on, or provider-specific convenience layer.

### Non-negotiable architecture boundary

- Every model inference request—local or hosted, free or paid, text or multimodal—must be dispatched through the SINA Provider Pool.
- No product feature, Agent, tool, API route, or Orchestrator module may call a provider adapter or provider API directly. The only permitted exception is an explicitly isolated test harness that cannot be enabled in production.
- The SINA Orchestrator remains the owner of task planning, decomposition, agent coordination, and task-level decisions. It expresses capability and policy constraints to the Provider Pool; it does not select credentials, rotate provider accounts, maintain provider quotas, or implement provider-specific fallback branches.
- The Provider Pool owns provider/model eligibility, route selection, quota and rate-limit accounting, health/circuit state, bounded retries, authorized fallback, cost controls, and provider-call execution.
- Provider adapters are reachable only through the Provider Pool's stable internal interface. Model Registry and Provider Registry supply metadata; neither registry bypasses Pool policy.
- All execution paths, including background jobs, queue workers, synchronous API calls, agents, website/game/media builders, and internal tools, must use the same governed dispatch boundary.

### Required enforcement

1. Define a single typed Provider Pool interface and make it the only production dependency available to inference consumers.
2. Add dependency-boundary checks (static import rules or architecture tests) that fail CI if production modules outside the Pool import provider SDKs/adapters or call provider endpoints directly.
3. Centralize provider credentials and secret resolution; no consumer or Agent receives raw provider API keys.
4. Enforce per-task capability, privacy, entitlement, budget, quota, and provider-allowlist policies before dispatch.
5. Normalize provider results and errors at the Pool boundary; callers must not depend on provider SDK-specific response types.
6. Emit correlated audit/telemetry events for every route decision, provider attempt, fallback transition, usage record, and final outcome.
7. Fail closed when no eligible route exists. Return structured errors such as `PROVIDER_UNAVAILABLE`, `QUOTA_EXHAUSTED`, `POLICY_DENIED`, or `BUDGET_EXCEEDED`; never bypass the Pool to make a feature appear available.
8. Preserve local-first preferences and explicit owner approval for cloud or paid routes. Mandatory use of the Pool does not mean mandatory use of any particular cloud provider.

### Definition of done

Provider Pool is considered the enforced core only when all production inference paths have been migrated, direct-provider-call architecture tests pass, secrets are inaccessible to consumers, quota/policy enforcement is tested under concurrency, and the existing product flows pass regression tests through the Pool. Documentation alone does not satisfy this implementation gate.


## Mandatory ordered fallback chain and execution policy

The Provider Pool must implement an explicit **Fallback Chain** as a first-class runtime capability, not merely retry the same provider. The chain is defined per capability/task profile, resolved dynamically against the Model Registry, Provider Registry, current quota/health state, and request policy, then executed in deterministic order. A configured chain is a preference order, not permission to bypass eligibility checks.

### Chain resolution and precedence

For every inference request, the Pool must:

1. Resolve the requested capability, task contract, quality floor, privacy/data-residency constraints, latency target, and budget/entitlement policy.
2. Load the capability's ordered fallback policy and expand each logical tier into currently registered model/provider/credential routes.
3. Filter out routes that are disabled, unhealthy/open-circuit, quota-exhausted, incompatible, unauthorized, license-ineligible, outside the allowed region, or over budget.
4. Rank remaining routes within each tier using configured priority and live health/latency/quota signals. Keep the configured tier order; do not let a lower-priority tier leapfrog a healthy eligible higher-priority tier unless an explicit policy says so.
5. Attempt the first eligible route. On a classified retryable failure, apply the error-specific retry/cooldown rule and proceed to the next eligible route within the bounded attempt/deadline budget.
6. Validate the returned result against the original task contract and quality floor before accepting it. If validation fails, record the failure and continue only if another compatible route remains.
7. Return the first valid result, together with a trace of attempted routes and fallback reasons, or return a structured terminal error when the chain is exhausted.

### Default capability-tier templates

The following order is the approved initial hosted-capacity fallback policy for SINA's text/agent inference path. It is an ordered chain, not a local-first chain. Ollama Local is the final listed fallback in this specific policy. Other modalities must have their own explicit chains; do not infer that this text-provider order applies to image, audio, video, 3D, game, or website execution.

| Order | Provider/model tier | Role and selection rule |
| --- | --- | --- |
| 1 | NVIDIA NIM — eligible model A, then model B, then subsequent registered NIM models | Primary hosted capacity tier. Each model slug is an independent quota bucket only where NVIDIA's current documentation/observed response confirms that scope. |
| 2 | OpenRouter — selected compatible free model | Model diversity and compatibility fallback; account-level and model-specific limits must both be respected as documented. |
| 3 | Groq | Additional hosted fallback when the selected model supports the task contract and its quota is available. |
| 4 | Cerebras | Additional hosted fallback when the selected model supports the task contract and its quota is available. |
| 5 | Ollama Local | Final fallback in this specified text-provider chain, only when a suitable local runtime/model is installed, healthy, and meets the task contract. |
| 6 | Structured terminal error | If no eligible route remains, return a typed provider/quota/policy error to the Orchestrator. |

The supplied NIM cascade currently names **eight** model identifiers: `meta/llama-4-maverick-17b-128e-instruct`, `meta/llama-3.1-8b-instruct`, `openai/gpt-oss-20b`, `nvidia/nemotron-nano-9b-v2`, `nvidia/llama-3.3-nemotron-super-49b-v1`, `meta/llama-3.3-70b-instruct`, `mistralai/mixtral-8x22b-instruct-v0.1`, and `openai/gpt-oss-120b`. The proposal refers to nine models, but a ninth exact model ID has not been supplied. Do not invent one; leave the ninth slot unconfigured until the owner provides and verifies its exact catalog ID.

For OpenRouter, the initial candidate free-model list is `qwen/qwen3-coder:free`, `minimax/minimax-m2.5:free`, `nvidia/nemotron-3-super-120b-a12b:free`, `openai/gpt-oss-120b:free`, `stepfun/step-3.5-flash:free`, `z-ai/glm-4.5-air:free`, and `openrouter/free`. These are candidate IDs from the supplied proposal, not a guarantee of current availability, tool-calling support, context length, or free quota. Verify the live catalog and each model's tool-calling contract before enabling it for Agent workflows.

The proposal's figures—40 RPM per NIM model and an aggregate capacity estimate based on cascading models, as well as OpenRouter's stated free RPM/RPD range—are planning claims that must be verified against current first-party terms and the project's actual entitlement. Never encode them as universal constants. Store the documented quota scope, limit, reset window, source, checked-at timestamp, and confidence per provider/model/endpoint. A theoretical sum of independent limits is not a throughput guarantee and must not be used to promise capacity.

For this text/agent chain, attempt eligible NIM model routes in configured order, then the compatible OpenRouter route(s), then Groq, then Cerebras, then Ollama Local. The chain is dynamically filtered by capability, tool-calling support, quality floor, policy, live health, quota, and budget. If a route is skipped because the server-side quota tracker already knows it is exhausted, do not call it. If the provider returns 429 despite an available local estimate, update the correct quota scope, honor `Retry-After`, and advance only to an independently eligible route. Never rotate credentials or accounts to evade a shared quota or provider restriction.

### Failure transition rules

- **Route-local transient failure** (timeout, connection reset, eligible 5xx): bounded retry on the same route, then next eligible route.
- **429 / rate limit:** honor `Retry-After` and provider reset metadata. Mark the relevant documented quota scope as throttled. Continue only to a distinct route that is independently eligible and whose use does not evade shared limits or provider restrictions.
- **Quota exhausted:** quarantine that quota scope until its verified reset/cooldown; advance to the next eligible route.
- **Credential failure (401/403):** quarantine the credential route and raise an operator alert; do not retry it or rotate through identities to bypass account controls.
- **Unsupported capability / invalid input:** do not cascade the same invalid request through providers. Stop unless an explicitly approved, contract-preserving transformation exists.
- **Safety, policy, privacy, entitlement, or budget denial:** terminal denial; never use fallback to bypass the denial.
- **Quality/contract validation failure:** reject the output and continue only to a route that can meet the same minimum contract. Do not silently lower the quality floor.
- **Paid route encountered:** skip unless the request carries explicit, valid owner/user authorization for that spend and remains within its budget. No automatic paid fallback.

### Chain configuration and safeguards

- Store versioned fallback policies by capability and task profile, with explicit tier order, allowed providers/models, retry budget, deadline, quality floor, and paid-route consent requirements.
- Support project-level overrides only within platform safety and owner policy; users and Agents cannot add arbitrary providers or relax platform restrictions at runtime.
- Keep credential rotation separate from provider/model fallback. Credential failover is permitted only among independently authorized credentials within the same provider account/terms and must never evade shared account quotas or rate limits.
- Use idempotency keys or provider-supported request identifiers for retryable generation calls. For non-idempotent operations without safe idempotency, do not automatically replay after an ambiguous timeout; surface an uncertain outcome for reconciliation.
- Enforce a global maximum attempt count, per-route retry count, wall-clock deadline, and concurrency budget to prevent retry storms and duplicate charges.
- Persist a structured execution trace: policy version, ordered candidates, skipped-route reasons, attempted route IDs, normalized error classes, retry delays, quota scope updates, output validation, and final decision. Redact secrets and unnecessary prompt/file content.
- Expose fallback state to the job/API layer as provider-neutral progress metadata; never expose credential values or internal secret references.
- Provide a dry-run/explain mode that shows the planned chain and why candidates are eligible/ineligible without making provider calls.

### Required fallback-chain acceptance tests

- deterministic ordering and stable policy-version behavior;
- dynamic exclusion of disabled, unhealthy, incompatible, unauthorized, unlicensed, over-budget, and quota-exhausted routes;
- local-first selection when a suitable local route is eligible;
- NIM hosted tier before complementary hosted diversity tiers when configured and eligible;
- correct advancement on timeout, 5xx, 429, and quota exhaustion, honoring reset/Retry-After;
- terminal stop on policy/safety/privacy/entitlement/budget denial and invalid input;
- no downgrade below the task quality floor and no acceptance of invalid fallback output;
- no paid fallback without explicit approval;
- no cross-account or cross-key quota-evasion behavior;
- bounded attempts/deadline and protection against retry storms;
- idempotency and ambiguous-timeout handling for generation tasks;
- complete redacted trace of selected, skipped, attempted, and final routes;
- dry-run chain explanation performs zero provider calls.

