import * as THREE from "three";

export const KEYFRAMES = [
  { p: 0.0, pos: [0.35, 0.25, 3.6], target: [-2.6, 0.3, 0.0], fov: 40 },
  { p: 0.1, pos: [-0.75, 0.4, 2.45], target: [-2.75, 0.35, 0.0], fov: 38 },
  { p: 0.21, pos: [-1.25, 0.85, 2.6], target: [-2.65, 0.2, -0.7], fov: 46 },
  { p: 0.34, pos: [0.9, -0.9, -0.6], target: [3.2, -1.8, -5.4], fov: 46 },
  { p: 0.46, pos: [1.9, -1.5, -2.6], target: [3.3, -2.0, -6.3], fov: 44 },
  { p: 0.58, pos: [2.2, -1.2, -4.2], target: [3.6, -2.1, -6.6], fov: 40 },
  { p: 0.7, pos: [2.4, -0.4, -8.8], target: [1.8, 1.0, -18.5], fov: 46 },
  { p: 0.84, pos: [2.0, 1.0, -12.4], target: [1.4, 1.3, -18.5], fov: 42 },
  { p: 1.0, pos: [1.6, 1.35, -11.4], target: [1.3, 1.3, -18.5], fov: 40 },
];

const scratch = {
  position: new THREE.Vector3(),
  target: new THREE.Vector3(),
  fov: 40,
};

const smooth = (t) => t * t * (3 - 2 * t);

export function sampleCameraPath(progress, out = scratch) {
  const frames = KEYFRAMES;
  const p = Math.min(1, Math.max(0, progress));

  let index = 0;
  while (index < frames.length - 2 && p > frames[index + 1].p) index += 1;

  const a = frames[index];
  const b = frames[index + 1];
  const span = Math.max(0.0001, b.p - a.p);
  const t = smooth(Math.min(1, Math.max(0, (p - a.p) / span)));

  out.position.set(
    a.pos[0] + (b.pos[0] - a.pos[0]) * t,
    a.pos[1] + (b.pos[1] - a.pos[1]) * t,
    a.pos[2] + (b.pos[2] - a.pos[2]) * t
  );

  out.target.set(
    a.target[0] + (b.target[0] - a.target[0]) * t,
    a.target[1] + (b.target[1] - a.target[1]) * t,
    a.target[2] + (b.target[2] - a.target[2]) * t
  );

  out.fov = a.fov + (b.fov - a.fov) * t;
  return out;
}