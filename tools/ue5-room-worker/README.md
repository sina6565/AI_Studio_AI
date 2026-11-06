# Self-hosted UE5 Room Worker Contract

This folder documents the worker that must run on an owner-controlled machine with Blender and Unreal Engine 5 installed. The backend adapter is in `backend/src/game3d/UnrealEngine5Adapter.ts`.

## Backend configuration

Set these variables in the backend runtime environment (never commit values):

- `UE5_WORKER_URL`: base URL of the private worker service, for example an internal network URL.
- `UE5_WORKER_TOKEN`: optional bearer token shared only between the backend and worker.

No hosted build provider or paid API is required by this contract.

## Endpoints

### POST /api/v1/ue5/builds

Accept the JSON payload sent by `UnrealEngine5Adapter`:

- `engine.id` must be `unreal_engine_5`.
- `engine.majorVersion` must be `5`.
- `manifest` must satisfy the versioned UE5 room contract in `backend/src/game3d/types.ts`.
- `authoring.tool` is Blender; export format is GLB.
- `output.includeUnrealProject` is true.
- `output.includePackagedBuild` is false until runtime approval.

Return HTTP 202 or 200 with JSON containing a stable `buildId` and `status` (`queued`, `processing`, `completed`, or `failed`).

### GET /api/v1/ue5/builds/{buildId}

Return the same build record. On completion, include `artifactUrl`, `format`, `size`, and `metadata`. On failure, include a concise `error`.

The API adapter polls this endpoint every two seconds for up to 30 minutes. It marks a job complete only after the worker reports `completed`.

## Worker execution stages

1. Revalidate the room manifest independently of the API.
2. Create an isolated workspace and enforce resource/time limits.
3. Generate structural room geometry in Blender: sealed shell, thickness, scheduled Boolean openings, and prop placements.
4. Run geometry, attachment, scale, symmetry, collision, navigation, and camera audits.
5. Export the approved room and assets as GLB/FBX with stable IDs and SHA-256 provenance.
6. Import into a version-pinned UE5 project template.
7. Apply materials, collision, navigation, player start, camera, and allow-listed interactions.
8. Run Unreal automation tests and a real runtime smoke test.
9. Store the source .blend, UE project, logs, test evidence, hashes, and artifact.
10. Return the completed build record.

## Safety and release gates

- Never execute arbitrary JavaScript or scripts supplied in a model response.
- Do not invoke Meshy or any paid service. Use procedural Blender geometry and approved free/local assets.
- Do not export before Function and Form approval.
- Do not package or publish before Runtime approval.
- A Blender preview is not proof that the UE5 runtime works.
- Keep the worker private; do not expose Unreal build endpoints publicly without authentication, isolation, and resource limits.
