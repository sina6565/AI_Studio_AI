# SINA AI STUDIO — Architecture

This document describes the architecture present in the repository. The source files and package manifests are authoritative when implementation details change.

## Application layout

```text
AI_Studio_AI/
├── backend/                 # Express + TypeScript API and orchestration
│   └── src/
│       ├── api/routes/      # HTTP routes
│       ├── config/          # Environment and runtime configuration
│       ├── database/        # MongoDB connection and Mongoose models
│       ├── game/            # Game scene manifests and generation
│       ├── game3d/          # Unreal Engine 5 room job adapter and contracts
│       ├── jobs/            # Bull queue processing and job recovery
│       ├── orchestrator/    # Job creation and execution
│       ├── providers/       # Provider contracts, registry and Agnes adapter
│       ├── routing/         # Capability-based provider selection
│       ├── website/         # Deterministic website generation
│       ├── webhooks/        # Job webhook dispatch
│       ├── types/           # Domain and API types
│       └── utils/           # Logging and shared utilities
├── frontend/               # React + Vite web application
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── App.tsx
├── mobile/                 # React Native application
│   └── src/
│       ├── screens/
│       └── App.tsx
├── tools/ue5-room-worker/  # Self-hosted Blender / Unreal Engine worker
├── docs/                   # Product, operations and engineering documents
└── docker-compose*.yml
```

## Request and job lifecycle

1. The web or mobile client sends an authenticated request to the Express API.
2. The API route validates the request and calls the existing Orchestrator.
3. The Orchestrator selects the execution path, creates a MongoDB job record and submits the job to `JobQueueProcessor`.
4. `JobQueueProcessor` uses Bull with Redis in `auto` or `redis` mode. In `auto` mode it falls back to bounded in-process execution when Redis is unavailable; `inline` mode always runs in-process.
5. The worker calls `Orchestrator.executeJob()`. The Orchestrator validates provider-backed inputs, runs the selected capability, and updates job status, progress, errors and results.
6. The client reads job status and displays the result or failure.

Relevant implementation:
- API routes: `backend/src/api/routes/`
- Orchestrator: `backend/src/orchestrator/Orchestrator.ts`
- Queue processor: `backend/src/jobs/JobQueueProcessor.ts`
- Interrupted-job recovery: `backend/src/jobs/recovery.ts`
- Health endpoint: `backend/src/api/routes/health.ts`

## Provider selection

- `backend/src/providers/interfaces/IProvider.ts` defines the provider contract.
- `backend/src/providers/registry.ts` registers configured providers.
- `backend/src/providers/agnes/AgnesProvider.ts` contains the Agnes adapter. Registration is controlled by `AGNES_ENABLED` and its configured credentials.
- `backend/src/routing/Router.ts` selects a compatible provider for a requested capability.
- The Orchestrator keeps provider-backed work separate from local website generation, manifest-only game building and the UE5 worker path.

Do not assume a provider is active because its name appears in a document or branch. It must be implemented, registered, configured and available at runtime.

## Data and persistence

- MongoDB is accessed through Mongoose models in `backend/src/database/models/`.
- Job records store request data, status, progress, provider metadata, errors and result metadata.
- Redis is used by Bull when the selected queue mode uses Redis.
- `auto` and `inline` queue modes support execution without a Redis service; `redis` mode requires Redis.

## Implemented creation paths

### Website Builder

`backend/src/website/WebsiteBuilderService.ts` validates the website specification and generates standalone responsive HTML. It does not require an AI provider. The web client provides preview, source editing and HTML download. Hosted publishing and AI-written copy are not part of this implementation.

### Game scene creation

`backend/src/game/GameService.ts` creates provider-backed scene artwork and a validated game scene manifest. The generated scene viewer is a visual preview, not a compiled playable game runtime.

### Unreal Engine 5 room pipeline

`backend/src/game3d/UnrealEngine5Adapter.ts` sends preview and build requests to the owner-operated worker under `tools/ue5-room-worker/`. Blender handles procedural room geometry and review artifacts; the worker prepares an Unreal Engine 5 project from the configured owner-supplied template. The adapter requires the worker URL and token, and the build path enforces the Function and Form approval gates.

The repository's worker contract and tests do not prove that Blender or Unreal Engine has run on a configured machine. A real engine build, gameplay acceptance test and packaged executable must not be claimed without worker logs and artifacts.

## Client applications

- Web: React, TypeScript and Vite in `frontend/`.
- Mobile: React Native and TypeScript in `mobile/`.
- The public cinematic landing page, product pages and web creation flows are part of the same `frontend/` application.
- Mobile welcome, authentication and product screens are part of the same `mobile/` application.
- `apps/` and `packages/` do not define separate runnable applications or installable shared packages in the current repository layout.

## Runtime configuration

Use the `.env.example` files and `backend/src/config/` as the source of truth for environment variable names and validation. Do not commit real credentials. Optional providers and the UE5 worker must not prevent the core application from starting when they are not configured; the relevant capability should report its unavailable state.

## Extensibility, parallel development and safe execution

The architecture above is the verified current baseline, not a ceiling. SINA is intentionally open to additive development, new modules, new frameworks, new runtimes, new databases, new agent systems, multiple Orchestrators, new provider families, and new multimodal workflows.

- Build new Orchestrators, agent teams, planners, tool registries, memory systems, workers, and runtimes alongside the existing implementation. Parallel development across branches and agents is encouraged; overlapping prototypes are acceptable.
- Extend or replace existing components when a new implementation provides a better path. Use adapters and migration plans where helpful, but do not require the current stack to remain the only stack.
- Keep Agnes and existing provider integrations available as part of the current baseline while adding local, open-source, hosted, or experimental providers. No cloud provider, paid API, or hosted GPU service may become mandatory without explicit owner approval.
- New multimodal and cross-capability workflows may coordinate website, image, video, audio, speech, character, 3D, and game systems; the distinct paths above describe today's implementation, not a product restriction.
- Continue to isolate untrusted executable content, protect credentials, validate inputs, and report provider availability honestly. These safeguards protect the project and users; they do not limit feature development.
- Update this document as new components are added and validated. Experimental work is welcome and should be labeled clearly rather than blocked.

## Validation references

- Backend tests: `backend/tests/`
- Frontend tests: `frontend/src/` and the configured Vitest suite
- Mobile type-check and lint scripts: `mobile/package.json`
- UE5 worker contract tests: `tools/ue5-room-worker/test_worker_contract.py`
- CI workflows: `.github/workflows/`
