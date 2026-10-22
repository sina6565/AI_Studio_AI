import { describe, expect, it } from 'vitest';
import { INTRO, getIntroState, orbReveal } from './introTimeline';

describe('cinematic intro timeline', () => {
  it('starts in darkness: nothing gathered, revealed or born', () => {
    const s = getIntroState(0);
    expect(s.gather).toBe(0);
    expect(s.planetReveal).toBe(0);
    expect(s.logoReveal).toBe(0);
    expect(s.worldsReveal).toBe(0);
    expect(s.nebula).toBeLessThan(0.05);
    expect(s.done).toBe(false);
  });

  it('gathers particles monotonically during the gathering beat', () => {
    let previous = -1;
    for (let t = INTRO.gatherStart; t <= INTRO.gatherEnd; t += 0.2) {
      const { gather } = getIntroState(t);
      expect(gather).toBeGreaterThanOrEqual(previous);
      previous = gather;
    }
    expect(getIntroState(INTRO.gatherEnd).gather).toBe(1);
  });

  it('materializes the planet only after the particles converge', () => {
    expect(getIntroState(2.5).planetReveal).toBe(0);
    const mid = getIntroState(3.85).planetReveal;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(getIntroState(INTRO.igniteEnd).planetReveal).toBe(1);
  });

  it('explodes: flash spikes at the blast and decays, burst returns to rest', () => {
    expect(getIntroState(INTRO.explosionAt).flash).toBeGreaterThan(0.9);
    expect(getIntroState(INTRO.explosionAt + 1.4).flash).toBeLessThan(0.05);
    expect(getIntroState(INTRO.explosionAt + 0.75).burst).toBeGreaterThan(0.9);
    expect(getIntroState(INTRO.explosionAt + 1.7).burst).toBeLessThan(0.05);
    expect(getIntroState(INTRO.total).shockwave).toBe(1);
  });

  it('reveals the logo after the explosion and births the six worlds last', () => {
    expect(getIntroState(INTRO.logoStart).logoReveal).toBe(0);
    expect(getIntroState(INTRO.logoEnd).logoReveal).toBe(1);
    expect(getIntroState(INTRO.worldsStart).worldsReveal).toBe(0);
    expect(getIntroState(INTRO.total).worldsReveal).toBe(1);
    expect(getIntroState(INTRO.total).done).toBe(true);
  });

  it('dollies the camera from the void into the hero framing', () => {
    expect(getIntroState(0).cameraZ).toBeGreaterThan(14);
    expect(getIntroState(INTRO.total).cameraZ).toBeLessThan(10.5);
  });

  it('staggers the six world orbs and completes every orb', () => {
    expect(orbReveal(0, 0, 6)).toBe(0);
    expect(orbReveal(0.5, 0, 6)).toBeGreaterThan(orbReveal(0.5, 5, 6));
    for (let i = 0; i < 6; i++) {
      expect(orbReveal(1, i, 6)).toBe(1);
    }
  });
});
