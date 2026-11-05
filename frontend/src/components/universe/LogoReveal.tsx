import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { clamp01, easeOutCubic, getIntroState } from './introTimeline';
import { introTime, useUniverseStore } from './universeStore';
import { getGlowTexture } from './glowTexture';

/**
 * The SINA STUDIO AI emblem ignites over the newborn planet after the
 * explosion. It is scaled as the hero focal point so the brand remains legible
 * above the planetary system on desktop and compact mobile viewports.
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
      const pop = 0.7 + 0.42 * easeOutCubic(reveal) + Math.sin(reveal * Math.PI) * 0.12;
      logoRef.current.scale.setScalar(Math.max(0.0001, pop));
      const m = logoRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = reveal * scrollFade;
    }
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.SpriteMaterial;
      m.opacity = (0.42 * reveal + s.flash * 0.48) * scrollFade;
      const gs = 5.4 * (0.6 + 0.4 * reveal) + s.flash * 3.0;
      glowRef.current.scale.set(gs, gs, 1);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.12, 1.62]}>
      <sprite ref={glowRef} position={[0, 0, -0.4]}>
        <spriteMaterial
          map={glowTexture}
          color="#f6a82a"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh ref={logoRef}>
        <planeGeometry args={[3.1, 3.18]} />
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
