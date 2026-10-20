import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export default function LogoCore() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current || !coreRef.current) return;

    groupRef.current.rotation.y += delta * 0.12;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
    coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0.7]}>
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.82, 1]} />
        <meshStandardMaterial
          color="#0D1B35"
          emissive="#00E5FF"
          emissiveIntensity={0.7}
          metalness={0.85}
          roughness={0.2}
          wireframe
        />
      </mesh>

      <mesh scale={0.76}>
        <icosahedronGeometry args={[0.82, 1]} />
        <meshStandardMaterial
          color="#101D3A"
          emissive="#7C3AED"
          emissiveIntensity={0.35}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      <Text
        position={[0, 0, 0.92]}
        fontSize={1.45}
        color="#E8FBFF"
        outlineWidth={0.025}
        outlineColor="#00E5FF"
        anchorX="center"
        anchorY="middle"
      >
        S
      </Text>
    </group>
  );
}
