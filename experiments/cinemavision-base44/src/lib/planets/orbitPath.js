import * as THREE from "three";
import { WORLD_AZIMUTHS, HERO_AZIMUTH, PLANET_ORBIT, PLANET_RADIUS } from "@/lib/planets/worldRegistry";

const FOV = 42;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const CAMERA_ELEVATIONS = [10, -8, 9, -7, 8, -9];

const toRad = (deg) => (deg * Math.PI) / 180;

export function sphericalPoint(azimuthDeg, elevationDeg, radius) {
  const az = toRad(azimuthDeg);
  const el = toRad(elevationDeg);
  const flat = Math.cos(el) * radius;
  return new THREE.Vector3(Math.cos(az) * flat, Math.sin(el) * radius, Math.sin(az) * flat);
}

const shortestDelta = (from, to) => {
  let delta = ((to - from + 540) % 360) - 180;
  return delta;
};

// The camera stays on one orbit around the core, so it can never cut through a
// world: every stop sits a fixed, frame-filling distance outside its planet.
export function buildOrbitStops(aspect) {
  const safeAspect = Math.min(Math.max(aspect, 0.45), 2.2);
  const portrait = aspect < 0.95;
  const fit = (radius, fill) => radius / (fill * TAN * safeAspect);

  const orbitRadius = PLANET_ORBIT + fit(PLANET_RADIUS, portrait ? 0.92 : 0.73);
  const heroRadius = Math.max(fit(17, portrait ? 1.05 : 0.72), orbitRadius * 0.82);

  const stops = [
    {
      az: HERO_AZIMUTH,
      el: 14,
      radius: heroRadius,
      target: new THREE.Vector3(0, 0, 0),
    },
  ];

  WORLD_AZIMUTHS.forEach((az, index) => {
    stops.push({
      az,
      el: CAMERA_ELEVATIONS[index],
      radius: orbitRadius,
      target: sphericalPoint(az, 0, PLANET_ORBIT),
    });
  });

  return { stops, orbitRadius, heroRadius };
}

export function sampleOrbit(stops, progress, outPosition, outTarget) {
  const clamped = THREE.MathUtils.clamp(progress, 0, stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(clamped));
  const raw = clamped - index;
  const k = raw * raw * (3 - 2 * raw);

  const from = stops[index];
  const to = stops[index + 1];
  const hop = 0.09 * Math.max(from.radius, to.radius) * Math.sin(Math.PI * k);

  const azimuth = from.az + shortestDelta(from.az, to.az) * k;
  const elevation = from.el + (to.el - from.el) * k;
  const radius = from.radius + (to.radius - from.radius) * k + hop;

  outPosition.copy(sphericalPoint(azimuth, elevation, radius));
  outTarget.lerpVectors(from.target, to.target, k);
  return outPosition;
}