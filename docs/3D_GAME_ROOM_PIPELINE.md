# SINA AI STUDIO — Native 3D Room and UE5 Project Pipeline

**Engine decision:** Unreal Engine 5 is the native 3D runtime. Blender is the deterministic room authoring and geometry-review stage. Phaser remains the independent 2D runtime; Three.js/React Three Fiber is used only for the web concept preview and cinematic surfaces.

## User workflow

1. Open **3D Game Lab** at `/studio/3d`.
2. Enter the game title, room brief, genre and target platform.
3. Confirm the Function brief. The client submits `game_3d_preview`.
4. The authenticated Orchestrator sends the job to the self-hosted worker. Blender generates a procedural structural shell, applies Boolean opening cuts, places declared props and creates a review package.
5. The worker returns a PNG for the browser, plus a .blend source, GLB, audit report, floor plan, four corner renders and ceiling-review views.
6. The owner examines the returned Blender render and explicitly approves Form.
7. The client submits `game_3d_build`. The adapter requires both approvals. The worker copies the configured owner-supplied UE5 Third Person project template, imports the combined GLB into a new generated level, creates a PlayerStart and NavMeshBoundsVolume, and packages the UE5 source project with review evidence into a ZIP.
8. The Jobs page displays the preview/build lifecycle and exposes completed artifacts.

## Implemented repository components

| Layer | Implementation |
|---|---|
| Frontend | `frontend/src/pages/Game3DBuilder.tsx`, interactive R3F concept preview, Function/Form approval controls, polling, bilingual copy |
| Frontend route | Protected `/studio/3d` route and navigation entry |
| Frontend service | `frontend/src/services/ue5Game.ts` — submits separate preview and final-build jobs |
| API | `backend/src/api/routes/jobs.ts` validates both job payloads against the versioned room contract |
| Contract | `backend/src/game3d/types.ts` — dimensions, surfaces, props, openings, traversal, symmetry, approvals and free-only policy |
| Orchestration | `backend/src/orchestrator/Orchestrator.ts` routes UE5 jobs to the native worker adapter, independently of image providers |
| Adapter | `backend/src/game3d/UnrealEngine5Adapter.ts` validates gates, submits work, polls status and rejects incomplete/invalid artifacts |
| Blender worker | `tools/ue5-room-worker/build_room_from_manifest.py` creates the room shell, Boolean openings, scene dressing, GLB/.blend and review views |
| UE5 import | `tools/ue5-room-worker/import_glb_to_unreal.py` imports the GLB, creates a dedicated level, PlayerStart and NavMeshBoundsVolume |
| Worker service | `tools/ue5-room-worker/server.py` authenticated HTTP API, job state, background processing and artifact delivery |
| Worker tests | `tools/ue5-room-worker/test_worker_contract.py` covers Function/Form and paid-service gates |

## Geometry and review requirements

- Structural floors, walls and ceilings are built procedurally as continuous shell geometry.
- Doors/openings are cut into walls with Blender Exact Boolean operations before decorative surrounds.
- The primary traversable arrival must be at least 2.4 m wide, unless an explicit functional exception is recorded.
- Traversable openings must enable both collision and navigation.
- Props are declared with stable IDs, function, dimensions, attachment, semantic front, source and transforms.
- Review views include a floor plan, four room-corner views, one center-up ceiling view, two ceiling obliques and the production-camera render.
- A successful Blender render is not evidence that the UE5 project opens or runs correctly.

## Free-only policy

- The contract requires `paidServicesAllowed: false`.
- No Meshy paid task is invoked. No paid API, hosted GPU or subscription is required by the code.
- The room shell and structural geometry use procedural Blender generation.
- Hunyuan3D/TRELLIS remain optional self-hosted research candidates; neither is enabled as a production provider or declared a winning model.
- Do not enable any external paid asset generation without separate, explicit owner authorization.

## Self-hosted worker configuration

The worker cannot run inside a generic Alibaba Serverless function without Blender, Unreal Engine 5 and a project template installed. It requires a dedicated owner-controlled machine or a compatible persistent worker environment.

Required on the worker:
- Blender executable (`BLENDER_BIN`).
- Unreal Engine 5 Editor command (`UE5_EDITOR_CMD`) for final builds.
- One owner-supplied UE5 Third Person project directory (`UE5_PROJECT_TEMPLATE`) containing exactly one `.uproject`.
- UE Python Script Plugin and glTF Importer enabled in the template.
- `UE5_WORKER_TOKEN` and HTTPS reverse proxy.
- `SINA_WORKER_PUBLIC_URL` set to the externally reachable HTTPS base so browser artifact URLs are not localhost links.

Required on the backend:
- `UE5_WORKER_URL` set to the private HTTPS worker origin.
- `UE5_WORKER_TOKEN` set to the same secret as the worker.

See [tools/ue5-room-worker/README.md](../tools/ue5-room-worker/README.md) for installation and operation.

## Current scope boundary — read before calling it complete

This branch implements the UI, versioned manifest, job routing, approval gates, Blender room-generation worker, UE5 project import script and source-project packaging path. However, the native Blender/UE5 pipeline has **not yet been run on an actual machine with Blender and Unreal Engine 5 installed**, and no worker health check or real UE5 build artifact has been verified in this repository session.

The generated UE5 project currently contains the generated environment, imported room mesh, player start and navigation bounds. The manifest stores allowed interactions, but this worker does not yet generate tested Blueprint gameplay logic, arbitrary objectives, enemy AI, character animation, packaged executables or mobile builds. Runtime approval, full gameplay acceptance testing and packaging remain separate stages.

Do not describe this as a production-ready, fully playable 3D game until the worker is configured, a real UE5 project opens, navigation/interactions are implemented and tested, target-platform runtime smoke tests pass, and the owner explicitly approves Runtime.
