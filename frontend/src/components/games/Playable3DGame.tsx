import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type Props = { width: number; depth: number; height: number };

const ORB_LAYOUT = [
  [-0.28, -0.12],
  [0.28, -0.12],
  [-0.28, 0.16],
  [0.28, 0.16],
  [0, 0.29],
] as const;

const HAZARD_LAYOUT = [
  [0, -0.02],
  [-0.16, 0.24],
  [0.16, 0.24],
] as const;

type GameKeys = Set<string>;

function GameWorld({
  width, depth, keys, finished, onCollect, onHit, onTime, onFinish,
}: Props & {
  keys: React.MutableRefObject<GameKeys>;
  finished: boolean;
  onCollect: () => void;
  onHit: () => void;
  onTime: (seconds: number) => void;
  onFinish: (result: 'won' | 'lost') => void;
}) {
  const player = useRef<THREE.Mesh>(null);
  const orbMeshes = useRef<Array<THREE.Mesh | null>>([]);
  const collected = useRef(new Set<number>());
  const hitCooldown = useRef(0);
  const elapsed = useRef(0);
  const lastSecond = useRef(90);
  const ended = useRef(false);
  const { camera } = useThree();
  const spawn = useRef(new THREE.Vector3(0, -depth * 0.34, 0.9));
  const orbPositions = useRef(ORB_LAYOUT.map(([x, y]) => new THREE.Vector3(width * x, depth * y, 1.15)));
  const hazardPositions = useRef(HAZARD_LAYOUT.map(([x, y]) => new THREE.Vector3(width * x, depth * y, 0.8)));
  const goal = useRef(new THREE.Vector3(0, depth * 0.37, 1.2));

  useEffect(() => {
    if (player.current) player.current.position.copy(spawn.current);
    collected.current.clear();
    orbMeshes.current.forEach((mesh) => { if (mesh) mesh.visible = true; });
    elapsed.current = 0;
    lastSecond.current = 90;
    ended.current = false;
  }, [width, depth]);

  useFrame((_, delta) => {
    if (!player.current || finished || ended.current) return;
    const body = player.current;
    elapsed.current += Math.min(delta, 0.05);
    const seconds = Math.max(0, 90 - Math.floor(elapsed.current));
    if (seconds !== lastSecond.current) {
      lastSecond.current = seconds;
      onTime(seconds);
    }
    if (seconds <= 0) {
      ended.current = true;
      onFinish('lost');
      return;
    }

    const pressed = keys.current;
    const x = Number(pressed.has('d') || pressed.has('arrowright')) - Number(pressed.has('a') || pressed.has('arrowleft'));
    const y = Number(pressed.has('w') || pressed.has('arrowup')) - Number(pressed.has('s') || pressed.has('arrowdown'));
    const direction = new THREE.Vector2(x, y);
    if (direction.lengthSq() > 0) {
      direction.normalize();
      body.position.x += direction.x * 6.2 * delta;
      body.position.y += direction.y * 6.2 * delta;
      body.rotation.z = Math.atan2(direction.y, direction.x) - Math.PI / 2;
    }
    body.position.x = THREE.MathUtils.clamp(body.position.x, -width / 2 + 1, width / 2 - 1);
    body.position.y = THREE.MathUtils.clamp(body.position.y, -depth / 2 + 1, depth / 2 - 1);

    const cameraTarget = new THREE.Vector3(body.position.x, body.position.y - 8.5, 7.5);
    camera.position.lerp(cameraTarget, 1 - Math.exp(-5 * delta));
    camera.lookAt(body.position.x, body.position.y + 1.5, 0.8);

    orbPositions.current.forEach((position, index) => {
      if (collected.current.has(index) || body.position.distanceTo(position) > 1.15) return;
      collected.current.add(index);
      const mesh = orbMeshes.current[index];
      if (mesh) mesh.visible = false;
      onCollect();
    });

    hitCooldown.current = Math.max(0, hitCooldown.current - delta);
    if (hitCooldown.current === 0 && hazardPositions.current.some((position) => body.position.distanceTo(position) < 1.2)) {
      hitCooldown.current = 1.4;
      body.position.copy(spawn.current);
      onHit();
    }

    if (collected.current.size === ORB_LAYOUT.length && body.position.distanceTo(goal.current) < 2.1) {
      ended.current = true;
      onFinish('won');
    }
  });

  return (
    <>
      <color attach="background" args={['#07101e']} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[width * 0.2, -depth * 0.3, height * 2]} intensity={2.2} />
      <pointLight position={[0, depth * 0.37, 2.5]} color="#22d3ee" intensity={100} distance={width} />
      <mesh position={[0, 0, -0.3]} receiveShadow>
        <boxGeometry args={[width, depth, 0.6]} />
        <meshStandardMaterial color="#273448" roughness={0.82} />
      </mesh>
      <mesh position={[-width / 2, 0, height / 2]}><boxGeometry args={[0.6, depth, height]} /><meshStandardMaterial color="#1a2b42" /></mesh>
      <mesh position={[width / 2, 0, height / 2]}><boxGeometry args={[0.6, depth, height]} /><meshStandardMaterial color="#1a2b42" /></mesh>
      <mesh position={[0, -depth / 2, height / 2]}><boxGeometry args={[width, 0.6, height]} /><meshStandardMaterial color="#1a2b42" /></mesh>
      <mesh position={[-width * 0.36, depth / 2, height / 2]}><boxGeometry args={[width * 0.28, 0.6, height]} /><meshStandardMaterial color="#1a2b42" /></mesh>
      <mesh position={[width * 0.36, depth / 2, height / 2]}><boxGeometry args={[width * 0.28, 0.6, height]} /><meshStandardMaterial color="#1a2b42" /></mesh>
      <mesh position={[0, depth / 2, height - 0.3]}><boxGeometry args={[width * 0.44, 0.6, 0.6]} /><meshStandardMaterial color="#1a2b42" /></mesh>
      {ORB_LAYOUT.map(([x, y], index) => (
        <mesh key={index} ref={(mesh) => { orbMeshes.current[index] = mesh; }} position={[width * x, depth * y, 1.15]}>
          <icosahedronGeometry args={[0.48, 1]} />
          <meshStandardMaterial color="#6ff7ff" emissive="#00a9d8" emissiveIntensity={2.1} metalness={0.25} roughness={0.25} />
        </mesh>
      ))}
      {HAZARD_LAYOUT.map(([x, y], index) => (
        <group key={index} position={[width * x, depth * y, 0.75]}>
          <mesh><dodecahedronGeometry args={[0.72, 0]} /><meshStandardMaterial color="#f0445c" emissive="#8c102b" emissiveIntensity={1.2} /></mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.9, 0.07, 8, 32]} /><meshStandardMaterial color="#ff8b62" emissive="#9d271a" /></mesh>
        </group>
      ))}
      <group position={[0, depth * 0.37, 1.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.45, 0.18, 16, 48]} /><meshStandardMaterial color="#d8a45b" metalness={0.75} roughness={0.2} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.15, 0.07, 12, 48]} /><meshStandardMaterial color="#22d3ee" emissive="#0b9fcb" emissiveIntensity={2.4} /></mesh>
      </group>
      <mesh ref={player} position={[0, -depth * 0.34, 0.9]} castShadow>
        <capsuleGeometry args={[0.42, 0.7, 6, 12]} />
        <meshStandardMaterial color="#f5c56d" metalness={0.25} roughness={0.38} />
      </mesh>
    </>
  );
}

export default function Playable3DGame({ width, depth, height }: Props) {
  const keys = useRef<GameKeys>(new Set());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [seconds, setSeconds] = useState(90);
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const [session, setSession] = useState(0);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        keys.current.add(key);
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const collect = useCallback(() => setScore((value) => Math.min(5, value + 1)), []);
  const hit = useCallback(() => setLives((value) => {
    const next = Math.max(0, value - 1);
    if (next === 0) setResult('lost');
    return next;
  }), []);
  const finish = useCallback((value: 'won' | 'lost') => setResult(value), []);

  const restart = () => {
    keys.current.clear();
    setScore(0); setLives(3); setSeconds(90); setResult(null); setSession((value) => value + 1);
  };
  const hold = (key: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    keys.current.add(key);
  };
  const release = (key: string) => () => keys.current.delete(key);

  return (
    <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#07101e', color: '#eaf6ff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '12px 16px', background: '#101d32', fontWeight: 700 }}>
        <span>Energy cores: {score}/5</span><span>Lives: {lives}</span><span>Time: {seconds}s</span>
      </div>
      <div style={{ height: 480, touchAction: 'none' }}>
        <Canvas key={session} camera={{ position: [0, -12, 8], up: [0, 0, 1], fov: 55 }}>
          <GameWorld
            width={width} depth={depth} height={height} keys={keys} finished={Boolean(result)}
            onCollect={collect} onHit={hit} onTime={setSeconds} onFinish={finish}
          />
        </Canvas>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: 12 }}>
        <span style={{ fontSize: 13, opacity: 0.85 }}>WASD / arrow keys · Touch: hold the direction pad · Collect all 5 cores, then enter the portal.</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 38px)', gridTemplateRows: 'repeat(2, 34px)', gap: 4 }}>
          <span />
          <button onPointerDown={hold('w')} onPointerUp={release('w')} onPointerLeave={release('w')} aria-label="Move forward">↑</button>
          <span />
          <button onPointerDown={hold('a')} onPointerUp={release('a')} onPointerLeave={release('a')} aria-label="Move left">←</button>
          <button onPointerDown={hold('s')} onPointerUp={release('s')} onPointerLeave={release('s')} aria-label="Move backward">↓</button>
          <button onPointerDown={hold('d')} onPointerUp={release('d')} onPointerLeave={release('d')} aria-label="Move right">→</button>
        </div>
        {result && <strong style={{ color: result === 'won' ? '#73f0bd' : '#ff8d9b' }}>{result === 'won' ? 'Level complete!' : 'Game over'}</strong>}
        <button onClick={restart} style={{ border: '1px solid #36cbe8', borderRadius: 8, padding: '8px 14px', color: '#7deaff', background: 'transparent', cursor: 'pointer' }}>Restart</button>
      </div>
      <div style={{ padding: '0 16px 14px', fontSize: 12, opacity: 0.7 }}>Browser gameplay prototype for testing. The native Unreal Engine 5 project remains a separate build target.</div>
    </div>
  );
}
