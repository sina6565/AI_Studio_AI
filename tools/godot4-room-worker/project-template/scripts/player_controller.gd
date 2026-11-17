extends CharacterBody3D

@export var move_speed: float = 5.0
@export var jump_velocity: float = 4.5

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= float(ProjectSettings.get_setting("physics/3d/default_gravity")) * delta
	elif Input.is_action_just_pressed("ui_accept"):
		velocity.y = jump_velocity

	var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var direction := Vector3(input_dir.x, 0.0, input_dir.y)
	if direction.length_squared() > 1.0:
		direction = direction.normalized()
	velocity.x = direction.x * move_speed
	velocity.z = direction.z * move_speed
	move_and_slide()
