# SINA Creative Production Workspace

**Project type:** Product workstream / integration roadmap  
**Status:** Proposed — documentation only; implementation status is tracked per capability below.  
**Owner:** SINA AI STUDIO  
**Primary goal:** Bring game, website, image, and video creation into one coordinated project experience without replacing the existing Orchestrator, job system, provider registry, or specialized builders.

## 1. Product vision

Enable a user to start from one brief and create, revise, organize, preview, and export a coordinated set of digital outputs:

- **Games:** 2D and 3D game projects, scenes, assets, and engine-oriented workflows.
- **Websites:** responsive website projects, editable source, preview, and a future publishing workflow.
- **Images:** image generation, editing, variations, and reusable visual assets.
- **Videos:** video generation, editing/assembly, animation, and reusable clips.

The four creation areas remain distinct capabilities with their own validation, execution requirements, and provider adapters. They are coordinated through a shared project workspace; they are not collapsed into one generic generator.

## 2. Repository baseline (documented, not a new implementation claim)

The root README already documents separate work in these areas:

- A game-scene creation path that produces scene artwork and a validated manifest with a standalone viewer; this is not a playable game runtime.
- A Website Builder MVP that creates responsive standalone HTML with preview, source editing, and download; hosted publishing is not yet implemented.
- A separate Unreal Engine 5 room workflow with a staged Blender/UE5 worker contract; real engine import, gameplay validation, and packaged runtime remain unverified.
- Existing image/video/media capabilities routed through the provider-agnostic platform, subject to configured providers and live end-to-end verification.

This workstream must reuse and connect the actual implementations. It must not create competing builders or imply that planned workflows are already production-ready.

## 3. Shared project experience

Each user project should have:

- A durable project identity, owner, title, description, timestamps, and lifecycle state.
- A project brief and structured requirements.
- Linked jobs, generated assets, source files, previews, and export records.
- Capability-specific task history and clear queued/running/completed/failed states.
- Versioned outputs and traceability from each output to its originating job/provider.
- Explicit approval before publishing, external sharing, destructive edits, or execution of generated code.

Use existing Projects, Jobs, persistence, authorization, and Orchestrator contracts wherever they exist. Extend them minimally and compatibly; do not introduce a parallel project or job database.

## 4. Capability workstreams

### A. Game development

**Scope**
- Preserve the existing game-scene and native 3D room workflows as separate paths.
- Grow from validated scene/room artifacts toward playable 2D and 3D projects.
- Support game brief → design/scene plan → asset list → scene/room generation → engine integration → playtest → export.
- Keep Godot 4 as a viable engine option and Unreal Engine 5 as a supported target where a configured worker and project template exist.
- Treat cameras, player controls, collisions, navigation, objectives, NPC/AI behavior, and packaging as explicit deliverables, not assumed features.

**Acceptance gates**
- A generated project opens in its declared target engine.
- Player movement, camera, collision, and one complete objective loop are demonstrated in a real runtime test.
- Assets and project files are versioned and exportable.
- Engine-specific tests and packaged builds are reported separately from unit/contract tests.

### B. Website development

**Scope**
- Evolve the existing Website Builder rather than creating a second one.
- Support multi-page site structure, reusable sections/components, responsive layouts, bilingual content, editable source, and isolated previews.
- Add a secure publishing pipeline only after ownership, storage, domain, TLS, rollback, and access-control design are implemented.
- Keep generated code isolated; do not execute arbitrary generated scripts inside the API process.

**Acceptance gates**
- Responsive preview at mobile and desktop breakpoints.
- Source can be edited, saved, versioned, and exported.
- Multi-page navigation and form behavior are tested.
- Publishing is not marked complete until a real hosted deployment, domain/TLS, rollback, and ownership test passes.

### C. Image creation

**Scope**
- Use the existing provider abstraction and image-generation capability.
- Support prompt-to-image, variations, editing where providers support it, aspect-ratio/size options, and project-linked asset history.
- Record provider/model, parameters, job status, output metadata, and usage constraints.
- Keep local-first options such as ComfyUI optional until a real local endpoint is configured and tested.

**Acceptance gates**
- Real provider or configured local-provider generation returns an accessible image.
- Output metadata and source job are persisted.
- Failure, timeout, retry, and provider-unavailable behavior are tested.
- Do not describe mock or fixture output as live generation.

### D. Video creation

**Scope**
- Use the existing video/media job path and provider abstraction.
- Support text/image-to-video only where the configured provider actually supports it.
- Add timeline/sequence assembly, clips, transitions, captions, audio tracks, and FFmpeg-based processing as separately validated stages.
- Keep long-running work asynchronous with progress, cancellation, bounded retries, and durable result references.
- Local-first FFmpeg/ComfyUI workflows remain optional until their runtime endpoints and dependencies are configured.

**Acceptance gates**
- A real configured provider or local pipeline produces a playable video file.
- Duration, format, resolution, audio, and output accessibility are validated.
- Job recovery and partial-failure behavior are tested.
- Provider generation and post-processing are measured and reported separately.

## 5. Cross-capability workflows

The shared workspace should support coordinated workflows such as:

1. **Game launch pack:** create a game scene, generate required images, produce a trailer/video, and create a companion website.
2. **Website campaign:** build a website, generate hero images, create promotional video, and link all outputs to one project.
3. **Game world expansion:** revise a scene/room, generate replacement assets, and create updated preview media.

The Orchestrator plans and coordinates these tasks. Existing Redis + Bull jobs and specialized workers execute asynchronous work. Each task must have typed inputs/outputs, capability validation, bounded retries, idempotency where appropriate, and traceable job relationships.

## 6. Architecture constraints

- Preserve the existing Express + TypeScript API, Orchestrator, provider-agnostic routing, MongoDB/Mongoose, Redis + Bull, and current authentication/authorization.
- Do not replace the core Orchestrator with n8n, MonkeyCode, or a third-party agent framework.
- n8n may remain an optional external automation/integration layer; it is not the source of truth for SINA projects or jobs.
- MonkeyCode and other AGPL tools may be evaluated independently for development assistance only. Do not copy their source code or merge AGPL implementation into SINA's proprietary core. Prefer clean-room implementations based on independently written requirements and interfaces.
- Keep providers optional and replaceable. No paid provider, hosted service, or subscription becomes mandatory without explicit product-owner approval.
- Never commit secrets. Keep user data, project files, and generated code behind authorization and storage boundaries.
- Keep game, website, image, and video capability contracts separate even when a single project coordinates them.

## 7. Delivery phases

| Phase | Deliverable | Exit condition |
|---|---|---|
| 0. Baseline audit | Map existing routes, UI, job types, workers, providers, storage, and tests for all four capabilities. | Evidence-backed capability matrix; duplicate work identified. |
| 1. Shared project linkage | Link existing jobs/assets/previews to a project using current persistence and authorization. | One project can display its related jobs and outputs without parallel storage. |
| 2. Capability completion | Close the highest-priority gaps in game, website, image, and video independently. | Each capability passes its own acceptance gates. |
| 3. Cross-capability orchestration | Execute multi-step workflows with dependency tracking, progress, cancellation, and recovery. | Demonstrated end-to-end workflow across at least two capabilities, then all four. |
| 4. Release readiness | Security, performance, deployment, mobile/desktop UX, export, and operational verification. | Release checklist passes with reproducible evidence and no unsupported claims. |

## 8. Priority order

1. Audit and preserve the existing implementations; do not rebuild working modules.
2. Complete the core game and website user journeys, including real 3D runtime validation and website export/publishing boundaries.
3. Verify real image and video generation paths using available free/local-first options where practical.
4. Connect all four capabilities through shared project history and Orchestrator task relationships.
5. Add multi-output workflows and release hardening.

## 9. Reporting and evidence

For every milestone, report:

- Branch and commit.
- Files and modules changed.
- Commands and tests actually executed.
- CI results separated from local, mocked, provider-live, engine-live, and deployment tests.
- Demonstrated behavior, unverified behavior, blockers, and next action.
- Any new dependency, license, provider, infrastructure, or cost implications.

A capability is **implemented** only when code exists; **tested** only for the tests actually run; and **live-verified** only after a real provider/runtime/deployment execution. Documentation or a passing unit test alone does not establish production readiness.

## 10. Definition of done

The workstream is complete when a user can create one SINA project and use it to develop a game, build a website, generate images, and create videos; all outputs are securely linked to the project; multi-step workflows are orchestrated and observable; exports are usable; and each advertised capability has reproducible end-to-end evidence.

---

**Current status:** This document creates the project workstream and delivery contract only. It does not implement new product functionality or change runtime behavior.
