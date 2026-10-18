export const UNIVERSE_MILESTONES = {
  planet: 0,
  fractureStart: 0.2,
  hemispheresSeparate: 0.4,
  energyExplosion: 0.6,
  planetOpened: 1,
} as const;

export function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
}

export function getFractureProgress(progress: number): number {
  const start = UNIVERSE_MILESTONES.fractureStart;
  return clampProgress((clampProgress(progress) - start) / (UNIVERSE_MILESTONES.planetOpened - start));
}

export function getExplosionProgress(progress: number): number {
  const start = UNIVERSE_MILESTONES.energyExplosion;
  return clampProgress((clampProgress(progress) - start) / (UNIVERSE_MILESTONES.planetOpened - start));
}

export function hasReachedMilestone(progress: number, milestone: number): boolean {
  return clampProgress(progress) >= milestone;
}
