import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { INTRO, easeOutExpo, getIntroState, segment } from './introTimeline';
import { introTime } from './universeStore';
import { getGlowTexture } from './glowTexture';

/** The explosion: a white-hot flash sprite plus twin expanding shockwave rings. */
export default function Shockwave() {
  const flashRef = useRef<THREE.Sprite>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const glowTexture = useMemo(() => getGlowTexture(), []);

  useFrame((state) => {
    const t = introTime();
    const s = getIntroState(t);

    if (flashRef.current) {
      const m = flashRef.current.material as THREE.SpriteMaterial;
      m.opacity = s.flash * 0.9;
      const scale = 13 + s.flash * 9;
      flashRef.current.scale.set(scale, scale, 1);
      flashRef.current.visible = s.flash > 0.01;
    }

    const applyRing = (mesh: THREE.Mesh | null, progress: number, maxRadius: number, maxOpacity: number) => {
      if (!mesh) return;
      const m = mesh.material as THREE.MeshBasicMaterial;
      const scale = 0.4 + progress * maxRadius;
      mesh.scale.set(scale, scale, 1);
      m.opacity = (1 - progress) * maxOpacity;
      mesh.visible = progress > 0 && progress < 1;
      mesh.lookAt(state.camera.position);
    };

    applyRing(ringARef.current, s.shockwave, 12, 0.95);
    const delayed = easeOutExpo(segment(t, INTRO.explosionAt + 0.16, INTRO.explosionEnd + 1.0));
    applyRing(ringBRef.current, delayed, 9.5, 0.6);
  });

  return (
    <group>
      <sprite ref={flashRef}>
        <spriteMaterial
          map={glowTexture}
          color="#d9f7ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <mesh ref={ringARef}>
        <ringGeometry args={[0.93, 1, 96]} />
        <meshBasicMaterial
          color="#a5f3fc"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ringBRef}>
        <ringGeometry args={[0.95, 1, 96]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
