import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getIntroState } from './introTimeline';
import { introTime } from './universeStore';
import { PLANET_RADIUS } from './Planet';

const vertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aDelay;
  attribute float aScale;
  attribute float aColorMix;
  attribute float aSeed;

  uniform float uTime;
  uniform float uGather;
  uniform float uBurst;
  uniform float uFlash;
  uniform float uPixelRatio;

  varying float vColorMix;
  varying float vAlpha;
  varying float vTwinkle;

  vec3 rotateY(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    vColorMix = aColorMix;

    // Per-particle cascade: each mote starts moving at its own delay.
    float g = smoothstep(aDelay, aDelay + 0.45, uGather);
    g = g * g * (3.0 - 2.0 * g);

    // The scattered cloud slowly swirls; the swirl tightens as it converges.
    vec3 start = rotateY(position, uTime * 0.03 * (0.5 + aSeed) + (1.0 - g) * aSeed * 2.4);
    start.y += sin(uTime * 0.25 + aSeed * 40.0) * 0.35 * (1.0 - g);

    vec3 pos = mix(start, aTarget, g);

    // Explosion: the shell bursts outward, then settles as orbiting dust.
    pos += normalize(aTarget) * uBurst * (0.9 + aSeed * 1.6);
    // Living shimmer on the formed shell.
    pos += normalize(aTarget) * sin(uTime * 0.8 + aSeed * 60.0) * 0.035 * g;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 90.0);
    vTwinkle = twinkle;
    vAlpha = mix(0.35, 1.0, g) * (0.75 + uFlash * 0.9);

    gl_PointSize = aScale * uPixelRatio * twinkle * (120.0 / -mv.z) * (0.65 + 0.55 * g + uFlash * 0.5);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uFlash;
  varying float vColorMix;
  varying float vAlpha;
  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.06, d) * vAlpha;

    vec3 cyan = vec3(0.15, 0.85, 1.0);
    vec3 violet = vec3(0.55, 0.32, 1.0);
    vec3 gold = vec3(1.0, 0.72, 0.30);

    vec3 color = mix(cyan, violet, smoothstep(0.1, 0.75, vColorMix));
    color = mix(color, gold, smoothstep(0.78, 0.98, vColorMix));
    color *= (0.75 + vTwinkle * 0.6 + uFlash * 1.6);

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Cosmic dust & light particles: scattered in darkness, they swirl together
 * to form the planet's shell, burst at the explosion, then live on as a
 * shimmering orbital halo.
 */
export default function ParticleField({ count = 9000 }: { count?: number }) {
  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3); // scattered start
    const targets = new Float32Array(count * 3); // planet shell (fibonacci sphere)
    const delays = new Float32Array(count);
    const scales = new Float32Array(count);
    const colorMix = new Float32Array(count);
    const seeds = new Float32Array(count);

    const golden = Math.PI * (3 - Math.sqrt(5));
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    for (let i = 0; i < count; i++) {
      // Start: random direction, far shell + flattened disc component.
      const dir = new THREE.Vector3().randomDirection();
      const radius = rand(6.5, 17);
      positions[i * 3] = dir.x * radius;
      positions[i * 3 + 1] = dir.y * radius * rand(0.35, 1);
      positions[i * 3 + 2] = dir.z * radius;

      // Target: even fibonacci distribution hugging the planet surface.
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const shell = PLANET_RADIUS * rand(1.01, 1.09);
      targets[i * 3] = Math.cos(theta) * r * shell;
      targets[i * 3 + 1] = y * shell;
      targets[i * 3 + 2] = Math.sin(theta) * r * shell;

      delays[i] = Math.random() * 0.55;
      scales[i] = rand(0.55, 1.9);
      colorMix[i] = Math.random();
      seeds[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3));
    geo.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aColorMix', new THREE.BufferAttribute(colorMix, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    return {
      geometry: geo,
      uniforms: {
        uTime: { value: 0 },
        uGather: { value: 0 },
        uBurst: { value: 0 },
        uFlash: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
      },
    };
  }, [count]);

  useFrame((state) => {
    const s = getIntroState(introTime());
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uGather.value = s.gather;
    uniforms.uBurst.value = s.burst;
    uniforms.uFlash.value = s.flash;
    uniforms.uPixelRatio.value = Math.min(state.viewport.dpr, 1.75);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
