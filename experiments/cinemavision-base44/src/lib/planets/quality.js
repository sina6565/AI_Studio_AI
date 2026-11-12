export function detectQuality() {
  if (typeof window === "undefined") return "mid";
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;

  if (width < 768) return cores >= 6 && dpr <= 2.5 ? "mid" : "low";
  if (width < 1180) return cores >= 6 ? "high" : "mid";
  return cores >= 8 ? "high" : "mid";
}

const SETTINGS = {
  high: { dpr: 2, starTier: "high", detail: "high", antialias: true },
  mid: { dpr: 1.6, starTier: "mid", detail: "mid", antialias: false },
  low: { dpr: 1.25, starTier: "low", detail: "low", antialias: false },
};

export function settingsFor(quality) {
  return SETTINGS[quality] ?? SETTINGS.mid;
}