export const PLAYABLE_GAME_SCHEMA_VERSION = 1 as const;
export const PHASER_ENGINE_VERSION = '4.2.1' as const;
export const PLAYABLE_MAP_COLUMNS = 20 as const;
export const PLAYABLE_MAP_ROWS = 15 as const;
export const PLAYABLE_TILE_SIZE = 32 as const;

export type Tile = '#' | '.' | 'P' | 'C' | 'H' | 'E';
export type GameStatus = 'playing' | 'won' | 'lost';
export type GameEndReason = 'exit' | 'lives' | 'timeout';

export interface PlayableGameDefinition {
  schemaVersion: typeof PLAYABLE_GAME_SCHEMA_VERSION;
  engine: { id: 'phaser'; version: typeof PHASER_ENGINE_VERSION };
  title: string;
  description: string;
  world: {
    columns: typeof PLAYABLE_MAP_COLUMNS;
    rows: typeof PLAYABLE_MAP_ROWS;
    tileSize: typeof PLAYABLE_TILE_SIZE;
    seed: number;
    layout: string[];
  };
  rules: {
    movementSpeed: number;
    startingLives: number;
    timeLimitSeconds: number;
    pointsPerCrystal: number;
    winCondition: 'collect_all_crystals_then_reach_exit';
    lossCondition: 'no_lives_or_time_expires';
  };
}

export interface GameInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface GameSnapshot {
  x: number;
  y: number;
  score: number;
  collectedCrystals: number;
  totalCrystals: number;
  lives: number;
  secondsRemaining: number;
  status: GameStatus;
  endReason?: GameEndReason;
  invulnerable: boolean;
}

interface GridPoint {
  column: number;
  row: number;
}

const ALLOWED_TILES = new Set<Tile>(['#', '.', 'P', 'C', 'H', 'E']);
const DIRECTIONS: ReadonlyArray<GridPoint> = [
  { column: 1, row: 0 },
  { column: -1, row: 0 },
  { column: 0, row: 1 },
  { column: 0, row: -1 },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isValidLayout(layout: unknown): layout is string[] {
  if (
    !Array.isArray(layout) ||
    layout.length !== PLAYABLE_MAP_ROWS ||
    !layout.every(
      (row) =>
        typeof row === 'string' &&
        row.length === PLAYABLE_MAP_COLUMNS &&
        [...row].every((tile) => ALLOWED_TILES.has(tile as Tile)),
    )
  ) {
    return false;
  }

  const cells = layout.map((row) => [...row]);
  for (let column = 0; column < PLAYABLE_MAP_COLUMNS; column += 1) {
    if (cells[0][column] !== '#' || cells[PLAYABLE_MAP_ROWS - 1][column] !== '#') return false;
  }
  for (let row = 0; row < PLAYABLE_MAP_ROWS; row += 1) {
    if (cells[row][0] !== '#' || cells[row][PLAYABLE_MAP_COLUMNS - 1] !== '#') return false;
  }

  const flat = cells.flat();
  if (
    flat.filter((tile) => tile === 'P').length !== 1 ||
    flat.filter((tile) => tile === 'E').length !== 1 ||
    !flat.includes('C') ||
    !flat.includes('H')
  ) {
    return false;
  }

  const startRow = cells.findIndex((row) => row.includes('P'));
  const startColumn = cells[startRow].indexOf('P');
  const reachable = new Set<string>([`${startColumn},${startRow}`]);
  const pending: GridPoint[] = [{ column: startColumn, row: startRow }];
  while (pending.length > 0) {
    const current = pending.shift()!;
    for (const direction of DIRECTIONS) {
      const column = current.column + direction.column;
      const row = current.row + direction.row;
      const key = `${column},${row}`;
      if (
        cells[row]?.[column] &&
        cells[row][column] !== '#' &&
        !reachable.has(key)
      ) {
        reachable.add(key);
        pending.push({ column, row });
      }
    }
  }

  return cells.every((row, y) =>
    row.every((tile, x) =>
      tile !== 'C' && tile !== 'E' ? true : reachable.has(`${x},${y}`),
    ),
  );
}

/** Runtime validation is repeated in the browser; never interpret arbitrary JS. */
export function parsePlayableGameDefinition(value: unknown): PlayableGameDefinition | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['schemaVersion', 'engine', 'title', 'description', 'world', 'rules']) ||
    value.schemaVersion !== PLAYABLE_GAME_SCHEMA_VERSION
  ) return null;
  if (
    !isRecord(value.engine) ||
    !hasOnlyKeys(value.engine, ['id', 'version']) ||
    value.engine.id !== 'phaser' ||
    value.engine.version !== PHASER_ENGINE_VERSION
  ) return null;
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 120) return null;
  if (typeof value.description !== 'string' || !value.description.trim() || value.description.length > 4000) return null;
  if (
    !isRecord(value.world) ||
    !hasOnlyKeys(value.world, ['columns', 'rows', 'tileSize', 'seed', 'layout']) ||
    !isValidLayout(value.world.layout)
  ) return null;
  if (
    value.world.columns !== PLAYABLE_MAP_COLUMNS ||
    value.world.rows !== PLAYABLE_MAP_ROWS ||
    value.world.tileSize !== PLAYABLE_TILE_SIZE ||
    typeof value.world.seed !== 'number' ||
    !Number.isInteger(value.world.seed) ||
    value.world.seed < 0
  ) {
    return null;
  }
  if (
    !isRecord(value.rules) ||
    !hasOnlyKeys(value.rules, [
      'movementSpeed',
      'startingLives',
      'timeLimitSeconds',
      'pointsPerCrystal',
      'winCondition',
      'lossCondition',
    ])
  ) return null;
  if (
    typeof value.rules.movementSpeed !== 'number' ||
    !Number.isInteger(value.rules.movementSpeed) ||
    value.rules.movementSpeed < 80 ||
    value.rules.movementSpeed > 300 ||
    typeof value.rules.startingLives !== 'number' ||
    !Number.isInteger(value.rules.startingLives) ||
    value.rules.startingLives < 1 ||
    value.rules.startingLives > 9 ||
    typeof value.rules.timeLimitSeconds !== 'number' ||
    !Number.isInteger(value.rules.timeLimitSeconds) ||
    value.rules.timeLimitSeconds < 30 ||
    value.rules.timeLimitSeconds > 600 ||
    typeof value.rules.pointsPerCrystal !== 'number' ||
    !Number.isInteger(value.rules.pointsPerCrystal) ||
    value.rules.pointsPerCrystal < 1 ||
    value.rules.pointsPerCrystal > 100 ||
    value.rules.winCondition !== 'collect_all_crystals_then_reach_exit' ||
    value.rules.lossCondition !== 'no_lives_or_time_expires'
  ) {
    return null;
  }

  return value as unknown as PlayableGameDefinition;
}

function cellCenter(column: number, row: number, tileSize: number): GridPoint {
  return { column: (column + 0.5) * tileSize, row: (row + 0.5) * tileSize };
}

function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

/**
 * Deterministic game rules used by the Phaser scene and by gameplay tests.
 * Phaser renders and collects keyboard input; this class owns movement,
 * collision, scoring, timing, and win/loss rules.
 */
export class GameSession {
  readonly definition: PlayableGameDefinition;
  private playerX: number;
  private playerY: number;
  private score = 0;
  private lives: number;
  private remainingMs: number;
  private hazardCooldownMs = 0;
  private status: GameStatus = 'playing';
  private endReason?: GameEndReason;
  private collected = new Set<string>();
  private readonly crystals: GridPoint[] = [];
  private readonly hazards: GridPoint[] = [];
  private exit: GridPoint = { column: 0, row: 0 };
  private readonly playerRadius: number;

  constructor(definition: PlayableGameDefinition) {
    this.definition = definition;
    const { layout, tileSize } = definition.world;
    let startColumn = 0;
    let startRow = 0;

    layout.forEach((row, rowIndex) => {
      [...row].forEach((tile, columnIndex) => {
        if (tile === 'P') {
          startColumn = columnIndex;
          startRow = rowIndex;
        } else if (tile === 'C') {
          this.crystals.push(cellCenter(columnIndex, rowIndex, tileSize));
        } else if (tile === 'H') {
          this.hazards.push(cellCenter(columnIndex, rowIndex, tileSize));
        } else if (tile === 'E') {
          this.exit = cellCenter(columnIndex, rowIndex, tileSize);
        }
      });
    });

    const start = cellCenter(startColumn, startRow, tileSize);
    this.playerX = start.column;
    this.playerY = start.row;
    this.playerRadius = tileSize * 0.28;
    this.lives = definition.rules.startingLives;
    this.remainingMs = definition.rules.timeLimitSeconds * 1000;
  }

  snapshot(): GameSnapshot {
    return {
      x: this.playerX,
      y: this.playerY,
      score: this.score,
      collectedCrystals: this.collected.size,
      totalCrystals: this.crystals.length,
      lives: this.lives,
      secondsRemaining: Math.max(0, Math.ceil(this.remainingMs / 1000)),
      status: this.status,
      endReason: this.endReason,
      invulnerable: this.hazardCooldownMs > 0,
    };
  }

  isCrystalCollected(index: number): boolean {
    return this.collected.has(String(index));
  }

  getCrystalPositions(): GridPoint[] {
    return this.crystals.map((crystal) => ({ ...crystal }));
  }

  getHazardPositions(): GridPoint[] {
    return this.hazards.map((hazard) => ({ ...hazard }));
  }

  getExitPosition(): GridPoint {
    return { ...this.exit };
  }

  update(input: GameInput, deltaMs: number): GameSnapshot {
    if (this.status !== 'playing') return this.snapshot();
    const elapsed = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
    this.remainingMs = Math.max(0, this.remainingMs - elapsed);
    this.hazardCooldownMs = Math.max(0, this.hazardCooldownMs - elapsed);

    if (this.remainingMs <= 0) {
      this.finish('lost', 'timeout');
      return this.snapshot();
    }

    this.movePlayer(input, Math.min(elapsed, 100));
    this.collectNearbyCrystals();
    this.checkHazards();
    this.checkExit();
    return this.snapshot();
  }

  private movePlayer(input: GameInput, deltaMs: number): void {
    const horizontal = Number(input.right) - Number(input.left);
    const vertical = Number(input.down) - Number(input.up);
    const magnitude = Math.hypot(horizontal, vertical);
    if (magnitude === 0 || deltaMs <= 0) return;

    const speed = this.definition.rules.movementSpeed;
    const distance = (speed * deltaMs) / 1000;
    const deltaX = (horizontal / magnitude) * distance;
    const deltaY = (vertical / magnitude) * distance;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY)) / (this.definition.world.tileSize / 4)),
    );
    const stepX = deltaX / steps;
    const stepY = deltaY / steps;

    for (let step = 0; step < steps; step += 1) {
      if (this.canOccupy(this.playerX + stepX, this.playerY)) this.playerX += stepX;
      if (this.canOccupy(this.playerX, this.playerY + stepY)) this.playerY += stepY;
    }
  }

  private canOccupy(x: number, y: number): boolean {
    const { layout, tileSize } = this.definition.world;
    const minColumn = Math.floor((x - this.playerRadius) / tileSize);
    const maxColumn = Math.floor((x + this.playerRadius) / tileSize);
    const minRow = Math.floor((y - this.playerRadius) / tileSize);
    const maxRow = Math.floor((y + this.playerRadius) / tileSize);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let column = minColumn; column <= maxColumn; column += 1) {
        if (layout[row]?.[column] !== '#') continue;
        const closestX = Math.max(column * tileSize, Math.min(x, (column + 1) * tileSize));
        const closestY = Math.max(row * tileSize, Math.min(y, (row + 1) * tileSize));
        if (distanceSquared(x, y, closestX, closestY) < this.playerRadius ** 2) return false;
      }
    }
    return true;
  }

  private collectNearbyCrystals(): void {
    const collectRadius = this.definition.world.tileSize * 0.42;
    this.crystals.forEach((crystal, index) => {
      const key = String(index);
      if (
        !this.collected.has(key) &&
        distanceSquared(this.playerX, this.playerY, crystal.column, crystal.row) <= collectRadius ** 2
      ) {
        this.collected.add(key);
        this.score += this.definition.rules.pointsPerCrystal;
      }
    });
  }

  private checkHazards(): void {
    if (this.hazardCooldownMs > 0) return;
    const collisionRadius = this.definition.world.tileSize * 0.43;
    if (
      this.hazards.some(
        (hazard) =>
          distanceSquared(this.playerX, this.playerY, hazard.column, hazard.row) <= collisionRadius ** 2,
      )
    ) {
      this.lives -= 1;
      this.hazardCooldownMs = 1100;
      if (this.lives <= 0) this.finish('lost', 'lives');
    }
  }

  private checkExit(): void {
    if (this.collected.size !== this.crystals.length) return;
    const exitRadius = this.definition.world.tileSize * 0.46;
    if (
      distanceSquared(this.playerX, this.playerY, this.exit.column, this.exit.row) <= exitRadius ** 2
    ) {
      this.finish('won', 'exit');
    }
  }

  private finish(status: Exclude<GameStatus, 'playing'>, reason: GameEndReason): void {
    this.status = status;
    this.endReason = reason;
  }
}
