import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { clamp01, easeOutCubic, getIntroState } from './introTimeline';
import { introTime, useUniverseStore } from './universeStore';
import { getGlowTexture } from './glowTexture';

/**
 * The SINA STUDIO AI emblem igniting over the newborn planet after the
 * explosion. The artwork lives on pure black, so additive blending drops
 * the background and leaves only the glowing chrome "S".
 */
export default function LogoReveal() {
  const groupRef = useRef<THREE.Group>(null);
  const logoRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const texture = useTexture('/assets/logo-sina-cropped.png');
  const glowTexture = useMemo(() => getGlowTexture(), []);

  useFrame((state) => {
    const s = getIntroState(introTime());
    const scroll = useUniverseStore.getState().scrollProgress;
    const elapsed = state.clock.elapsedTime;
    const reveal = s.logoReveal;
    const scrollFade = clamp01(1 - scroll * 2.4);

    if (groupRef.current) {
      groupRef.current.visible = reveal > 0.001 && scrollFade > 0.001;
      groupRef.current.position.y = 0.12 + Math.sin(elapsed * 0.7) * 0.05;
      groupRef.current.lookAt(state.camera.position);
    }
    if (logoRef.current) {
      // Slight overshoot as the emblem slams in, then a calm heroic float.
      const pop = 0.55 + 0.45 * easeOutCubic(reveal) + Math.sin(reveal * Math.PI) * 0.10;
      logoRef.current.scale.setScalar(Math.max(0.0001, pop));
      const m = logoRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = reveal * scrollFade;
    }
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.SpriteMaterial;
      m.opacity = (0.35 * reveal + s.flash * 0.4) * scrollFade;
      const gs = 4.6 * (0.6 + 0.4 * reveal) + s.flash * 2.5;
      glowRef.current.scale.set(gs, gs, 1);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.12, 1.62]}>
      <sprite ref={glowRef} position={[0, 0, -0.4]}>
        <spriteMaterial
          map={glowTexture}
          color="#3b82f6"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh ref={logoRef}>
        <planeGeometry args={[2.5, 2.56]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

useTexture.preload('/assets/logo-sina-cropped.png');
