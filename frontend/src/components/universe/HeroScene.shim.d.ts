import type { FC } from 'react';

/**
 * Type-level shim for the WebGL scene, seen by the main TypeScript program.
 *
 * Why: @react-three/fiber augments the global JSX.IntrinsicElements with
 * ~300 three.js elements. Combined with MUI v5's generic `sx`/Box prop
 * types, that makes the checker fail with TS2590 ("union type too complex")
 * in unrelated MUI pages. Vite still resolves `@/components/universe/
 * HeroScene` to the real HeroScene.tsx at runtime; the scene sources are
 * type-checked separately via `tsconfig.universe.json` (see npm scripts).
 */
declare const HeroScene: FC<{ onSelectWorld: (index: number) => void }>;

export default HeroScene;
