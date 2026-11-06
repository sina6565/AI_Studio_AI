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
room_actor = unreal.EditorLevelLibrary.spawn_actor_from_object(room_mesh, unreal.Vector(0, 0, 0))
if not room_actor:
    raise RuntimeError("UE5 could not spawn the imported room mesh.")
room_actor.set_actor_label("SINA_GeneratedRoom")
room_actor.set_folder_path("SINA/Generated")
room_actor.set_editor_property("mobility", unreal.ComponentMobility.STATIC)

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

# Preserve the authored gameplay contract in the generated project for the
# owner to extend with Blueprint interactions after runtime review.
manifest_asset = build_dir / "ue5-room-manifest.json"
manifest_asset.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
unreal.EditorAssetLibrary.save_loaded_asset(room_mesh)
unreal.EditorLevelLibrary.save_current_level()
unreal.EditorLoadingAndSavingUtils.save_dirty_packages(True, True)

print("SINA_UE5_LEVEL=" + level_path)
print("SINA_UE5_ROOM_MESH=" + room_mesh_path)
print("SINA_UE5_PLAYER_START=" + str(bool(player_start)))
print("SINA_UE5_NAV_BOUNDS=" + str(bool(nav)))
