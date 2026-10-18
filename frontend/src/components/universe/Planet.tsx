import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Planet() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <group position={[3.7, 0, -5]}>
      <mesh ref={meshRef} scale={3}>
        <sphereGeometry args={[2.5, 128, 128]} />
        <meshStandardMaterial
          color="#7C3AED"
          emissive="#00E5FF"
          emissiveIntensity={0.4}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>
      <mesh scale={3.04}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.07} />
      </mesh>
    </group>
  );
}
