'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { FRAME_GAP, frameNumber, type StripFrame } from './film-model';

/*
 * A 35mm roll in space: frames slide along a fixed wave (with a gentle roll)
 * as the visitor scrolls. Geometry is deformed on the CPU each frame — only
 * the dozen frames near the gate exist — so pointer hit-testing is exact.
 * Each frame's film (base, sprocket holes, edge print, numbers) is a small
 * canvas texture; the photograph is composited into its window in a shader.
 */

const IMAGE_H = 1; // image window height (strip units)
const BORDER = 0.21; // film border above and below the window
const FILM_H = IMAGE_H + BORDER * 2;
const SEGMENTS = 28;
const WINDOW = 7.5; // strip units kept alive either side of the gate
const PX = 240; // canvas pixels per strip unit

export interface GLPhoto {
  url: string;
}

interface Props {
  frames: StripFrame[];
  photos: GLPhoto[];
  position: MotionValue<number>;
  edge: string;
  active: boolean;
  onHover: (photo: number | null, point: { x: number; y: number } | null) => void;
  onOpen: (photo: number, rect: DOMRect) => void;
  onReady: () => void;
}

/** The wave the roll travels along, in normalised units (x' = distance from the gate). */
function curve(x: number, out: THREE.Vector3) {
  return out.set(x, 0.16 * Math.sin(0.95 * x + 0.5), 0.5 * (Math.cos(0.62 * x) - 1));
}
function roll(x: number) {
  return 0.2 * Math.sin(0.8 * x - 0.4);
}

function drawFilm(width: number, index: number | null, edge: string): HTMLCanvasElement {
  const full = width + FRAME_GAP;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(full * PX);
  canvas.height = Math.round(FILM_H * PX);
  const g = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  const b = BORDER * PX;
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#2b353e');
  grad.addColorStop(0.5, '#222b33');
  grad.addColorStop(1, '#1d252c');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  // Unexposed window (shown for leader film and until the photo loads)
  const gx = (FRAME_GAP / 2) * PX;
  g.fillStyle = index === null ? '#2f3a44' : '#33404b';
  g.fillRect(gx, b, W - gx * 2, H - b * 2);
  // Edge print and frame numbers
  g.fillStyle = 'rgba(232, 238, 241, 0.86)';
  g.textBaseline = 'middle';
  g.font = `600 ${Math.round(b * 0.27)}px ui-monospace, Consolas, monospace`;
  if (index !== null) {
    g.fillText(edge, gx + b * 0.4, b * 0.2);
    g.font = `700 ${Math.round(b * 0.3)}px ui-monospace, Consolas, monospace`;
    g.fillText(frameNumber(index), gx + b * 0.5, H - b * 0.2);
    g.fillText('▸', W * 0.42, H - b * 0.2);
    g.fillText(frameNumber(index, true), W * 0.5, H - b * 0.2);
  }
  // Sprocket holes, cut out so the page shows through
  g.globalCompositeOperation = 'destination-out';
  const pitch = 0.19 * PX;
  const hw = 0.09 * PX;
  const hh = 0.075 * PX;
  const r = hh * 0.28;
  const hole = (x: number, y: number) => {
    g.beginPath();
    g.roundRect(x, y, hw, hh, r);
    g.fill();
  };
  for (let x = pitch * 0.25; x + hw < W; x += pitch) {
    hole(x, b * 0.48);
    hole(x, H - b * 0.48 - hh);
  }
  g.globalCompositeOperation = 'source-over';
  return canvas;
}

const vertexShader = /* glsl */ `
  attribute vec3 aNormal;
  varying vec2 vUv;
  varying float vShade;
  void main() {
    vUv = uv;
    vec3 n = normalize(aNormal);
    vec3 light = normalize(vec3(0.35, 0.6, 1.0));
    vShade = 0.8 + 0.28 * abs(dot(n, light));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  uniform sampler2D uFilm;
  uniform sampler2D uPhoto;
  uniform float uHasPhoto;
  uniform vec4 uWin;
  uniform float uHover;
  varying vec2 vUv;
  varying float vShade;
  void main() {
    vec4 film = texture2D(uFilm, vUv);
    if (film.a < 0.5) discard;
    vec3 color = film.rgb;
    vec2 w = (vUv - uWin.xy) / (uWin.zw - uWin.xy);
    if (uHasPhoto > 0.5 && w.x >= 0.0 && w.x <= 1.0 && w.y >= 0.0 && w.y <= 1.0) {
      color = texture2D(uPhoto, w).rgb;
      color *= 1.0 + 0.05 * uHover;
    }
    gl_FragColor = vec4(color * vShade, 1.0);
    #include <colorspace_fragment>
  }
`;

const textureCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();
function photoTexture(url: string, onLoad: () => void): THREE.Texture {
  const cached = textureCache.get(url);
  if (cached) {
    textureCache.delete(url);
    textureCache.set(url, cached); // LRU touch
    return cached;
  }
  const texture = loader.load(url, () => onLoad());
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(url, texture);
  while (textureCache.size > 40) {
    const [oldest, value] = textureCache.entries().next().value as [string, THREE.Texture];
    value.dispose();
    textureCache.delete(oldest);
  }
  return texture;
}

function FrameMesh({
  frame,
  photo,
  edge,
  shared,
  onHover,
  onOpen,
}: {
  frame: StripFrame;
  photo: GLPhoto | null;
  edge: string;
  shared: React.RefObject<{ pos: number; scale: number }>;
  onHover: Props['onHover'];
  onOpen: Props['onOpen'];
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const { invalidate, camera, size } = useThree();
  const [loaded, setLoaded] = useState(false);
  const full = frame.width + FRAME_GAP;
  const start = frame.start - FRAME_GAP / 2;

  const { geometry, material } = useMemo(() => {
    const count = (SEGMENTS + 1) * 2;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aNormal', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const uv = new Float32Array(count * 2);
    const index: number[] = [];
    for (let i = 0; i <= SEGMENTS; i += 1) {
      const u = i / SEGMENTS;
      uv.set([u, 0, u, 1], i * 4);
      if (i < SEGMENTS) {
        const a = i * 2;
        index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(index);
    const film = new THREE.CanvasTexture(drawFilm(frame.width, frame.photo, edge));
    film.colorSpace = THREE.SRGBColorSpace;
    film.anisotropy = 4;
    const gu = FRAME_GAP / 2 / full;
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uFilm: { value: film },
        uPhoto: { value: null },
        uHasPhoto: { value: 0 },
        uWin: { value: new THREE.Vector4(gu, BORDER / FILM_H, 1 - gu, 1 - BORDER / FILM_H) },
        uHover: { value: 0 },
      },
    });
    return { geometry: geo, material: mat };
  }, [frame.width, frame.photo, edge, full]);

  useEffect(() => () => {
    geometry.dispose();
    (material.uniforms.uFilm.value as THREE.Texture).dispose();
    material.dispose();
  }, [geometry, material]);

  useEffect(() => {
    if (!photo) return;
    const texture = photoTexture(photo.url, () => {
      setLoaded(true);
      invalidate();
    });
    material.uniforms.uPhoto.value = texture;
    if (texture.image && (texture.image as HTMLImageElement).complete) setLoaded(true);
  }, [photo, material, invalidate]);

  useEffect(() => {
    material.uniforms.uHasPhoto.value = loaded ? 1 : 0;
    invalidate();
  }, [loaded, material, invalidate]);

  const tmp = useMemo(() => ({ c: new THREE.Vector3(), d: new THREE.Vector3(), t: new THREE.Vector3(), a: new THREE.Vector3(), n: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), []);

  useFrame(() => {
    const { pos, scale } = shared.current;
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const normal = geometry.attributes.aNormal as THREE.BufferAttribute;
    for (let i = 0; i <= SEGMENTS; i += 1) {
      const x = start + (i / SEGMENTS) * full - pos;
      curve(x, tmp.c);
      curve(x + 0.01, tmp.d);
      tmp.t.subVectors(tmp.d, tmp.c).normalize();
      tmp.a.copy(tmp.up).addScaledVector(tmp.t, -tmp.up.dot(tmp.t)).normalize();
      const r = roll(x);
      tmp.n.crossVectors(tmp.t, tmp.a);
      const ax = tmp.a.x * Math.cos(r) + tmp.n.x * Math.sin(r);
      const ay = tmp.a.y * Math.cos(r) + tmp.n.y * Math.sin(r);
      const az = tmp.a.z * Math.cos(r) + tmp.n.z * Math.sin(r);
      for (const [k, v] of [[0, -0.5], [1, 0.5]] as const) {
        position.setXYZ(i * 2 + k, (tmp.c.x + ax * v * FILM_H) * scale, (tmp.c.y + ay * v * FILM_H) * scale, (tmp.c.z + az * v * FILM_H) * scale);
      }
      tmp.n.set(ax, ay, az).cross(tmp.t);
      normal.setXYZ(i * 2, tmp.n.x, tmp.n.y, tmp.n.z);
      normal.setXYZ(i * 2 + 1, tmp.n.x, tmp.n.y, tmp.n.z);
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  /** Screen rectangle of the photograph window, for the viewer's opening move. */
  const windowRect = () => {
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const gu = Math.round((FRAME_GAP / 2 / full) * SEGMENTS);
    const xs: number[] = [];
    const ys: number[] = [];
    const v = new THREE.Vector3();
    for (let i = gu; i <= SEGMENTS - gu; i += 2) {
      for (const k of [0, 1]) {
        v.fromBufferAttribute(position, i * 2 + k).project(camera);
        xs.push(((v.x + 1) / 2) * size.width);
        ys.push(((1 - v.y) / 2) * size.height);
      }
    }
    const inset = (BORDER / FILM_H) * (Math.max(...ys) - Math.min(...ys));
    return new DOMRect(Math.min(...xs), Math.min(...ys) + inset, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys) - inset * 2);
  };

  const interactive = frame.photo !== null;
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      onPointerMove={interactive ? (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        material.uniforms.uHover.value = 1;
        onHover(frame.photo, { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY });
        invalidate();
      } : undefined}
      onPointerOut={interactive ? () => {
        material.uniforms.uHover.value = 0;
        onHover(null, null);
        invalidate();
      } : undefined}
      onClick={interactive ? (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const canvasRect = (event.nativeEvent.target as HTMLElement).getBoundingClientRect();
        const r = windowRect();
        onOpen(frame.photo as number, new DOMRect(r.x + canvasRect.left, r.y + canvasRect.top, r.width, r.height));
      } : undefined}
    />
  );
}

function Roll({ frames, photos, position, edge, onHover, onOpen }: Omit<Props, 'active' | 'onReady'>) {
  const { viewport, invalidate } = useThree();
  const shared = useRef({ pos: position.get(), scale: 1 });
  const [range, setRange] = useState<[number, number]>([0, 0]);

  // Strip scale: the roll takes ~half the stage height (about three frames
  // across on a desktop, as on the reference); on portrait phones a 1.6:1
  // frame is capped at ~82% of the width.
  shared.current.scale = Math.min((viewport.height * 0.5) / FILM_H, (viewport.width * 0.82) / 1.6);

  useEffect(() => position.on('change', () => invalidate()), [position, invalidate]);
  useEffect(() => invalidate(), [range, invalidate]);

  useFrame((_, delta) => {
    const target = position.get();
    const s = shared.current;
    const step = Math.min(1, Math.min(delta, 1 / 30) * 7);
    s.pos += (target - s.pos) * step;
    if (Math.abs(target - s.pos) > 1e-4) invalidate();
    const first = frames.findIndex((frame) => frame.start + frame.width > s.pos - WINDOW);
    let last = first;
    while (last + 1 < frames.length && frames[last + 1].start < s.pos + WINDOW) last += 1;
    if (first !== range[0] || last !== range[1]) setRange([first, last]);
  });

  return (
    <group>
      {frames.slice(Math.max(0, range[0]), range[1] + 1).map((frame) => (
        <FrameMesh
          key={`${frame.photo ?? 'leader'}-${frame.start.toFixed(3)}`}
          frame={frame}
          photo={frame.photo === null ? null : photos[frame.photo]}
          edge={edge}
          shared={shared}
          onHover={onHover}
          onOpen={onOpen}
        />
      ))}
    </group>
  );
}

export default function FilmStripGL({ active, onReady, ...rest }: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? 'demand' : 'never'}
      camera={{ position: [0, 0, 6.2], fov: 32, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      onCreated={() => onReady()}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      aria-hidden="true"
    >
      <Roll {...rest} />
    </Canvas>
  );
}
