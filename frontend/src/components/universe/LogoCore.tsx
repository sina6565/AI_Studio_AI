import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

      <mesh position={[0, 0, 0.88]}>
        <planeGeometry args={[0.72, 0.92]} />
        <meshBasicMaterial color="#050816" />
      </mesh>
      <mesh position={[0, 0, 0.9]}>
        <planeGeometry args={[0.58, 0.78]} />
        <meshBasicMaterial color="#E8FBFF" />
      </mesh>
      <mesh position={[0, 0, 0.92]}>
        <planeGeometry args={[0.48, 0.68]} />
        <meshBasicMaterial color="#050816" />
      </mesh>
      <mesh position={[0, 0, 0.94]}>
        <planeGeometry args={[0.38, 0.56]} />
        <meshBasicMaterial color="#00E5FF" />
      </mesh>
    </group>
  );
}
