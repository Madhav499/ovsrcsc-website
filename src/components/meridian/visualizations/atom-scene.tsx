'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';

/*
 * The official OVSRCSC logo is an atom: three tilted elliptical orbits with
 * coloured electrons around a silver nucleus. This scene reinterprets that
 * mark as a brass-and-silver instrument in the heritage palette: polished
 * metal electrons and nucleons, hairline orbits — no glow effects.
 *
 * Everything that changes per frame (scroll progress, the visitor's drag,
 * the highlighted part) is read from refs and motion values inside
 * `useFrame`, so React never re-renders while the atom moves.
 */

export type AtomFocus = 'nucleus' | 'electrons' | 'orbits' | null;

export interface AtomControls {
  /** Visitor-controlled rotation targets, in radians. */
  yaw: MotionValue<number>;
  pitch: MotionValue<number>;
}

const CYAN = new THREE.Color('#D3B387'); // brass light
const TEAL = new THREE.Color('#A8BAAE'); // sage light
const AMBER = new THREE.Color('#B18A58'); // brass
const IVORY = new THREE.Color('#FAF8F2');

const ORBITS: Array<{ tilt: number; color: THREE.Color; speed: number; phase: number }> = [
  { tilt: -Math.PI / 6, color: CYAN, speed: 0.55, phase: 0 },
  { tilt: Math.PI / 6, color: TEAL, speed: 0.42, phase: 2.1 },
  { tilt: Math.PI / 2, color: AMBER, speed: 0.36, phase: 4.2 },
];

const RX = 1.55;
const RY = 0.52;

interface SceneState {
  focus: AtomFocus;
  progress?: MotionValue<number>;
  controls?: AtomControls;
}

type SceneRef = React.RefObject<SceneState>;

/** Opacity a part should ease toward for the current highlight. */
function targetOpacity(part: Exclude<AtomFocus, null>, focus: AtomFocus, base: number) {
  if (!focus) return base;
  return focus === part ? 1 : base * 0.18;
}

function ease(current: number, target: number, delta: number, rate = 6) {
  return current + (target - current) * Math.min(1, delta * rate);
}

function Orbit({
  tilt,
  color,
  speed,
  phase,
  index,
  animate,
  scene,
}: {
  tilt: number;
  color: THREE.Color;
  speed: number;
  phase: number;
  index: number;
  animate: boolean;
  scene: SceneRef;
}) {
  const plane = useRef<THREE.Group>(null);
  const electron = useRef<THREE.Group>(null);
  const line = useRef<THREE.LineBasicMaterial>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const t = useRef(phase);
  const geometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, RX, RY, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(160).map((p) => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame((_, delta) => {
    const { focus, progress } = scene.current;
    const p = progress?.get() ?? 0;
    // Scrolling out of the hero "opens" the atom: the orbital planes fan
    // apart and the electrons quicken, revealing its three-dimensional form.
    if (animate) t.current += delta * speed * (1 + p * 1.6);
    if (plane.current) plane.current.rotation.x = 0.35 + p * (index - 1) * 0.55;
    if (electron.current) {
      electron.current.position.set(Math.cos(t.current) * RX, Math.sin(t.current) * RY, 0);
      const s = focus === 'electrons' ? 1.45 : 1;
      electron.current.scale.setScalar(ease(electron.current.scale.x, s, delta));
    }
    if (line.current) line.current.opacity = ease(line.current.opacity, targetOpacity('orbits', focus, 0.7), delta);
    if (core.current) core.current.opacity = ease(core.current.opacity, targetOpacity('electrons', focus, 1), delta);
    if (halo.current) halo.current.opacity = ease(halo.current.opacity, targetOpacity('electrons', focus, 0.07), delta);
  });

  return (
    <group rotation={[0, 0, tilt]}>
      <group ref={plane} rotation={[0.35, 0, 0]}>
        <lineLoop geometry={geometry}>
          <lineBasicMaterial ref={line} color={color} transparent opacity={0.7} />
        </lineLoop>
        <group ref={electron}>
          <mesh>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial
              ref={core}
              color={color}
              emissive={color}
              emissiveIntensity={0.25}
              metalness={0.7}
              roughness={0.3}
              transparent
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshBasicMaterial
              ref={halo}
              color={color}
              transparent
              opacity={0.07}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Nucleus({ animate, scene }: { animate: boolean; scene: SceneRef }) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const materials = useMemo(
    () => ({
      ivory: new THREE.MeshStandardMaterial({ color: IVORY, metalness: 0.65, roughness: 0.28, transparent: true }),
      amber: new THREE.MeshStandardMaterial({ color: AMBER, metalness: 0.2, roughness: 0.28, transparent: true }),
    }),
    [],
  );
  useEffect(
    () => () => {
      materials.ivory.dispose();
      materials.amber.dispose();
    },
    [materials],
  );
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
    const { focus } = scene.current;
    const current = group.current;
    if (!current) return;
    if (animate) {
      current.rotation.y += delta * 0.35;
      current.rotation.x += delta * 0.12;
    }
    current.scale.setScalar(ease(current.scale.x, focus === 'nucleus' ? 1.6 : 1, delta));
    const opacity = targetOpacity('nucleus', focus, 1);
    materials.ivory.opacity = ease(materials.ivory.opacity, opacity, delta);
    materials.amber.opacity = materials.ivory.opacity;
    if (glow.current) glow.current.opacity = ease(glow.current.opacity, focus === 'nucleus' ? 0.14 : 0.05, delta);
  });

  return (
    <group ref={group}>
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.position} material={particle.amber ? materials.amber : materials.ivory}>
          <sphereGeometry args={[0.095, 20, 20]} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial ref={glow} color={CYAN} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function Dust({ animate, scene }: { animate: boolean; scene: SceneRef }) {
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
    const p = scene.current.progress?.get() ?? 0;
    if (animate && points.current) points.current.rotation.y += delta * (0.02 + p * 0.12);
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

function Rig({ animate, scene, children }: { animate: boolean; scene: SceneRef; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const clock = useRef(0);
  useFrame((_, delta) => {
    const current = group.current;
    if (!current) return;
    const { progress, controls } = scene.current;
    const p = progress?.get() ?? 0;
    const yaw = controls?.yaw.get() ?? 0;
    const pitch = controls?.pitch.get() ?? 0;
    if (animate) clock.current += delta;
    // Face-on like the logo at rest: a slow sway, a gentle ease toward the
    // pointer, the visitor's own drag, and a tilt that grows with scroll.
    const sway = Math.sin(clock.current * 0.22) * 0.32;
    const targetY = sway + (animate ? pointer.x * 0.18 : 0) + yaw;
    const targetX = (animate ? -pointer.y * 0.12 : 0) + pitch + p * 0.85;
    const rate = Math.min(1, delta * 3);
    current.rotation.y += (targetY - current.rotation.y) * rate;
    current.rotation.x += (targetX - current.rotation.x) * rate;
    current.scale.setScalar(1 + p * 0.3);
  });
  return <group ref={group}>{children}</group>;
}

export default function AtomScene({
  animate,
  active,
  onReady,
  focus = null,
  progress,
  controls,
}: {
  /** False under reduced motion: renders a still frame. */
  animate: boolean;
  /** False when off-screen: stops the render loop entirely. */
  active: boolean;
  onReady?: () => void;
  focus?: AtomFocus;
  /** 0 → 1 as the hero scrolls away. */
  progress?: MotionValue<number>;
  controls?: AtomControls;
}) {
  const scene = useRef<SceneState>({ focus, progress, controls });
  scene.current = { focus, progress, controls };

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
      <pointLight position={[-3, -2, 2]} intensity={6} color="#D3B387" distance={8} />
      <pointLight position={[2.5, -1.5, 1]} intensity={4} color="#A8BAAE" distance={7} />
      <Rig animate={animate} scene={scene}>
        <Nucleus animate={animate} scene={scene} />
        {ORBITS.map((orbit, index) => (
          <Orbit key={orbit.phase} {...orbit} index={index} animate={animate} scene={scene} />
        ))}
      </Rig>
      <Dust animate={animate} scene={scene} />
    </Canvas>
  );
}
