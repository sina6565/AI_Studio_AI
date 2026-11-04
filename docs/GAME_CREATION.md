# Experimental 2D Game Creation

The current game workflow builds an experimental, data-driven 2D browser game on
the existing React/Vite, Express/TypeScript, MongoDB, Redis/Bull, and provider
stack. It does not generate arbitrary JavaScript, a full 3D game, or a native
engine project.

## Workflow

1. In Studio, enter a title and describe the game idea in natural language (world, player, goal, obstacles, and mood).
2. Choose **Build playable 2D game**. For a quick start, the description is used as the first scene prompt; manual scene breakdown is optional under **Customize scenes**. Optionally attach the job to an existing project.
3. For multi-scene concepts, open **Customize scenes**, add up to 12 named scenes, and provide a focused description for each.
4. The existing image-generation provider creates scene art. The backend
   deterministically creates and validates a versioned data-only gameplay
   definition from the resulting manifest.
5. Open the completed job from Jobs or its linked project and select **Play 2D
   game**. **Preview scene viewer** remains a safe, non-executable art preview.

## Gameplay definition

`result.metadata.playableGame` has schema version `1`, engine target Phaser
`4.2.1`, and a fixed 20 × 15 grid of 32-pixel tiles. Tiles are limited to walls,
floor, one player start, crystals, hazards, and one exit. The server validates
map dimensions, tile characters, route reachability, supported rules, and
engine/schema versions before persisting the job result. The browser validates
again before starting the game.

The runtime provides arrow-key/WASD movement, wall collision, crystal collection
and scoring, hazard/lives collision, a time limit, restart, a win state (collect
every crystal then touch the exit), and loss states (zero lives or timeout).
No model-generated code is interpreted.

## API shape

The existing authenticated `POST /api/v1/jobs` endpoint accepts a game spec:

```json
{
  "type": "game_build",
  "projectId": "507f1f77bcf86cd799439011",
  "input": {
    "title": "Crystal Run",
    "description": "Collect crystals and find the exit.",
    "genre": "adventure",
    "artStyle": "pixel art",
    "scenes": [
      { "name": "Ruins", "description": "A broken stone courtyard." }
    ]
  }
}
```

`projectId` is optional and is checked against the authenticated user's project.
The existing project `jobs` list and job metadata retain the association. The
`game_build` result includes both:

- `result.metadata.playableGame`: validated Phaser-oriented game data for the
  in-app runtime.
- `result.metadata.artifact`: metadata for the backward-compatible downloadable
  HTML scene viewer. That HTML remains a viewer, not a playable build.

A `game_build` request may also use an earlier generated manifest as `input`; it
reuses manifest image URLs rather than generating them again. Job creation still
uses the existing provider-routing requirements.

## Deliberate limits

This MVP uses a fixed collection-game ruleset and a generated tile layout. It
supports no arbitrary scripts, user-authored rule graphs, multiplayer, physics
beyond the tile-map collision model, full 3D runtime, or packaged standalone
Phaser export. The scene-viewer download and safe React scene preview remain
available as fallbacks.
