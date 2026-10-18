export const UNIVERSE_MILESTONES = {
  planetNormal: 0,
  fractureGlowBegins: 0.2,
  planetOpens: 0.4,
  energyExplosion: 0.6,
  sixWorldsFadeIn: 0.8,
  planetFullyOpen: 1,
} as const;

/** Clamp a numeric progress value to the normalized 0..1 range. */
export function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
}

/**
 * Map a value from the [min, max] interval to 0..1.
 * Values outside the interval are clamped.
 */
export function remap(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return 0;
  }
  if (min === max) return value < min ? 0 : 1;
  return clampProgress((value - min) / (max - min));
}

/** 0 until 0.20, then glow ramps up through 0.40. */
export function getFractureGlowProgress(progress: number): number {
  return remap(progress, UNIVERSE_MILESTONES.fractureGlowBegins, UNIVERSE_MILESTONES.planetOpens);
}

/** Opening motion begins at 0.40 and completes at 1.00. */
export function getPlanetOpeningProgress(progress: number): number {
  return remap(progress, UNIVERSE_MILESTONES.planetOpens, UNIVERSE_MILESTONES.planetFullyOpen);
}

/** Energy effect ramps in from 0.60 to 1.00. */
export function getExplosionProgress(progress: number): number {
  return remap(progress, UNIVERSE_MILESTONES.energyExplosion, UNIVERSE_MILESTONES.planetFullyOpen);
}

/** Six worlds fade in between 0.80 and 1.00. */
export function getWorldsFadeProgress(progress: number): number {
  return remap(progress, UNIVERSE_MILESTONES.sixWorldsFadeIn, UNIVERSE_MILESTONES.planetFullyOpen);
}

export function hasReachedMilestone(progress: number, milestone: number): boolean {
  return clampProgress(progress) >= milestone;
}
