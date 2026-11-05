import * as THREE from "three";

const COUNTS = { high: 2600, mid: 1500, low: 780 };

function spherePoint(radius, out) {
  const u = Math.random() * 2 - 1;
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  out.set(Math.cos(theta) * r * radius, u * radius, Math.sin(theta) * r * radius);
  return out;
}

export function createStars(quality = "high") {
  const group = new THREE.Group();
  const total = COUNTS[quality] ?? COUNTS.mid;
  const point = new THREE.Vector3();

  const build = (count, size, opacity, radiusRange, bright) => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      spherePoint(radiusRange[0] + Math.random() * (radiusRange[1] - radiusRange[0]), point);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      const tint = Math.random();
      if (tint > 0.82) color.setHex(0xffd9b0);
      else if (tint > 0.62) color.setHex(0x9ec8ff);
      else color.setHex(0xffffff);

      const strength = bright ? 0.85 + Math.random() * 0.15 : 0.4 + Math.random() * 0.55;
      colors[i * 3] = color.r * strength;
      colors[i * 3 + 1] = color.g * strength;
      colors[i * 3 + 2] = color.b * strength;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
    });

    group.add(new THREE.Points(geometry, material));
  };

  build(Math.round(total * 0.86), 0.5, 0.75, [70, 160], false);
  build(Math.round(total * 0.14), 1.15, 0.95, [60, 150], true);

  return group;
}