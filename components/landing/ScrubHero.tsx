'use client';

/**
 * ScrubHero — cinematic scroll-driven intro, fully real-time WebGL.
 * The stage pins for 280vh while ~14k particles assemble into the CardIQ
 * card (AssemblyScene), driven directly by scroll progress — scrolling
 * back up disassembles it. "SEE THE MARKET COMING." resolves word by word
 * as the card completes, then the stage fades and hands off to the
 * interactive 3D hero below. No video, no assets, no quota.
 *
 * prefers-reduced-motion → renders nothing; visitors go straight to the
 * static hero.
 */

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { goldSound } from './soundEngine';

const AssemblyScene = dynamic(() => import('./AssemblyScene'), { ssr: false });

export default function ScrubHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    setEnabled(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const headline = headlineRef.current;
    if (!section || !stage || !headline) return;

    gsap.registerPlugin(ScrollTrigger);

    const words = headline.querySelectorAll('[data-word]');
    gsap.set(words, { opacity: 0, y: 40, filter: 'blur(8px)' });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=280%',
      pin: stage,
      scrub: 0.35,
      // Page-top pin must re-measure before everything below it, so its
      // spacer offset cascades into their start positions (GSAP refreshes
      // by priority, not document order).
      refreshPriority: 2,
      onUpdate: (self) => {
        const p = self.progress;
        stage.dataset.progress = p.toFixed(3); // exposed for tests/tools
        goldSound.setProgress(p); // shimmer follows the assembly

        // Assembly consumes the first 85% of the pin
        progressRef.current = gsap.utils.clamp(0, 1, p / 0.85);

        // Words resolve one by one, 40% → 80%
        words.forEach((w, i) => {
          const startAt = 0.4 + i * 0.1;
          const k = gsap.utils.clamp(0, 1, (p - startAt) / 0.09);
          gsap.set(w, {
            opacity: k,
            y: 40 * (1 - k),
            filter: `blur(${8 * (1 - k)}px)`,
          });
        });

        // Scroll cue disappears as soon as the visitor commits
        if (cueRef.current) {
          gsap.set(cueRef.current, { opacity: gsap.utils.clamp(0, 1, 1 - p * 5) });
        }

        // Hand-off: fade the whole stage into the interactive hero
        const fade = gsap.utils.clamp(0, 1, (p - 0.92) / 0.08);
        gsap.set(stage, { opacity: 1 - fade });
      },
    });
    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    return () => trigger.kill();
  }, [enabled]);

  if (enabled === false) return null; // reduced motion → straight to hero

  return (
    // No explicit height — GSAP's pin-spacer provides the scroll runway.
    <section ref={sectionRef} className="relative">
      <div
        ref={stageRef}
        data-scrub-stage
        className="h-screen w-full overflow-hidden relative bg-[#060E1C]"
      >
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

        {/* Ambient bloom bed behind the particles */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,200,66,0.07) 0%, rgba(0,212,170,0.03) 45%, transparent 72%)',
          }}
        />

        {/* The particle assembly (client-only WebGL) */}
        <div className="absolute inset-0" aria-hidden>
          {enabled && <AssemblyScene progressRef={progressRef} />}
        </div>

        {/* Seam scrims — blend into the page above and below */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,14,28,0.55) 0%, transparent 18%, transparent 78%, #060E1C 100%)',
          }}
        />

        {/* The line */}
        <div className="absolute inset-0 flex items-center justify-center px-4 pointer-events-none">
          <h2
            ref={headlineRef}
            className="font-card text-white text-center uppercase leading-none tracking-widest text-5xl sm:text-7xl lg:text-8xl xl:text-[7.5rem]"
            style={{ textShadow: '0 4px 60px rgba(6,14,28,0.95)' }}
          >
            <span data-word className="inline-block">See&nbsp;</span>
            <span data-word className="inline-block">the&nbsp;</span>
            <span data-word className="inline-block title-gold">market&nbsp;</span>
            <span data-word className="inline-block">coming.</span>
          </h2>
        </div>

        {/* Scroll cue */}
        <div ref={cueRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-chrome-500 pointer-events-none">
          <span className="text-[9px] uppercase tracking-widest font-display">Scroll to assemble</span>
          <div className="w-px h-10 bg-gradient-to-b from-gold-400/70 to-transparent" />
        </div>
      </div>
    </section>
  );
}
