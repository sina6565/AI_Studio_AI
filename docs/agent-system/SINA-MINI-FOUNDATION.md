# SINA Mini — first implementation milestone

**Branch:** `feat/sina-mini-personal-agent-v1`  
**Status:** initial contracts and in-memory adapters; not wired into production APIs.

## Goal

Build a lightweight personal agent that can accumulate user-controlled memories and reusable skills without requiring a large model or a large mobile application bundle. The agent runtime must remain model-agnostic so inference can be local or supplied by an explicitly configured remote provider.

## Included in this increment

- Typed personal-memory and skill contracts.
- Owner-scoped memory access in the in-memory development adapter.
- Simple deterministic keyword retrieval for local tests and prototypes.
- Owner-scoped skill metadata registry.
- A model adapter contract, without binding SINA Mini to a specific LLM.

## Deliberately not included yet

- No LLM/provider call and no claim of autonomous learning.
- No embedding model or vector database.
- No persistent database adapter, cloud-drive connector, background sync, or Android UI.
- No skill execution, shell access, code execution, or tool permissions.
- No sharing of personal memories or automatic contribution to collective SINA knowledge.
- No API route or production Orchestrator integration.

## Privacy and security invariants

1. Every memory is scoped to an `ownerId`; callers must derive that identity from authenticated server context, never from an untrusted request body.
2. Memories are private by default. A `shareable` label is only metadata and does not itself authorize publication.
3. Personal memories and reusable skills are separate data classes. Raw memories must never be uploaded to a shared skill catalogue.
4. Skill publication requires a separate explicit consent and review workflow.
5. This in-memory adapter is not durable storage and must not be mistaken for secure persistent storage.
6. Never execute generated code in the API process.

## Next steps

1. Add unit tests for owner isolation, search limits, deletion, duplicate skill IDs, and skill enable/disable.
2. Implement persistent adapters using the repository's existing MongoDB/Mongoose layer.
3. Add an authenticated service boundary that obtains `ownerId` from the verified session.
4. Add a provider adapter and bounded context assembly; keep remote inference disabled unless configured.
5. Add encrypted, user-authorized storage connectors as optional persistence targets. Cloud storage is for durable files and sync, not compute.
6. Add a separate, opt-in skill contribution pipeline with validation, versioning, revocation, and audit history.
