# SINA Agent Resource Engine

## Purpose

The resource engine supplies reusable, versioned specialist guidance and approved connector references to SINA agents. It is a native SINA subsystem and does not depend on an external agent framework.

## Resource types

- Skill: capability-specific execution guidance.
- Rule: scoped operational guidance with optional priority ordering.
- Expert: reusable specialist guidance.
- Connector: a reference to a separately managed SINA connection and an explicit tool-name allowlist. Credentials are never stored in a resource.

## Resolution

Resources are selected by capability, enabled state, and scope. Global resources are visible to all matching tasks; tenant resources require an exact tenant match; project resources require an exact project match and, when present, a tenant match. Connector resources are omitted unless the caller explicitly supplies their resource IDs in allowedConnectorIds.

Instruction bodies are treated as untrusted context. They cannot grant permissions, override platform policy, execute code, or authorize connector access. The SINA Orchestrator, MCP Gateway, approval controls, and tool authorization remain authoritative.

## Architecture boundary

The engine uses an AgentResourceRepository port. The included in-memory repository is for tests and local development only; it is not durable or multi-process. A production MongoDB adapter must use the existing SINA persistence conventions and project/tenant authorization before this engine is enabled in production. The engine does not introduce a second job queue, provider router, orchestrator, or external dependency.

## Current implementation

- Typed Skill, Rule, Expert, and Connector resource contracts.
- Capability- and scope-aware resolution.
- Connector allowlisting and credential-reference separation.
- Resource lifecycle operations and summary redaction.
- Focused unit tests for scope isolation, connector gating, validation, and lifecycle.

## Not yet implemented

MongoDB persistence, package import/export, cryptographic publisher signatures, remote resource marketplace, MCP transport execution, and production API wiring are not part of this increment. These require dedicated adapters and authorization tests before exposure.
