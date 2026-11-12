import * as THREE from "three";

function softDot() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,226,170,0.75)");
  gradient.addColorStop(1, "rgba(255,190,90,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function createDust({ count = 700, radius = 22, quality = "high" } = {}) {
  const total = quality === "low" ? Math.round(count * 0.45) : quality === "mid" ? Math.round(count * 0.7) : count;
  const positions = new Float32Array(total * 3);

  for (let i = 0; i < total; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.35 + Math.random() * 0.65);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.55;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.16,
    map: softDot(),
    color: 0xffc46a,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    fog: false,
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    material,
    update(dt) {
      points.rotation.y += dt * 0.035;
      points.rotation.x += dt * 0.008;
    },
    dispose() {
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
    },
  };
}