import { z } from 'zod';
import type { GameManifest } from './types';

export const PLAYABLE_GAME_SCHEMA_VERSION = 1 as const;
export const PHASER_ENGINE_VERSION = '4.2.1' as const;
export const PLAYABLE_MAP_COLUMNS = 20 as const;
export const PLAYABLE_MAP_ROWS = 15 as const;
export const PLAYABLE_TILE_SIZE = 32 as const;

const rowSchema = z.string().length(PLAYABLE_MAP_COLUMNS).regex(/^[#.PCEH]+$/);

export const playableGameDefinitionSchema = z
  .object({
    schemaVersion: z.literal(PLAYABLE_GAME_SCHEMA_VERSION),
    engine: z
      .object({
        id: z.literal('phaser'),
        version: z.literal(PHASER_ENGINE_VERSION),
      })
      .strict(),
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(4000),
    world: z
      .object({
        columns: z.literal(PLAYABLE_MAP_COLUMNS),
        rows: z.literal(PLAYABLE_MAP_ROWS),
        tileSize: z.literal(PLAYABLE_TILE_SIZE),
        seed: z.number().int().nonnegative(),
        layout: z.array(rowSchema).length(PLAYABLE_MAP_ROWS),
      })
      .strict(),
    rules: z
      .object({
        movementSpeed: z.number().int().min(80).max(300),
        startingLives: z.number().int().min(1).max(9),
        timeLimitSeconds: z.number().int().min(30).max(600),
        pointsPerCrystal: z.number().int().min(1).max(100),
        winCondition: z.literal('collect_all_crystals_then_reach_exit'),
        lossCondition: z.literal('no_lives_or_time_expires'),
      })
      .strict(),
  })
  .strict()
  .superRefine((definition, context): void => {
    const cells = definition.world.layout.map((row) => [...row]);
    const count = (cell: string): number =>
      cells.flat().filter((tile) => tile === cell).length;

    if (count('P') !== 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Map must have exactly one player start' });
    }
    if (count('E') !== 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Map must have exactly one exit' });
    }
    if (count('C') < 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Map must contain at least one crystal' });
    }
    if (count('H') < 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Map must contain at least one hazard' });
    }

    for (let column = 0; column < PLAYABLE_MAP_COLUMNS; column += 1) {
      if (cells[0][column] !== '#' || cells[PLAYABLE_MAP_ROWS - 1][column] !== '#') {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Map must have solid outer walls' });
        return;
      }
    }
    for (let row = 0; row < PLAYABLE_MAP_ROWS; row += 1) {
      if (cells[row][0] !== '#' || cells[row][PLAYABLE_MAP_COLUMNS - 1] !== '#') {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Map must have solid outer walls' });
        return;
      }
    }

    const startRow = cells.findIndex((row) => row.includes('P'));
    const startColumn = startRow >= 0 ? cells[startRow].indexOf('P') : -1;
    if (startRow < 0 || startColumn < 0) return;

    const reachable = findReachableCells(cells, startColumn, startRow);
    for (let row = 0; row < cells.length; row += 1) {
      for (let column = 0; column < cells[row].length; column += 1) {
        const tile = cells[row][column];
        if ((tile === 'C' || tile === 'E') && !reachable.has(cellKey(column, row))) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Map contains an unreachable ${tile === 'C' ? 'crystal' : 'exit'}`,
          });
        }
      }
    }
  });

export type PlayableGameDefinition = z.infer<typeof playableGameDefinitionSchema>;

function cellKey(column: number, row: number): string {
  return `${column},${row}`;
}

function findReachableCells(
  cells: string[][],
  startColumn: number,
  startRow: number,
): Set<string> {
  const reachable = new Set<string>([cellKey(startColumn, startRow)]);
  const pending: Array<[number, number]> = [[startColumn, startRow]];
  const directions: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (pending.length > 0) {
    const [column, row] = pending.shift()!;
    for (const [deltaColumn, deltaRow] of directions) {
      const nextColumn = column + deltaColumn;
      const nextRow = row + deltaRow;
      const key = cellKey(nextColumn, nextRow);
      if (
        cells[nextRow]?.[nextColumn] &&
        cells[nextRow][nextColumn] !== '#' &&
        !reachable.has(key)
      ) {
        reachable.add(key);
        pending.push([nextColumn, nextRow]);
      }
    }
  }

  return reachable;
}

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

/**
 * Build a deterministic, data-only collection game from the generated manifest.
 * No model-provided code is accepted or evaluated; every runtime rule is an
 * allow-listed value in the versioned schema above.
 */
export function createPlayableGameDefinition(
  manifest: Pick<GameManifest, 'title' | 'description' | 'genre' | 'scenes'>,
): PlayableGameDefinition {
  const seed = hashText(
    [manifest.title, manifest.description, manifest.genre, ...manifest.scenes.map((scene) => scene.name)].join('|'),
  );
  const random = seededRandom(seed);
  const cells: string[][] = Array.from({ length: PLAYABLE_MAP_ROWS }, (_, row) =>
    Array.from({ length: PLAYABLE_MAP_COLUMNS }, (_, column) =>
      row === 0 ||
      column === 0 ||
      row === PLAYABLE_MAP_ROWS - 1 ||
      column === PLAYABLE_MAP_COLUMNS - 1
        ? '#'
        : '.',
    ),
  );

  // Short interior obstacles make wall collision meaningful while leaving open
  // routes around each segment.
  const obstacleCells: Array<[number, number]> = [
    [4, 3], [4, 4], [4, 5], [4, 6],
    [8, 3], [9, 3], [10, 3],
    [13, 5], [13, 6], [13, 7],
    [7, 9], [8, 9], [9, 9],
    [16, 7], [16, 8], [16, 9],
  ];
  for (const [column, row] of obstacleCells) cells[row][column] = '#';

  const start: [number, number] = [1, 1];
  const exit: [number, number] = [PLAYABLE_MAP_COLUMNS - 2, PLAYABLE_MAP_ROWS - 2];
  const reachable = findReachableCells(cells, start[0], start[1]);
  const candidates: Array<[number, number]> = [];
  for (let row = 1; row < PLAYABLE_MAP_ROWS - 1; row += 1) {
    for (let column = 1; column < PLAYABLE_MAP_COLUMNS - 1; column += 1) {
      if (
        cells[row][column] === '.' &&
        reachable.has(cellKey(column, row)) &&
        !(column === start[0] && row === start[1]) &&
        !(column === exit[0] && row === exit[1])
      ) {
        candidates.push([column, row]);
      }
    }
  }

  cells[start[1]][start[0]] = 'P';
  cells[exit[1]][exit[0]] = 'E';
  const placements = shuffle(candidates, random);
  const crystalCount = 6;
  const hazardCount = 3;
  let placementIndex = 0;

  for (let index = 0; index < crystalCount; index += 1) {
    const [column, row] = placements[placementIndex++];
    cells[row][column] = 'C';
  }

  let hazardsPlaced = 0;
  for (; placementIndex < placements.length && hazardsPlaced < hazardCount; placementIndex += 1) {
    const [column, row] = placements[placementIndex];
    const distanceFromStart = Math.abs(column - start[0]) + Math.abs(row - start[1]);
    if (distanceFromStart < 5) continue;
    cells[row][column] = 'H';
    hazardsPlaced += 1;
  }

  if (hazardsPlaced !== hazardCount) {
    throw new Error('Could not generate enough reachable hazard positions');
  }

  return playableGameDefinitionSchema.parse({
    schemaVersion: PLAYABLE_GAME_SCHEMA_VERSION,
    engine: { id: 'phaser', version: PHASER_ENGINE_VERSION },
    title: manifest.title.trim(),
    description: manifest.description.trim(),
    world: {
      columns: PLAYABLE_MAP_COLUMNS,
      rows: PLAYABLE_MAP_ROWS,
      tileSize: PLAYABLE_TILE_SIZE,
      seed,
      layout: cells.map((row) => row.join('')),
    },
    rules: {
      movementSpeed: 160,
      startingLives: 3,
      timeLimitSeconds: 120,
      pointsPerCrystal: 10,
      winCondition: 'collect_all_crystals_then_reach_exit',
      lossCondition: 'no_lives_or_time_expires',
    },
  });
}
