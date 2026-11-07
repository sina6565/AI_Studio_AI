import { describe, expect, it } from 'vitest';
import {
  GameSession,
  PLAYABLE_GAME_SCHEMA_VERSION,
  PHASER_ENGINE_VERSION,
  PLAYABLE_MAP_COLUMNS,
  PLAYABLE_MAP_ROWS,
  PLAYABLE_TILE_SIZE,
  PlayableGameDefinition,
  parsePlayableGameDefinition,
} from './playableGame';

function buildDefinition(options: {
  start?: [number, number];
  crystals?: Array<[number, number]>;
  hazards?: Array<[number, number]>;
  exit?: [number, number];
  walls?: Array<[number, number]>;
  timeLimitSeconds?: number;
} = {}): PlayableGameDefinition {
  const layout: string[][] = Array.from({ length: PLAYABLE_MAP_ROWS }, (_, row) =>
    Array.from({ length: PLAYABLE_MAP_COLUMNS }, (_, column) =>
      row === 0 ||
      column === 0 ||
      row === PLAYABLE_MAP_ROWS - 1 ||
      column === PLAYABLE_MAP_COLUMNS - 1
        ? '#'
        : '.',
    ),
  );
  for (const [column, row] of options.walls || []) layout[row][column] = '#';
  const [startColumn, startRow] = options.start || [1, 1];
  const [exitColumn, exitRow] = options.exit || [3, 1];
  layout[startRow][startColumn] = 'P';
  layout[exitRow][exitColumn] = 'E';
  for (const [column, row] of options.crystals || [[2, 1]]) layout[row][column] = 'C';
  for (const [column, row] of options.hazards || [[10, 10]]) layout[row][column] = 'H';

  return {
    schemaVersion: PLAYABLE_GAME_SCHEMA_VERSION,
    engine: { id: 'phaser', version: PHASER_ENGINE_VERSION },
    title: 'Crystal Run',
    description: 'Collect crystals and find the exit.',
    world: {
      columns: PLAYABLE_MAP_COLUMNS,
      rows: PLAYABLE_MAP_ROWS,
      tileSize: PLAYABLE_TILE_SIZE,
      seed: 12345,
      layout: layout.map((row) => row.join('')),
    },
    rules: {
      movementSpeed: 160,
      startingLives: 3,
      timeLimitSeconds: options.timeLimitSeconds || 120,
      pointsPerCrystal: 10,
      winCondition: 'collect_all_crystals_then_reach_exit',
      lossCondition: 'no_lives_or_time_expires',
    },
  };
}

const idle = { left: false, right: false, up: false, down: false };
const right = { ...idle, right: true };

describe('versioned playable game definition', () => {
  it('accepts valid data and rejects unsupported versions or executable fields', () => {
    const definition = buildDefinition();
    expect(parsePlayableGameDefinition(definition)).toEqual(definition);
    expect(parsePlayableGameDefinition({ ...definition, schemaVersion: 99 })).toBeNull();
    expect(parsePlayableGameDefinition({ ...definition, script: 'window.alert(1)' })).toBeNull();
  });
});

describe('GameSession gameplay', () => {
  it('moves, collects crystals for points, and wins by reaching the exit', () => {
    const session = new GameSession(buildDefinition());

    session.update(right, 100);
    const afterFirstStep = session.update(right, 100);
    expect(afterFirstStep.x).toBeGreaterThan(48);
    expect(afterFirstStep.collectedCrystals).toBe(1);
    expect(afterFirstStep.score).toBe(10);

    session.update(right, 100);
    const victory = session.update(right, 100);
    expect(victory.status).toBe('won');
    expect(victory.endReason).toBe('exit');
    expect(victory.score).toBe(10);
  });

  it('collides with walls instead of moving through them', () => {
    const session = new GameSession(
      buildDefinition({ walls: [[3, 1]], crystals: [[4, 1]], exit: [5, 1] }),
    );

    for (let frame = 0; frame < 20; frame += 1) session.update(right, 100);
    expect(session.snapshot().x).toBeLessThan(3 * PLAYABLE_TILE_SIZE);
    expect(session.snapshot().x).toBeGreaterThan(48);
  });

  it('loses lives on hazard contact and ends when lives or time run out', () => {
    const hazardSession = new GameSession(
      buildDefinition({ hazards: [[2, 1]], crystals: [[4, 1]], exit: [5, 1] }),
    );
    hazardSession.update(right, 100);
    const hit = hazardSession.update(right, 100);
    expect(hit.lives).toBe(2);
    expect(hit.status).toBe('playing');
    hazardSession.update(idle, 1100);
    const lastLife = hazardSession.update(idle, 1100);
    expect(lastLife.lives).toBe(0);
    expect(lastLife.status).toBe('lost');
    expect(lastLife.endReason).toBe('lives');

    const timedSession = new GameSession(buildDefinition({ timeLimitSeconds: 30 }));
    const timeout = timedSession.update(idle, 30_000);
    expect(timeout.status).toBe('lost');
    expect(timeout.endReason).toBe('timeout');
  });
});
