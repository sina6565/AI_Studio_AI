import * as THREE from "three";
import { createSurfaceMaterial, createRimMaterial } from "@/lib/planets/worldSurface";
import { WORLD_VISUALS } from "@/lib/planets/worldRegistry";

const SEGMENTS = { high: 96, mid: 64, low: 44 };

export function createWorldPlanet(key, { radius = 7, quality = "high" } = {}) {
  const def = WORLD_VISUALS[key] ?? WORLD_VISUALS.web;
  const segments = SEGMENTS[quality] ?? SEGMENTS.mid;
  const group = new THREE.Group();

  const material = createSurfaceMaterial(def);
  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, Math.max(24, segments / 2)),
    material
  );
  group.add(surface);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.05, Math.max(32, segments / 2), Math.max(20, segments / 4)),
    createRimMaterial(def.rim)
  );
  group.add(atmosphere);

  // AUDIO carries thin luminous rings, like a spectrum around the world.
  if (key === "audio") {
    const ringCount = 3;
    for (let i = 0; i < ringCount; i += 1) {
      const inner = radius * (1.28 + i * 0.16);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, inner + radius * 0.035, 128),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(def.rim),
          transparent: true,
          opacity: 0.5 - i * 0.1,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2 + 0.24 + i * 0.05;
      ring.rotation.y = 0.08 * i;
      group.add(ring);
    }
  }

  group.userData.surface = surface;
  group.userData.material = material;

  return {
    group,
    material,
    update(dt) {
      material.uniforms.uTime.value += dt;
      surface.rotation.y += dt * 0.035;
    },
    setTime(time) {
      material.uniforms.uTime.value = time;
      surface.rotation.y = time * 0.035;
    },
    dispose() {
      group.traverse((object) => {
        object.geometry?.dispose?.();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((item) => item?.dispose?.());
      });
    },
  };
}