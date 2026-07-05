'use client';

/**
 * Card3D — the immersive WebGL hero centerpiece.
 * A gilt-edged, foil-finished trading card that drifts and rotates toward
 * the cursor. Front/back art is drawn procedurally to canvas textures
 * (no assets needed), but if /card/card-front.png or /card/card-back.png
 * exist in public/, they're used instead — drop in Gemini-generated card
 * art and it upgrades itself.
 */

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Float, Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { pickCardFace } from './cardArt';

export const CARD_W = 3.4;
export const CARD_H = 4.76; // 5:7 ratio
const TEX_W = 1024;
const TEX_H = 1434;

/* ── Canvas helpers ───────────────────────────────────────────────────────── */
function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  return { canvas, ctx: canvas.getContext('2d')! };
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ── Front face — Prizm-style rookie card ─────────────────────────────────── */
export function drawFront() {
  const { canvas, ctx } = makeCanvas();
  const w = TEX_W;
  const h = TEX_H;

  // Base navy gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#07101F');
  bg.addColorStop(0.45, '#12264D');
  bg.addColorStop(1, '#0A1730');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Diagonal foil streaks
  ctx.globalAlpha = 0.05;
  for (let i = -h; i < w; i += 34) {
    ctx.strokeStyle = i % 68 === 0 ? '#00D4AA' : '#F5C842';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Sunburst rays from behind the player
  ctx.save();
  ctx.translate(w / 2, 980);
  for (let r = 0; r < 26; r++) {
    ctx.rotate((Math.PI * 2) / 26);
    const ray = ctx.createLinearGradient(0, 0, 0, -900);
    ray.addColorStop(0, 'rgba(245,200,66,0.10)');
    ray.addColorStop(1, 'rgba(245,200,66,0)');
    ctx.fillStyle = ray;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-26, -900);
    ctx.lineTo(26, -900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Giant faint jersey number
  ctx.fillStyle = 'rgba(245,200,66,0.12)';
  ctx.font = '900 640px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('15', w / 2, 1020);
  ctx.textAlign = 'left';

  // Stylized QB silhouette — angular throwing pose
  ctx.save();
  ctx.shadowColor = 'rgba(245,200,66,0.55)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#050B15';
  ctx.strokeStyle = 'rgba(245,200,66,0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  const pts: Array<[number, number]> = [
    [430, 1060], [468, 930], [452, 800], [500, 645], [520, 520],
    [558, 472], [640, 424], [718, 362], [748, 300], [792, 332],
    [732, 402], [652, 492], [622, 562], [640, 700], [700, 860],
    [682, 1060], [604, 1060], [592, 902], [542, 822], [520, 952], [500, 1060],
  ];
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(588, 452, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Ball
  ctx.save();
  ctx.translate(806, 300);
  ctx.rotate(-0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, 44, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3D2410';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,200,66,0.7)';
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // Top-left chip — set + year
  ctx.strokeStyle = 'rgba(245,200,66,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(44, 44, 236, 66, 10);
  ctx.stroke();
  ctx.fillStyle = '#F5C842';
  ctx.font = '900 34px Arial';
  ctx.fillText("CARDIQ '23", 68, 89);

  // Top-right chip — grade
  ctx.fillStyle = 'rgba(6,14,28,0.85)';
  ctx.beginPath();
  ctx.roundRect(w - 244, 44, 200, 66, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,200,66,0.7)';
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 36px Arial';
  ctx.fillText('PSA 10', w - 208, 90);

  // Signal chip — the product tie-in
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.roundRect(w - 320, 1052, 276, 60, 10);
  ctx.fill();
  ctx.fillStyle = '#060E1C';
  ctx.font = '900 34px Arial';
  ctx.fillText('BUY  +34.2%', w - 296, 1094);

  // Gold nameplate band
  const plate = ctx.createLinearGradient(0, 1150, w, 1150);
  plate.addColorStop(0, '#D4A017');
  plate.addColorStop(0.5, '#FAE07A');
  plate.addColorStop(1, '#D4A017');
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.roundRect(44, 1150, w - 88, 128, 12);
  ctx.fill();
  ctx.fillStyle = '#0A1526';
  ctx.font = '900 84px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('MAHOMES', w / 2, 1238);
  ctx.textAlign = 'left';

  // Footer — series + serial + IQ mark
  ctx.fillStyle = 'rgba(184,192,208,0.75)';
  ctx.font = '700 30px Arial';
  ctx.fillText('ROOKIE PRIZM · 04/99', 48, 1358);
  ctx.fillStyle = '#F5C842';
  ctx.beginPath();
  ctx.roundRect(w - 116, 1318, 68, 56, 8);
  ctx.fill();
  ctx.fillStyle = '#0A1526';
  ctx.font = '900 34px Arial';
  ctx.fillText('IQ', w - 99, 1358);

  // Outer gold frame
  const frame = ctx.createLinearGradient(0, 0, w, h);
  frame.addColorStop(0, '#D4A017');
  frame.addColorStop(0.5, '#FAE07A');
  frame.addColorStop(1, '#A07810');
  ctx.strokeStyle = frame;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.roundRect(16, 16, w - 32, h - 32, 28);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(30, 30, w - 60, h - 60, 20);
  ctx.stroke();

  return canvas;
}

/* ── Back face — CardIQ brand ─────────────────────────────────────────────── */
function drawBack() {
  const { canvas, ctx } = makeCanvas();
  const w = TEX_W;
  const h = TEX_H;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0A1730');
  bg.addColorStop(0.5, '#07101F');
  bg.addColorStop(1, '#0A1730');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // IQ monogram
  ctx.fillStyle = 'rgba(245,200,66,0.9)';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 170, 330, 340, 340, 42);
  ctx.fill();
  ctx.fillStyle = '#0A1526';
  ctx.font = '900 200px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('IQ', w / 2, 570);

  ctx.fillStyle = 'rgba(232,237,245,0.9)';
  ctx.font = '900 74px Arial';
  ctx.fillText('CARDIQ', w / 2, 810);
  ctx.fillStyle = 'rgba(138,150,171,0.8)';
  ctx.font = '700 32px Arial';
  ctx.fillText('MARKET INTELLIGENCE', w / 2, 866);
  ctx.textAlign = 'left';

  // Faux stat rows
  for (let i = 0; i < 4; i++) {
    const y = 960 + i * 86;
    ctx.fillStyle = 'rgba(192,200,216,0.12)';
    ctx.beginPath();
    ctx.roundRect(120, y, w - 240, 52, 8);
    ctx.fill();
    ctx.fillStyle = i % 2 === 0 ? 'rgba(245,200,66,0.5)' : 'rgba(0,212,170,0.45)';
    ctx.beginPath();
    ctx.roundRect(120, y, (w - 240) * (0.35 + 0.16 * i), 52, 8);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(138,150,171,0.7)';
  ctx.font = '700 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('N° 0004 / 0099', w / 2, 1372);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(245,200,66,0.5)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(16, 16, w - 32, h - 32, 28);
  ctx.stroke();

  return canvas;
}

/* ── Texture hooks — prefer dropped-in art, fall back to procedural ───────── */
function useCardFaces() {
  const procedural = useMemo(
    () => ({ front: toTexture(drawFront()), back: toTexture(drawBack()) }),
    [],
  );
  const [override, setOverride] = useState<{ front?: THREE.Texture; back?: THREE.Texture }>({});

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const tryLoad = (url: string, key: 'front' | 'back') =>
      loader.load(
        url,
        (t) => {
          t.anisotropy = 8;
          t.colorSpace = THREE.SRGBColorSpace;
          setOverride((o) => ({ ...o, [key]: t }));
        },
        undefined,
        () => {}, // missing file → keep procedural art
      );
    tryLoad(pickCardFace(), 'front');
    tryLoad('/card/card-back.jpg', 'back');
  }, []);

  return {
    front: override.front ?? procedural.front,
    back: override.back ?? procedural.back,
  };
}

/* ── The card mesh — gilt edge + printed faces with foil clearcoat ────────── */
function CardMesh() {
  const group = useRef<THREE.Group>(null);
  const yaw = useRef(0);
  const { front, back } = useCardFaces();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    // Slow showcase spin (full turn ~26s) with cursor tilt layered on top —
    // front, gilt edge, and back all get their moment.
    yaw.current += delta * 0.24;
    const targetY = yaw.current + mouse.current.x * 0.5;
    const targetX = -mouse.current.y * 0.3;
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, delta * 3);
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 3);
  });

  // Printed cardstock under clearcoat: matte ink, glossy finish, only a
  // whisper of foil iridescence — realism over neon.
  const faceProps = {
    metalness: 0.08,
    roughness: 0.42,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    iridescence: 0.15,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 380] as [number, number],
    envMapIntensity: 0.7,
  };

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.5}>
      <group ref={group}>
        {/* Thin gilt-edged body — real cards aren't slabs */}
        <RoundedBox args={[CARD_W, CARD_H, 0.045]} radius={0.06} smoothness={6}>
          <meshPhysicalMaterial
            color="#C9A227"
            metalness={0.85}
            roughness={0.45}
            envMapIntensity={0.7}
          />
        </RoundedBox>
        {/* Front art */}
        <mesh position={[0, 0, 0.024]}>
          <planeGeometry args={[CARD_W - 0.08, CARD_H - 0.08]} />
          <meshPhysicalMaterial map={front} {...faceProps} />
        </mesh>
        {/* Back art */}
        <mesh position={[0, 0, -0.024]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CARD_W - 0.08, CARD_H - 0.08]} />
          <meshPhysicalMaterial map={back} {...faceProps} />
        </mesh>
      </group>
    </Float>
  );
}

/* ── Lighting rig — gold + teal studio, generated (no network fetch) ──────── */
function Rig() {
  return (
    <Environment resolution={256}>
      <Lightformer intensity={2.2} color="#FAE07A" position={[-3, 3, 4]} scale={[6, 6, 1]} />
      <Lightformer intensity={1.4} color="#00D4AA" position={[4, -2, 3]} scale={[5, 5, 1]} />
      <Lightformer intensity={0.5} color="#7B2FFF" position={[0, 4, -4]} scale={[8, 3, 1]} />
      <Lightformer intensity={1.6} color="#ffffff" position={[0, 0, 6]} scale={[4, 6, 1]} />
    </Environment>
  );
}

export default function Card3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#FAE07A" />
      <directionalLight position={[-5, -2, 3]} intensity={0.6} color="#00D4AA" />
      <Suspense fallback={null}>
        <CardMesh />
        <Rig />
      </Suspense>
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.75} luminanceSmoothing={0.3} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0007, 0.0007)}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </Canvas>
  );
}
