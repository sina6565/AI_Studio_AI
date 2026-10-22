import { create } from 'zustand';
import { INTRO } from './introTimeline';

/**
 * Shared, render-loop-friendly state for the cinematic universe scene.
 * High-frequency values (time, scroll) are read imperatively inside
 * useFrame via getState()/introTime() to avoid React re-renders.
 */
interface UniverseStore {
  /** performance.now() timestamp of intro start; 0 = not started yet. */
  startedAt: number;
  /** True when the intro should be presented already settled (repeat visit / reduced motion). */
  instant: boolean;
  introDone: boolean;
  /** Page scroll progress 0..1 across the whole landing document. */
  scrollProgress: number;
  /** Currently highlighted world index (synced between 3D orbs and HTML cards). */
  activeWorld: number;
  begin: (instant: boolean) => void;
  skip: () => void;
  finishIntro: () => void;
  setScrollProgress: (v: number) => void;
  setActiveWorld: (i: number) => void;
}

export const useUniverseStore = create<UniverseStore>((set, get) => ({
  startedAt: 0,
  instant: false,
  introDone: false,
  scrollProgress: 0,
  activeWorld: -1,
  begin: (instant) => {
    if (get().startedAt) return; // idempotent (React StrictMode double-mount)
    set({ startedAt: performance.now(), instant, introDone: instant });
  },
  skip: () => set({ instant: true, introDone: true }),
  finishIntro: () => {
    if (!get().introDone) set({ introDone: true });
  },
  setScrollProgress: (v) => set({ scrollProgress: v }),
  setActiveWorld: (i) => set({ activeWorld: i }),
}));

/** Seconds elapsed in the intro timeline (INTRO.total when settled instantly). */
export function introTime(): number {
  const s = useUniverseStore.getState();
  if (!s.startedAt) return 0;
  if (s.instant) return INTRO.total + 1;
  return (performance.now() - s.startedAt) / 1000;
}
