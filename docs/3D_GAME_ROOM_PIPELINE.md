# SINA AI STUDIO — Unreal Engine 5 Game Room Pipeline

Status: Unreal Engine 5 is the official 3D game engine. The Build 3D Game Rooms workflow is integrated as a room-authoring and validation pipeline that prepares packages for UE5. The worker must be self-hosted and is not yet verified as deployed.

## Fixed engine decision

- 3D game runtime and project target: Unreal Engine 5.
- Room authoring and geometry validation: Blender.
- 2D game runtime: existing Phaser MVP, kept independent.
- Three.js / React Three Fiber may remain in the cinematic web universe or lightweight previews; they are not the official 3D game runtime.
- Orchestrator coordinates Game Agent, Asset Agent, room pipeline, and Unreal Engine 5 Adapter. End users provide a natural-language brief and should not need to operate Unreal Editor.

## Build 3D Game Rooms capabilities mapped into SINA

1. Function gate: room purpose, runtime surface, bounds, hero object, circulation, production camera, performance budget, and symmetry.
2. Prop manifest: stable IDs, functional roles, dimensions, attachment face, semantic front, reuse class, polygon target, source provenance, and rejection criteria.
3. Room layout: machine-readable shell, placements, circulation, spawn/respawn, collision, and navigation data.
4. Opening schedule: doors, windows, and deep alcoves with dimensions, wall, destination, and traversal behavior. Traversable openings must agree with collision and navigation; decorative arches cannot create phantom routes.
5. Asset preparation: isolated references and provenance; procedural Blender geometry first. Only approved, available free/local assets may be used.
6. Blender composition: sealed wall/floor/ceiling substrates, real thickness, structural Boolean openings, prop placement, scale/orientation checks, and production camera.
7. Review evidence: monochrome floor plan, elevations, four 120-degree corner views, center-up ceiling view, two opposed ceiling obliques, and opening/collision evidence.
8. Form gate: human approval after geometry, attachment, symmetry, camera, and collision/navigation audits.
9. UE5 handoff: export validated room/prop data and GLB/FBX assets through the owner-operated UE5 Adapter/Worker; import into a UE5 project, apply materials/collision/navigation, and run real-runtime tests.
10. Runtime gate: verify loaded meshes/textures, lighting, camera fit, interactions, navigation, performance, and packaged output before explicit approval.

## Free-only constraints

- No paid Meshy submission, paid API, hosted GPU, or subscription is part of the required workflow.
- The Meshy path in the original skill is intentionally disabled unless the owner later gives explicit permission for a specific spend.
- Prefer procedural Blender geometry and local/approved free assets.
- UE5 worker is self-hosted/owner-operated. Configure `UE5_WORKER_URL` and optional `UE5_WORKER_TOKEN` outside source control. Never commit tokens or print secrets.
- Do not describe a worker as available until its health check and a real test build succeed.

## Implemented backend integration

- Job type: `game_3d_build`.
- API validates the versioned `UE5RoomManifest` before enqueueing.
- Contract: `backend/src/game3d/types.ts`.
- Adapter: `backend/src/game3d/UnrealEngine5Adapter.ts`.
- Orchestrator routes UE5 jobs to the native worker path without requiring an image-generation provider.
- Existing Phaser job types and provider routing remain separate.
- Worker submit endpoint: `POST /api/v1/ue5/builds`.
- Worker status endpoint: `GET /api/v1/ue5/builds/{buildId}`.
- Adapter polls the worker for up to 30 minutes and only returns a completed artifact. Failed/unknown worker responses are not reported as successful.
- Adapter blocks UE5 handoff until Function and Form approvals are both true.
- No arbitrary model-generated scripts are executed by the API.

### Worker request responsibilities

The worker receives a validated manifest plus:
- Blender authoring tool and GLB export format.
- Preserve-source-project and geometry-audit requirements.
- Unreal Engine 5 major version 5.
- Request to return the UE project artifact; packaged builds remain disabled until Runtime approval.

The worker must:
1. Validate request schema and idempotency key.
2. Create an isolated workspace per job and enforce CPU, memory, disk, and time budgets.
3. Run Blender in background mode to compose and audit the room.
4. Export approved assets and import them into a version-pinned UE5 project template.
5. Apply collision, navigation, player start, camera, materials, and allow-listed interactions.
6. Run Unreal automation tests and launch a real runtime smoke test.
7. Store logs, source project, hashes, test evidence, and output artifacts.
8. Return a stable build ID and status. The status endpoint must report `queued`, `processing`, `completed`, or `failed`.

## Acceptance criteria

- Existing Phaser 2D game builds and scene-viewer fallback remain unchanged.
- A 3D job routes to the UE5 adapter, not Phaser or a Three.js gameplay runtime.
- Server validates the manifest; worker validates it again.
- Room openings, collision, navigation, and player routes agree.
- No paid Meshy/API/GPU dependency is introduced.
- Function and Form approvals block export; Runtime approval blocks release.
- A successful Blender render is not treated as proof of a working UE5 game.
- UE5 worker health and real build tests are recorded separately from API unit tests.

## Current verified status

Backend job registration, manifest validation, Orchestrator routing, and worker adapter code are committed on the feature branch. A real UE5 worker, Blender worker automation, and a real UE5 build have not yet been connected or verified. API tests have not yet been executed in this environment.
