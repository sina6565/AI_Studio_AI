"""Import one normalized Blender GLB into an owner-supplied UE5 Third Person project.

Invoked by UnrealEditor-Cmd with -ExecutePythonScript. It creates a dedicated
map, imports the merged room mesh, places PlayerStart and a NavMeshBoundsVolume,
and saves the project. No arbitrary model-generated code is executed.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import unreal


def require_env(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise RuntimeError(name + " is required by the UE5 import script.")
    return value


def safe_slug(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9_]+", "_", value).strip("_")
    return slug[:60] or "GeneratedRoom"


def set_ini_value(path: Path, section: str, key: str, value: str) -> None:
    lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    section_header = "[" + section + "]"
    start = next((i for i, line in enumerate(lines) if line.strip() == section_header), None)
    if start is None:
        if lines and lines[-1].strip():
            lines.append("")
        lines.extend([section_header, key + "=" + value])
    else:
        end = next((i for i in range(start + 1, len(lines)) if lines[i].lstrip().startswith("[")), len(lines))
        found = next((i for i in range(start + 1, end) if lines[i].split("=", 1)[0].strip() == key), None)
        if found is None:
            lines.insert(end, key + "=" + value)
        else:
            lines[found] = key + "=" + value
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


glb_path = Path(require_env("SINA_ROOM_GLB")).resolve()
manifest_path = Path(require_env("SINA_ROOM_MANIFEST")).resolve()
build_dir = Path(require_env("SINA_ROOM_BUILD_DIR")).resolve()
if not glb_path.is_file() or not manifest_path.is_file():
    raise RuntimeError("Room GLB or manifest is missing.")

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
room = manifest["room"]
title = manifest["project"]["title"]
level_name = safe_slug(title) + "_GeneratedRoom"
level_path = "/Game/SINA/Maps/" + level_name
asset_folder = "/Game/SINA/Generated"

unreal.EditorAssetLibrary.make_directory("/Game/SINA")
unreal.EditorAssetLibrary.make_directory("/Game/SINA/Generated")
unreal.EditorAssetLibrary.make_directory("/Game/SINA/Maps")

# A new map prevents accidental edits to the supplied template's original map.
if not unreal.EditorLevelLibrary.new_level(level_path):
    raise RuntimeError("Could not create generated UE5 level: " + level_path)

task = unreal.AssetImportTask()
task.set_editor_property("filename", str(glb_path))
task.set_editor_property("destination_path", asset_folder)
task.set_editor_property("automated", True)
task.set_editor_property("replace_existing", True)
task.set_editor_property("save", True)
unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])

imported_paths = list(task.get_editor_property("imported_object_paths") or [])
static_meshes = []
for asset_path in imported_paths:
    asset = unreal.EditorAssetLibrary.load_asset(asset_path)
    if isinstance(asset, unreal.StaticMesh):
        static_meshes.append((asset_path, asset))

if not static_meshes:
    raise RuntimeError(
        "UE5 did not import a StaticMesh from the GLB. Enable the glTF importer plugin in the supplied project template."
    )

# The Blender pipeline exports one transform-applied combined room mesh.
room_mesh_path, room_mesh = static_meshes[0]
# The combined room is stationary environment geometry. Use per-polygon collision
# so the player can walk on the floor and be blocked by walls without one giant
# simple box enclosing the room interior.
body_setup = room_mesh.get_editor_property("body_setup")
if not body_setup:
    raise RuntimeError("UE5 imported the room mesh without a BodySetup for collision.")
body_setup.set_editor_property(
    "collision_trace_flag",
    unreal.CollisionTraceFlag.CTF_USE_COMPLEX_AS_SIMPLE,
)
unreal.EditorAssetLibrary.save_loaded_asset(room_mesh)

room_actor = unreal.EditorLevelLibrary.spawn_actor_from_object(room_mesh, unreal.Vector(0, 0, 0))
if not room_actor:
    raise RuntimeError("UE5 could not spawn the imported room mesh.")
room_actor.set_actor_label("SINA_GeneratedRoom")
room_actor.set_folder_path("SINA/Generated")
root_component = room_actor.get_root_component()
if root_component:
    root_component.set_mobility(unreal.ComponentMobility.STATIC)
    root_component.set_collision_profile_name("BlockAll")
    root_component.set_collision_enabled(unreal.CollisionEnabled.QUERY_AND_PHYSICS)
else:
    raise RuntimeError("Imported room actor has no root component for collision.")

# Keep player start and nav bounds derived from the same metre-based manifest.
spawn = room.get("playerSpawn", [0, 0, 0])
player_start = unreal.EditorLevelLibrary.spawn_actor_from_class(
    unreal.PlayerStart,
    unreal.Vector(float(spawn[0]) * 100, float(spawn[1]) * 100, float(spawn[2]) * 100),
    unreal.Rotator(0, 0, 0),
)
if not player_start:
    raise RuntimeError("Could not create PlayerStart.")

bounds = room["boundsMeters"]
nav_center = unreal.Vector(0, 0, float(bounds[2]) * 50)
nav = unreal.EditorLevelLibrary.spawn_actor_from_class(
    unreal.NavMeshBoundsVolume, nav_center, unreal.Rotator(0, 0, 0)
)
if nav:
    nav.set_actor_scale3d(unreal.Vector(float(bounds[0]), float(bounds[1]), float(bounds[2])))
else:
    raise RuntimeError("Could not create NavMeshBoundsVolume.")

# Preserve the authored gameplay contract in the generated project for the
# owner to extend with Blueprint interactions after runtime review.
manifest_asset = build_dir / "ue5-room-manifest.json"
manifest_asset.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
unreal.EditorAssetLibrary.save_loaded_asset(room_mesh)
unreal.EditorLevelLibrary.save_current_level()
unreal.EditorLoadingAndSavingUtils.save_dirty_packages(True, True)

# Launch the generated room by default when this project is opened or played.
# Require the standard UE5 Third Person template GameMode so the generated
# level launches with a real playable character/controller, not just a camera.
game_mode_asset = "/Game/ThirdPerson/Blueprints/BP_ThirdPersonGameMode"
if not unreal.EditorAssetLibrary.does_asset_exist(game_mode_asset):
    raise RuntimeError(
        "The supplied UE5 project must be the Third Person template and contain "
        "BP_ThirdPersonGameMode at " + game_mode_asset
    )
game_mode_class = game_mode_asset + ".BP_ThirdPersonGameMode_C"
maps_settings = Path(unreal.Paths.project_dir()) / "Config" / "DefaultGame.ini"
section = "/Script/EngineSettings.GameMapsSettings"
set_ini_value(maps_settings, section, "GlobalDefaultGameMode", game_mode_class)
set_ini_value(maps_settings, section, "EditorStartupMap", level_path)
set_ini_value(maps_settings, section, "GameDefaultMap", level_path)

import_report = {
    "schemaVersion": 1,
    "status": "created",
    "engine": "unreal_engine_5",
    "generatedMap": level_path,
    "roomMesh": room_mesh_path,
    "playerStartCreated": True,
    "navMeshBoundsCreated": True,
    "collisionTraceFlag": "CTF_USE_COMPLEX_AS_SIMPLE",
    "collisionProfile": "BlockAll",
    "editorStartupMapSet": True,
    "gameDefaultMapSet": True,
    "defaultGameMode": game_mode_class,
    "thirdPersonTemplateVerified": True,
}
(build_dir / "ue5-import-report.json").write_text(
    json.dumps(import_report, indent=2), encoding="utf-8"
)

print("SINA_UE5_LEVEL=" + level_path)
print("SINA_UE5_ROOM_MESH=" + room_mesh_path)
print("SINA_UE5_PLAYER_START=" + str(bool(player_start)))
print("SINA_UE5_NAV_BOUNDS=" + str(bool(nav)))
print("SINA_UE5_COMPLEX_COLLISION=enabled")
