# Game Creation

SINA AI STUDIO has three distinct game workflows. Keep their outputs and readiness claims separate.

## 1. Scene concept and asset generation

The authenticated `game_creation` job validates a game concept, routes scene-art requests through the existing provider abstraction, and stores a versioned scene manifest with generated image assets.

The workflow accepts an original title, description, genre, art style and one or more scene descriptions. It does not fabricate assets: provider errors are surfaced as job failures.

## 2. Browser-playable 2D game

The authenticated `game_build` workflow can create a deterministic, schema-validated Phaser 4.2.1 game definition from a game spec or reuse an existing scene manifest. The current playable definition includes:
- A 20 × 15 tile map with validated outer walls and reachable objectives.
- Player start, exit, collectibles and hazards.
- Allow-listed movement, score, lives, timer, win and loss rules.
- A browser runtime rendered by `PhaserPlayableGameCanvas`.

After a completed `game_build` job, the protected route `/play/:jobId` loads `result.metadata.playableGame` and starts the Phaser runtime. The job also returns a standalone HTML scene viewer; that viewer is a visual scene presentation and should not be confused with the Phaser playable route.

Relevant implementation:
- `backend/src/game/GameService.ts`
- `backend/src/game/PlayableGameDefinition.ts`
- `frontend/src/games/playableGame.ts`
- `frontend/src/components/games/PhaserPlayableGameCanvas.tsx`
- `frontend/src/pages/PlayableGamePage.tsx`

The current 2D game is a deterministic collection-game prototype, not yet a general-purpose authoring system for arbitrary mechanics, multiplayer or native packaged games. User-editable mechanics, level editor, broader genre templates and mobile touch-control acceptance remain follow-up work.

## 3. Native 3D room authoring and UE5 project export

For parametric Unreal Engine 5 room authoring, use the protected **3D Game Lab** at `/studio/3d`. Its separate `game_3d_preview` and `game_3d_build` jobs use Blender and the self-hosted UE5 worker. See [3D_GAME_ROOM_PIPELINE.md](./3D_GAME_ROOM_PIPELINE.md).

This workflow creates a procedural room and UE5 source-project package behind explicit Function/Form approval gates. A room render or project ZIP is not proof of a fully playable 3D game. Actual Blender/UE5 worker execution, character/controller validation, collision/navigation, gameplay interactions, runtime playtesting, packaged executables and mobile builds must be verified on a real configured worker before production-readiness claims.

## Product and licensing boundary

The commercial SINA AI STUDIO codebase must contain original game concepts, mechanics, names, art direction and implementation. Third-party gameplay, models, weights, datasets, textures and documentation require independent commercial-use rights review. Source-code license and model-weight license are separate checks.

The UE5 room pipeline is free-only by default. Do not invoke paid asset generation, hosted GPU services or subscriptions without separate explicit owner approval.
