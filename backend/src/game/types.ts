/**
 * Game creation domain types.
 *
 * A "game" in AI Studio is a structured, provider-generated definition: a
 * scene graph plus the generated assets for each scene. It is deliberately
 * engine-agnostic so the same manifest can be rendered by the web app, the
 * mobile app, or an external runtime.
 */

export interface GameSceneSpec {
  id?: string;
  name: string;
  description: string;
  imagePrompt?: string;
}

export interface GameSpec {
  title: string;
  description: string;
  genre?: string;
  artStyle?: string;
  scenes: GameSceneSpec[];
}

export interface GameAsset {
  sceneId: string;
  url: string;
  format: string;
  provider: string;
}

export interface GameManifestScene {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface GameManifest {
  version: string;
  title: string;
  description: string;
  genre: string;
  artStyle: string;
  scenes: GameManifestScene[];
  assets: GameAsset[];
  assetCount: number;
  /** False: this manifest is a game definition, not a compiled engine build. */
  playable: boolean;
  engine: {
    type: string;
    runtime: string;
  };
  generatedAt: string;
  notes: string;
}

export const GAME_JOB_TYPES = ['game_creation', 'game_build'] as const;

export type GameJobType = (typeof GAME_JOB_TYPES)[number];

export function isGameJobType(type: string): type is GameJobType {
  return (GAME_JOB_TYPES as readonly string[]).includes(type);
}

/**
 * Capability a game job needs from a provider in order to run. Game jobs are
 * composite: the orchestrator fans out to this capability per step rather than
 * asking a single provider to "create a game".
 */
export function gameJobCapability(type: string): string {
  switch (type) {
    case 'game_creation':
      return 'image_generation';
    case 'game_build':
      return 'image_generation';
    default:
      return type;
  }
}
