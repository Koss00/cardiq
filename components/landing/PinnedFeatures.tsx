'use client';

/**
 * PinnedFeatures — the SCAN · TRACK · SIGNAL sequence. The section pins
 * full-viewport over the signal-catch footage while three massive words
 * crossfade through as the visitor scrolls. Falls back to the scan-beam
 * clip until signal-catch.mp4 exists, and to a static stacked layout for
 * prefers-reduced-motion (or if GSAP can't pin).
 */

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FEATURES = [
  {
    word: 'SCAN',
    accent: 'text-electric',
    line: 'Point. Shoot. Any card identified in under 3 seconds.',
  },
  {
    word: 'TRACK',
    accent: 'text-emerald-400',
    line: 'Live eBay comps price your entire portfolio, automatically.',
  },
  {
    word: 'SIGNAL',
    accent: 'text-gold-400',
    line: 'BUY · SELL · HOLD calls with a confidence score on every card.',
  },
];

export default function PinnedFeatures() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [videoSrc, setVideoSrc] = useState('/video/signal-catch.mp4');
  const [videoDead, setVideoDead] = useState(false);

  // Mount the footage only when the section approaches the viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '150% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleVideoError = () => {
    if (videoSrc !== '/video/scan-beam.mp4') setVideoSrc('/video/scan-beam.mp4');
    else setVideoDead(true);
  };

  // SSR'd <video> can 404 before hydration attaches onError — re-check here.
  useEffect(() => {
    const v = videoRef.current;
    if (v && (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) handleVideoError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSrc, inView]);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    gsap.registerPlugin(ScrollTrigger);
    const blocks = stage.querySelectorAll<HTMLElement>('[data-feature]');
    gsap.set(blocks, { opacity: 0, y: 60 });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=240%',
      pin: stage,
      scrub: 0.4,
      refreshPriority: 1, // after the scrub hero, before the data-reveals
      onUpdate: (self) => {
        const p = self.progress;
        if (stage) stage.dataset.progress = p.toFixed(3); // exposed for tests/tools
        blocks.forEach((el, i) => {
          // Each word owns a third of the pin, with crossfade edges
          const mid = (i + 0.5) / 3;
          const d = Math.abs(p - mid) * 3; // 0 at center of its window
          const k = gsap.utils.clamp(0, 1, 1.25 - d * 1.6);
          gsap.set(el, { opacity: k, y: 60 * (1 - k) });
        });
      },
    });
    ScrollTrigger.refresh();
    return () => trigger.kill();
  }, [reduced]);

  /* Reduced motion — simple stacked, no pin, no video */
  if (reduced) {
    return (
      <section className="py-24 px-4 border-y border-[#1E2D45] bg-[rgba(13,26,48,0.4)]">
        <div className="max-w-4xl mx-auto space-y-16 text-center">
          {FEATURES.map(({ word, accent, line }) => (
            <div key={word}>
              <h3 className={`font-card text-6xl sm:text-7xl uppercase tracking-widest ${accent}`}>{word}</h3>
              <p className="text-slate-400 text-lg font-sans mt-3">{line}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    // No explicit height — GSAP's pin-spacer provides the scroll runway.
    <section ref={sectionRef} className="relative border-y border-[#1E2D45]">
      <div ref={stageRef} data-features-stage className="h-screen w-full overflow-hidden relative bg-[#060E1C]">
        {/* Footage layer — signal-catch, falling back to scan-beam */}
        {!videoDead && inView && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            onError={handleVideoError}
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, #060E1C 0%, rgba(6,14,28,0.3) 25%, rgba(6,14,28,0.3) 75%, #060E1C 100%)',
          }}
        />
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

        {/* The three words — stacked in the same spot, crossfaded by scroll */}
        {FEATURES.map(({ word, accent, line }, i) => (
          <div
            key={word}
            data-feature
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
          >
            <p className="text-[11px] font-display font-black uppercase tracking-widest text-chrome-500 mb-6">
              0{i + 1} / 03
            </p>
            <h3 className={`font-card text-7xl sm:text-8xl lg:text-9xl uppercase tracking-widest leading-none ${accent}`}
                style={{ textShadow: '0 8px 80px rgba(6,14,28,0.9)' }}>
              {word}
            </h3>
            <p className="text-slate-300 text-lg sm:text-xl font-sans mt-6 max-w-xl">{line}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
