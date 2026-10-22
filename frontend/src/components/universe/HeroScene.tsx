import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import NebulaSky from './NebulaSky';
import ParticleField from './ParticleField';
import Planet from './Planet';
import LogoReveal from './LogoReveal';
import WorldOrbs from './WorldOrbs';
import Shockwave from './Shockwave';
import PostEffects from './PostEffects';
import { getIntroState } from './introTimeline';
import { introTime, useUniverseStore } from './universeStore';

/**
 * Cinematic camera: dollies through the intro beats, absorbs the explosion
 * with a micro-shake, parallaxes with the mouse, and pulls back as the
 * visitor scrolls through the page's chapters.
 */
function CameraRig() {
  const pointer = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3(0, 0.62, 15.5));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame((state) => {
    const t = introTime();
    const s = getIntroState(t);
    const store = useUniverseStore.getState();
    const scroll = store.scrollProgress;
    if (s.done && !store.introDone) store.finishIntro();

    const aspect = state.size.width / Math.max(1, state.size.height);
    let z = s.cameraZ + scroll * 3.4;
    if (aspect < 1) z *= Math.pow(1 / Math.max(aspect, 0.4), 0.55);

    const elapsed = state.clock.elapsedTime;
    const shakeX = Math.sin(elapsed * 85) * 0.07 * s.flash;
    const shakeY = Math.cos(elapsed * 97) * 0.055 * s.flash;

    target.current.set(
      pointer.current.x * 0.55 + shakeX,
      0.62 + pointer.current.y * 0.32 + shakeY - scroll * 0.45,
      z,
    );
    state.camera.position.lerp(target.current, 0.05);
    state.camera.lookAt(0, 0.48 + scroll * 1.1, 0);
  });

  return null;
}

/**
 * The whole planetary system. It sits high in the hero (like the brand
 * mockup), then majestically rises and recedes as the page scrolls.
 */
function UniverseGroup({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const scroll = useUniverseStore.getState().scrollProgress;
    ref.current.position.y = 0.95 + scroll * 2.7;
    ref.current.rotation.y = scroll * 0.85;
    const scale = 1 - scroll * 0.16;
    ref.current.scale.setScalar(scale);
  });

  return <group ref={ref}>{children}</group>;
}

interface HeroSceneProps {
  onSelectWorld: (index: number) => void;
}

export default function HeroScene({ onSelectWorld }: HeroSceneProps) {
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');

  const quality = useMemo(() => {
    const coarse =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760);
    return coarse
      ? { particles: 4200, dpr: [1, 1.5] as [number, number], samples: 0 }
      : { particles: 9000, dpr: [1, 1.75] as [number, number], samples: 4 };
  }, []);

  // Pause rendering while the tab is hidden — cinema etiquette & battery.
  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? 'never' : 'always');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <Canvas
      dpr={quality.dpr}
      frameloop={frameloop}
      camera={{ position: [0, 0.62, 15.5], fov: 48, near: 0.1, far: 260 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
      fallback={
        <div className="hero-scene-fallback" role="img" aria-label="SINA STUDIO AI cinematic universe" />
      }
    >
      <color attach="background" args={['#010208']} />
      <ambientLight intensity={0.65} />
      <pointLight position={[6, 4, 6]} intensity={1.6} decay={0} color="#00e5ff" />
      <pointLight position={[-6, -3, 2]} intensity={1.1} decay={0} color="#7c3aed" />

      <Suspense fallback={null}>
        <NebulaSky />
        <Stars radius={85} depth={45} count={4200} factor={5} saturation={0.15} fade speed={0.6} />
        <UniverseGroup>
          <ParticleField count={quality.particles} />
          <Planet />
          <LogoReveal />
          <WorldOrbs onSelectWorld={onSelectWorld} />
          <Shockwave />
        </UniverseGroup>
        <CameraRig />
      </Suspense>

      <PostEffects samples={quality.samples} />
    </Canvas>
  );
}
