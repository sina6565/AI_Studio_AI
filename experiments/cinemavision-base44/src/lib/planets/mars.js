import * as THREE from "three";
import { createMarsTextures } from "@/lib/planets/procedural";
import { createAtmosphereMaterial } from "@/lib/planets/atmosphere";

export function createMars({ quality = "high", radius = 0.78 } = {}) {
  const group = new THREE.Group();
  const size = quality === "high" ? 1024 : 512;
  const { albedo, bump } = createMarsTextures(size);

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.wrapS = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = THREE.RepeatWrapping;

  const segments = quality === "high" ? 72 : 48;
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.7)),
    new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.028,
      roughness: 1,
      metalness: 0,
    })
  );
  group.add(body);

  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.045, segments, Math.round(segments * 0.7)),
    createAtmosphereMaterial({ color: 0xd9a179, intensity: 0.55, power: 3.6, sunDir: [-0.61, 0.34, 0.71] })
  );
  group.add(haze);

  body.rotation.y = 2.1;

  const update = (dt) => {
    body.rotation.y += dt * 0.035;
  };

  return { group, update };
}