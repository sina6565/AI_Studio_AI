// Pure timeline for the cinematic trailer — no three.js here, so it stays testable.

export const TRAILER_DURATION = 26;

export const PHASES = [
  { key: "space", from: 0, to: 3.6, label: "فضای عمیق", en: "DEEP SPACE" },
  { key: "approach", from: 3.6, to: 7.4, label: "نزدیک شدن دوربین", en: "APPROACH" },
  { key: "split", from: 7.4, to: 10.9, label: "شکافتن زحل", en: "THE SPLIT" },
  { key: "logo", from: 10.9, to: 14.6, label: "آشکار شدن لوگو", en: "CORE REVEAL" },
  { key: "birth", from: 14.6, to: 19.4, label: "تولد شش سیاره", en: "SIX WORLDS" },
  { key: "orbit", from: 19.4, to: 22.8, label: "حرکت دوربین", en: "ORBIT" },
  { key: "tagline", from: 22.8, to: 26, label: "شعار", en: "TAGLINE" },
];

const CAMERA_KEYS = [
  { t: 0, pos: [0, 1.6, 36], target: [0, 0, 0], fov: 34 },
  { t: 4.4, pos: [0, 1.2, 23], target: [0, 0, 0], fov: 36 },
  { t: 7.4, pos: [0.4, 0.8, 14.6], target: [0, 0, 0], fov: 40 },
  { t: 10.9, pos: [0, 0.3, 12.4], target: [0, 0.1, 0], fov: 42 },
  { t: 14.6, pos: [0, 0.2, 11.2], target: [0, 0.25, 0], fov: 44 },
  { t: 19.4, pos: [0, 4.2, 27], target: [0, 0.4, -4], fov: 40 },
  { t: 22.8, pos: [0, 4.8, 30], target: [0, 0.4, -4.6], fov: 39 },
  { t: 26, pos: [0, 5.2, 32], target: [0, 0.5, -5], fov: 38 },
];

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const range = (time, from, to) => clamp01((time - from) / (to - from));
const ease = (value) => value * value * (3 - 2 * value);
const mix = (a, b, k) => a + (b - a) * k;

function sampleCamera(time) {
  let index = 0;
  while (index < CAMERA_KEYS.length - 2 && time > CAMERA_KEYS[index + 1].t) index += 1;
  const a = CAMERA_KEYS[index];
  const b = CAMERA_KEYS[index + 1];
  const k = ease(range(time, a.t, b.t));

  return {
    pos: [mix(a.pos[0], b.pos[0], k), mix(a.pos[1], b.pos[1], k), mix(a.pos[2], b.pos[2], k)],
    target: [
      mix(a.target[0], b.target[0], k),
      mix(a.target[1], b.target[1], k),
      mix(a.target[2], b.target[2], k),
    ],
    fov: mix(a.fov, b.fov, k),
  };
}

export function sampleTrailer(time) {
  const t = Math.min(Math.max(time, 0), TRAILER_DURATION);
  const camera = sampleCamera(t);

  return {
    ...camera,
    split: ease(range(t, 7.6, 10.6)),
    coreGlow: ease(range(t, 9.0, 12.0)),
    logo: range(t, 11.0, 12.8) * (1 - range(t, 24.0, 25.9)),
    birth: range(t, 14.8, 18.8),
    tagline: ease(range(t, 21.9, 23.6)),
    dust: 0.3 + 0.7 * range(t, 2.6, 8),
    exposure: 1.02 + 0.24 * Math.sin(range(t, 7, 11.5) * Math.PI),
  };
}

export function phaseAt(time) {
  const t = Math.min(Math.max(time, 0), TRAILER_DURATION - 0.001);
  return PHASES.find((phase) => t >= phase.from && t < phase.to) ?? PHASES[PHASES.length - 1];
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}