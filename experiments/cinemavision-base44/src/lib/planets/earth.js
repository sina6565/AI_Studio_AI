import * as THREE from "three";
import { createEarthFallback } from "@/lib/planets/procedural";
import { createAtmosphereMaterial } from "@/lib/planets/atmosphere";

const BASE = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r171/examples/textures/planets";

const URLS = {
  day: `${BASE}/earth_atmos_2048.jpg`,
  normal: `${BASE}/earth_normal_2048.jpg`,
  specular: `${BASE}/earth_specular_2048.jpg`,
  clouds: `${BASE}/earth_clouds_1024.png`,
};

const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");

function loadTexture(url, { srgb = true, anisotropy = 4 } = {}) {
  return new Promise((resolve) => {
    loader.load(
      url,
      (texture) => {
        if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = anisotropy;
        texture.wrapS = THREE.RepeatWrapping;
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
}

function createEarthFallbackTexture(size) {
  const texture = new THREE.CanvasTexture(createEarthFallback(size));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createEarth({ quality = "high", radius = 1 } = {}) {
  const group = new THREE.Group();
  const segments = quality === "high" ? 96 : 64;

  const material = new THREE.MeshPhongMaterial({
    color: 0x2b4a70,
    shininess: 14,
    specular: new THREE.Color(0x2b4055),
  });

  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.66)), material);
  group.add(planet);

  const cloudMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    shininess: 4,
  });
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.012, segments, Math.round(segments * 0.66)),
    cloudMaterial
  );
  group.add(clouds);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.065, segments, Math.round(segments * 0.66)),
    createAtmosphereMaterial({ color: 0x62b8ff, intensity: 1.05, power: 3, sunDir: [-0.68, 0.38, 0.61] })
  );
  group.add(atmosphere);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.19, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 1, metalness: 0, flatShading: false })
  );
  group.add(moon);

  let disposed = false;
  let moonAngle = 0.6;
  const fallbackSize = quality === "high" ? 1024 : 512;

  Promise.all([
    loadTexture(URLS.day),
    loadTexture(URLS.normal, { srgb: false }),
    loadTexture(URLS.specular, { srgb: false }),
    loadTexture(URLS.clouds),
  ]).then(([day, normal, specular, cloudMap]) => {
    if (disposed) {
      [day, normal, specular, cloudMap].forEach((texture) => texture?.dispose());
      return;
    }
    if (day) {
      material.map?.dispose();
      material.map = day;
      material.color.setHex(0xffffff);
    } else {
      material.map = createEarthFallbackTexture(fallbackSize);
    }
    if (normal) {
      material.normalMap = normal;
      material.normalScale = new THREE.Vector2(0.8, 0.8);
    }
    if (specular) material.specularMap = specular;
    material.needsUpdate = true;

    if (cloudMap) {
      cloudMaterial.alphaMap = cloudMap;
      cloudMaterial.opacity = 0.9;
      cloudMaterial.needsUpdate = true;
    }
  });

  const update = (dt) => {
    planet.rotation.y += dt * 0.045;
    clouds.rotation.y += dt * 0.06;
    moonAngle += dt * 0.2;
    moon.position.set(
      Math.cos(moonAngle) * radius * 2.75,
      Math.sin(moonAngle) * radius * 0.55,
      Math.sin(moonAngle) * radius * 2.4
    );
    moon.rotation.y += dt * 0.09;
  };

  const dispose = () => {
    disposed = true;
  };

  return { group, update, dispose };
}