import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getIntroState } from './introTimeline';
import { introTime, useUniverseStore } from './universeStore';
import { getGlowTexture } from './glowTexture';

export const PLANET_RADIUS = 2.1;

const NOISE_GLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`;

const surfaceVertex = /* glsl */ `
  varying vec3 vObj;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vObj = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const surfaceFragment = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uFlash;
  varying vec3 vObj;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  ${NOISE_GLSL}

  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    vec3 dir = normalize(vObj);
    vec3 sunDir = normalize(vec3(0.55, 0.38, 0.74));

    // --- Terrain: procedural continents in object space (fixed to surface).
    float continents = fbm(dir * 2.3 + vec3(11.3, 4.7, 8.9));
    float detail = fbm(dir * 8.5 + vec3(3.1));
    float land = smoothstep(0.50, 0.545, continents + (detail - 0.5) * 0.14);
    float elevation = smoothstep(0.50, 0.88, continents);

    vec3 oceanDeep = vec3(0.012, 0.07, 0.22);
    vec3 oceanHigh = vec3(0.03, 0.22, 0.50);
    vec3 ocean = mix(oceanDeep, oceanHigh, fbm(dir * 5.0 + vec3(7.7)));

    vec3 landLow = vec3(0.13, 0.06, 0.30);   // violet rock
    vec3 landHigh = vec3(0.05, 0.42, 0.45);  // teal highlands
    vec3 landCol = mix(landLow, landHigh, elevation);
    landCol += vec3(0.35, 0.20, 0.05) * smoothstep(0.72, 0.95, detail) * elevation * 0.5;

    float ice = smoothstep(0.80, 0.93, abs(dir.y) + (detail - 0.5) * 0.28);
    vec3 surface = mix(ocean, landCol, land);
    surface = mix(surface, vec3(0.78, 0.92, 1.0), ice * 0.85);

    // --- Lighting: day/night terminator, ocean sun-glint, fresnel rim.
    float ndl = dot(n, sunDir);
    float day = smoothstep(-0.16, 0.42, ndl);
    float spec = pow(max(dot(reflect(-sunDir, n), viewDir), 0.0), 72.0) * (1.0 - land) * day;
    float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.6);

    vec3 color = surface * (0.045 + day * 1.1);
    color += vec3(0.65, 0.9, 1.0) * spec * 0.9;

    // Night side: glowing energy veins / city lights on land.
    float veins = smoothstep(0.60, 0.72, fbm(dir * 10.0 + vec3(3.7, 9.1, 1.3))) * land * (1.0 - day);
    color += mix(vec3(0.0, 0.85, 1.0), vec3(1.0, 0.7, 0.3), detail) * veins * 1.7;

    // Atmosphere rim in brand cyan → violet.
    color += mix(vec3(0.0, 0.65, 1.0), vec3(0.45, 0.2, 1.0), 0.5 + 0.5 * dir.y)
      * fresnel * (0.30 + 0.85 * day);

    // Birth & explosion energy.
    color += vec3(0.55, 0.9, 1.15) * uFlash * (0.30 + 0.9 * fresnel);
    color *= mix(0.0, 1.0, uReveal);
    color += vec3(0.0, 0.55, 0.85) * (1.0 - uReveal) * fresnel * 0.8 * uReveal;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const cloudFragment = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  varying vec3 vObj;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  ${NOISE_GLSL}

  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    vec3 dir = normalize(vObj);
    vec3 sunDir = normalize(vec3(0.55, 0.38, 0.74));
    float day = smoothstep(-0.2, 0.45, dot(n, sunDir));

    float clouds = fbm(dir * 3.4 + vec3(uTime * 0.012, 0.0, uTime * 0.004));
    float alpha = smoothstep(0.52, 0.78, clouds) * 0.5 * uReveal;
    vec3 color = mix(vec3(0.10, 0.16, 0.34), vec3(0.92, 0.98, 1.05), day);
    float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.0);
    alpha *= 0.55 + 0.45 * fresnel + 0.3 * day;

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform float uReveal;
  uniform float uFlash;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.72 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 3.5);
    vec3 color = mix(vec3(0.0, 0.55, 1.0), vec3(0.5, 0.25, 1.0), 0.45);
    gl_FragColor = vec4(color, 1.0) * intensity * (0.9 * uReveal + uFlash * 1.4);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * The newborn planet: fully procedural shader world with continents, oceans,
 * day/night terminator, glowing night veins, drifting clouds and atmosphere.
 */
export default function Planet() {
  const groupRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);

  const surfaceUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uReveal: { value: 0 }, uFlash: { value: 0 } }),
    [],
  );
  const cloudUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uReveal: { value: 0 } }),
    [],
  );
  const atmosphereUniforms = useMemo(
    () => ({ uReveal: { value: 0 }, uFlash: { value: 0 } }),
    [],
  );
  const glowTexture = useMemo(() => getGlowTexture(), []);

  useFrame((state) => {
    const s = getIntroState(introTime());
    const scroll = useUniverseStore.getState().scrollProgress;
    const elapsed = state.clock.elapsedTime;

    surfaceUniforms.uTime.value = elapsed;
    surfaceUniforms.uReveal.value = s.planetReveal;
    surfaceUniforms.uFlash.value = s.flash;
    cloudUniforms.uTime.value = elapsed;
    cloudUniforms.uReveal.value = s.planetReveal;
    atmosphereUniforms.uReveal.value = s.planetReveal;
    atmosphereUniforms.uFlash.value = s.flash;

    if (groupRef.current) {
      const scale = (0.86 + 0.14 * s.planetReveal) * (1 + s.flash * 0.025);
      groupRef.current.scale.setScalar(scale);
    }
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y = elapsed * 0.021 + scroll * 1.5;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = elapsed * 0.03 + scroll * 1.5;
    }
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.SpriteMaterial;
      m.opacity = 0.32 * s.nebula + s.flash * 0.55;
      const gs = 10.5 + s.flash * 5;
      glowRef.current.scale.set(gs, gs, 1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Halo behind the planet */}
      <sprite ref={glowRef} position={[0, 0, -1.6]}>
        <spriteMaterial
          map={glowTexture}
          color="#2563eb"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Surface */}
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[PLANET_RADIUS, 96, 64]} />
        <shaderMaterial
          vertexShader={surfaceVertex}
          fragmentShader={surfaceFragment}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudsRef} scale={1.018}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 48]} />
        <shaderMaterial
          vertexShader={surfaceVertex}
          fragmentShader={cloudFragment}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh scale={1.22}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 48]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmosphereUniforms}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
