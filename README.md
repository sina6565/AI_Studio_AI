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

The current repository separates three different creation paths; do not collapse them into one capability claim:

- **Game scene creation:** provider-backed scene artwork and a validated scene manifest, followed by a standalone, non-interactive HTML scene viewer. This is not a playable 2D game runtime.
- **Website Builder:** a provider-free deterministic template/code generator. It supports a bilingual form, responsive standalone HTML, isolated preview, source editing, and HTML download. It does not yet write copy with an AI model or publish sites to a hosted domain.
- **Native 3D Game Lab:** a separate `/studio/3d` workflow targeting Unreal Engine 5. It exposes parametric room dimensions, entrance dimensions, portal scale, and movement-style metadata; uses a versioned room manifest, Function approval, a Blender geometry preview and review renders, explicit Form approval, and a self-hosted UE5 worker adapter that prepares a UE5 source project. It currently builds a configurable procedural room, not an arbitrary fully playable game.

The UE5 worker is an owner-operated persistent process, not a generic Serverless function. It requires Blender and Unreal Engine 5 installed on a compatible machine plus an owner-supplied UE5 Third Person project template. The repository includes the worker service and import scripts, but a real Blender run, UE5 project import, gameplay test, and packaged runtime have not yet been verified. The generated source project currently provides a room mesh, PlayerStart, and navigation bounds; arbitrary Blueprint gameplay logic, AI characters, complete game objectives, and packaged executables are not claimed.

The repository also includes:
- React + Vite web client and React Native mobile app
- Express/TypeScript API, authentication, and the existing Orchestrator
- Agnes provider integration and provider-agnostic routing
- Redis/Bull job processing with the configured in-process fallback mode
- MongoDB/Mongoose data layer
- Self-hosted Blender/UE5 worker contract and approval-gate tests

These are repository-level implementation notes; live-provider behavior, native-engine execution, and production readiness still require environment-specific evidence.

## What's still unverified / where work can be blocked

Do not mark the platform “production-ready” based only on a successful unit test or CI run. Verify these items against current code, CI, credentials, and deployment evidence:

- **Live provider paths:** real Agnes/media API calls, provider limits, errors, fallback behavior, and returned asset accessibility.
- **End-to-end workflows:** authentication → job creation → queue/worker → result persistence → UI display, for each advertised capability.
- **Deployment:** deployed frontend and API routing, environment variables, health endpoints, database/Redis connectivity, logs, and restart/recovery behavior.
- **Website publishing:** hosted storage, domain/DNS, CDN, TLS, publish/rollback and production site ownership are not yet implemented by the local HTML builder.
- **Native 3D execution:** actual worker health, Blender render/audit, UE5 template import, collision/navigation, player movement, Blueprint gameplay, runtime camera, target-device performance, and packaged output must be tested on a configured engine machine.
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
- [Game scene creation](./docs/GAME_CREATION.md)
- [Website creation](./docs/WEBSITE_CREATION.md)
- [Unreal Engine 5 room pipeline](./docs/3D_GAME_ROOM_PIPELINE.md)
- [3D model benchmark](./docs/3D_MODEL_BENCHMARK.md)
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

## Test & Verification Report (2026-11-09)

This section records **test cases actually reported by the latest successful GitHub Actions CI run**, and keeps older agent-reported/external checks separate. Counts are per executed test case in the referenced run; they are not cumulative lifetime totals and do not count build/type-check jobs as test cases.

### Latest verified GitHub Actions run

- **Repository / branch:** `sina6565/AI_Studio_AI` / `main`
- **Commit:** `cdd7b99eae5a7c445d53e9957812446c8a15d740`
- **CI run:** [Run #42635882064](https://github.com/sina6565/AI_Studio_AI/actions/runs/42635882064)
- **Result:** 4/4 CI jobs passed; 149/149 test cases passed.

| Test area | Test suites/files | Executed tests | Passed | Failed |
|---|---:|---:|---:|---:|
| Backend (Jest) | 18 suites | 119 | 119 | 0 |
| Frontend (Vitest) | 8 files | 25 | 25 | 0 |
| UE5 worker contract (Python unittest) | 1 test module | 5 | 5 | 0 |
| **Total** | **27** | **149** | **149** | **0** |

The same run also passed the backend build, frontend type-check/build, mobile TypeScript type-check, UE5 worker Python syntax compilation, and the worker approval-gate test job. These are successful CI checks, but build/type-check steps are not added to the 149 test-case count.

### Historical checks reported outside the current GitHub Actions run

The repository's [Cinematic Universe Verification Record](./docs/release/CINEMATIC-UNIVERSE-VERIFICATION-RECORD.md) preserves an implementation-agent report dated 2026-10-20:

| Reported area | Reported checks |
|---|---:|
| Frontend tests | 5/5 passed |
| Backend tests | 90/90 passed |
| Mobile | 3 checks reported passed (type-check, lint, tests; test-case count not supplied) |
| **Historical reported test cases** | **95/95 passed** |

**Evidence qualification:** these 95 historical test cases are agent-reported project history, not raw logs from the current GitHub Actions run. The record also reports a live full-stack preview and desktop/mobile visual review as passed, but supplies no count of individual assertions or scenarios. They are therefore recorded separately and are **not added** to the latest 149-test CI total. The report's 3 mobile checks are not counted as three test cases.

### Tests and runs outside GitHub

No independently accessible test-run logs or result exports from external environments (for example local machines, Replit, Base44, Lovable, or other hosted previews) were available during this audit. Their test totals and pass counts are therefore **unknown / not independently verified** and must not be represented as zero or as successful. Add each external run only when its platform, date, commit/build identifier, executed test count, passed/failed count, and evidence link or log are supplied.

### Scope and limitations

- The 149/149 figure is the exact test-case count from the latest successful CI run above, not a claim that every feature or every historical run has passed.
- CI tests do not prove live Agnes/provider calls, production deployment, external service connectivity, a real Blender render, UE5 editor import, playable native-engine gameplay, or packaged game output.
- Earlier failed or cancelled runs remain part of repository history; the latest main-branch CI result is the successful run linked above.
- Keep external/manual test evidence separate from automated CI, and never add overlapping historical runs together as if they were unique tests.

### Full CI pipeline and process checks — latest run on this README commit

The latest CI execution on commit `42ca33c242c9513c3c7196d4c4e4199bb8146927` is [Run #42669544900](https://github.com/sina6565/AI_Studio_AI/actions/runs/42669544900). All four jobs completed successfully:

| Pipeline job | Process/checks executed | Result |
|---|---|---|
| Backend (build + tests) | Locked dependency install (`npm ci`), TypeScript type-check/build (`npm run build`), Jest test suite | Passed; 18 suites / 119 tests |
| Frontend (build) | Locked dependency install, type-check/build (`npm run build`), Vitest tests (`npm test -- --run`) | Passed; 8 files / 25 tests |
| Mobile (type-check) | Locked dependency install (`npm ci --legacy-peer-deps`), TypeScript type-check (`npm run type-check`) | Passed; no separate mobile test-case count is configured in this workflow |
| UE5 worker (Python syntax + gate tests) | Python 3.12 setup, `py_compile` for worker scripts, Python unittest discovery for approval gates | Passed; 5 tests |

**Current CI test-case total: 149 passed, 0 failed.** The four jobs also include dependency installation, builds, type-checks, and syntax validation; those process checks are recorded above but are not added to the 149 test cases.

### Repository security and code-scanning workflows

These are separate from the 149 application/worker test cases and must not be added to that count.

| Workflow | Latest observed run on commit `42ca33c` | Status at audit time |
|---|---|---|
| Secret scan / Gitleaks | [Run #42669545052](https://github.com/sina6565/AI_Studio_AI/actions/runs/42669545052) | Passed |
| Microsoft Defender for DevOps | [Run #42669545114](https://github.com/sina6565/AI_Studio_AI/actions/runs/42669545114) | In progress; not counted as passed |
| GitHub CodeQL code scanning | [Run #42669543933](https://github.com/sina6565/AI_Studio_AI/actions/runs/42669543933) | JavaScript/TypeScript analysis still in progress at audit time; Python and Actions analysis jobs passed |

### Explicit coverage boundaries

The current CI workflow does **not** define separate automated test jobs for live API/provider integration, MongoDB/Redis production connectivity, full browser/device E2E, mobile runtime/UI tests, deployment smoke tests, live Agnes generation, Blender rendering, Unreal Editor import, or packaged/playable UE5 game validation. These areas must remain marked **not covered by this CI run**, unless separate external evidence is added. A successful build or worker contract test is not proof of an end-to-end engine/gameplay test.


## Ownership, proprietary rights, and repository access

- **Project owner and rights holder designated by the project owner:** ام صفرپور.
- **Sole designated GitHub owner account:** [`sina6565`](https://github.com/sina6565). The repository is maintained under this account; do not describe another person or account as a co-owner or rights holder unless the project owner explicitly authorizes that change in writing.
- **Repository:** [`sina6565/AI_Studio_AI`](https://github.com/sina6565/AI_Studio_AI), default branch: `main`.
- **Code and materials:** SINA AI STUDIO's original code, architecture, documentation, designs, branding, and original assets are proprietary, subject to the rights of their applicable owners and the separate terms of third-party components. See the root `LICENSE` notice. Repository access does not grant a public license to reuse or redistribute proprietary materials.
- **Access policy:** The intended repository visibility is **Private**. Only the designated owner and collaborators explicitly authorized by that owner should have access. Do not infer or grant ownership from write, maintain, or administrative access alone.
- **Product capability protection:** Changing GitHub repository visibility from Public to Private is an access-control and source-confidentiality measure only. It must not remove, disable, downgrade, hide, or otherwise restrict any SINA AI STUDIO feature, API, provider adapter, Orchestrator, Agent, workflow, user entitlement, or runtime capability. Preserve the existing implementation and deployment behavior. If a GitHub-hosted service or workflow has a plan-dependent visibility restriction, document and resolve that separately without reducing SINA product functionality.
- **Verification:** Repository visibility and collaborator permissions must be checked in GitHub repository settings after the owner applies the Private setting. Do not report the repository as Private until GitHub confirms the change.
