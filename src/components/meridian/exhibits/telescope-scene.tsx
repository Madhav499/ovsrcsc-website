'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/*
 * The Dobsonian reflector modelled in Blender (assets-src/3d/dobsonian-
 * telescope.blend → src/assets/meridian/models/dobsonian-telescope.glb, emitted
 * by the bundler as a content-hashed /_next/static asset). Node names from
 * the source drive the interaction:
 *   Rocker  — turns about the vertical axis (azimuth)
 *   OTA     — tilts about the bearing axis (altitude)
 *   OTA_axis — optical frame (Blender +Z → glTF +Y is the optical axis)
 *   ap_ / pm_ / sm_ / ep_ / fs_ / mt_ — the parts that can be highlighted
 */

export type TelescopePart = 'aperture' | 'primary' | 'secondary' | 'eyepiece' | 'finder' | 'mount';

const PART_PREFIX: Record<TelescopePart, string[]> = {
  aperture: ['ap_'],
  primary: ['pm_'],
  secondary: ['sm_'],
  eyepiece: ['ep_'],
  finder: ['fs_'],
  mount: ['mt_'],
};

const MODEL_URL = new URL('../../../assets/meridian/models/dobsonian-telescope.glb', import.meta.url).href;
const BRASS = new THREE.Color('#d3b387');

// Optical constants shared with the Blender source (metres, optical frame).
const ZB = -0.5;
const ZF = 0.56;
const FOCAL = 1.2;
const MIRROR_TOP = ZB + 0.012 + 0.02;
const FOCUSER_PHI = (-30 * Math.PI) / 180;

/** Blender (x, y, z) → glTF (x, z, −y), the exporter's Y-up conversion. */
const toGltf = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.z, -v.y);

/**
 * Computes the Newtonian light path exactly as built: parallel rays meet the
 * paraboloid, converge toward its focus, and are folded by the 45° flat.
 */
function lightPath(): THREE.Vector3[][] {
  const d = new THREE.Vector3(Math.cos(FOCUSER_PHI), Math.sin(FOCUSER_PHI), 0);
  const z = new THREE.Vector3(0, 0, 1);
  const n = d.clone().sub(z).normalize();
  const c = new THREE.Vector3(0, 0, ZF);
  const focus = new THREE.Vector3(0, 0, MIRROR_TOP + FOCAL);
  const folded = focus.clone().sub(n.clone().multiplyScalar(2 * focus.clone().sub(c).dot(n)));
  const rays: THREE.Vector3[][] = [];
  for (const s of [-0.075, -0.045, 0.045, 0.075]) {
    const start = d.clone().multiplyScalar(s).setZ(0.95);
    const hit = d.clone().multiplyScalar(s).setZ(MIRROR_TOP + (s * s) / (4 * FOCAL));
    const dir = focus.clone().sub(hit).normalize();
    const t = c.clone().sub(hit).dot(n) / dir.dot(n);
    const onSecondary = hit.clone().add(dir.multiplyScalar(t));
    rays.push([start, hit, onSecondary, folded].map(toGltf));
  }
  return rays;
}

export interface TelescopeSceneState {
  part: TelescopePart | null;
  xray: boolean;
  altitude: number; // degrees
}

function Model({ state, yaw, onReady }: { state: React.RefObject<TelescopeSceneState>; yaw: MotionValue<number>; onReady: () => void }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const { invalidate } = useThree();
  // One pure memo: clone the scene, give it its own materials, collect handles.
  // (Never mutate shared objects in a memo — React may call it twice.)
  const { scene, handles } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const meshes: Array<{ mesh: THREE.Mesh; part: TelescopePart | null; tube: boolean; materials: THREE.MeshStandardMaterial[] }> = [];
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Own material instances so highlighting one part never affects another.
      const list = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => (m as THREE.MeshStandardMaterial).clone());
      mesh.material = Array.isArray(mesh.material) ? list : list[0];
      const name = mesh.name;
      const part = (Object.keys(PART_PREFIX) as TelescopePart[]).find((key) => PART_PREFIX[key].some((p) => name.startsWith(p))) ?? null;
      meshes.push({ mesh, part, tube: name.startsWith('tube_body') || name.startsWith('ap_ring'), materials: list });
    });
    const rocker = scene.getObjectByName('Rocker');
    const ota = scene.getObjectByName('OTA');
    const axis = scene.getObjectByName('OTA_axis');
    const rays = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({ color: BRASS, transparent: true, opacity: 0, depthTest: false });
    for (const points of lightPath()) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial);
      line.renderOrder = 10;
      rays.add(line);
    }
    axis?.add(rays);
    return { scene, handles: { meshes, rocker, ota, lineMaterial } };
  }, [gltf]);

  useEffect(() => {
    onReady();
    return () => {
      for (const { materials } of handles.meshes) materials.forEach((m) => m.dispose());
      handles.lineMaterial.dispose();
    };
  }, [handles, onReady]);

  useFrame((_, delta) => {
    const s = state.current;
    if (!s) return;
    // Clamp: after an idle period a demand frame can report a delta of seconds.
    const rate = Math.min(1, Math.min(delta, 1 / 30) * 6);
    let moving = false;
    const approach = (current: number, target: number) => {
      const next = current + (target - current) * rate;
      if (Math.abs(target - next) > 1e-4) moving = true;
      return Math.abs(target - next) > 1e-4 ? next : target;
    };
    if (handles.ota) handles.ota.rotation.x = approach(handles.ota.rotation.x, THREE.MathUtils.degToRad(s.altitude));
    if (handles.rocker) handles.rocker.rotation.y = approach(handles.rocker.rotation.y, yaw.get());
    const inside = s.xray || s.part === 'primary' || s.part === 'secondary';
    for (const { part, tube, materials } of handles.meshes) {
      const highlight = s.part !== null && part === s.part;
      for (const m of materials) {
        const targetOpacity = tube && inside ? 0.14 : 1;
        const transparent = targetOpacity < 1 || m.opacity < 0.999;
        if (transparent !== m.transparent) {
          // Switching blending needs a shader recompile.
          m.transparent = transparent;
          m.depthWrite = !transparent;
          m.needsUpdate = true;
        }
        m.opacity = approach(m.opacity, targetOpacity);
        m.emissive.copy(BRASS);
        m.emissiveIntensity = approach(m.emissiveIntensity, highlight ? 0.45 : 0);
      }
    }
    handles.lineMaterial.opacity = approach(handles.lineMaterial.opacity, inside ? 0.95 : 0);
    if (moving) invalidate();
  });

  return <primitive object={scene} />;
}

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

export default function TelescopeScene({
  state,
  yaw,
  version,
  onReady,
}: {
  state: React.RefObject<TelescopeSceneState>;
  yaw: MotionValue<number>;
  /** Bumped by the parent whenever state changes, to request a frame. */
  version: number;
  onReady: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop="demand"
      camera={{ position: [2.35, 1.35, 2.55], fov: 30, near: 0.05, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 0.6, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      aria-hidden="true"
    >
      <Invalidator version={version} yaw={yaw} />
      <Environment />
      <hemisphereLight args={['#fffdf8', '#344c43', 0.55]} />
      <directionalLight position={[2.5, 3.5, 2]} intensity={1.6} color="#fff6e8" />
      <directionalLight position={[-2.5, 1.5, -1.5]} intensity={0.55} color="#d3e0d8" />
      <Model state={state} yaw={yaw} onReady={onReady} />
    </Canvas>
  );
}

function Invalidator({ version, yaw }: { version: number; yaw: MotionValue<number> }) {
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [version, invalidate]);
  useEffect(() => yaw.on('change', () => invalidate()), [yaw, invalidate]);
  return null;
}
