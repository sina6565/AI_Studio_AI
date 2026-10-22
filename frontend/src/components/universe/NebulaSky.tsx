import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getIntroState } from './introTimeline';
import { introTime } from './universeStore';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uFlash;
  varying vec3 vDir;

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
    float a = 0.55;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float clouds = fbm(dir * 3.1 + vec3(uTime * 0.008, 0.0, uTime * 0.005));
    float wisps = fbm(dir * 6.5 - vec3(0.0, uTime * 0.006, 0.0));

    vec3 deepSpace = vec3(0.008, 0.012, 0.045);
    vec3 violet = vec3(0.23, 0.07, 0.52);
    vec3 cyan = vec3(0.0, 0.45, 0.65);
    vec3 magenta = vec3(0.42, 0.05, 0.30);

    vec3 color = deepSpace;
    color += violet * smoothstep(0.42, 0.95, clouds) * 0.55;
    color += cyan * smoothstep(0.55, 1.0, wisps) * 0.34;
    color += magenta * smoothstep(0.62, 1.05, clouds * wisps * 2.2) * 0.30;

    // A warm galactic core glow low on the horizon.
    float core = pow(max(dot(dir, normalize(vec3(-0.45, -0.28, -0.85))), 0.0), 6.0);
    color += vec3(0.55, 0.28, 0.08) * core * 0.35;

    color *= mix(0.04, 1.0, uReveal);
    color += vec3(0.55, 0.8, 1.0) * uFlash * 0.22;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Inverted nebula dome — the deep-space backdrop that fades in from darkness. */
export default function NebulaSky() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uFlash: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const s = getIntroState(introTime());
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uReveal.value = s.nebula;
    uniforms.uFlash.value = s.flash;
  });

  return (
    <mesh scale={90} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 24]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
