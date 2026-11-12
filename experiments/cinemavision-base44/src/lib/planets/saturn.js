import * as THREE from "three";
import { createRingTexture, createSaturnTexture } from "@/lib/planets/procedural";
import { createAtmosphereMaterial } from "@/lib/planets/atmosphere";

export function createSaturn({ quality = "high", radius = 1.85 } = {}) {
  const group = new THREE.Group();
  const size = quality === "high" ? 1024 : 512;

  const map = new THREE.CanvasTexture(createSaturnTexture(size));
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.wrapS = THREE.RepeatWrapping;

  const segments = quality === "high" ? 80 : 56;
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.72)),
    new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0.02 })
  );
  body.castShadow = true;
  body.receiveShadow = true;

  const inner = radius * 1.3;
  const outer = radius * 2.34;
  const ringGeometry = new THREE.RingGeometry(inner, outer, quality === "high" ? 256 : 128, 1);
  const positions = ringGeometry.attributes.position;
  const uvs = ringGeometry.attributes.uv;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < positions.count; i += 1) {
    vertex.fromBufferAttribute(positions, i);
    const distance = Math.hypot(vertex.x, vertex.y);
    uvs.setXY(i, (distance - inner) / (outer - inner), 0.5);
  }
  uvs.needsUpdate = true;

  const ringMap = new THREE.CanvasTexture(createRingTexture(quality === "high" ? 1024 : 512));
  ringMap.colorSpace = THREE.SRGBColorSpace;
  ringMap.anisotropy = 8;

  const rings = new THREE.Mesh(
    ringGeometry,
    new THREE.MeshStandardMaterial({
      map: ringMap,
      transparent: true,
      opacity: 0.97,
      side: THREE.DoubleSide,
      roughness: 0.95,
      metalness: 0,
      alphaTest: 0.02,
      depthWrite: false,
    })
  );
  rings.rotation.x = -Math.PI / 2;
  rings.receiveShadow = true;

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.03, segments, Math.round(segments * 0.72)),
    createAtmosphereMaterial({ color: 0xf2d9a5, intensity: 0.75, power: 3.4, sunDir: [-0.35, 0.13, 0.9] })
  );

  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(26.7);
  tilt.rotation.x = THREE.MathUtils.degToRad(-5.5);
  tilt.add(body, rings, glow);
  group.add(tilt);

  const update = (dt) => {
    body.rotation.y += dt * 0.022;
    rings.rotation.z += dt * 0.01;
  };

  return { group, update, body, rings };
}