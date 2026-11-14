# SINA Agent Skills

## Purpose

The Skill Registry provides reusable, capability-scoped instructions for native SINA agents. It follows the useful separation between an agent's identity/execution contract and the specialist guidance it may use.

## Current implementation boundary

The initial registry is in-memory and metadata-only:

- Skills have a stable ID, name, version, description, capability list, instruction text, and enabled state.
- Skills can be registered, listed, queried by capability, enabled/disabled, and unregistered.
- Summary listings intentionally omit instruction bodies.
- Registry reads return copies of mutable capability arrays.
- IDs and capability names are normalized and validated.
- Instruction payloads are bounded to 32,000 characters.

The registry does not download skill packages, read arbitrary files, execute scripts, invoke shell commands, or make network requests. It is not a package manager and does not yet persist skills across process restarts.

## Security and governance

Treat skill instructions as untrusted prompt data, not as executable code or trusted policy. A skill cannot grant itself permissions. Agent permissions, user authorization, tool allowlists, approval gates, and provider privacy rules remain enforced by their owning SINA services.

Before adding remote or filesystem-backed skill packages, implement:

1. Trusted publisher identity and provenance.
2. Cryptographic package integrity/signature verification.
3. Explicit owner approval before installation or update.
4. Version pinning and rollback.
5. Path traversal and archive extraction protections.
6. Content-size and resource limits.
7. Audit events for installation, activation, and removal.
8. A clear separation between skill instructions and system/developer policy.

## Integration direction

The native Agent Registry can query skills by capability and pass selected instruction text as context to an agent. The existing SINA Orchestrator remains responsible for task planning and routing. Redis/Bull remains the durable job execution mechanism; the in-memory skill registry must not become a second task queue or coordination system.

## Verification

The unit tests cover registration, duplicate and malformed IDs, capability matching, instruction-size limits, summary redaction, defensive copies, and enable/disable lifecycle. Persistence, multi-process synchronization, signed package installation, and runtime policy enforcement are not claimed by this initial implementation.
