import { game3DBuildInputSchema, ue5RoomManifestSchema } from '../src/game3d/types';
import { UnrealEngine5Adapter } from '../src/game3d/UnrealEngine5Adapter';

const validInput = {
  manifest: {
    schemaVersion: 1,
    project: {
      title: 'Citadel',
      description: 'A playable stone citadel room.',
      genre: 'adventure',
      targetPlatforms: ['windows'],
    },
    engine: { id: 'unreal_engine_5', majorVersion: 5 },
    room: {
      id: 'citadel-main',
      purpose: 'Exploration and combat arena.',
      boundsMeters: [24, 18, 8],
      heroObjectId: 'central-gate',
      playerSpawn: [0, 0, 0],
      productionCamera: { location: [0, -10, 5], target: [0, 0, 2], verticalFovDegrees: 75 },
      symmetry: { mode: 'bilateral', order: 2, exceptions: [] },
    },
    assets: [{
      id: 'central-gate',
      role: 'Main entrance hero object',
      dimensionsMeters: [4, 0.5, 5],
      attachment: 'freestanding',
      semanticFront: 'positive_y',
      reusable: false,
      source: 'procedural_blender',
      transform: { location: [0, 5, 0], rotationDegrees: [0, 0, 0], scale: [1, 1, 1] },
    }],
    openings: [{
      id: 'main-door',
      kind: 'door',
      wallId: 'north-wall',
      widthMeters: 3,
      heightMeters: 4,
      destination: 'main-hall',
      traversable: true,
      collisionEnabled: true,
      navigationEnabled: true,
    }],
    gameplay: {
      movement: 'third_person',
      collisionRequired: true,
      navigationRequired: true,
      respawnPoints: [[0, 0, 0]],
      interactions: [{ id: 'gate-open', action: 'open', targetId: 'central-gate' }],
    },
    pipeline: {
      roomAuthoring: 'blender',
      runtime: 'unreal_engine_5',
      meshGeneration: 'procedural_first',
      paidServicesAllowed: false,
      gates: { functionApproved: true, formApproved: true, runtimeApproved: false },
    },
  },
};

describe('UE5 room manifest contracts', () => {
  it('accepts a valid versioned UE5 room package', () => {
    expect(game3DBuildInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects traversable openings without matching collision and navigation', () => {
    const invalid = structuredClone(validInput);
    invalid.manifest.openings[0].navigationEnabled = false;
    expect(ue5RoomManifestSchema.safeParse(invalid.manifest).success).toBe(false);
  });

  it('rejects a hero object that is not declared in the asset manifest', () => {
    const invalid = structuredClone(validInput);
    invalid.manifest.room.heroObjectId = 'missing-prop';
    expect(ue5RoomManifestSchema.safeParse(invalid.manifest).success).toBe(false);
  });

  it('requires explicit Function and Form approvals before UE5 export', async () => {
    const invalid = structuredClone(validInput);
    invalid.manifest.pipeline.gates.formApproved = false;
    const adapter = new UnrealEngine5Adapter();
    await expect(adapter.build(invalid as any)).rejects.toThrow(/Function and Form/i);
  });

  it('does not allow paid asset-generation services in the room contract', () => {
    const invalid = structuredClone(validInput);
    invalid.manifest.pipeline.paidServicesAllowed = true;
    expect(ue5RoomManifestSchema.safeParse(invalid.manifest).success).toBe(false);
  });
});
