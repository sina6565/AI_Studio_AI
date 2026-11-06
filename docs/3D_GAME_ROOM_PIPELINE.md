# 3D Gameplay Room Pipeline

Status: integration contract and implementation plan. This document does not claim that a production 3D room runtime is already implemented.

## Goal

Add a deterministic, browser-playable 3D room path to SINA AI STUDIO without replacing the existing Phaser 2D MVP, scene viewer, Orchestrator, provider routing, jobs, or project records.

## Existing repository facts

- The current playable game path is a validated, data-only Phaser 4.2.1 2D collection game.
- The current game manifest and downloadable HTML scene viewer are not a 3D runtime.
- The frontend already depends on Three.js, React Three Fiber, Drei, and postprocessing for the cinematic universe experience. These dependencies should be reused; do not add a second rendering stack.
- The current game build flow uses existing authenticated jobs and provider routing. 3D room generation must remain an additive capability.

## Plugin capabilities mapped to this project

1. **Room brief / Function gate** — define room purpose, target runtime, dimensions, hero object, player movement envelope, camera, circulation, collision/navigation, sightlines, recovery zones, and performance budget.
2. **Prop manifest** — each prop declares a stable ID, functional role, dimensions, attachment face, semantic front, reuse class, target polygon budget, placement, and rejection criteria.
3. **Room layout and openings** — machine-readable shell/layout/opening manifests; doors, windows, and deep alcoves are explicit. A decorative arch must never imply a traversable route without matching geometry, navigation, and collision.
4. **Reference images** — isolated, full-silhouette object references with preserved prompts and provenance. Require human approval before any 3D asset conversion.
5. **Procedural Blender construction** — sealed wall/floor/ceiling substrates, real thickness, structural Boolean openings, and generated/imported props as additive dressing. Validate attachment, scale, symmetry, manifold geometry, clearance, and camera-space separation.
6. **Review evidence** — monochrome orthographic floor plan, elevations, four 120-degree corner views, center-up ceiling view, two opposed ceiling obliques, plus opening and collision evidence.
7. **Runtime gate** — export only after Form approval; validate asset hashes, geometry/texture tiers, frame/performance budget, production camera, loaded textures, lighting, environment, and interactions before release.
8. **Postmortem** — record observations and propose reusable lessons as pending; never auto-approve them.

## SINA AI STUDIO integration boundaries

- Keep the existing Phaser 2D schema and runtime backward compatible.
- Add a separately versioned 3D room manifest and validator; never overload the 2D tile-map schema.
- Route requests through the existing Orchestrator, provider abstraction, authenticated job lifecycle, and project association. A 3D room request must not bypass job validation or invent provider capabilities.
- Use Three.js / React Three Fiber for the browser runtime and Blender for deterministic geometry authoring/validation.
- Keep room packages portable and self-contained: brief, props, layout, opening schedule, review approvals, images, meshes, plans, renders, runtime exports, and final report.
- Keep AI-generated code out of the runtime. The runtime consumes validated data/manifests and allow-listed interactions only.

## Free-only policy

- No paid Meshy submission, paid API, paid GPU, or new subscription is part of this integration.
- Prefer procedural Blender geometry and locally available/free reference-generation routes.
- Meshy is an optional third-party paid conversion path, not a dependency. It stays disabled unless the owner separately authorizes a specific spend after current pricing and data transfer are disclosed.
- Do not request or store API keys in chat, manifests, prompts, logs, or source control.

## Required implementation phases

### Phase A — contracts and safe preview
- Add versioned 3D room/prop/opening schemas and server-side validation.
- Add deterministic room-package creation and validation.
- Add a Three.js/R3F room preview that can load only validated manifests.
- Add unit tests for schema rejection, unsupported engine versions, invalid dimensions, missing destinations, out-of-bounds placements, and invalid opening/collision combinations.

### Phase B — playable room runtime
- Add player spawn, movement, collision, navigation bounds, camera contract, interaction allow-list, and recovery/respawn zones.
- Validate intended and unintended routes and prevent decorative openings from becoming phantom passages.
- Add browser tests for loading, controls, collision, interaction, and graceful failure.

### Phase C — authoring and asset pipeline
- Add procedural Blender shell generation, Boolean openings, prop placement, camera setup, review renders, and geometry audits.
- Preserve source images/prompts and asset hashes. Human approvals are required at Function and Form gates.
- Keep Meshy disabled by default under the free-only policy.

### Phase D — export and release
- Export runtime tiers only after explicit Form approval.
- Verify production-camera fit, loaded assets, lighting, interactions, performance, and provenance.
- Require explicit Runtime approval before deployment.

## Blocking acceptance criteria

- No regression to existing Phaser 2D builds or scene-viewer fallback.
- No generated JavaScript or arbitrary model-provided scripts are evaluated.
- Server and browser independently validate the versioned room manifest.
- Room shell, openings, collision, navigation, and player routes agree.
- Floor/wall/ceiling props are physically attached and correctly oriented.
- The room is reviewed from production-camera views, including dedicated ceiling coverage.
- Runtime tests pass on the actual loaded application, not only a Blender proxy render.
- Every gate records evidence and explicit human approval; a successful render or test alone is not approval.

## Current status

Only the existing 2D Phaser MVP and the separate cinematic Three.js universe are verified in the inspected repository snapshot. The 3D gameplay-room pipeline described here is a planned additive implementation and must not be advertised as complete until the phases above are implemented and tested.
