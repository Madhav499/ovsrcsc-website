'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CYAN = '#52D5E8';
const SOLAR = '#E9A94B';
const IVORY = '#F6F3EC';
const TEAL = '#24A6A0';

function OrbitRing({
  radius,
  tilt,
  spin,
  animate,
}: {
  radius: number;
  tilt: [number, number, number];
  spin: number;
  animate: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (animate && group.current) {
      group.current.rotation.z += delta * spin;
    }
  });
  return (
    <group ref={group} rotation={tilt}>
      <mesh>
        <torusGeometry args={[radius, 0.012, 12, 96]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.65} />
      </mesh>
      <mesh position={[radius, 0, 0]}>
        <sphereGeometry args={[0.048, 16, 16]} />
        <meshBasicMaterial color={SOLAR} />
      </mesh>
      <mesh position={[-radius, 0, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color={CYAN} />
      </mesh>
    </group>
  );
}

function Nucleus({ animate }: { animate: boolean }) {
  const core = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (animate && core.current) {
      core.current.rotation.y += delta * 0.45;
      core.current.rotation.x += delta * 0.18;
    }
  });
  const points = useMemo(() => new THREE.IcosahedronGeometry(0.52, 1), []);
  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.42, 2]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.45} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[points]} />
        <lineBasicMaterial color={SOLAR} transparent opacity={0.9} />
      </lineSegments>
      <mesh>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshBasicMaterial color={SOLAR} />
      </mesh>
    </group>
  );
}

function Dust({ animate }: { animate: boolean }) {
  const field = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const array = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.85 + Math.random() * 0.85;
      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = (Math.random() - 0.5) * 2.6;
      array[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return array;
  }, []);
  useFrame((_, delta) => {
    if (animate && field.current) {
      field.current.rotation.y += delta * 0.06;
    }
  });
  return (
    <points ref={field}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={CYAN} size={0.024} transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

export default function ScienceScene({
  animate = true,
  className,
}: {
  animate?: boolean;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3.1], fov: 38 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Armillary animate={animate} />
      </Canvas>
    </div>
  );
}

function Armillary({ animate }: { animate: boolean }) {
  return (
    <Pivot animate={animate}>
      <Nucleus animate={animate} />
      <OrbitRing radius={0.95} tilt={[Math.PI / 3, 0.2, 0]} spin={0.28} animate={animate} />
      <OrbitRing radius={1.35} tilt={[Math.PI / 5, -0.5, 0.4]} spin={-0.2} animate={animate} />
      <OrbitRing radius={1.65} tilt={[Math.PI / 2.4, 0.9, 0]} spin={0.13} animate={animate} />
      <Dust animate={animate} />
    </Pivot>
  );
}

function Pivot({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (animate && group.current) {
      group.current.rotation.y += delta * 0.12;
    }
  });
  return <group ref={group}>{children}</group>;
}
