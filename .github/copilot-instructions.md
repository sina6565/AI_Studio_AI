# GitHub Copilot Instructions — SINA AI STUDIO

## Mission
Continue the existing SINA AI STUDIO codebase in sina6565/AI_Studio_AI. Do not rebuild from scratch. Start by inspecting the repository, current CI, open PRs, deployment configuration, and existing tests; then make the smallest safe, evidence-backed changes that move the existing product forward.

## Non-negotiable constraints
- Preserve the existing architecture and working code. No broad rewrites, speculative migrations, force pushes, destructive cleanup, or unrequested redesigns.
- Preserve Agnes integration and the provider-agnostic AI provider registry/routing. Do not hard-wire the product to a single model provider.
- Do not alter database schemas, production secrets, authentication behavior, billing, or deployment infrastructure without a demonstrated need and regression coverage.
- Never commit secrets, tokens, API keys, real environment files, or user data. Keep examples safe and placeholders obvious.
- Do not add paid services or paid dependencies. Ask before any paid service, destructive operation, or irreversible production action.
- User-reported runtime constraint: do not use Node.js 22.7.0; use Node.js 22.8.0+ (prefer the version already pinned/configured by the repository).
- Preserve Persian/RTL and non-ASCII text. Do not run data migrations or encoding conversions without explicit need and tests.
- Keep changes on a feature/fix branch and open a PR. Do not merge your own PR or deploy to production.

## Required first pass
1. Read root and frontend/backend package manifests, lockfiles, README/docs, CI workflows, and current branches/PRs.
2. Inspect CI logs before guessing at causes. Report observed evidence separately from hypotheses.
3. Establish a baseline: latest commit, workflow status, and available tests.
4. Check open PRs #10 (production JWT/CORS hardening) and #11 (cinematic public landing page) for fresh CI status, changed files, conflicts, and correctness. Do not merge either automatically.
5. Inspect the exact GitHub security/Dependabot/code-scanning alerts available to the connected account. If permissions prevent reading them, state the API limitation; never invent alert counts or CVEs.

## Current known investigation lead (must re-verify)
The frontend CI run for main commit 24bd0b82d83e1245242f164bd75eb3b2105b227b failed during npm ci --no-audit --no-fund with: npm error Cannot read properties of null (reading 'edgesOut'). This is an npm install failure, not proof of a particular dependency conflict. Reproduce it in CI, inspect the full npm debug log and dependency tree, and fix the actual cause. If changing dependencies, regenerate frontend/package-lock.json using npm itself and commit the manifest + lockfile together. Never hand-edit a large lockfile or claim build/test success unless CI proves it.

## Cinematic landing page direction
The product is a cinematic Digital Universe Factory, not a generic SaaS template. Retain the existing React + Vite app and authenticated routes. Aim for the established dark cosmic visual direction (black/navy, cyan, violet, pink accents; glass/lighting; bilingual EN/FA and RTL), using the user's existing assets where available. Do not claim a true 3D scene is integrated unless implemented and verified. Avoid adding Three.js/R3F until the implementation fits the current architecture and dependency/size impact is checked.

## Execution order
P0. Repair the reproducible frontend dependency-install/CI failure and get frontend type-check/build running.
P1. Verify backend tests/build and preserve their passing state.
P2. Review PR #10 security hardening and PR #11 landing-page changes against CI and repository behavior; fix issues on their branches or propose focused follow-up PRs.
P3. Inventory actual security alerts and triage by severity, reachability, and fix availability; remediate confirmed issues with tests.
P4. Inspect landing-page implementation against the product direction and existing user-provided assets; improve only after the build is green.
P5. Check deployment health and workflow status without changing production settings or deploying automatically.

## Validation and reporting
- Run the repository's actual install, type-check, build, lint, and test commands where applicable.
- Prefer targeted regression tests plus the relevant full test suite.
- After changes, rerun CI and inspect logs. Do not report fixed until the relevant check passes.
- Each PR description must state: problem/evidence, changes, tests actually run, CI status, risks, and follow-up.
- Final report format: Completed; files changed; test/CI evidence; unresolved blockers; PR/commit links; exact next step.
- If a task is blocked, continue with independent safe tasks and document the blocker rather than stopping the entire effort.