import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

import Planet from "./Planet";
import LogoCore from "./LogoCore";
import PostEffects from "./PostEffects";
import EnergyRing from "./EnergyRing";

interface HeroSceneProps {
  progress?: number;
}

export default function HeroScene({ progress = 0 }: HeroSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      fallback={<div className="hero-scene-fallback" role="img" aria-label="Cinematic digital universe" />}
    >
      <color attach="background" args={["#050816"]} />
      <fog attach="fog" args={["#050816", 15, 50]} />

      <ambientLight intensity={1.2} />
      <pointLight position={[5, 5, 5]} intensity={20} color="#00E5FF" />
      <pointLight position={[-5, -5, -2]} intensity={8} color="#7C3AED" />

      <Stars radius={200} depth={70} count={7000} factor={6} saturation={0} fade />

      <Planet progress={progress} />
      <EnergyRing progress={progress} />
      <LogoCore />
      <PostEffects />
    </Canvas>
  );
}
