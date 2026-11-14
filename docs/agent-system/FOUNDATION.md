# SINA Native Agent System — Foundation

Status: **foundation interfaces added; not yet wired into production request flow**.

## Scope of this increment

- A provider-agnostic SINAAgent contract and typed task/context/output models.
- An in-memory AgentRegistry with duplicate-id protection and capability lookup.
- An AgentRunner that executes one registered agent and returns a structured result.
- A MessageBus port plus a single-process in-memory fallback.
- A ModelRouter port that makes privacy and remote-use permission explicit.

## Existing systems preserved

- The existing Express/TypeScript API and Orchestrator remain authoritative.
- The existing Provider Registry and provider adapters remain unchanged.
- The existing Bull/Redis job processor and its current auto / inline fallback remain unchanged.
- No new runtime dependency, paid API, model, database, or external service is introduced.

## Important limitations

- The in-memory registry and message bus are process-local and non-durable.
- The runner does not schedule tasks, retry, persist state, grant tool permissions, or invoke a model.
- The model router is an interface only; no model is selected until a concrete adapter is implemented.
- These interfaces are not yet connected to API endpoints, the Orchestrator, MongoDB, Redis, MCP, or a sandbox.
- No claim of production multi-agent execution is made by this increment.

## Next implementation sequence

1. Add focused unit tests for registry, runner, and local message bus.
2. Add durable agent/task definitions and workspace scoping through the existing MongoDB layer.
3. Add permission checks and approval gates before exposing tools to agents.
4. Add a model-router adapter with local-only as the default and remote inference disabled unless explicitly enabled.
5. Connect the runner to the existing Orchestrator through a feature-flagged path.
6. Add a Redis-backed message transport only when cross-process agent messaging is required.
7. Add sandbox and artifact-store adapters before allowing code execution or generated executable artifacts.

## Safety invariants

- Never execute model-generated code inside the API process.
- Never expose secrets to agent prompts or message payloads.
- Treat agent outputs and tool results as untrusted input.
- Require approval for destructive, external, deployment, and data-changing actions.
- Keep retries bounded and make task execution idempotent before enabling automatic re-planning.


## Declarative skill registry

This branch also adds an in-memory SkillRegistry for reusable capability-scoped instructions. It validates stable IDs and capability names, rejects duplicate registrations, bounds instruction text to 32,000 characters, returns summaries without instruction bodies, and returns defensive copies of capability arrays. Skills are plain declarative text: the registry does not download packages, read arbitrary files, access the network, or execute scripts. See [Agent Skills](./SKILLS.md) for its trust boundary and future package-governance requirements.

The skill registry is not persistent and is not yet wired into AgentRunner or production routing. Do not describe skill marketplace, remote installation, signature verification, or cross-process synchronization as implemented.
