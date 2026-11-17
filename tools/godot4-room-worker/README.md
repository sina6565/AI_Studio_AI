# SINA Godot 4 Room Worker

Godot 4 is the primary 3D runtime target for SINA AI STUDIO. This worker replaces the previous mandatory Unreal Engine 5 dependency while preserving the engine-neutral room manifest, approval gates, local-first execution, and Orchestrator ownership.

## Scope
- Generate a native Godot 4 project from a validated, structured room manifest.
- Build procedural room geometry, doors/openings, collision, lighting, spawn points, and playable first-/third-person controllers.
- Keep Blender optional for mesh authoring and visual review; it is not required for Godot runtime.
- Export a Godot project first. Desktop/mobile packaging is a separate, explicitly tested release stage.
- No paid hosted generation services. Use procedural geometry and approved free/local assets.

## Runtime requirements
- Godot 4.3 or newer (standard engine; no paid license).
- A self-hosted worker or local workstation with Godot installed.
- Backend reachability over private HTTPS and a bearer token when using remote worker mode.

## Worker contract
- GET /health: reports worker reachability, Godot version, and supported export targets.
- POST /api/v1/godot4/previews: validates the manifest and returns a preview artifact.
- POST /api/v1/godot4/builds: requires Function and Form approvals, generates a Godot project ZIP, and returns a build ID.
- GET /api/v1/godot4/builds/{buildId}: returns queued/processing/completed/failed status.

The worker must never execute model-generated code. It accepts only validated structured data and writes trusted templates plus generated numeric geometry. File paths must be normalized and constrained to the job workspace.

## Acceptance gates
1. Godot 4 project opens in headless/editor mode without parse/import errors.
2. Generated scene contains a navigable room, valid collision, spawn point, camera, and movement controller.
3. A headless smoke test loads the generated main scene.
4. An interactive runtime test verifies movement, collisions, door traversal, and camera modes.
5. The ZIP contains the complete source project and a machine-readable build report.
6. No UE5 executable, plugin, license, or UE5 worker environment is required.

## Migration note
The current main branch still contains UE5-specific adapter, schema, route validation, frontend service names, and a Blender-to-UE5 worker. This branch introduces the Godot 4 target in isolation. Do not delete or merge the legacy UE5 path until Godot tests pass and the owner approves the migration.
