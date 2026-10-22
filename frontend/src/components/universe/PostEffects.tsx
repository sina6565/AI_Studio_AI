import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

/** Filmic finishing: HDR bloom for the glow cascade + a gentle vignette. */
export default function PostEffects({ samples = 4 }: { samples?: number }) {
  return (
    <EffectComposer multisampling={samples}>
      <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.16} luminanceSmoothing={0.22} />
      <Vignette offset={0.2} darkness={0.62} />
    </EffectComposer>
  );
}
