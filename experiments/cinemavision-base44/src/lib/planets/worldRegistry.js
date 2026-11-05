// Visual identity of each of the six worlds. One star lights them all (SUN_DIR).
export const WORLD_VISUALS = {
  game: { a: "#04231e", b: "#17c98e", c: "#9dffd9", rim: "#34f0bc", style: 0, seed: 1.3 },
  web: { a: "#04122e", b: "#2b9dff", c: "#c2efff", rim: "#4fc4ff", style: 1, seed: 3.7 },
  video: { a: "#24100a", b: "#ff9f45", c: "#b070ff", rim: "#ffb56b", style: 2, seed: 6.1 },
  audio: { a: "#1d0730", b: "#ff4fa8", c: "#ffd2f2", rim: "#ff6cc4", style: 3, seed: 8.9 },
  character: { a: "#2c0f16", b: "#ff8d76", c: "#ffe6cf", rim: "#ffa38c", style: 4, seed: 10.4 },
  three: { a: "#0a1040", b: "#7c8bff", c: "#d3d9ff", rim: "#8f9dff", style: 5, seed: 12.6 },
};

export const WORLD_KEYS = ["game", "web", "video", "audio", "character", "three"];

// The six worlds sit on a flat ecliptic around the golden core.
export const PLANET_ORBIT = 32;
export const PLANET_RADIUS = 6;
export const WORLD_AZIMUTHS = [130, 78, 26, -26, -78, -130];
export const HERO_AZIMUTH = 104;

export function worldAnchor(index) {
  const azimuth = (WORLD_AZIMUTHS[index] * Math.PI) / 180;
  return {
    x: Math.cos(azimuth) * PLANET_ORBIT,
    y: 0,
    z: Math.sin(azimuth) * PLANET_ORBIT,
  };
}