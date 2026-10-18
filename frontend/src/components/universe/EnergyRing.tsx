import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface EnergyRingProps {
  progress?: number;
}

export default function EnergyRing({ progress = 0 }: EnergyRingProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;

    ringRef.current.rotation.z = state.clock.elapsedTime * 0.3 + progress * Math.PI * 1.5;
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 + progress * 0.25;
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.2, 0.04, 16, 200]} />
      <meshBasicMaterial color="#FF2E88" transparent opacity={0.55 + progress * 0.45} />
    </mesh>
  );
}
