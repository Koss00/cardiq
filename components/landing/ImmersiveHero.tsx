'use client';

/**
 * ImmersiveHero — igloo-style hero: Veo ambient video underneath, the WebGL
 * iridescent card on the right, headline + waitlist on the left. The 3D
 * canvas is client-only (WebGL can't SSR) and pointer-transparent so every
 * CTA underneath it stays clickable.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import EmailForm from '@/components/landing/EmailForm';
import VideoBackdrop from '@/components/landing/VideoBackdrop';

const Card3D = dynamic(() => import('@/components/landing/Card3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="w-44 rounded-xl skeleton"
        style={{ aspectRatio: '5/7', opacity: 0.4 }}
      />
    </div>
  ),
});

export default function ImmersiveHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-14">
      {/* Layer 0 — Veo ambient footage (no-op until the clip exists) */}
      <VideoBackdrop src="/video/hero-bg.mp4" opacity={0.5} />

      {/* Layer 1 — existing CSS atmosphere, kept as base + fallback */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,200,66,0.13) 0%, rgba(212,160,23,0.06) 35%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 -left-32 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left — copy + waitlist */}
        <div className="text-center lg:text-left py-16 lg:py-0">
          <div className="inline-flex items-center gap-2 border border-[rgba(245,200,66,0.3)] bg-[rgba(245,200,66,0.08)] text-gold-400 text-[11px] font-black px-4 py-2 rounded-full mb-8 uppercase tracking-widest fade-in-up">
            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-glow-pulse" />
            Now in Early Access
          </div>

          <h1 className="font-card text-6xl sm:text-7xl xl:text-8xl text-white mb-6 leading-none uppercase tracking-widest fade-in-up fade-in-up-delay-1">
            Your Cards.{' '}
            <span
              style={{
                background:
                  'linear-gradient(90deg, #D4A017 0%, #F5C842 30%, #FAE07A 50%, #F5C842 70%, #D4A017 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'chrome-sweep 3s linear infinite',
              }}
            >
              Smarter.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed font-sans fade-in-up fade-in-up-delay-2">
            The AI-powered sports card portfolio platform. Identify any card from a
            photo, track real-time values, and get market intelligence to buy and
            sell at the right time.
          </p>

          <div id="waitlist" className="w-full max-w-md mx-auto lg:mx-0 mb-5 fade-in-up fade-in-up-delay-3 scroll-mt-24">
            <EmailForm />
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm font-semibold transition-colors duration-200 group mb-6"
          >
            Or launch the app now
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-[11px] text-slate-600 uppercase tracking-widest">
            {['Free to use', 'No credit card required', 'Powered by Claude AI'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle size={11} className="text-gold-400" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Right — the WebGL card */}
        <div
          data-hero-card
          className="relative h-[420px] sm:h-[520px] lg:h-[640px] -mt-8 lg:mt-0"
        >
          {/* Bloom bed behind the canvas */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(245,200,66,0.12) 0%, rgba(0,212,170,0.05) 45%, transparent 72%)',
              filter: 'blur(24px)',
            }}
          />
          <Card3D />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-chrome-600 pointer-events-none">
        <span className="text-[9px] uppercase tracking-widest font-display">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gold-400/60 to-transparent" />
      </div>
    </section>
  );
}
