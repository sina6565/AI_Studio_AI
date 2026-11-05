import * as THREE from "three";
import { createSurfaceMaterial, createRimMaterial } from "@/lib/planets/worldSurface";

const GOLD_DEF = { a: "#2a1a06", b: "#c9912f", c: "#ffefc2", rim: "#ffd58a", style: 6, seed: 4.2 };

function bandTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 1);

  for (let i = 0; i < 260; i += 1) {
    const x = Math.random() * 512;
    const w = 1 + Math.random() * 7;
    const shade = Math.floor(90 + Math.random() * 165);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},1)`;
    ctx.fillRect(x, 0, w, 1);
  }
  // the Cassini-like gaps that make a ring read as real matter
  ctx.fillStyle = "rgba(0,0,0,0.92)";
  ctx.fillRect(148, 0, 5, 1);
  ctx.fillRect(232, 0, 3, 1);
  ctx.fillRect(336, 0, 6, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,244,214,1)");
  gradient.addColorStop(0.24, "rgba(255,214,140,0.72)");
  gradient.addColorStop(0.55, "rgba(255,176,74,0.22)");
  gradient.addColorStop(1, "rgba(255,150,40,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

export function createGoldenCore({
  bodyRadius = 5.2,
  ringInner = 6.4,
  ringOuter = 10.4,
  quality = "high",
  env = null,
} = {}) {
  const segments = quality === "high" ? 112 : quality === "mid" ? 72 : 48;
  const group = new THREE.Group();
  const material = createSurfaceMaterial(GOLD_DEF, { doubleSide: true, scale: 3.6 });

  const halfGeometry = (phiStart) => {
    const geometry = new THREE.SphereGeometry(
      bodyRadius,
      segments,
      Math.max(28, Math.round(segments / 2)),
      phiStart,
      Math.PI
    );
    geometry.rotateY(Math.PI / 2);
    return geometry;
  };

  const halfRight = new THREE.Mesh(halfGeometry(0), material);
  const halfLeft = new THREE.Mesh(halfGeometry(Math.PI), material);
  group.add(halfRight, halfLeft);

  const ringTexture = bandTexture();
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9a94a,
    metalness: 1,
    roughness: 0.24,
    envMap: env || undefined,
    envMapIntensity: 1.75,
    alphaMap: ringTexture,
    transparent: true,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0x3a2100),
    emissiveIntensity: 1,
    depthWrite: false,
  });

  const ringGeometry = (thetaStart) => {
    const geometry = new THREE.RingGeometry(ringInner, ringOuter, 200, 8, thetaStart, Math.PI);
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const radial = THREE.MathUtils.clamp((r - ringInner) / (ringOuter - ringInner), 0, 1);
      uv.setXY(i, radial, 0.5);
    }
    uv.needsUpdate = true;
    return geometry;
  };

  const ringsRoot = new THREE.Group();
  ringsRoot.rotation.x = -Math.PI / 2 + 0.36;
  ringsRoot.rotation.z = 0.14;
  const ringRight = new THREE.Mesh(ringGeometry(-Math.PI / 2), ringMaterial);
  const ringLeft = new THREE.Mesh(ringGeometry(Math.PI / 2), ringMaterial);
  ringsRoot.add(ringRight, ringLeft);
  group.add(ringsRoot);

  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xffedc4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.46, 32, 24), coreMaterial);
  group.add(core);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color: 0xffd489,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.setScalar(bodyRadius * 6);
  group.add(glow);

  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(bodyRadius * 1.06, 48, 32),
    createRimMaterial("#ffca7a")
  );
  group.add(rim);

  const coreLight = new THREE.PointLight(0xffcf85, 0, bodyRadius * 14, 2);
  group.add(coreLight);

  const setSplit = (value, glowStrength = value) => {
    const split = THREE.MathUtils.clamp(value, 0, 1);
    const brightness = THREE.MathUtils.clamp(glowStrength, 0, 1);
    const offset = split * bodyRadius * 0.66;

    halfRight.position.x = offset;
    halfLeft.position.x = -offset;
    halfRight.rotation.y = split * 0.42;
    halfLeft.rotation.y = -split * 0.42;

    ringRight.position.x = offset * 1.18;
    ringLeft.position.x = -offset * 1.18;
    ringRight.rotation.z = split * 0.06;
    ringLeft.rotation.z = -split * 0.06;

    coreMaterial.opacity = brightness * 0.95;
    core.scale.setScalar(0.6 + brightness * 0.7);
    glow.material.opacity = brightness * 0.9;
    glow.scale.setScalar(bodyRadius * (4.5 + brightness * 5.5));
    coreLight.intensity = brightness * 120;
    rim.visible = split < 0.03;
  };

  return {
    group,
    setSplit,
    update(dt) {
      material.uniforms.uTime.value += dt;
      ringsRoot.rotation.y += dt * 0.02;
    },
    dispose() {
      group.traverse((object) => {
        object.geometry?.dispose?.();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((item) => {
          if (!item) return;
          Object.values(item).forEach((value) => {
            if (value && value.isTexture) value.dispose();
          });
          item.dispose?.();
        });
      });
    },
  };
}