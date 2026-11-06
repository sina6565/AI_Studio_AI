# SINA AI STUDIO — Self-hosted Blender / Unreal Engine 5 Worker

This worker is the execution side of the native 3D room pipeline. It is intentionally self-hosted: it requires a machine on which Blender and Unreal Engine 5 are already installed. It is **not** an Alibaba Serverless function and cannot run inside a generic serverless container without the native tools and a compatible project template.

The backend adapter is `backend/src/game3d/UnrealEngine5Adapter.ts`. The worker implementation is `server.py`.

## Two-stage workflow

1. **Function approval → Blender preview.** The UI submits `game_3d_preview`. The worker validates the room manifest, creates sealed procedural surfaces, applies Boolean door/window cuts, places approved props, renders review images, exports GLB and saves the .blend source. The main render is returned for owner review.
2. **Form approval → UE5 project.** After the owner reviews the Blender render and approves Form, the UI submits `game_3d_build`. The worker regenerates the room, imports the combined GLB into an owner-supplied UE5 Third Person project template, creates a generated level with a PlayerStart and NavMeshBoundsVolume, and returns a source-project ZIP.

Runtime/package approval remains separate. The current worker does **not** produce a packaged executable, prove device compatibility, or implement arbitrary game objectives/interactions from natural language. The result is a UE5 source project containing a generated room/environment, ready for opening and runtime review in Unreal Editor.

## Requirements

- Python 3.9+ for the worker service.
- Blender 4.x or newer, available as a command (or set `BLENDER_BIN`).
- Unreal Engine 5 installed locally.
- An owner-supplied UE5 **Third Person** project template containing exactly one `.uproject` file. Enable the UE Python Script Plugin and glTF Importer plugin in that template.
- A backend deployment that can reach the worker's private HTTPS endpoint.

No hosted GPU, paid model API, Meshy submission, or paid cloud generation service is used. Structural geometry falls back to procedural Blender geometry. Model candidates in `model-benchmark.json` remain disabled until compatible local hardware and actual benchmark evidence are available.

## Start the worker

Set the following environment variables in the worker's execution environment. Never commit their values.

| Variable | Required | Purpose |
|---|---:|---|
| `UE5_WORKER_TOKEN` | Yes | Shared bearer token; the service refuses to start without it |
| `BLENDER_BIN` | Yes | Blender executable path or command; default: `blender` |
| `UE5_EDITOR_CMD` | For UE5 build | Unreal Editor command path, e.g. `UnrealEditor-Cmd` |
| `UE5_PROJECT_TEMPLATE` | For UE5 build | Local UE5 Third Person project directory |
| `SINA_WORKER_PUBLIC_URL` | For browser artifacts | Public HTTPS base URL used to construct review-image and ZIP links |
| `SINA_WORKER_HOST` | No | Bind address; default `0.0.0.0` |
| `SINA_WORKER_PORT` | No | Bind port; default `8787` |
| `SINA_WORKER_DATA_DIR` | No | Artifact/state directory; default `tools/ue5-room-worker/worker-data` |
| `SINA_BLENDER_TIMEOUT_SECONDS` | No | Blender timeout; default `900` |
| `SINA_UE5_TIMEOUT_SECONDS` | No | Unreal Editor timeout; default `1800` |

Run:

```bash
python tools/ue5-room-worker/server.py
```

Check `GET /health`. Preview is available when Blender is detected. UE5 builds require Blender, the Unreal Editor command, and the project template. Configure `SINA_WORKER_PUBLIC_URL` with the externally reachable HTTPS origin; otherwise artifact links default to localhost and will not work for a remote browser.

Configure the backend:

- `UE5_WORKER_URL`: worker base URL, for example `https://your-private-worker.example`.
- `UE5_WORKER_TOKEN`: the same token as `UE5_WORKER_TOKEN` on the worker.

Keep the worker behind TLS and a network access control layer. Artifact URLs are unguessable UUID paths so a browser can display preview images and download ZIPs without exposing the bearer token; treat them as private links and apply an expiring signed-URL layer at the reverse proxy for production.

## HTTP API

All `/api/v1/ue5/*` routes require `Authorization: Bearer <UE5_WORKER_TOKEN>`.

### Preview

- `POST /api/v1/ue5/previews`
- `GET /api/v1/ue5/previews/{buildId}`

A completed response includes `artifactUrl` (PNG), `format`, `size`, and `metadata.audit`. The backend polls the status endpoint and marks the preview job complete only after the worker reports `completed`.

### UE5 project build

- `POST /api/v1/ue5/builds`
- `GET /api/v1/ue5/builds/{buildId}`

Build requests are rejected unless both Function and Form approvals are present. A completed response includes a ZIP `artifactUrl`, `format`, `size`, and build metadata. `includePackagedBuild` remains false; runtime approval and packaging are a separate future stage.

## Worker files

- `server.py`: authenticated HTTP service, job state, background execution and artifact delivery.
- `build_room_from_manifest.py`: procedural Blender shell, Boolean openings, prop placement, review renders, GLB/.blend export and audit report.
- `import_glb_to_unreal.py`: UE Python script that imports the combined room mesh into a generated map and places PlayerStart / NavMeshBoundsVolume.
- `examples/build_demo_room.py`: standalone fixed demo blockout; not used by the manifest-driven job API.
- `model-benchmark.json`: candidate registry and scoring rubric. It currently contains no measured model results.

## Safety and release gates

- The worker accepts structured manifests only; it does not execute JavaScript or Python supplied in a prompt or model response.
- Paid services are rejected by the manifest contract. No Meshy calls are made.
- The preview endpoint requires Function approval. The UE5 project endpoint additionally requires explicit Form approval and evidence.
- Runtime approval is not inferred from a successful Blender render or project import.
- The current automated worker creates a room/environment source project. Gameplay interactions beyond player start and navigation-volume placement are metadata only and need a separately tested Blueprint/runtime implementation.
- A Blender preview is not proof that the UE5 project opens, compiles, navigates correctly, or runs at target-device performance. Run a real UE5 editor smoke test before describing the room as runtime-verified.
- Do not expose the worker publicly without TLS, bearer authentication, job isolation, disk/CPU/time limits, access controls and expiring artifact URLs.
