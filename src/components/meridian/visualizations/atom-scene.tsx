'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/*
 * The official OVSRCSC logo is an atom: three tilted elliptical orbits with
 * coloured electrons around a silver nucleus. This scene reinterprets that
 * mark in the MERIDIAN palette. Geometry is deliberately low-poly.
 */

const CYAN = new THREE.Color('#52D5E8');
const TEAL = new THREE.Color('#24A6A0');
const AMBER = new THREE.Color('#E9A94B');
const IVORY = new THREE.Color('#F6F3EC');

const ORBITS: Array<{ tilt: number; color: THREE.Color; speed: number; phase: number }> = [
  { tilt: -Math.PI / 6, color: CYAN, speed: 0.55, phase: 0 },
  { tilt: Math.PI / 6, color: TEAL, speed: 0.42, phase: 2.1 },
  { tilt: Math.PI / 2, color: AMBER, speed: 0.36, phase: 4.2 },
];

const RX = 1.55;
const RY = 0.52;

function Orbit({
  tilt,
  color,
  speed,
  phase,
  animate,
}: {
  tilt: number;
  color: THREE.Color;
  speed: number;
  phase: number;
  animate: boolean;
}) {
  const electron = useRef<THREE.Group>(null);
  const t = useRef(phase);
  const geometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, RX, RY, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(160).map((p) => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame((_, delta) => {
    if (animate) t.current += delta * speed;
    if (electron.current) {
      electron.current.position.set(Math.cos(t.current) * RX, Math.sin(t.current) * RY, 0);
    }
  });

  return (
    <group rotation={[0, 0, tilt]}>
      <group rotation={[0.35, 0, 0]}>
        <lineLoop geometry={geometry}>
          <lineBasicMaterial color={color} transparent opacity={0.7} />
        </lineLoop>
        <group ref={electron}>
          <mesh>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} roughness={0.35} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Nucleus({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    // A small, stable cluster of nucleons on a Fibonacci sphere.
    const count = 14;
    const list: Array<{ position: [number, number, number]; amber: boolean }> = [];
    for (let i = 0; i < count; i += 1) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = i * Math.PI * (3 - Math.sqrt(5));
      list.push({
        position: [Math.cos(theta) * radius * 0.17, y * 0.17, Math.sin(theta) * radius * 0.17],
        amber: i % 3 === 0,
      });
    }
    return list;
  }, []);

  useFrame((_, delta) => {
    if (animate && group.current) {
      group.current.rotation.y += delta * 0.35;
      group.current.rotation.x += delta * 0.12;
    }
  });

  return (
    <group ref={group}>
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.position}>
          <sphereGeometry args={[0.095, 20, 20]} />
          <meshStandardMaterial
            color={particle.amber ? AMBER : IVORY}
            metalness={particle.amber ? 0.2 : 0.65}
            roughness={0.28}
          />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function Dust({ animate }: { animate: boolean }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 320;
    const array = new Float32Array(count * 3);
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count; i += 1) {
      const radius = 1.9 + random() * 2.6;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = radius * Math.cos(phi) * 0.7;
      array[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 1;
    }
    return array;
  }, []);

  useFrame((_, delta) => {
    if (animate && points.current) points.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={IVORY} size={0.018} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

function Rig({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const clock = useRef(0);
  useFrame((_, delta) => {
    const current = group.current;
    if (!current) return;
    if (animate) clock.current += delta;
    // Keep the atom face-on like the logo: a slow sway plus a gentle ease
    // toward the pointer for depth, never a full turn that hides the orbits.
    const sway = Math.sin(clock.current * 0.22) * 0.32;
    const targetY = sway + (animate ? pointer.x * 0.22 : 0);
    const targetX = animate ? -pointer.y * 0.16 : 0;
    const ease = Math.min(1, delta * 2.2);
    current.rotation.y += (targetY - current.rotation.y) * ease;
    current.rotation.x += (targetX - current.rotation.x) * ease;
  });
  return <group ref={group}>{children}</group>;
}

export default function AtomScene({
  animate,
  active,
  onReady,
}: {
  /** False under reduced motion: renders a still frame. */
  animate: boolean;
  /** False when off-screen: stops the render loop entirely. */
  active: boolean;
  onReady?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active && animate ? 'always' : 'demand'}
      camera={{ position: [0, 0, 4.6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      onCreated={() => onReady?.()}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-3, -2, 2]} intensity={6} color="#52D5E8" distance={8} />
      <pointLight position={[2.5, -1.5, 1]} intensity={4} color="#E9A94B" distance={7} />
      <Rig animate={animate}>
        <Nucleus animate={animate} />
        {ORBITS.map((orbit) => (
          <Orbit key={orbit.phase} {...orbit} animate={animate} />
        ))}
      </Rig>
      <Dust animate={animate} />
    </Canvas>
  );
}
