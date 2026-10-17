/**
 * Game creation service.
 *
 * Turns a validated game spec into a game manifest by generating one image
 * asset per scene through the provider-agnostic router. It never fabricates
 * assets: if a provider fails, the error propagates so the job is marked
 * failed instead of reporting a fake success.
 */

import logger from '../utils/logger';
import { AppError, ValidationError } from '../types/errors';
import { JobType, ProviderCapability } from '../types';
import type { Router } from '../routing/Router';
import type { IProvider } from '../providers/interfaces/IProvider';
import type {
  GameAsset,
  GameManifest,
  GameManifestScene,
  GameSceneSpec,
  GameSpec,
} from './types';
import { renderSceneViewer, sceneViewerFilename } from './SceneViewerRenderer';

export type GameProgressReporter = (
  percentage: number,
  stage: string,
) => Promise<void> | void;

export const MAX_GAME_SCENES = 12;
export const MIN_GAME_SCENES = 1;

export interface GameBuildOptions {
  /** Routing context for the underlying asset generation. */
  jobType?: JobType;
}

/** A rendered, self-contained scene-viewer artifact. */
export interface GameBuildResult {
  manifest: GameManifest;
  html: string;
  filename: string;
  /** data: URL so the artifact needs no storage backend to be delivered. */
  dataUrl: string;
  size: number;
}

/**
 * True when the input is already a built manifest (assets plus per-scene image
 * URLs) rather than a spec that still needs asset generation.
 */
export function isGameManifest(value: unknown): value is GameManifest {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GameManifest>;
  if (!Array.isArray(candidate.scenes) || !Array.isArray(candidate.assets)) {
    return false;
  }
  return candidate.scenes.some(
    (scene) => !!scene && typeof scene.imageUrl === 'string' && !!scene.imageUrl,
  );
}

export class GameService {
  constructor(private readonly router: Router) {}

  /**
   * Validate a game spec and throw a descriptive ValidationError when invalid.
   */
  validateSpec(spec: GameSpec): void {
    if (!spec || typeof spec !== 'object') {
      throw new ValidationError('A game spec object is required');
    }
    if (!spec.title || !spec.title.trim()) {
      throw new ValidationError('Game title is required');
    }
    if (spec.title.length > 120) {
      throw new ValidationError('Game title must be 120 characters or fewer');
    }
    if (!spec.description || !spec.description.trim()) {
      throw new ValidationError('Game description is required');
    }
    if (!Array.isArray(spec.scenes) || spec.scenes.length < MIN_GAME_SCENES) {
      throw new ValidationError(
        `At least ${MIN_GAME_SCENES} scene is required`,
      );
    }
    if (spec.scenes.length > MAX_GAME_SCENES) {
      throw new ValidationError(
        `A game can have at most ${MAX_GAME_SCENES} scenes`,
      );
    }

    const seen = new Set<string>();
    spec.scenes.forEach((scene, index) => {
      const label = `Scene ${index + 1}`;
      if (!scene || typeof scene !== 'object') {
        throw new ValidationError(`${label} must be an object`);
      }
      if (!scene.name || !scene.name.trim()) {
        throw new ValidationError(`${label} needs a name`);
      }
      if (!scene.description || !scene.description.trim()) {
        throw new ValidationError(`${label} needs a description`);
      }
      const id = (scene.id || `scene-${index + 1}`).trim();
      if (seen.has(id)) {
        throw new ValidationError(`Duplicate scene id: ${id}`);
      }
      seen.add(id);
    });
  }

  private normalizeScenes(spec: GameSpec): Required<GameSceneSpec>[] {
    return spec.scenes.map((scene, index) => ({
      id: (scene.id || `scene-${index + 1}`).trim(),
      name: scene.name.trim(),
      description: scene.description.trim(),
      imagePrompt: (scene.imagePrompt || scene.description).trim(),
    }));
  }

  private buildPrompt(
    spec: GameSpec,
    scene: Required<GameSceneSpec>,
  ): string {
    const parts = [
      spec.artStyle ? `${spec.artStyle.trim()} game art` : 'game art',
      scene.imagePrompt,
      `scene "${scene.name}" from the ${spec.genre || 'adventure'} game "${spec.title}"`,
      'no text, no watermark',
    ];
    return parts.filter(Boolean).join(', ');
  }

  /**
   * Generate a game manifest (scene graph + one image asset per scene).
   */
  async createGame(
    spec: GameSpec,
    providers: IProvider[],
    report?: GameProgressReporter,
    options?: GameBuildOptions,
  ): Promise<GameManifest> {
    this.validateSpec(spec);

    if (!providers.length) {
      throw new AppError(
        'NO_PROVIDERS',
        'No AI providers are currently available',
        503,
      );
    }

    const decision = await this.router.route('image_generation', providers, {
      jobType: options?.jobType || JobType.GAME_CREATION,
      capabilities: [ProviderCapability.IMAGE_GENERATION],
    });

    const provider = providers.find((p) => p.name === decision.providerName);
    if (!provider) {
      throw new AppError(
        'PROVIDER_NOT_FOUND',
        `Provider "${decision.providerName}" is not available for game asset generation`,
        503,
      );
    }

    const scenes = this.normalizeScenes(spec);
    const assets: GameAsset[] = [];
    const manifestScenes: GameManifestScene[] = [];

    for (let index = 0; index < scenes.length; index += 1) {
      const scene = scenes[index];
      const percentage = Math.round(((index + 1) / scenes.length) * 80) + 10;

      if (report) {
        await report(percentage, `generating_scene_${scene.id}`);
      }

      const generated = await provider.generateImage({
        prompt: this.buildPrompt(spec, scene),
      });

      assets.push({
        sceneId: scene.id,
        url: generated.url,
        format: generated.format,
        provider: provider.name,
      });

      manifestScenes.push({
        id: scene.id,
        name: scene.name,
        description: scene.description,
        imageUrl: generated.url,
      });

      logger.info(
        `[GameService] Generated asset for scene ${scene.id} via ${provider.name}`,
      );
    }

    if (report) {
      await report(95, 'assembling_manifest');
    }

    return {
      version: '1.0',
      title: spec.title.trim(),
      description: spec.description.trim(),
      genre: (spec.genre || 'adventure').trim(),
      artStyle: (spec.artStyle || 'stylised').trim(),
      scenes: manifestScenes,
      assets,
      assetCount: assets.length,
      playable: false,
      engine: { type: 'scene-viewer', runtime: 'html5' },
      generatedAt: new Date().toISOString(),
      notes:
        'This manifest is a game definition (scene graph + generated assets), not a compiled engine build.',
    };
  }

  /**
   * Build a runnable scene-viewer artifact from either a game spec (assets are
   * generated first) or an already-built manifest (assets are reused, so a
   * build never regenerates images it already has).
   */
  async buildGame(
    input: GameSpec | GameManifest,
    providers: IProvider[],
    report?: GameProgressReporter,
  ): Promise<GameBuildResult> {
    let manifest: GameManifest;

    if (isGameManifest(input)) {
      if (report) await report(50, 'reusing_manifest');
      manifest = input;
    } else {
      manifest = await this.createGame(input as GameSpec, providers, report, {
        jobType: JobType.GAME_BUILD,
      });
    }

    if (report) await report(95, 'rendering_scene_viewer');

    const html = renderSceneViewer(manifest);
    const filename = sceneViewerFilename(manifest.title);
    const size = Buffer.byteLength(html, 'utf8');
    const dataUrl =
      'data:text/html;charset=utf-8;base64,' +
      Buffer.from(html, 'utf8').toString('base64');

    logger.info(
      `[GameService] Built scene viewer ${filename} (${size} bytes, ${manifest.scenes.length} scenes)`,
    );

    return { manifest, html, filename, dataUrl, size };
  }
}
