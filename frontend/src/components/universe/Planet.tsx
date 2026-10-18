import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const planetVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const planetFragmentShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z
    );
  }

  void main() {
    vec3 n = normalize(vNormal);
    float fresnel = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 2.2);
    float cloud = noise(vPosition * 2.8 + vec3(0.0, uTime * 0.035, 0.0));
    float bands = sin(vUv.y * 42.0 + cloud * 5.0 + uTime * 0.18) * 0.5 + 0.5;
    vec3 deep = vec3(0.025, 0.035, 0.16);
    vec3 violet = vec3(0.31, 0.08, 0.72);
    vec3 cyan = vec3(0.0, 0.9, 1.0);
    vec3 color = mix(deep, violet, smoothstep(0.22, 0.78, cloud));
    color = mix(color, cyan, smoothstep(0.68, 0.98, bands) * 0.34);
    color += cyan * fresnel * 1.5;
    color += violet * fresnel * 0.45;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface PlanetProps {
  progress?: number;
}

export default function Planet({ progress = 0 }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.045 + progress * 0.12;
      groupRef.current.scale.setScalar(1 - progress * 0.06);
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef} position={[3.7, 0, -5]}>
      <mesh scale={3}>
        <sphereGeometry args={[2.5, 128, 128]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={{ uTime: { value: 0 } }}
        />
      </mesh>

      <mesh scale={3.055}>
        <sphereGeometry args={[2.5, 96, 96]} />
        <meshBasicMaterial
          color="#00E5FF"
          side={THREE.BackSide}
          transparent
          opacity={0.11}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={3.09}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshBasicMaterial
          color="#7C3AED"
          side={THREE.BackSide}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
