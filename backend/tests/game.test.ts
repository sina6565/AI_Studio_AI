/**
 * Game creation service tests.
 *
 * The provider is faked so the pipeline can be verified without credentials.
 */

import { GameService } from '../src/game/GameService';
import { Router } from '../src/routing/Router';
import { gameJobCapability, isGameJobType } from '../src/game/types';
import type { GameSpec } from '../src/game/types';
import type { IProvider } from '../src/providers/interfaces/IProvider';

function makeProvider(
  generateImage: jest.Mock = jest.fn(async (_params: any) => ({
    id: 'asset-1',
    url: 'https://cdn.test/asset-1.png',
    format: 'png',
    size: 128,
  })),
): IProvider {
  return {
    name: 'fake-image',
    capabilities: ['image_generation'],
    initialize: jest.fn(async () => undefined),
    generateImage,
    generateVideo: jest.fn(),
    generateAudio: jest.fn(),
    synthesizeSpeech: jest.fn(),
    healthCheck: jest.fn(async () => true),
    getRateLimit: jest.fn(async () => ({ remaining: 10, resetTime: 0, limit: 10 })),
    validateInput: jest.fn(async () => ({ valid: true })),
    validateCredentials: jest.fn(async () => true),
  } as unknown as IProvider;
}

const validSpec: GameSpec = {
  title: 'Dungeon of Echoes',
  description: 'A short dungeon-crawling adventure.',
  genre: 'dungeon crawler',
  artStyle: 'pixel art',
  scenes: [
    { name: 'Entrance', description: 'A mossy stone doorway.' },
    { name: 'Hall', description: 'A long hall lit by torches.' },
  ],
};

describe('game job type helpers', () => {
  it('recognises game job types', () => {
    expect(isGameJobType('game_creation')).toBe(true);
    expect(isGameJobType('game_build')).toBe(true);
    expect(isGameJobType('image_generation')).toBe(false);
  });

  it('maps a game job type to the capability the pipeline needs', () => {
    expect(gameJobCapability('game_creation')).toBe('image_generation');
    expect(gameJobCapability('game_build')).toBe('image_generation');
    expect(gameJobCapability('image_generation')).toBe('image_generation');
  });
});

describe('GameService.validateSpec', () => {
  const service = new GameService(new Router());

  it('accepts a well formed spec', () => {
    expect(() => service.validateSpec(validSpec)).not.toThrow();
  });

  it('requires a title', () => {
    expect(() => service.validateSpec({ ...validSpec, title: '' })).toThrow(
      /title/i,
    );
  });

  it('requires a description', () => {
    expect(() =>
      service.validateSpec({ ...validSpec, description: '   ' }),
    ).toThrow(/description/i);
  });

  it('requires at least one scene', () => {
    expect(() => service.validateSpec({ ...validSpec, scenes: [] })).toThrow(
      /scene/i,
    );
  });

  it('rejects more scenes than the limit', () => {
    const scenes = Array.from({ length: 13 }, (_, i) => ({
      name: `Scene ${i}`,
      description: 'x',
    }));
    expect(() => service.validateSpec({ ...validSpec, scenes })).toThrow(
      /at most/i,
    );
  });

  it('rejects a scene without a name', () => {
    const scenes = [{ name: '', description: 'x' }];
    expect(() => service.validateSpec({ ...validSpec, scenes })).toThrow(
      /name/i,
    );
  });

  it('rejects duplicate scene ids', () => {
    const scenes = [
      { id: 'a', name: 'A', description: 'x' },
      { id: 'a', name: 'B', description: 'y' },
    ];
    expect(() => service.validateSpec({ ...validSpec, scenes })).toThrow(
      /duplicate/i,
    );
  });
});

describe('GameService.createGame', () => {
  it('generates one asset per scene and returns a manifest', async () => {
    const generateImage = jest.fn(async (_params: any) => ({
      id: 'asset-1',
      url: 'https://cdn.test/asset-1.png',
      format: 'png',
      size: 128,
    }));
    const provider = makeProvider(generateImage);
    const service = new GameService(new Router());
    const stages: string[] = [];

    const manifest = await service.createGame(validSpec, [provider], (_p, stage) => {
      stages.push(stage);
    });

    expect(generateImage).toHaveBeenCalledTimes(2);
    expect(manifest.assets).toHaveLength(2);
    expect(manifest.scenes).toHaveLength(2);
    expect(manifest.assetCount).toBe(2);
    expect(manifest.playable).toBe(false);
    expect(manifest.title).toBe('Dungeon of Echoes');
    expect(manifest.scenes[0].imageUrl).toBe('https://cdn.test/asset-1.png');
    expect(stages).toContain('assembling_manifest');
  });

  it('includes the art style and scene name in the image prompt', async () => {
    const generateImage = jest.fn(async (_params: any) => ({
      id: 'a',
      url: 'https://cdn.test/a.png',
      format: 'png',
      size: 1,
    }));
    const service = new GameService(new Router());

    await service.createGame(
      { ...validSpec, scenes: [validSpec.scenes[0]] },
      [makeProvider(generateImage)],
    );

    const prompt = String(generateImage.mock.calls[0][0].prompt);
    expect(prompt).toContain('pixel art');
    expect(prompt).toContain('Entrance');
    expect(prompt).toContain('Dungeon of Echoes');
  });

  it('propagates provider failures instead of reporting success', async () => {
    const generateImage = jest.fn(async () => {
      throw new Error('provider exploded');
    });
    const service = new GameService(new Router());

    await expect(
      service.createGame(validSpec, [makeProvider(generateImage)]),
    ).rejects.toThrow('provider exploded');
  });

  it('fails clearly when no providers are available', async () => {
    const service = new GameService(new Router());
    await expect(service.createGame(validSpec, [])).rejects.toThrow(
      /no ai providers/i,
    );
  });

  it('rejects an invalid spec before calling any provider', async () => {
    const generateImage = jest.fn();
    const service = new GameService(new Router());

    await expect(
      service.createGame({ ...validSpec, scenes: [] }, [makeProvider(generateImage)]),
    ).rejects.toThrow(/scene/i);
    expect(generateImage).not.toHaveBeenCalled();
  });
});
