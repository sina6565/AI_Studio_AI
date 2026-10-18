import { remap } from "./progress";


interface WorldOrbsProps {
  progress: number;
}

const WORLDS = [
  { name: "GAME WORLD", color: "#7C3AED", position: [-4.2, 1.1, -3] as const },
  { name: "WEB WORLD", color: "#00E5FF", position: [-2.6, -1.4, -2] as const },
  { name: "VIDEO WORLD", color: "#FF2E88", position: [-0.9, 1.8, -4] as const },
  { name: "AUDIO WORLD", color: "#FFC857", position: [1.0, -1.7, -3] as const },
  { name: "CHARACTER WORLD", color: "#49F2B4", position: [3.0, 1.5, -3] as const },
  { name: "3D WORLD", color: "#5B8CFF", position: [4.4, -0.7, -4] as const },
] as const;

/** Six small world cores that emerge as the cinematic scroll reaches its final beat. */
export default function WorldOrbs({ progress }: WorldOrbsProps) {
  const worldsVisible = remap(progress, 0.75, 1.0);

  return (
    <group name="six-worlds">
      {WORLDS.map((world, index) => {
        const scale = 0.1 + worldsVisible;
        return (
          <group
            key={world.name}
            name={world.name}
            position={world.position}
            visible={worldsVisible > 0}
          >
            <mesh scale={scale}>
              <icosahedronGeometry args={[0.42, 2]} />
              <meshStandardMaterial
                color={world.color}
                emissive={world.color}
                emissiveIntensity={0.45 + worldsVisible * 1.8}
                metalness={0.65}
                roughness={0.22}
                transparent
                opacity={worldsVisible}
              />
            </mesh>
            <mesh scale={scale * 1.18}>
              <torusGeometry args={[0.48, 0.009, 8, 64]} />
              <meshBasicMaterial color={world.color} transparent opacity={worldsVisible * 0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
