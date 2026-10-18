export const UNIVERSE_MILESTONES = {
  planet: 0,
  fractureStart: 0.2,
  hemispheresSeparate: 0.4,
  energyExplosion: 0.6,
  planetOpened: 1,
} as const;

/** Clamp a numeric progress value to the normalized 0..1 range. */
export function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
}

/**
 * Remap a value from the [start, end] interval to normalized 0..1 progress.
 * Values below start return 0; values above end return 1.
 */
export function remap(value: number, start: number, end: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }
  if (start === end) return value < start ? 0 : 1;
  return clampProgress((value - start) / (end - start));
}

export function getFractureProgress(progress: number): number {
  return remap(progress, UNIVERSE_MILESTONES.fractureStart, UNIVERSE_MILESTONES.planetOpened);
}

export function getExplosionProgress(progress: number): number {
  return remap(progress, UNIVERSE_MILESTONES.energyExplosion, UNIVERSE_MILESTONES.planetOpened);
}

export function hasReachedMilestone(progress: number, milestone: number): boolean {
  return clampProgress(progress) >= milestone;
}
