# SINA AI STUDIO — Agent-Ready Website and Game Builders

**Status:** implementation contract / next development track  
**Canonical repository:** `sina6565/AI_Studio_AI`  
**Base:** `main` at `38169e7cd571cb02b47743a506736ed1e4a0ed91`  
**Working branch:** `feat/agent-ready-site-and-game-builders`

This document defines an additive path for the user-facing Website Builder and Game Builder. It does not replace the existing Orchestrator, Provider Registry, Agnes integration, job lifecycle, or local-first policy.

## Non-negotiable architecture

- The Orchestrator remains the execution authority. Specialist agents are registered capabilities called through the existing orchestration boundary; they do not become a second hidden orchestrator.
- Preserve the provider-neutral adapter/registry design. A missing model or worker must produce a truthful unavailable state, not a fake success.
- Local-first defaults: Ollama, ComfyUI, Whisper, Piper and FFmpeg. Cloud/model endpoints are optional adapters and may not be required for app startup.
- No paid API, hosted GPU, subscription, paid asset-generation task, or paid agent framework is enabled by default.
- Never execute model-generated source code on the backend. Generated websites are sandboxed previews/artifacts; generated game logic is constrained to versioned schemas and allow-listed runtime behaviours.
- Keep Website Builder, 2D game runtime, and native UE5 room authoring as distinct workflows with shared project/job/asset contracts.
- Preserve existing features and history. All work is additive and must be tested before merge.

## Existing verified baseline

### Website Builder
- `backend/src/website/WebsiteBuilderService.ts`: local deterministic HTML generator; strict Zod input; HTML escaping; EN/FA direction; responsive single-page output.
- `frontend/src/pages/WebsiteBuilder.tsx`: authenticated job submission, polling, sandboxed preview, source editing and HTML download.
- `backend/src/orchestrator/Orchestrator.ts`: `website_build` runs locally without an AI provider.
- Current documented gaps: AI copy/brief planning, multi-page/site navigation, structured editable sections, persistent project revisions, hosted publishing and domain workflow.

### Game Builder
- `backend/src/game/GameService.ts` and `PlayableGameDefinition.ts`: generated scene manifest plus a schema-validated deterministic Phaser game definition.
- `frontend/src/pages/PlayableGamePage.tsx` and `PhaserPlayableGameCanvas.tsx`: browser-playable 2D runtime with score/lives/time/restart.
- `frontend/src/pages/Game3DBuilder.tsx`, `backend/src/game3d/UnrealEngine5Adapter.ts`, and `tools/ue5-room-worker/`: separate Blender-to-UE5 procedural room pipeline with Function/Form gates.
- Current 3D limits remain explicit: actual Blender/UE5 worker execution, full gameplay Blueprints, enemy AI, animation, packaged executables and mobile packaging require real worker/runtime validation.

## Specialist agent roles

Agents are task-scoped specialists, not autonomous owners of production writes:

1. **Brief Planner** — converts the user's natural-language request into a validated, versioned WebsiteSpec or GameSpec; asks only for essential missing fields.
2. **Design Director** — proposes visual system, layout/level composition, responsive rules, accessibility and asset requirements; outputs structured data, not executable code.
3. **Website Architect** — maps approved page/section structure to safe components and navigation; preserves user content and supports Persian RTL/English LTR.
4. **Game Designer** — produces game loop, objective, player controls, progression, hazards, win/loss conditions and level graph in a strict schema.
5. **Asset Curator** — selects available licensed assets/providers; records provenance and rejects unclear commercial rights.
6. **Implementation Agent** — translates approved specifications into allow-listed templates, Phaser definitions or UE5 worker manifests; no arbitrary server-side code execution.
7. **QA/Playtest Agent** — validates schema, build output, responsive/accessibility checks, reachable game objectives, collision/navigation and runtime evidence.
8. **Reflection/Repair Agent** — summarizes test failures and proposes minimal patches; writes only through the normal branch/PR approval flow.

Each agent must declare: input/output schema version, required capabilities, local/cloud preference, resource budget, timeout, retry policy, provenance and failure state. Agent-to-agent handoff is persisted as job/trace metadata, not hidden prompt history.

## Resource evaluation — candidates, not production dependencies

- **Ollama + Qwen2.5-Coder 7B**: local coding/planning candidate; benchmark on target hardware before assigning code-generation work.
- **Kimi K3 and Bonsai 27B**: reasoning/model candidates; do not assume they can run locally or that their weights/license permit commercial deployment. Evaluate API/runtime, quantization, memory, license and output quality separately.
- **PixWorld**: candidate for layout/texture-aware image workflows; verify official repository, weights, inference requirements and commercial rights before adapter work.
- **SeFi Image**: research candidate only until code, weights and training-data terms are independently checked. A non-commercial weight license is a release blocker for commercial use even if source code is permissively licensed.
- **ComfyUI**: local visual workflow integration candidate through a capability adapter, not a hard-coded dependency.
- **MCP, n8n, Open WebUI, AgentSea, Gwenflow, MAGoCo-EVO and OpenRouter Agent SDK**: orchestration/tooling research references. Integrate only where they fit the existing Orchestrator/Tool Registry and free-only requirement; do not introduce a parallel mandatory runtime or expose provider credentials to agents.

No candidate is considered integrated until a reproducible smoke test, capability declaration, license review and failure-path test are recorded.

## Website Builder delivery sequence

### W1 — structured multi-section specification
- Add a versioned WebsiteSpec for pages, sections, theme tokens, navigation, locale and assets.
- Keep the current three site kinds and palettes backward compatible.
- Generate from structured section data; keep all user text escaped and all links validated.
- Add editable section ordering/content controls without accepting arbitrary scripts.

### W2 — multi-page and project persistence
- Support a small allow-listed page set (Home, About, Services/Features, Contact) with shared navigation.
- Save revisions under the authenticated project; list, restore and duplicate revisions.
- Keep standalone HTML export available even when persistence is unavailable.

### W3 — local agent-assisted authoring
- Brief Planner proposes copy and page outline through an optional text-generation capability.
- Human can edit/approve generated copy before build.
- If no text provider exists, retain the current local template flow and report that AI assistance is unavailable.

### W4 — preview and publish boundary
- Add link, mobile viewport, keyboard navigation, contrast, RTL/LTR and HTML safety checks.
- Publishing is a separate adapter and must not be represented as live until a real deployment target, ownership, rollback and URL health checks are verified.
- No paid hosting/domain provider is selected by default.

## Game Builder delivery sequence

### G1 — restore a clear 2D creation-to-play loop
- Make the UI distinguish concept/scene generation from playable-game generation.
- Expose title, genre, theme, player goal, controls, difficulty, level count and target runtime.
- Generate only versioned GameSpec/PlayableGameDefinition data; no model-written JavaScript execution.
- Add validation for solvability, reachable collectibles/exit, hazard fairness, collision and mobile touch controls.
- Preserve Phaser as the 2D runtime; keep the generated game playable in-browser and downloadable as a self-contained artifact where feasible.

### G2 — level and mechanics authoring
- Add editable level layout and rules before build.
- Provide deterministic seed/rebuild, preview, restart and clear win/loss states.
- Persist game revisions and playtest summaries in Projects/Jobs.

### G3 — 3D room to playable prototype
- Keep Blender as deterministic authoring and UE5 as the native runtime.
- Do not claim a playable 3D game from a room render or ZIP alone.
- Validate actual UE5 project open, character controller, collision, navigation, interactions, camera and packaged runtime on a configured worker.
- Add gameplay Blueprint templates only after the worker's real execution is reproducible.
- Godot 4 may be evaluated as a separate optional adapter; it must not silently replace the chosen UE5 path.

### G4 — agent-assisted playtesting
- QA agent runs schema/graph checks and automated browser tests.
- Runtime playtest evidence must include build identity, engine version, device/browser, control path, pass/fail and captured logs.
- Human approval remains required before merging or publishing.

## Required tests and release gates

- Backend unit and API tests for every schema, job type, authorization boundary and unavailable-provider path.
- Frontend tests for Persian RTL, English LTR, mobile layout, edit/preview/download, job failures and recovery.
- Website security tests for HTML escaping, URL validation, unsafe markup and script injection.
- 2D game tests for deterministic generation, reachable objectives, collision, timer/lives and win/loss.
- 3D worker tests for room contract, Boolean openings, collision/navigation, artifact provenance and explicit approval gates.
- CI must pass on the feature branch. No merge to `main` and no production publish is implied by this document.

## Immediate implementation order

1. Reconcile the current Game Builder documentation with the existing Phaser playable route and distinguish it from the non-playable scene viewer.
2. Add the versioned multi-page WebsiteSpec while preserving legacy inputs.
3. Add structured GameSpec controls and touch-friendly Phaser playtest coverage.
4. Add agent capability contracts and optional local adapters only after the above interfaces are stable.
5. Validate with GitHub Actions and report exact run URLs, test totals, changed files and remaining blockers.

