"""Create a deterministic UE5 gameplay-room blockout in Blender.

Run:
  blender --background --python tools/ue5-room-worker/examples/build_demo_room.py -- --output /tmp/sina-ue5-demo.blend --glb /tmp/sina-ue5-demo.glb

This is a procedural blockout, not an AI-generated or runtime-verified game.
"""
from __future__ import annotations
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--glb", type=Path, required=True)
    return p.parse_args(argv)


def material(name, color, metallic=0.0, roughness=0.6, emission=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1.0)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission
    return m


def cube(name, location, dimensions, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("SoftEdges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        obj.modifiers.new("WeightedNormals", "WEIGHTED_NORMAL")
    return obj


def cylinder(name, location, radius, depth, mat, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("EdgeBevel", "BEVEL")
    bevel.width = 0.06
    bevel.segments = 2
    obj.modifiers.new("WeightedNormals", "WEIGHTED_NORMAL")
    return obj


def torus(name, location, major, minor, mat, rotation=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=64, minor_segments=12, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def main():
    a = args()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    stone = material("M_ObsidianStone", (0.075, 0.09, 0.13), 0.18, 0.42)
    trim = material("M_BrushedBronze", (0.45, 0.25, 0.09), 0.72, 0.3)
    floor = material("M_BasaltFloor", (0.16, 0.18, 0.22), 0.12, 0.72)
    glow = material("M_CyanEnergy", (0.02, 0.55, 0.8), 0.25, 0.24, 3.0)

    # 24 m x 18 m x 9 m room. North wall is split around a real 3.2 m arrival.
    cube("Shell_Floor", (0, 0, -0.25), (24, 18, 0.5), floor)
    cube("Shell_Ceiling", (0, 0, 9.25), (24, 18, 0.5), stone)
    cube("Shell_WestWall", (-11.75, 0, 4.5), (0.5, 18, 9), stone)
    cube("Shell_EastWall", (11.75, 0, 4.5), (0.5, 18, 9), stone)
    cube("Shell_SouthWall", (0, -8.75, 4.5), (24, 0.5, 9), stone)
    # North wall opening: 3.2 m wide x 4.2 m high, passage is actually open.
    cube("Shell_NorthLeft", (-6.8, 8.75, 4.5), (10.4, 0.5, 9), stone)
    cube("Shell_NorthRight", (6.8, 8.75, 4.5), (10.4, 0.5, 9), stone)
    cube("Shell_NorthLintel", (0, 8.75, 6.6), (3.2, 0.5, 4.8), stone)

    # Arrival frame and portal hero object, leaving the passage visibly open.
    for x in (-1.8, 1.8):
        cube("Arrival_Pilaster", (x, 8.25, 2.1), (0.42, 0.7, 4.2), trim, 0.08)
    cube("Arrival_Transom", (0, 8.25, 4.25), (4.2, 0.7, 0.35), trim, 0.06)
    torus("Hero_Portal_Ring", (0, 3.5, 4.1), 2.15, 0.16, trim)
    torus("Hero_Portal_InnerGlow", (0, 3.42, 4.1), 1.92, 0.055, glow)

    # Four structural columns with open bays; no wall infill between them.
    for x in (-8.5, -4.5, 4.5, 8.5):
        for y in (-5.5, 5.5):
            cylinder("OpenColonnade_Column", (x, y, 4.5), 0.42, 9.0, trim)
            cylinder("Column_Base", (x, y, 0.28), 0.72, 0.42, stone)
            cylinder("Column_Capital", (x, y, 8.65), 0.68, 0.42, stone)

    # Repeated floor guidance strips keep the central traversal lane readable.
    for y in (-6.0, -3.0, 0.0, 3.0, 6.0):
        cube("Traversal_Inlay", (0, y, 0.012), (0.12, 1.8, 0.025), glow, 0.02)

    # Side plinths are dressing only; the central 4 m gameplay lane stays clear.
    for x in (-8.5, 8.5):
        for y in (-3.0, 0.0, 3.0):
            cube("Side_Plinth", (x, y, 0.65), (1.8, 1.4, 1.3), stone, 0.08)
            cube("Plinth_Trim", (x, y, 1.33), (1.9, 1.5, 0.08), trim, 0.025)

    # Production camera and basic lighting for the first review render.
    bpy.ops.object.camera_add(location=(0, -21, 12))
    camera = bpy.context.object
    camera.name = "ProductionCamera"
    camera.data.lens = 30
    point_at(camera, (0, 1.0, 3.5))
    bpy.context.scene.camera = camera

    bpy.ops.object.light_add(type="AREA", location=(0, 0, 8.4))
    key = bpy.context.object
    key.name = "Key_AreaLight"
    key.data.energy = 4200
    key.data.shape = "DISK"
    key.data.size = 9
    point_at(key, (0, 0, 0))

    for x in (-9, 9):
        bpy.ops.object.light_add(type="AREA", location=(x, 0, 6.5))
        light = bpy.context.object
        light.name = "Side_AreaLight"
        light.data.energy = 1100
        light.data.size = 5
        point_at(light, (0, 0, 3))

    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.world.color = (0.035, 0.04, 0.055)
    scene["project"] = "SINA AI STUDIO"
    scene["runtime_target"] = "Unreal Engine 5"
    scene["room_id"] = "ue5-ancient-gateway-demo"
    scene["review_status"] = "blockout_only_not_runtime_approved"

    a.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(a.output.resolve()))
    a.glb.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(a.glb.resolve()), export_format="GLB", use_selection=True)
    print(f"BLEND={a.output.resolve()}")
    print(f"GLB={a.glb.resolve()}")


if __name__ == "__main__":
    main()
