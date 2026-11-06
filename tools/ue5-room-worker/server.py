"""Self-hosted SINA UE5 worker (standard-library HTTP service).

Preview jobs require Blender. Final UE5 project jobs additionally require a
local Unreal Engine 5 editor command and an owner-supplied Third Person project
template. No hosted GPU, paid API, Meshy request, or arbitrary model code runs.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import json
import mimetypes
import os
import shutil
import subprocess
import threading
import uuid
import zipfile
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
BLENDER_SCRIPT = ROOT / "build_room_from_manifest.py"
UNREAL_SCRIPT = ROOT / "import_glb_to_unreal.py"
DATA_DIR = Path(os.environ.get("SINA_WORKER_DATA_DIR", ROOT / "worker-data")).resolve()
PUBLIC_BASE_URL = os.environ.get("SINA_WORKER_PUBLIC_URL", "").rstrip("/")
HOST = os.environ.get("SINA_WORKER_HOST", "0.0.0.0")
PORT = int(os.environ.get("SINA_WORKER_PORT", "8787"))
TOKEN = os.environ.get("UE5_WORKER_TOKEN", "")
BLENDER_BIN = os.environ.get("BLENDER_BIN", "blender")
UE5_EDITOR_CMD = os.environ.get("UE5_EDITOR_CMD", "")
UE5_PROJECT_TEMPLATE = os.environ.get("UE5_PROJECT_TEMPLATE", "")
MAX_BODY = 4 * 1024 * 1024
LOCK = threading.Lock()
POOL = concurrent.futures.ThreadPoolExecutor(max_workers=1, thread_name_prefix="sina-ue5")


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def record_path(kind: str, build_id: str) -> Path:
    return DATA_DIR / "jobs" / kind / (build_id + ".json")


def write_record(kind: str, build_id: str, record: dict):
    path = record_path(kind, build_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(record, indent=2), encoding="utf-8")
    temp.replace(path)


def read_record(kind: str, build_id: str):
    path = record_path(kind, build_id)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def set_status(kind: str, build_id: str, **updates):
    with LOCK:
        current = read_record(kind, build_id) or {}
        current.update(updates)
        current["updatedAt"] = utc_now()
        write_record(kind, build_id, current)
        return current


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def public_url(build_id: str, filename: str) -> str:
    base = PUBLIC_BASE_URL or ("http://127.0.0.1:" + str(PORT))
    return base + "/artifacts/" + build_id + "/" + filename


def validate_payload(payload: dict, require_form: bool):
    if payload.get("engine", {}).get("id") != "unreal_engine_5" or payload.get("engine", {}).get("majorVersion") != 5:
        raise ValueError("Only Unreal Engine 5 room jobs are accepted.")
    manifest = payload.get("manifest")
    if not isinstance(manifest, dict):
        raise ValueError("manifest is required.")
    pipeline = manifest.get("pipeline", {})
    gates = pipeline.get("gates", {})
    if pipeline.get("paidServicesAllowed") is not False:
        raise ValueError("Paid services must remain disabled.")
    if not gates.get("functionApproved"):
        raise ValueError("Function approval is required.")
    if require_form and not gates.get("formApproved"):
        raise ValueError("Form approval is required before UE5 project handoff.")
    if require_form and not gates.get("formApproval", {}).get("evidence"):
        raise ValueError("Form approval evidence is required.")
    if not gates.get("functionApproval", {}).get("evidence"):
        raise ValueError("Function approval evidence is required.")
    return manifest


def run_blender(build_id: str, manifest: dict):
    job_dir = DATA_DIR / "artifacts" / build_id
    job_dir.mkdir(parents=True, exist_ok=True)
    manifest_file = job_dir / "manifest.json"
    blend_file = job_dir / "room.blend"
    glb_file = job_dir / "room.glb"
    preview_file = job_dir / "preview.png"
    review_dir = job_dir / "review"
    manifest_file.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    command = [
        BLENDER_BIN, "--background", "--python", str(BLENDER_SCRIPT), "--",
        "--manifest-file", str(manifest_file),
        "--output", str(blend_file),
        "--glb", str(glb_file),
        "--render", str(preview_file),
        "--review-dir", str(review_dir),
    ]
    result = subprocess.run(
        command, cwd=str(ROOT), capture_output=True, text=True,
        timeout=int(os.environ.get("SINA_BLENDER_TIMEOUT_SECONDS", "900")),
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("Blender failed: " + (result.stderr or result.stdout)[-5000:])
    required = [blend_file, glb_file, preview_file, job_dir / "audit_report.json"]
    missing = [str(path.name) for path in required if not path.is_file() or path.stat().st_size == 0]
    if missing:
        raise RuntimeError("Blender did not create required artifacts: " + ", ".join(missing))
    audit = json.loads((job_dir / "audit_report.json").read_text(encoding="utf-8"))
    if audit.get("status") != "passed":
        raise RuntimeError("Blender geometry audit did not pass.")
    return job_dir, blend_file, glb_file, preview_file, audit


def run_preview(build_id: str, payload: dict):
    try:
        set_status("previews", build_id, status="processing", progress=10, stage="validating_manifest")
        manifest = validate_payload(payload, require_form=False)
        set_status("previews", build_id, progress=25, stage="running_blender")
        job_dir, blend_file, glb_file, preview_file, audit = run_blender(build_id, manifest)
        review_names = audit.get("reviewViews", [])
        metadata = {
            "engine": "unreal_engine_5",
            "authoring": "blender",
            "glbSha256": sha256(glb_file),
            "blendSha256": sha256(blend_file),
            "audit": audit,
            "reviewViews": [public_url(build_id, "review/" + name) for name in review_names],
            "formApprovalRequired": True,
        }
        set_status(
            "previews", build_id, status="completed", progress=100, stage="preview_ready",
            artifactUrl=public_url(build_id, "preview.png"), format="image/png",
            size=preview_file.stat().st_size, metadata=metadata, completedAt=utc_now(),
        )
    except Exception as exc:
        set_status("previews", build_id, status="failed", progress=100, stage="failed", error=str(exc)[:5000])


def copy_project_template(template: Path, destination: Path):
    if not template.is_dir():
        raise RuntimeError("UE5_PROJECT_TEMPLATE must point to a local Unreal Engine 5 Third Person project directory.")
    project_files = list(template.glob("*.uproject"))
    if len(project_files) != 1:
        raise RuntimeError("UE5 project template must contain exactly one .uproject file.")
    ignored = shutil.ignore_patterns("Binaries", "DerivedDataCache", "Intermediate", "Saved", ".git", ".vs")
    shutil.copytree(template, destination, ignore=ignored)
    copied = list(destination.glob("*.uproject"))
    if len(copied) != 1:
        raise RuntimeError("Could not copy a valid .uproject file.")
    return copied[0]


def run_ue5_editor(project_file: Path, glb_file: Path, manifest_file: Path, build_dir: Path):
    if not UE5_EDITOR_CMD:
        raise RuntimeError("UE5_EDITOR_CMD is not configured.")
    editor = shutil.which(UE5_EDITOR_CMD) or (UE5_EDITOR_CMD if Path(UE5_EDITOR_CMD).is_file() else None)
    if not editor:
        raise RuntimeError("UE5_EDITOR_CMD could not be found.")
    env = os.environ.copy()
    env["SINA_ROOM_GLB"] = str(glb_file)
    env["SINA_ROOM_MANIFEST"] = str(manifest_file)
    env["SINA_ROOM_BUILD_DIR"] = str(build_dir)
    command = [
        str(editor), str(project_file), "-unattended", "-nop4", "-nosplash",
        "-ExecutePythonScript=" + str(UNREAL_SCRIPT),
        "-stdout", "-FullStdOutLogOutput",
    ]
    result = subprocess.run(
        command, cwd=str(project_file.parent), env=env,
        capture_output=True, text=True,
        timeout=int(os.environ.get("SINA_UE5_TIMEOUT_SECONDS", "1800")),
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("Unreal Editor import failed: " + (result.stderr or result.stdout)[-5000:])


def zip_project(build_dir: Path, job_dir: Path):
    output = job_dir / "sina-unreal-project.zip"
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=5) as archive:
        for path in build_dir.rglob("*"):
            if not path.is_file():
                continue
            if any(part in {"Binaries", "DerivedDataCache", "Intermediate", "Saved", ".git"} for part in path.parts):
                continue
            archive.write(path, path.relative_to(build_dir.parent))
        for name in ("room.blend", "room.glb", "preview.png", "audit_report.json", "manifest.json", "ue5-import-report.json"):
            candidate = job_dir / name
            if candidate.is_file():
                archive.write(candidate, "SINA_Review/" + name)
    return output


def run_build(build_id: str, payload: dict):
    try:
        set_status("builds", build_id, status="processing", progress=5, stage="validating_manifest")
        manifest = validate_payload(payload, require_form=True)
        job_dir, blend_file, glb_file, preview_file, audit = run_blender(build_id, manifest)
        set_status("builds", build_id, progress=55, stage="preparing_unreal_project")
        template = Path(UE5_PROJECT_TEMPLATE).expanduser().resolve()
        project_dir = job_dir / "UnrealProject"
        project_file = copy_project_template(template, project_dir)
        set_status("builds", build_id, progress=70, stage="importing_room_into_ue5")
        run_ue5_editor(project_file, glb_file, job_dir / "manifest.json", project_dir)
        import_report_path = job_dir / "ue5-import-report.json"
        if not import_report_path.is_file() or import_report_path.stat().st_size == 0:
            raise RuntimeError("Unreal Editor did not produce the required UE5 import report.")
        import_report = json.loads(import_report_path.read_text(encoding="utf-8"))
        required_checks = (
            import_report.get("status") == "created"
            and bool(import_report.get("generatedMap"))
            and bool(import_report.get("playerStartCreated"))
            and bool(import_report.get("navMeshBoundsCreated"))
            and import_report.get("collisionTraceFlag") == "CTF_USE_COMPLEX_AS_SIMPLE"
            and import_report.get("collisionProfile") == "BlockAll"
            and bool(import_report.get("editorStartupMapSet"))
            and bool(import_report.get("gameDefaultMapSet"))
        )
        if not required_checks:
            raise RuntimeError("UE5 import report is missing required map, player-start, navigation, collision or startup-map evidence.")
        set_status("builds", build_id, progress=90, stage="packaging_project_source")
        artifact = zip_project(project_dir, job_dir)
        metadata = {
            "engine": "unreal_engine_5",
            "engineMajorVersion": 5,
            "artifactKind": "unreal-project-source",
            "packagedGame": False,
            "runtimeApprovalRequiredForPackaging": True,
            "glbSha256": sha256(glb_file),
            "blendSha256": sha256(blend_file),
            "audit": audit,
            "ue5Import": import_report,
            "projectFile": project_file.name,
        }
        set_status(
            "builds", build_id, status="completed", progress=100, stage="ue5_project_ready",
            artifactUrl=public_url(build_id, artifact.name), format="application/zip",
            size=artifact.stat().st_size, metadata=metadata, completedAt=utc_now(),
        )
    except Exception as exc:
        set_status("builds", build_id, status="failed", progress=100, stage="failed", error=str(exc)[:5000])


class Handler(BaseHTTPRequestHandler):
    server_version = "SINA-UE5-Worker/1.0"

    def log_message(self, fmt, *args):
        # Keep request logs free of headers, request bodies, and bearer tokens.
        print("[%s] %s" % (utc_now(), fmt % args))

    def send_json(self, status, data):
        raw = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def authorized(self):
        if not TOKEN:
            return False
        return self.headers.get("Authorization", "") == "Bearer " + TOKEN

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("Invalid Content-Length.")
        if length < 2 or length > MAX_BODY:
            raise ValueError("Request body is empty or exceeds the 4 MiB limit.")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            blender_ok = bool(shutil.which(BLENDER_BIN) or Path(BLENDER_BIN).is_file())
            ue_ok = bool(UE5_EDITOR_CMD and (shutil.which(UE5_EDITOR_CMD) or Path(UE5_EDITOR_CMD).is_file()))
            template_ok = bool(UE5_PROJECT_TEMPLATE and Path(UE5_PROJECT_TEMPLATE).is_dir())
            self.send_json(200, {
                "service": "sina-ue5-worker",
                "status": "ready" if blender_ok and ue_ok and template_ok else "degraded",
                "checks": {"blender": blender_ok, "unrealEditor": ue_ok, "projectTemplate": template_ok},
                "previewAvailable": blender_ok,
                "ue5BuildAvailable": blender_ok and ue_ok and template_ok,
            })
            return

        if parsed.path.startswith("/artifacts/"):
            parts = [unquote(p) for p in parsed.path.split("/") if p]
            if len(parts) < 3:
                self.send_error(404)
                return
            build_id = parts[1]
            filename = "/".join(parts[2:])
            if not build_id.replace("-", "").isalnum() or ".." in filename.split("/"):
                self.send_error(400)
                return
            file_path = (DATA_DIR / "artifacts" / build_id / filename).resolve()
            root = (DATA_DIR / "artifacts" / build_id).resolve()
            if not file_path.is_relative_to(root) or not file_path.is_file():
                self.send_error(404)
                return
            content = file_path.read_bytes()
            mime = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "private, max-age=300")
            self.end_headers()
            self.wfile.write(content)
            return

        if not self.authorized():
            self.send_json(401, {"error": "unauthorized"})
            return
        segments = [unquote(p) for p in parsed.path.split("/") if p]
        if len(segments) == 5 and segments[:3] == ["api", "v1", "ue5"] and segments[3] in {"previews", "builds"}:
            kind, build_id = segments[3], segments[4]
            if not build_id.replace('-', '').isalnum():
                self.send_json(400, {"error": "invalid_build_id"})
                return
            record = read_record(kind, build_id)
            if record is None:
                self.send_json(404, {"error": "job_not_found"})
            else:
                self.send_json(200, record)
            return
        self.send_json(404, {"error": "not_found"})

    def do_POST(self):
        if not self.authorized():
            self.send_json(401, {"error": "unauthorized"})
            return
        parsed = urlparse(self.path)
        route_map = {
            "/api/v1/ue5/previews": ("previews", run_preview, False),
            "/api/v1/ue5/builds": ("builds", run_build, True),
        }
        if parsed.path not in route_map:
            self.send_json(404, {"error": "not_found"})
            return
        kind, runner, require_form = route_map[parsed.path]
        blender_ready = bool(shutil.which(BLENDER_BIN) or Path(BLENDER_BIN).is_file())
        if not blender_ready:
            self.send_json(503, {"error": "BLENDER_BIN is not available on this worker."})
            return
        if require_form:
            editor_ready = bool(UE5_EDITOR_CMD and (shutil.which(UE5_EDITOR_CMD) or Path(UE5_EDITOR_CMD).is_file()))
            template_ready = bool(UE5_PROJECT_TEMPLATE and Path(UE5_PROJECT_TEMPLATE).is_dir())
            if not editor_ready or not template_ready:
                self.send_json(503, {"error": "UE5_EDITOR_CMD and UE5_PROJECT_TEMPLATE must be configured before UE5 builds."})
                return
        try:
            payload = self.read_json()
            manifest = validate_payload(payload, require_form=require_form)
            build_id = str(uuid.uuid4())
            record = {
                "buildId": build_id,
                "status": "queued",
                "progress": 0,
                "stage": "queued",
                "createdAt": utc_now(),
                "projectTitle": str(manifest.get("project", {}).get("title", ""))[:120],
            }
            write_record(kind, build_id, record)
            POOL.submit(runner, build_id, payload)
            self.send_json(202, record)
        except Exception as exc:
            self.send_json(400, {"error": str(exc)[:2000]})


def mark_interrupted_jobs():
    jobs_root = DATA_DIR / "jobs"
    if not jobs_root.exists():
        return
    for path in jobs_root.glob("*/*.json"):
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
            if record.get("status") in {"queued", "processing"}:
                record.update({
                    "status": "failed",
                    "stage": "worker_restarted",
                    "error": "Worker restarted while this job was running. Submit a new job after checking existing artifacts.",
                    "updatedAt": utc_now(),
                })
                path.write_text(json.dumps(record, indent=2), encoding="utf-8")
        except Exception:
            continue


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not TOKEN:
        raise SystemExit("UE5_WORKER_TOKEN is required; do not run the worker without authentication.")
    mark_interrupted_jobs()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("SINA UE5 Worker listening on %s:%s" % (HOST, PORT))
    print("Health check: /health")
    server.serve_forever()


if __name__ == "__main__":
    main()
