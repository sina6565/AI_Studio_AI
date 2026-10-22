/**
 * Cinematic intro timeline — the birth of the SINA universe.
 *
 * Story beats (seconds):
 *  0.0 – 0.9  DARKNESS    : near-black void, faint cosmic dust.
 *  0.9 – 3.6  GATHERING   : light & dust particles swirl and converge.
 *  3.4 – 4.3  IGNITION    : a real planet materializes inside the shell.
 *  4.3 – 5.1  EXPLOSION   : flash + shockwave; shell bursts into orbit dust.
 *  5.0 – 6.3  LOGO REVEAL : the SINA STUDIO AI emblem ignites over the planet.
 *  6.1 – 7.7  SIX WORLDS  : six world-orbs are born and take their orbits.
 *
 * Pure functions only — unit-testable, shared by the WebGL scene and the
 * HTML overlay so both stay in perfect sync.
 */

export const INTRO = {
  darknessEnd: 0.9,
  gatherStart: 0.9,
  gatherEnd: 3.6,
  igniteStart: 3.4,
  igniteEnd: 4.3,
  explosionAt: 4.3,
  explosionEnd: 5.1,
  logoStart: 5.0,
  logoEnd: 6.3,
  worldsStart: 6.1,
  worldsEnd: 7.7,
  total: 7.7,
} as const;

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Linear 0→1 progress of t inside [start, end]. */
export const segment = (t: number, start: number, end: number): number =>
  clamp01((t - start) / (end - start));

export const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

export const easeOutExpo = (x: number): number =>
  x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);

/** 0→1→0 pulse across [start, end], used for the explosion burst. */
export const pulse = (t: number, start: number, end: number): number => {
  const s = segment(t, start, end);
  return Math.pow(Math.sin(Math.PI * s), 1.5);
};

export interface IntroState {
  /** Particles converged onto the planet shell (0..1). */
  gather: number;
  /** Planet surface materialized (0..1). */
  planetReveal: number;
  /** Explosion flash intensity (0..1, spikes then decays). */
  flash: number;
  /** Particle burst outward (0..1..0). */
  burst: number;
  /** Shockwave ring expansion (0..1). */
  shockwave: number;
  /** Logo emblem reveal (0..1). */
  logoReveal: number;
  /** Six worlds born (0..1, staggered per-orb by the component). */
  worldsReveal: number;
  /** Background nebula fade-in from pure black (0..1). */
  nebula: number;
  /** Camera dolly distance for the current beat. */
  cameraZ: number;
  done: boolean;
}

export function getIntroState(t: number): IntroState {
  const gather = easeInOutCubic(segment(t, INTRO.gatherStart, INTRO.gatherEnd));
  const planetReveal = easeOutCubic(segment(t, INTRO.igniteStart, INTRO.igniteEnd));

  // Flash: a charging pre-glow just before the blast, then an exponential decay.
  const preGlow =
    t < INTRO.explosionAt ? 0.35 * segment(t, INTRO.explosionAt - 0.18, INTRO.explosionAt) : 0;
  const blast = t >= INTRO.explosionAt ? Math.exp(-(t - INTRO.explosionAt) * 3.4) : 0;
  const flash = clamp01(Math.max(preGlow, blast));

  const burst = pulse(t, INTRO.explosionAt, INTRO.explosionAt + 1.5);
  const shockwave = easeOutExpo(segment(t, INTRO.explosionAt, INTRO.explosionEnd + 0.7));
  const logoReveal = easeOutCubic(segment(t, INTRO.logoStart, INTRO.logoEnd));
  const worldsReveal = easeOutCubic(segment(t, INTRO.worldsStart, INTRO.worldsEnd));
  const nebula = easeInOutCubic(segment(t, 0.35, 3.2));

  // Camera: slow dolly-in through the gathering, a push at the explosion,
  // then a gentle settle-back as the logo and worlds arrive.
  let cameraZ = 15.5;
  cameraZ -= 6.4 * easeInOutCubic(segment(t, INTRO.gatherStart, INTRO.igniteEnd));
  cameraZ -= 1.1 * pulse(t, INTRO.explosionAt, INTRO.explosionAt + 1.3);
  cameraZ += 0.55 * logoReveal;

  return {
    gather,
    planetReveal,
    flash,
    burst,
    shockwave,
    logoReveal,
    worldsReveal,
    nebula,
    cameraZ,
    done: t >= INTRO.total,
  };
}

/** Per-orb stagger: maps the global worldsReveal onto orb `index` of `count`. */
export function orbReveal(worldsReveal: number, index: number, count: number): number {
  const span = 1 / count;
  const start = index * span * 0.72; // overlap staggers slightly for a cascade feel
  return easeOutCubic(clamp01((worldsReveal - start) / (span * 1.6)));
}

/** The six world colors, in birth order — shared by the 3D orbs and HTML cards. */
export const WORLD_COLORS = ['#22d3ee', '#818cf8', '#e879f9', '#fbbf24', '#34d399', '#60a5fa'];
