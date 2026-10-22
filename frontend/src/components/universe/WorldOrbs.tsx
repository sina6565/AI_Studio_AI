import { useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_COLORS, getIntroState, orbReveal } from './introTimeline';
import { introTime, useUniverseStore } from './universeStore';
import { getGlowTexture } from './glowTexture';

export const ORBIT_RADIUS = 3.45;

interface WorldOrbsProps {
  onSelectWorld: (index: number) => void;
}

/**
 * Six glowing worlds born from the explosion. Each orb ejects from the
 * planet's core into its tilted orbit; hovering highlights it, clicking
 * dives to the matching world section.
 */
export default function WorldOrbs({ onSelectWorld }: WorldOrbsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbsRef = useRef<(THREE.Group | null)[]>([]);
  const ringsRef = useRef<(THREE.Mesh | null)[]>([]);
  const glowTexture = useMemo(() => getGlowTexture(), []);
  const setActiveWorld = useUniverseStore((s) => s.setActiveWorld);

  useFrame((state) => {
    const s = getIntroState(introTime());
    const { activeWorld } = useUniverseStore.getState();
    const elapsed = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.045;
    }

    orbsRef.current.forEach((orb, i) => {
      if (!orb) return;
      const born = orbReveal(s.worldsReveal, i, WORLD_COLORS.length);
      const angle = (i / WORLD_COLORS.length) * Math.PI * 2;
      const target = new THREE.Vector3(
        Math.cos(angle) * ORBIT_RADIUS,
        Math.sin(elapsed * 0.6 + i * 1.7) * 0.10,
        Math.sin(angle) * ORBIT_RADIUS,
      );
      // Born at the core, ejected to orbit.
      orb.position.lerpVectors(new THREE.Vector3(0, 0, 0), target, born);
      const activeBoost = activeWorld === i ? 1.45 : 1;
      const pulse = 1 + Math.sin(elapsed * 1.8 + i * 2.1) * 0.07;
      orb.scale.setScalar(Math.max(0.0001, born * activeBoost * pulse));
      orb.visible = born > 0.002;
    });

    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const m = ring.material as THREE.MeshBasicMaterial;
      m.opacity = (i === 0 ? 0.5 : 0.32) * s.worldsReveal;
      ring.rotation.z = elapsed * (i === 0 ? 0.05 : -0.035);
    });
  });

  const handleOver = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setActiveWorld(i);
    document.body.style.cursor = 'pointer';
  };
  const handleOut = () => {
    setActiveWorld(-1);
    document.body.style.cursor = 'auto';
  };
  const handleClick = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectWorld(i);
  };

  return (
    <group rotation={[1.08, 0, 0.16]}>
      <group ref={groupRef}>
        {WORLD_COLORS.map((color, i) => (
          <group
            key={color}
            ref={(el) => {
              orbsRef.current[i] = el;
            }}
            onPointerOver={handleOver(i)}
            onPointerOut={handleOut}
            onClick={handleClick(i)}
          >
            <mesh>
              <sphereGeometry args={[0.165, 32, 24]} />
              <meshStandardMaterial
                color="#0a1128"
                emissive={color}
                emissiveIntensity={2.4}
                metalness={0.4}
                roughness={0.25}
              />
            </mesh>
            <sprite scale={[0.95, 0.95, 1]}>
              <spriteMaterial
                map={glowTexture}
                color={color}
                transparent
                opacity={0.75}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
            <pointLight color={color} intensity={2.2} distance={5.5} decay={0} />
          </group>
        ))}
      </group>

      {/* Orbital energy rings */}
      <mesh
        ref={(el) => {
          ringsRef.current[0] = el;
        }}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[ORBIT_RADIUS, 0.012, 8, 220]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh
        ref={(el) => {
          ringsRef.current[1] = el;
        }}
        rotation={[Math.PI / 2 + 0.22, 0.3, 0]}
      >
        <torusGeometry args={[ORBIT_RADIUS * 1.14, 0.009, 8, 220]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}
