import {
  createPlayableGameDefinition,
  playableGameDefinitionSchema,
} from '../src/game/PlayableGameDefinition';

const manifest = {
  title: 'Crystal Run',
  description: 'Gather the crystals and escape the ruins.',
  genre: 'adventure',
  scenes: [
    { id: 'scene-1', name: 'Ruins', description: 'A broken stone courtyard.' },
    { id: 'scene-2', name: 'Exit', description: 'A mossy archway.' },
  ],
};

describe('playable game definition generation', () => {
  it('generates deterministic, validated, versioned data-only game rules', () => {
    const first = createPlayableGameDefinition(manifest);
    const second = createPlayableGameDefinition(manifest);

    expect(first).toEqual(second);
    expect(first.schemaVersion).toBe(1);
    expect(first.engine).toEqual({ id: 'phaser', version: '4.2.1' });
    expect(playableGameDefinitionSchema.safeParse(first).success).toBe(true);
    expect(first.world.layout).toHaveLength(15);
    expect(first.world.layout.every((row) => row.length === 20)).toBe(true);
    expect(first.world.layout.join('')).toContain('C');
    expect(first.world.layout.join('')).toContain('H');
  });

  it('rejects unrecognized executable fields and unsupported definition versions', () => {
    const definition = createPlayableGameDefinition(manifest);
    expect(
      playableGameDefinitionSchema.safeParse({ ...definition, script: 'globalThis.alert(1)' }).success,
    ).toBe(false);
    expect(
      playableGameDefinitionSchema.safeParse({ ...definition, schemaVersion: 2 }).success,
    ).toBe(false);
  });

  it('rejects maps with unreachable objectives', () => {
    const definition = createPlayableGameDefinition(manifest);
    const layout = definition.world.layout.map((row) => [...row]);
    const exitRow = layout.findIndex((row) => row.includes('E'));
    const exitColumn = layout[exitRow].indexOf('E');
    layout[exitRow][exitColumn - 1] = '#';
    layout[exitRow - 1][exitColumn] = '#';
    const isolatedExit = {
      ...definition,
      world: { ...definition.world, layout: layout.map((row) => row.join('')) },
    };

    expect(playableGameDefinitionSchema.safeParse(isolatedExit).success).toBe(false);
  });
});
