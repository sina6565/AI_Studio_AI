extends Node3D

## Minimal Godot 4 runtime bootstrap for generated SINA room scenes.
## Geometry comes from validated numeric data; model-produced scripts are never executed.

@export var room_width: float = 20.0
@export var room_depth: float = 20.0
@export var room_height: float = 6.0

func _ready() -> void:
	_build_room()
	_spawn_player()

func _build_room() -> void:
	_add_static_box("Floor", Vector3(room_width, 0.2, room_depth), Vector3(0.0, -0.1, 0.0))
	_add_static_box("Ceiling", Vector3(room_width, 0.2, room_depth), Vector3(0.0, room_height, 0.0))
	_add_static_box("NorthWall", Vector3(room_width, room_height, 0.2), Vector3(0.0, room_height / 2.0, -room_depth / 2.0))
	_add_static_box("SouthWall", Vector3(room_width, room_height, 0.2), Vector3(0.0, room_height / 2.0, room_depth / 2.0))
	_add_static_box("EastWall", Vector3(0.2, room_height, room_depth), Vector3(room_width / 2.0, room_height / 2.0, 0.0))
	_add_static_box("WestWall", Vector3(0.2, room_height, room_depth), Vector3(-room_width / 2.0, room_height / 2.0, 0.0))

func _add_static_box(node_name: String, size: Vector3, position: Vector3) -> void:
	var body := StaticBody3D.new()
	body.name = node_name
	body.position = position
	var mesh_instance := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_instance.mesh = mesh
	body.add_child(mesh_instance)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	add_child(body)

func _spawn_player() -> void:
	var player := CharacterBody3D.new()
	player.name = "Player"
	player.position = Vector3(0.0, 1.0, 0.0)
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.35
	capsule.height = 1.8
	collision.shape = capsule
	player.add_child(collision)
	var camera := Camera3D.new()
	camera.position = Vector3(0.0, 0.65, 3.0)
	camera.current = true
	player.add_child(camera)
	add_child(player)
