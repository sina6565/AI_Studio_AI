import { Bloom, EffectComposer } from "@react-three/postprocessing";

export default function PostEffects() {
  return (
    <EffectComposer>
      <Bloom intensity={2.5} luminanceThreshold={0.15} luminanceSmoothing={0.9} />
    </EffectComposer>
  );
}
