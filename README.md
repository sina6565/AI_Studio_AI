# SINA AI STUDIO

SINA AI STUDIO is an existing, provider-agnostic AI creation platform for web and mobile workflows spanning image, video, audio, speech, text, characters, 3D assets, and experimental game creation.

> **Source of truth:** this repository and its current default branch, `main`. Keep project documentation and implementation aligned with the code. Do not treat planned integrations as completed features.

## Product direction

Turn a user's idea into one or more coordinated outputs through a single experience. The platform should route requests to the appropriate capability, track asynchronous work, preserve project/job history, and assemble the results.

Core capability areas:
- Image and visual asset generation
- Video and animation
- Audio and music
- Speech / text-to-speech (Persian and English where supported by the configured provider)
- Text generation
- Character creation
- 3D assets (scope depends on implemented providers and workflows)
- AI-assisted game creation
- Web projects, user projects, jobs, and generated-asset management

Availability and quality depend on the implemented workflow, provider configuration, credentials, and deployment environment. A listed capability is not proof of a successful live end-to-end run.

## Existing architecture to preserve

```text
Web client (React + Vite) / Mobile client (React Native)
                         |
                  Express + TypeScript API
                         |
            Authentication / Users / Projects
                         |
             Existing Orchestrator / Task Planner
                         |
             Provider-agnostic routing layer
                         |
               Provider adapters (including Agnes)
                         |
             Redis + Bull asynchronous jobs
                         |
       Specialized workers / safe execution boundary
                         |
           MongoDB + storage + job results/history
                         |
             Progress updates to the client
```

### Responsibilities

- **API:** authentication, authorization, validation, and REST endpoints.
- **Orchestrator / task planner:** classify a request, break multi-step work into tasks, route tasks to the relevant capability, and coordinate results. Preserve the existing implementation; do not replace it with an autonomous-agent framework without evidence and an approved migration.
- **Provider routing:** select providers by capability, configuration, constraints, and availability. Keep Agnes and the provider-agnostic abstraction.
- **Redis + Bull:** queue and track asynchronous jobs, retries, cancellation, and recovery using the existing queue implementation.
- **Specialized workers:** separate media work from website/game work where the existing architecture supports it. An assembly/FFmpeg worker is an optional extension, not an assumed completed service.
- **Sandbox:** generated or user-supplied executable content must not run unsafely in the API process. Use an isolated execution boundary and explicit validation.
- **MongoDB Atlas / Mongoose:** persist users, projects, job state, metadata, and results through the existing database layer.
- **Git integration:** where implemented and authorized, version generated website/game project files through branches and commits. Do not claim automatic commits or pushes unless verified.
- **Progress delivery:** use the project's implemented progress/status mechanism; WebSocket or Redis Pub/Sub is a design option only if confirmed in code.

## Architecture options and decisions

The architecture notes considered both a hierarchical Orchestrator and an event-driven queue/worker model. These do not need to be treated as mutually exclusive:

1. Keep the **existing Orchestrator** for request planning and coordination.
2. Use **Redis + Bull and specialized workers** for reliable asynchronous execution.
3. Keep task inputs/outputs structured and validated. A useful internal contract is `{ task_id, prompt, user_id, parameters }`; adapt it to the existing types rather than creating a competing contract.
4. Apply provider-specific rate limits and concurrency limits separately. Concurrency alone does not enforce requests-per-minute limits.
5. Retry transient failures with bounded retries, clear job states, and provider fallback only when a compatible provider is configured.
6. Do not introduce CrewAI, AutoGen, NestJS, BullMQ, or a replacement queue merely because they appeared in architecture proposals. The repository currently documents **Express + TypeScript and Redis + Bull**; preserve those until a code-backed decision justifies a migration.

### Ollama and n8n

- **Ollama** is a potential local-model runtime for lightweight classification, planning, or development-time assistance where the selected model can perform the task. It is not itself a media-generation provider for every modality, and local inference still consumes machine resources.
- **n8n** is a potential workflow/integration layer for explicitly defined external workflows. It should not duplicate the platform's existing job system or become a mandatory dependency without a demonstrated need.
- Treat both as **optional integrations until code, configuration, and a working test prove they are integrated**. Do not place API keys or credentials in source control or documentation.

### Example: multi-output game workflow

For a request such as “make a space game and play a celebration video when the player wins”:

1. The API authenticates the user and creates a tracked job.
2. The Orchestrator identifies the game, asset, and integration tasks.
3. Bull queues the work for the appropriate existing workers.
4. The configured providers generate assets; the game workflow produces a validated, data-only definition.
5. The application assembles the outputs and validates the result without executing arbitrary model-generated JavaScript.
6. Job status, errors, and result references are persisted and exposed to the client.

This is a target workflow description, not a claim that every multi-agent, video-on-win, or deployment step is already implemented.

## Current implementation notes

The repository's documented game workflow is an **experimental 2D Phaser MVP**, not a general-purpose game engine or full 3D game generator. It uses validated, versioned, data-only game definitions and an in-app playable route. Keep that limitation explicit.

The repository has previously documented:
- React + Vite web client and React Native mobile app
- Express/TypeScript API and authentication framework
- Agnes provider integration and provider-agnostic routing
- Redis/Bull job processing
- MongoDB/Mongoose data layer
- An experimental playable 2D game workflow

These are repository-level implementation notes; live-provider behavior and production readiness still require environment-specific evidence.

## What's still unverified / where work can be blocked

Do not mark the platform “production-ready” based only on a successful unit test or CI run. Verify these items against current code, CI, credentials, and deployment evidence:

- **Live provider paths:** real Agnes/media API calls, provider limits, errors, fallback behavior, and returned asset accessibility.
- **End-to-end workflows:** authentication → job creation → queue/worker → result persistence → UI display, for each advertised capability.
- **Deployment:** deployed frontend and API routing, environment variables, health endpoints, database/Redis connectivity, logs, and restart/recovery behavior.
- **Mobile release:** native Android/iOS builds need the corresponding platform toolchains; type-checking alone is not a native build.
- **Security:** authorization boundaries, generated-content isolation, secret handling, rate limits, and production configuration.
- **Performance:** benchmark realistic queue depth, provider latency, worker concurrency, storage, and memory before making capacity claims.
- **Scope clarity:** distinguish implemented 2D gameplay from full 3D generation, arbitrary generated-code execution, or game-engine export.

Update this list only when a specific item has been verified or resolved; avoid repeating green tests without new evidence.

## Runtime and deployment

Use the existing deployment files and environment templates in this repository. Check `docker-compose.yml`, `docker-compose.prod.yml`, Dockerfiles, and the relevant `docs/` guides before changing deployment behavior.

Core environment settings documented by the project include:

- `NODE_ENV`
- `PORT` / `HOST`
- `MONGODB_URI` (with `DATABASE_URL` fallback where supported by the code)
- `REDIS_URL`
- `JWT_SECRET`
- Agnes/provider credentials and configuration
- CORS and storage settings

Use the actual `.env.example` files and configuration schema as the final authority for variable names. Never commit real secrets.

## Technology stack

| Area | Existing documented stack |
|---|---|
| Web | React, TypeScript, Vite |
| Mobile | React Native, TypeScript |
| API | Node.js, Express, TypeScript |
| Database | MongoDB / Mongoose |
| Queue and cache | Redis + Bull |
| AI integration | Agnes plus provider-agnostic adapters |
| Validation | Zod (where used by the current code) |
| Testing | Jest and the test tools configured by each package |
| Deployment | Docker / Docker Compose; GitHub Actions CI |

Do not infer that an optional service, tool, provider, or framework is installed merely because it appears in this README.

## Development

1. Read the repository's current package scripts and environment examples.
2. Install dependencies using the lockfiles and the Node version supported by the repository/CI.
3. Configure local environment variables without committing secrets.
4. Start services using the current development instructions in `docs/DEVELOPMENT.md`.
5. Run the targeted tests for changed code, then relevant package tests and CI.
6. Report the exact branch/commit, files changed, commands run, test results, and unresolved blockers.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Providers](./docs/PROVIDERS.md)
- [Sandbox](./docs/SANDBOX.md)
- [Game creation](./docs/GAME_CREATION.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Development](./docs/DEVELOPMENT.md)
- [Security](./docs/SECURITY.md)

## Contribution rules

- Preserve existing working features and the current architecture.
- Inspect implementation before adding a competing abstraction or service.
- Do not label planned integrations as complete.
- Prefer small, verifiable changes over repeated broad audits.
- Never commit credentials or real environment files.
- Document blockers with evidence and a concrete next action.

## Project status

**Status: active development; production readiness not established by this README.**

This document intentionally separates existing architecture, optional proposals, and unverified release work. Update it as implementation changes are merged and verified.
