'use client';

/**
 * AssemblyScene — the WebGL particle assembly. ~14k additive gold/teal
 * particles scattered through a void converge into the CardIQ hero card.
 * Every particle is colored by the exact card-art pixel it lands on, and at
 * ~82% progress the actual textured card fades in inside the same group
 * while the particles melt into it — pointillist cloud → real card in one
 * continuous moment. Art comes from /card/card-front.png when present
 * (photoreal drop-in), else the procedural card face.
 *
 * One value (progressRef, 0→1) drives everything; ScrubHero maps scroll
 * into it. Fully reversible, no video, no assets required.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { drawFront, CARD_W, CARD_H } from './Card3D';
import { pickCardFace } from './cardArt';

const VERT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSolid;
  attribute vec3 aStart;
  attribute vec3 aColor;
  attribute float aDelay;
  attribute float aSize;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Per-particle staggered progress: each arrives in its own window
    float p = clamp((uProgress - aDelay) / max(1.0 - aDelay, 0.001), 0.0, 1.0);
    float e = p * p * (3.0 - 2.0 * p); // smoothstep ease

    vec3 pos = mix(aStart, position, e);

    // Swirl while unassembled — noise drift that dies as the particle lands
    float sw = 1.0 - e;
    pos += sw * sw * vec3(
      sin(uTime * 0.55 + aSeed * 6.2831 + pos.y * 0.45),
      cos(uTime * 0.48 + aSeed * 12.566 + pos.x * 0.4),
      sin(uTime * 0.62 + aSeed * 3.1415)
    ) * (0.5 + aSeed * 0.9);

    vColor = aColor;
    // Particles melt away as the real card solidifies beneath them
    vAlpha = mix(0.30, 0.95, e) * (1.0 - uSolid * 0.85);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPixelRatio * (8.0 / -mv.z) * mix(1.9, 0.85, e);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float m = smoothstep(0.5, 0.06, length(gl_PointCoord - 0.5));
    if (m < 0.01) discard;
    gl_FragColor = vec4(vColor, m * vAlpha);
  }
`;

/* Art canvas: prefer the photoreal drop-in, fall back to procedural */
function useArtCanvas() {
  const [art, setArt] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1434;
      const ctx = c.getContext('2d')!;
      // cover-fit the image into the 5:7 card face
      const s = Math.max(c.width / img.width, c.height / img.height);
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
      setArt(c);
    };
    img.onerror = () => {
      if (!cancelled) setArt(drawFront());
    };
    img.src = pickCardFace();
    return () => {
      cancelled = true;
    };
  }, []);

  return art;
}

function AssemblyGroup({
  art,
  progressRef,
}: {
  art: HTMLCanvasElement;
  progressRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const planeMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const { geometry, texture } = useMemo(() => {
    const count = window.innerWidth < 768 ? 7000 : 14000;
    const ctx = art.getContext('2d')!;
    const { width: tw, height: th } = art;
    const img = ctx.getImageData(0, 0, tw, th).data;

    const end = new Float32Array(count * 3);
    const start = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const delay = new Float32Array(count);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Bias sampling toward bright pixels (frame, nameplate, subject) so
      // the assembly reads as molten gold with sparse fill for the body.
      let u = 0.5, v = 0.5, r = 0, g = 0, b = 0;
      for (let attempt = 0; attempt < 5; attempt++) {
        u = Math.random();
        v = Math.random();
        const px = Math.min(tw - 1, (u * tw) | 0);
        const py = Math.min(th - 1, (v * th) | 0);
        const o = (py * tw + px) * 4;
        r = img[o] / 255; g = img[o + 1] / 255; b = img[o + 2] / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 0.16 || Math.random() < 0.3) break;
      }

      end[i * 3] = (u - 0.5) * CARD_W;
      end[i * 3 + 1] = (0.5 - v) * CARD_H;
      end[i * 3 + 2] = (Math.random() - 0.5) * 0.03;

      // Void: random shell around the card, pushed wide
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize();
      const radius = 7 + Math.random() * 8;
      start[i * 3] = dir.x * radius;
      start[i * 3 + 1] = dir.y * radius * 0.7;
      start[i * 3 + 2] = dir.z * radius * 0.6 - 1.5;

      const boost = 1.3;
      color[i * 3] = Math.min(1, r * boost + 0.04);
      color[i * 3 + 1] = Math.min(1, g * boost + 0.04);
      color[i * 3 + 2] = Math.min(1, b * boost + 0.05);

      delay[i] = Math.random() * 0.45;
      const sparkle = Math.random() < 0.04;
      size[i] = sparkle ? 6 + Math.random() * 4 : 2 + Math.random() * 3.5;
      seed[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(end, 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
    geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    const tex = new THREE.CanvasTexture(art);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;

    return { geometry: geo, texture: tex };
  }, [art]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uSolid: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    }),
    [],
  );

  useFrame((state) => {
    const p = progressRef.current;
    const solid = THREE.MathUtils.clamp((p - 0.82) / 0.18, 0, 1);
    if (matRef.current) {
      matRef.current.uniforms.uProgress.value = p;
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uSolid.value = solid;
    }
    if (planeMatRef.current) {
      planeMatRef.current.opacity = solid;
    }
    if (groupRef.current) {
      // The cloud carries a slow drift that settles as it assembles
      groupRef.current.rotation.y =
        (1 - p) * 0.6 + Math.sin(state.clock.elapsedTime * 0.14) * 0.05 * (1 - p);
      groupRef.current.rotation.x = (1 - p) * -0.12;
    }
  });

  return (
    <group ref={groupRef}>
      {/* The real card — fades in as the particles land on it */}
      <mesh renderOrder={0}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial
          ref={planeMatRef}
          map={texture}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <points geometry={geometry} frustumCulled={false} renderOrder={1}>
        <shaderMaterial
          ref={matRef}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function AssemblyScene({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const art = useArtCanvas();

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8], fov: 40 }}
      gl={{ antialias: false, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      {art && <AssemblyGroup art={art} progressRef={progressRef} />}
    </Canvas>
  );
}
