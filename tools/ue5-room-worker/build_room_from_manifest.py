"""Build and audit a procedural UE5 room from the SINA versioned manifest.

Usage:
  blender --background --python build_room_from_manifest.py -- \
    --manifest-file manifest.json --output room.blend --glb room.glb \
    --render preview.png --review-dir review

This tool creates geometry only from validated project data; it never executes
scripts or code supplied by an AI model.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Vector


def cli_args():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest-file", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--glb", type=Path, required=True)
    parser.add_argument("--render", type=Path, required=True)
    parser.add_argument("--review-dir", type=Path, required=True)
    return parser.parse_args(args)


def material(name, color, metallic=0.0, roughness=0.6, emission=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    if emission:
        shader.inputs["Emission Color"].default_value = (*color, 1.0)
        shader.inputs["Emission Strength"].default_value = emission
    return mat


def box(name, location, dimensions, mat, rotation=(0.0, 0.0, 0.0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat is not None:
        obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("EdgeBevel", "BEVEL")
        modifier.width = min(bevel, min(dimensions) * 0.2)
        modifier.segments = 3
        obj.modifiers.new("WeightedNormals", "WEIGHTED_NORMAL")
    return obj


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def validate_manifest(manifest):
    errors = []
    room = manifest.get("room", {})
    assets = manifest.get("assets", [])
    openings = manifest.get("openings", [])
    surfaces = room.get("surfaces", [])
    ids = {surface.get("id") for surface in surfaces}
    asset_ids = {asset.get("id") for asset in assets}
    if room.get("heroObjectId") not in asset_ids:
        errors.append("heroObjectId must reference a declared asset")
    arrival = next((item for item in openings if item.get("id") == room.get("primaryArrivalId")), None)
    if not arrival:
        errors.append("primary arrival opening is missing")
    elif arrival.get("kind") != "door" or not arrival.get("traversable"):
        errors.append("primary arrival must be a traversable door")
    elif float(arrival.get("widthMeters", 0)) < 2.4:
        errors.append("primary arrival must be at least 2.4 meters wide")
    for opening in openings:
        if opening.get("wallId") not in ids:
            errors.append("opening references an unknown wall: " + str(opening.get("id")))
        if opening.get("traversable") and (not opening.get("collisionEnabled") or not opening.get("navigationEnabled")):
            errors.append("traversable opening collision/navigation mismatch: " + str(opening.get("id")))
    if manifest.get("pipeline", {}).get("paidServicesAllowed") is not False:
        errors.append("paid services must remain disabled")
    if not room.get("surfaces"):
        errors.append("room must define structural surfaces")
    return errors


def build_surfaces(manifest, materials):
    surfaces = {}
    for surface in manifest["room"]["surfaces"]:
        rotation = tuple(math.radians(float(v)) for v in surface["transform"]["rotationDegrees"])
        obj = box(
            "Shell_" + surface["id"],
            surface["transform"]["location"],
            surface["dimensionsMeters"],
            materials["floor"] if surface["kind"] == "floor" else materials["shell"],
            rotation,
        )
        surfaces[surface["id"]] = obj
    return surfaces


def apply_openings(manifest, surfaces):
    applied = []
    for opening in manifest.get("openings", []):
        wall = surfaces.get(opening["wallId"])
        if wall is None:
            raise RuntimeError("Opening wall is missing: " + opening["wallId"])
        surface = next(s for s in manifest["room"]["surfaces"] if s["id"] == opening["wallId"])
        wall_dims = surface["dimensionsMeters"]
        transform = surface["transform"]
        rotation = Euler(tuple(math.radians(float(v)) for v in transform["rotationDegrees"]), "XYZ")
        sill = float(opening.get("sillMeters", 0))
        local_center = Vector((0.0, 0.0, -float(wall_dims[2]) / 2 + sill + float(opening["heightMeters"]) / 2))
        world_center = Vector(transform["location"]) + rotation.to_matrix() @ local_center
        cutter = box(
            "CUT_" + opening["id"],
            world_center,
            (float(opening["widthMeters"]), max(float(wall_dims[1]) * 3.0, 2.0), float(opening["heightMeters"])),
            None,
            tuple(rotation),
        )
        modifier = wall.modifiers.new("Opening_" + opening["id"], "BOOLEAN")
        modifier.operation = "DIFFERENCE"
        modifier.solver = "EXACT"
        modifier.object = cutter
        bpy.ops.object.select_all(action='DESELECT')
        wall.select_set(True)
        bpy.context.view_layer.objects.active = wall
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.data.objects.remove(cutter, do_unlink=True)
        applied.append(opening["id"])
    return applied


def build_assets(manifest, materials):
    for asset in manifest.get("assets", []):
        loc = asset["transform"]["location"]
        dims = asset["dimensionsMeters"]
        rotation = tuple(math.radians(float(v)) for v in asset["transform"]["rotationDegrees"])
        role = str(asset.get("role", "")).lower()
        if "portal" in role or "ring" in role:
            bpy.ops.mesh.primitive_torus_add(
                major_radius=max(float(dims[0]), float(dims[2])) * 0.46,
                minor_radius=max(0.035, min(float(dims[0]), float(dims[2])) * 0.035),
                major_segments=64,
                minor_segments=12,
                location=loc,
                rotation=rotation,
            )
            obj = bpy.context.object
            obj.name = "Hero_" + asset["id"]
            obj.data.materials.append(materials["hero"])
        else:
            obj = box("Prop_" + asset["id"], loc, dims, materials["trim"], rotation, 0.04)
        obj["sina_asset_id"] = asset["id"]
        obj["sina_role"] = asset["role"]
        obj["sina_source"] = asset["source"]


def add_room_dressing(manifest, materials):
    bounds = manifest["room"]["boundsMeters"]
    width, depth, height = map(float, bounds)
    if width >= 20 and depth >= 16 and height >= 7:
        for x in (-8.5, -4.5, 4.5, 8.5):
            for y in (-5.5, 5.5):
                bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.42, depth=height, location=(x, y, height / 2))
                column = bpy.context.object
                column.name = "OpenColonnade_Column"
                column.data.materials.append(materials["trim"])
                box("Column_Base", (x, y, 0.22), (1.25, 1.25, 0.44), materials["shell"])
                box("Column_Capital", (x, y, height - 0.22), (1.25, 1.25, 0.44), materials["shell"])
        for y in (-6, -3, 0, 3, 6):
            box("Traversal_Inlay", (0, y, 0.015), (0.12, 1.8, 0.03), materials["glow"], bevel=0.01)
        for x in (-8.5, 8.5):
            for y in (-3, 0, 3):
                box("Side_Plinth", (x, y, 0.65), (1.8, 1.4, 1.3), materials["shell"], bevel=0.06)


def configure_scene(manifest):
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.resolution_percentage = 85
    scene.world.color = (0.025, 0.032, 0.05)
    scene["project"] = manifest["project"]["title"]
    scene["runtime_target"] = "Unreal Engine 5"
    scene["room_id"] = manifest["room"]["id"]
    scene["review_status"] = "blender_geometry_review_pending_owner_form_approval"

    bpy.ops.object.light_add(type="AREA", location=(0, 0, 8.2))
    key = bpy.context.object
    key.name = "SINA_KeyLight"
    key.data.energy = 3000
    key.data.shape = "DISK"
    key.data.size = 9
    point_at(key, (0, 0, 0))

    bpy.ops.object.light_add(type="AREA", location=(-9, -2, 6.5))
    fill = bpy.context.object
    fill.name = "SINA_FillLight"
    fill.data.energy = 1400
    fill.data.size = 6
    point_at(fill, (0, 0, 3))

    camera_spec = manifest["room"]["productionCamera"]
    bpy.ops.object.camera_add(location=camera_spec["location"])
    camera = bpy.context.object
    camera.name = "SINA_ProductionCamera"
    camera.data.lens = 32
    camera.data.angle = math.radians(float(camera_spec["verticalFovDegrees"]))
    point_at(camera, camera_spec["target"])
    scene.camera = camera
    return camera


def render_review_views(manifest, main_camera, render_path, review_dir):
    review_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    bounds = manifest["room"]["boundsMeters"]
    w, d, h = map(float, bounds)
    center = (0, 0, h * 0.42)
    views = [
        ("corner_ne", (w * 0.72, d * 0.72, h * 1.05), center),
        ("corner_nw", (-w * 0.72, d * 0.72, h * 1.05), center),
        ("corner_sw", (-w * 0.72, -d * 0.72, h * 1.05), center),
        ("corner_se", (w * 0.72, -d * 0.72, h * 1.05), center),
        ("ceiling_oblique_a", (0, -d * 0.25, h * 1.85), (0, 0, h * 0.7)),
        ("ceiling_oblique_b", (0, d * 0.25, h * 1.85), (0, 0, h * 0.7)),
    ]
    for name, location, target in views:
        main_camera.location = location
        point_at(main_camera, target)
        scene.render.filepath = str((review_dir / (name + ".png")).resolve())
        bpy.ops.render.render(write_still=True)

    # Primary production view is rendered last and is the review image shown in Studio.
    camera_spec = manifest["room"]["productionCamera"]
    main_camera.location = camera_spec["location"]
    point_at(main_camera, camera_spec["target"])
    scene.render.filepath = str(render_path.resolve())
    bpy.ops.render.render(write_still=True)
    return [str((review_dir / (name + ".png")).name) for name, _, _ in views] + [render_path.name]


def main():
    args = cli_args()
    manifest = json.loads(args.manifest_file.read_text(encoding="utf-8"))
    errors = validate_manifest(manifest)
    if errors:
        raise SystemExit("Manifest rejected: " + "; ".join(errors))

    clear_scene()
    materials = {
        "shell": material("M_ObsidianStone", (0.075, 0.09, 0.13), 0.18, 0.42),
        "floor": material("M_BasaltFloor", (0.16, 0.18, 0.22), 0.12, 0.72),
        "trim": material("M_BrushedBronze", (0.45, 0.25, 0.09), 0.72, 0.3),
        "hero": material("M_HeroPortal", (0.55, 0.31, 0.12), 0.72, 0.25),
        "glow": material("M_CyanEnergy", (0.02, 0.55, 0.8), 0.25, 0.24, 2.5),
    }
    surfaces = build_surfaces(manifest, materials)
    applied_openings = apply_openings(manifest, surfaces)
    build_assets(manifest, materials)
    add_room_dressing(manifest, materials)
    camera = configure_scene(manifest)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.glb.parent.mkdir(parents=True, exist_ok=True)
    args.render.parent.mkdir(parents=True, exist_ok=True)
    review_views = render_review_views(manifest, camera, args.render, args.review_dir)

    bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()))
    bpy.ops.object.select_all(action="DESELECT")
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for obj in mesh_objects:
        obj.select_set(True)
    if not mesh_objects:
        raise RuntimeError("No mesh geometry was created for GLB export.")
    bpy.context.view_layer.objects.active = mesh_objects[0]
    # A transform-applied combined room mesh imports consistently as one StaticMesh in UE5.
    if len(mesh_objects) > 1:
        bpy.ops.object.join()
    bpy.context.object.name = "SINA_GeneratedRoom"
    bpy.ops.export_scene.gltf(filepath=str(args.glb.resolve()), export_format="GLB", use_selection=True)

    report = {
        "schemaVersion": 1,
        "status": "passed",
        "engine": "unreal_engine_5",
        "roomId": manifest["room"]["id"],
        "appliedBooleanOpenings": applied_openings,
        "reviewViews": review_views,
        "checks": {
            "primaryArrivalWidthMeters": next(o["widthMeters"] for o in manifest["openings"] if o["id"] == manifest["room"]["primaryArrivalId"]),
            "traversableOpeningsHaveCollisionAndNavigation": all(
                not o["traversable"] or (o["collisionEnabled"] and o["navigationEnabled"])
                for o in manifest["openings"]
            ),
            "proceduralShellCreated": bool(surfaces),
            "paidServicesDisabled": manifest["pipeline"]["paidServicesAllowed"] is False,
        },
    }
    (args.output.parent / "audit_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"blend": str(args.output), "glb": str(args.glb), "render": str(args.render), "audit": report}))


if __name__ == "__main__":
    main()
