# SINA AI STUDIO

**FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE**

SINA AI STUDIO is an evolving AI creation platform intended to coordinate agents, models, tools and execution workflows across digital-content and software-creation tasks. The repository contains multiple application areas and backend services at different levels of implementation. Treat each capability as unverified until its source code, tests and runtime path establish what it actually does.

> **This README is the repository navigation and discovery index.** It is deliberately not a feature-completion report, release claim, architecture specification or substitute for inspecting code.

- Repository: [sina6565/AI_Studio_AI](https://github.com/sina6565/AI_Studio_AI)
- Default branch: `main`
- Agent-specific guidance: [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
- Architecture notes: [`ARCHITECTURE.md`](ARCHITECTURE.md) — verify every statement against current code.
- Security reporting: [`SECURITY.md`](SECURITY.md)

## Repository map

| Path | What to inspect there |
|---|---|
| `backend/` | Express/TypeScript API, configuration, data models, jobs, orchestration, providers, routing and backend tests. |
| `frontend/` | React/TypeScript/Vite web application, UI, routes, client services and frontend tests. |
| `mobile/` | React Native application, screens, API client and mobile-specific release notes. |
| `apps/` | Application workspaces and product/site areas. Inspect each subdirectory README and manifests before assuming its role or build process. |
| `packages/` | Shared-package workspace area. Inspect its README and actual contents; do not assume packages are implemented or installable. |
| `tools/` | Developer and runtime tools, including the UE5 and Godot 4 room-worker areas and release smoke tooling. |
| `docs/` | Engineering, architecture, provider, operations, website, game and 3D workflow documentation. |
| `.github/workflows/` | CI and automation definitions. These define what CI actually checks. |
| `.github/copilot-instructions.md` | Additional repository-specific instructions for Copilot. Re-check time-sensitive leads and PR numbers instead of assuming they remain current. |

There is no root `package.json` in the current repository layout. Do not run root-level npm commands by assumption. Each application has its own manifest and scripts.

## How to investigate this repository (Copilot / coding agents)

Before proposing or changing code:

1. Confirm the repository is `sina6565/AI_Studio_AI`, the checked-out branch, and the current commit. Do not substitute similarly named repositories.
2. Read this file and [`.github/copilot-instructions.md`](.github/copilot-instructions.md), then inspect the relevant application manifest, lockfile, environment example, CI workflow, source files and tests.
3. Trace the real execution path end to end: client action → API route → service/orchestrator → queue or worker → provider/tool/runtime → persistence → response/UI. Follow the actual code; do not infer behavior from names or diagrams.
4. Search for all callers, registrations, configuration gates, feature flags, job types and tests before changing a shared interface.
5. Compare documentation with implementation. Mark contradictions, stale dates, dead links and unverified claims; do not silently promote a proposal or prototype into a shipped feature.
6. Make the smallest coherent change. Preserve existing working paths and integrations unless the task explicitly authorizes changing them.
7. Add or update focused tests, run the exact scripts defined by the relevant package, and inspect the resulting CI checks. Report commands and outcomes honestly.

### Evidence hierarchy

When sources disagree, use this order:

1. Current source code and runtime configuration.
2. Tests that exercise the relevant behavior.
3. Package manifests, lockfiles and CI workflow definitions.
4. Maintained technical documentation that matches the code.
5. This README, old status notes, diagrams, issue descriptions and historical reports.

A passing type-check or unit test does not prove a complete end-to-end workflow. A provider adapter in the source does not prove its credentials are configured or the remote service is available. A worker contract does not prove the external engine has run.

### Known documentation caution

Some repository documents are historical or may lag behind implementation. In particular, `STATE.md` contains an older status note referring to a Lovable → n8n → Gemini setup. Do not treat that note as a description of the current canonical architecture without verifying it. The same rule applies to dates, CI counts, PR numbers, diagrams and progress statements elsewhere in the repository.

## Development entry points

Use the scripts in the package you are working on; inspect each manifest first.

- Backend manifest and scripts: [`backend/package.json`](backend/package.json)
- Frontend manifest and scripts: [`frontend/package.json`](frontend/package.json)
- Mobile manifest and scripts: [`mobile/package.json`](mobile/package.json)
- Backend environment template: [`backend/.env.example`](backend/.env.example)
- Frontend environment template: [`frontend/.env.example`](frontend/.env.example)
- Mobile environment template: [`mobile/.env.example`](mobile/.env.example)

Never commit real credentials, tokens, private keys, production data or real environment files. Use placeholders in examples. Do not introduce paid services or dependencies without explicit project-owner approval.

## Technical documentation

These files exist in the current repository; read only the documents relevant to the task and verify them against implementation:

- [Architecture](ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operations](docs/OPERATIONS.md)
- [Workstreams](docs/WORKSTREAMS.md)
- [Website creation](docs/WEBSITE_CREATION.md)
- [Game creation](docs/GAME_CREATION.md)
- [3D game room pipeline](docs/3D_GAME_ROOM_PIPELINE.md)
- [3D local model asset pipeline](docs/3D_LOCAL_MODEL_ASSET_PIPELINE.md)
- [Provider Pool and fallback design](docs/PROVIDER_POOL_FALLBACK_ENGINE.md)
- [NVIDIA NIM per-model pool](docs/NVIDIA_NIM_PER_MODEL_POOL.md)

## Contribution and change reporting

Work on a focused feature or fix branch and use a pull request. Do not force-push shared branches, commit secrets, or merge/deploy without the required authorization.

Every implementation report should include:

- Repository, branch and exact commit SHA.
- Problem and evidence that reproduced or established it.
- Files changed and the reason for each change.
- Tests and commands actually executed, with pass/fail results.
- CI status for the exact commit.
- Remaining limitations, risks and unverified behavior.

**Project status:** active development. This statement is not a release-readiness claim. Use current code, tests, CI and runtime evidence to determine the status of any individual feature.
