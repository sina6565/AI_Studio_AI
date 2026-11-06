# Game Scene Creation

SINA AI STUDIO currently supports creation of game concepts as scene manifests
and generated visual assets. It also supports a standalone HTML scene viewer.
This workflow is an asset and scene-preview pipeline, not a playable game
runtime.

## Workflow

1. In Studio, enter an original game title, description, genre, art style, and
   one or more scene descriptions.
2. Submit the game creation job and optionally attach it to a project.
3. The configured image-generation provider creates the scene artwork.
4. Open the completed job to inspect the scene manifest, preview individual
   scenes, or download the standalone HTML scene viewer.

## API shape

The authenticated `POST /api/v1/jobs` endpoint accepts a game-creation spec:

```json
{
  "type": "game_creation",
  "projectId": "507f1f77bcf86cd799439011",
  "input": {
    "title": "Original Project",
    "description": "A short description of the original game concept.",
    "genre": "adventure",
    "artStyle": "stylised",
    "scenes": [
      { "name": "Opening Scene", "description": "Describe the original setting." }
    ]
  }
}
```

The optional `projectId` is checked against the authenticated user's project.
The job result stores the scene manifest and links to its generated assets.

A `game_build` job can reuse a previously generated scene manifest without
calling an image provider again. It produces only the neutral HTML scene viewer.
It does not add gameplay rules, scoring, collectibles, hazards, win/loss logic,
or a playable Phaser runtime.

## Native 3D room creation

For parametric Unreal Engine 5 room authoring, use the protected **3D Game Lab** at `/studio/3d`. Its separate `game_3d_preview` and `game_3d_build` jobs use Blender and the self-hosted UE5 worker. See [3D_GAME_ROOM_PIPELINE.md](./3D_GAME_ROOM_PIPELINE.md). This is separate from scene-image generation and the HTML scene viewer described above.

## Product boundary

The commercial SINA AI STUDIO codebase must contain only original game concepts,
mechanics, names, art direction, and implementation. Do not add third-party
gameplay, assets, names, or documentation unless their commercial-use rights
have been verified and approved.

## Current limits

The scene viewer is a visual preview and is not a playable game. Generic
playable-game authoring, user-defined mechanics, a full 3D runtime, multiplayer,
and packaged native engine exports are not implemented by this workflow.
