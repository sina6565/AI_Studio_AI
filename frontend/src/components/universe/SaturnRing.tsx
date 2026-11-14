import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  INTRO,
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  segment,
  getIntroState,
} from './introTimeline';
import { introTime, useUniverseStore } from './universeStore';

/**
 * A warm metallic planetary ring that opens into two halves during the
 * explosion, leaving a clear visual window for the SINA emblem.
 */
export default function SaturnRing() {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const leftAccentRef = useRef<THREE.Group>(null);
  const rightAccentRef = useRef<THREE.Group>(null);
  const goldMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const accentMaterial = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = introTime();
    const intro = getIntroState(t);
    const scroll = useUniverseStore.getState().scrollProgress;
    const reveal = easeOutCubic(segment(t, INTRO.igniteStart + 0.12, INTRO.explosionAt + 0.42));
    const split = easeInOutCubic(segment(t, INTRO.explosionAt, INTRO.logoStart + 0.42));
    const visibility = reveal * clamp01(1 - scroll * 2.35);
    const separation = 0.62 * split;

    if (leftRef.current) {
      leftRef.current.position.x = -separation;
      leftRef.current.rotation.z = -0.11 * split;
    }
    if (rightRef.current) {
      rightRef.current.position.x = separation;
      rightRef.current.rotation.z = Math.PI + 0.11 * split;
    }
    if (leftAccentRef.current) {
      leftAccentRef.current.position.x = -separation * 1.015;
      leftAccentRef.current.rotation.z = -0.11 * split;
    }
    if (rightAccentRef.current) {
      rightAccentRef.current.position.x = separation * 1.015;
      rightAccentRef.current.rotation.z = Math.PI + 0.11 * split;
    }

    if (goldMaterial.current) {
      goldMaterial.current.opacity = visibility;
      goldMaterial.current.emissiveIntensity = 0.42 + intro.flash * 2.1;
    }
    if (accentMaterial.current) {
      accentMaterial.current.opacity = visibility * 0.72;
    }

    const drift = state.clock.elapsedTime * 0.018 + scroll * 0.18;
    [leftRef.current, rightRef.current, leftAccentRef.current, rightAccentRef.current]
      .forEach((group) => {
        if (group) group.rotation.y = drift;
      });
  });

  return (
    <group rotation={[1.12, 0.04, 0.18]}>
      <group ref={leftRef}>
        <mesh>
          <torusGeometry args={[2.76, 0.052, 16, 128, Math.PI - 0.16]} />
          <meshStandardMaterial
            ref={goldMaterial}
            color="#E8C36A"
            emissive="#9A5B16"
            emissiveIntensity={0.42}
            metalness={0.92}
            roughness={0.24}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group ref={rightRef}>
        <mesh rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[2.76, 0.052, 16, 128, Math.PI - 0.16]} />
          <meshStandardMaterial
            color="#E8C36A"
            emissive="#9A5B16"
            emissiveIntensity={0.42}
            metalness={0.92}
            roughness={0.24}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group ref={leftAccentRef}>
        <mesh>
          <torusGeometry args={[2.91, 0.012, 8, 128, Math.PI - 0.16]} />
          <meshBasicMaterial
            ref={accentMaterial}
            color="#FFE7A3"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
      <group ref={rightAccentRef}>
        <mesh rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[2.91, 0.012, 8, 128, Math.PI - 0.16]} />
          <meshBasicMaterial
            color="#FFE7A3"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
