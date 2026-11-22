import { browserGameSceneManifestSchema } from '../src/game3d/browserSceneTypes';

const validManifest = {
  schemaVersion: 1,
  project: {
    id: 'browser-demo',
    title: 'SINA Browser Demo',
    genre: 'adventure',
    target: 'web_responsive',
  },
  runtime: {
    id: 'threejs_r3f',
    threeMajorVersion: 0,
    reactThreeFiberMajorVersion: 8,
  },
  world: {
    units: 'meters',
    coordinateSystem: 'right_handed_y_up',
    bounds: [30, 12, 30],
  },
  camera: {
    mode: 'perspective',
    position: [0, 5, 10],
    target: [0, 0, 0],
  },
  assets: [{
    id: 'hero-model',
    uri: 'project-assets/hero.glb',
    format: 'glb',
    license: {
      spdx: 'CC-BY-4.0',
      commercialUse: 'allowed',
      attribution: 'Example author',
    },
  }],
  entities: [{
    id: 'hero',
    kind: 'character',
    assetId: 'hero-model',
    transform: {
      position: [0, 0, 0],
      rotationDegrees: [0, 0, 0],
      scale: [1, 1, 1],
    },
    collision: 'dynamic',
  }],
  lights: [],
  input: {
    desktop: [{ action: 'move_forward', keys: ['w', 'ArrowUp'] }],
    touchControls: 'virtual_joystick',
  },
  gameplay: {
    maxPlayers: 1,
    objectives: [{ id: 'reach-exit', event: 'reach', count: 1 }],
    interactions: [{ id: 'inspect-hero', entityId: 'hero', action: 'inspect' }],
  },
};

describe('browserGameSceneManifestSchema', () => {
  it('accepts a valid, data-only R3F scene manifest', () => {
    expect(browserGameSceneManifestSchema.safeParse(validManifest).success).toBe(true);
  });

  it('rejects undeclared asset references', () => {
    const input = structuredClone(validManifest);
    input.entities[0].assetId = 'missing-model';
    expect(browserGameSceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('rejects interactions targeting undeclared entities', () => {
    const input = structuredClone(validManifest);
    input.gameplay.interactions[0].entityId = 'missing-entity';
    expect(browserGameSceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('rejects executable or unknown fields instead of accepting arbitrary code', () => {
    const input = { ...validManifest, script: 'alert(1)' };
    expect(browserGameSceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('rejects duplicate entity identifiers', () => {
    const input = structuredClone(validManifest);
    input.entities.push({ ...input.entities[0] });
    expect(browserGameSceneManifestSchema.safeParse(input).success).toBe(false);
  });
});
