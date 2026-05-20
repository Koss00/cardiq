'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ScanLine, Brain, BarChart3, ArrowRight, CheckCircle,
  TrendingUp, Zap, ChevronRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ScanLine,
    tag: 'SCAN',
    title: 'AI Card Scanner',
    description:
      'Photograph any card and Claude Vision instantly identifies the player, year, brand, set, and variation — no manual entry required.',
    bullets: [
      'Identifies in under 3 seconds',
      'Works on raw and graded cards',
      'Supports all major sports & brands',
    ],
    accentClass: 'from-electric/20 to-transparent',
    iconBg: 'border-electric/25 bg-electric/10',
    iconColor: 'text-electric',
  },
  {
    icon: BarChart3,
    tag: 'TRACK',
    title: 'Live Portfolio Tracker',
    description:
      "Every card's cost basis, current market value, and ROI — updated with real eBay sold-price data refreshed automatically.",
    bullets: [
      'Live eBay sold-price data',
      'ROI calculated per card',
      'Sortable, filterable dashboard',
    ],
    accentClass: 'from-emerald-500/20 to-transparent',
    iconBg: 'border-emerald-500/25 bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Brain,
    tag: 'INTELLIGENCE',
    title: 'Market Intelligence',
    description:
      'AI analyzes your portfolio and delivers buy, sell, or hold signals based on player performance, card scarcity, and market trends.',
    bullets: [
      'BUY / SELL / HOLD signals',
      'Confidence score per card',
      'Price targets included',
    ],
    accentClass: 'from-gold-400/20 to-transparent',
    iconBg: 'border-[rgba(245,200,66,0.25)] bg-gold-400/10',
    iconColor: 'text-gold-400',
  },
];

const EARLY_ACCESS_PERKS = [
  'Full access to AI card scanning',
  'Live eBay pricing & portfolio tracking',
  'Market intelligence signals',
  'Priority support & feature requests',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Scan Your Card',
    description: 'Upload a photo. AI identifies the card in seconds.',
    icon: ScanLine,
  },
  {
    step: '02',
    title: 'Track Your Portfolio',
    description: 'Live eBay pricing and ROI calculated automatically.',
    icon: TrendingUp,
  },
  {
    step: '03',
    title: 'Act on Intelligence',
    description: 'Get AI buy/sell/hold signals with price targets.',
    icon: Zap,
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (email) setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#060E1C] text-slate-100 overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(245,200,66,0.1)] bg-[rgba(6,14,28,0.92)] backdrop-blur-xl">
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,200,66,0.45) 40%, rgba(0,212,255,0.35) 70%, transparent 100%)' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-[#060E1C] text-xs font-black tracking-tight z-10">IQ</span>
            </div>
            <span className="font-card text-xl tracking-widest chrome-text select-none">CARD<span>IQ</span></span>
          </div>
          <Link
            href="/dashboard"
            className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest"
          >
            Launch App <ChevronRight size={12} />
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-44 pb-32 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        <div
          className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,200,66,0.06) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-32 left-1/3 w-72 h-72 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute top-48 right-1/3 w-56 h-56 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(123,47,255,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />

        {/* Live badge */}
        <div className="relative inline-flex items-center gap-2 border border-[rgba(245,200,66,0.28)] bg-[rgba(245,200,66,0.07)] text-gold-400 text-[11px] font-black px-4 py-2 rounded-full mb-10 uppercase tracking-widest fade-in-up">
          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-glow-pulse" />
          Now in Early Access
        </div>

        {/* Headline */}
        <h1 className="relative font-card text-6xl sm:text-7xl lg:text-8xl xl:text-9xl text-white mb-7 max-w-5xl leading-none uppercase tracking-widest fade-in-up fade-in-up-delay-1">
          Your Cards.{' '}
          <span className="chrome-text">Smarter.</span>
        </h1>

        {/* Subheadline */}
        <p className="relative text-lg sm:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed font-sans fade-in-up fade-in-up-delay-2">
          The AI-powered sports card portfolio platform. Identify any card from a photo,
          track real-time values, and get market intelligence to buy and sell at the right time.
        </p>

        {/* Email waitlist */}
        <div className="relative w-full max-w-md mb-7 fade-in-up fade-in-up-delay-3">
          {!submitted ? (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-[#0D1A30] border border-[rgba(245,200,66,0.18)] text-white rounded-sm px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-gold-400 transition-colors duration-200"
                aria-label="Email address for waitlist"
              />
              <button
                type="submit"
                className="btn-gold px-7 py-3 text-sm uppercase tracking-widest whitespace-nowrap font-black"
              >
                Join Waitlist
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-6 py-3.5 rounded-md text-sm font-semibold">
              <CheckCircle size={16} />
              You&apos;re on the list — we&apos;ll be in touch soon.
            </div>
          )}
        </div>

        {/* Secondary CTA */}
        <Link
          href="/dashboard"
          className="relative inline-flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm font-semibold transition-colors duration-200 group mb-16"
        >
          Or launch the app now
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>

        {/* Trust row */}
        <div className="relative flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-600 uppercase tracking-widest">
          {['Free to use', 'No credit card required', 'Powered by Claude AI'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle size={11} className="text-gold-400" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Early Access band ────────────────────────────────────────────── */}
      <section className="border-y border-[rgba(245,200,66,0.12)] bg-[rgba(245,200,66,0.04)] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">
            Limited Availability
          </p>
          <h3 className="font-card text-3xl sm:text-4xl text-white uppercase mb-3 tracking-widest">
            Join the first 100 collectors
          </h3>
          <p className="text-slate-400 text-sm mb-10 font-sans leading-relaxed max-w-lg mx-auto">
            Spots are limited during early access. Every member gets full access to all features from day one.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl mx-auto text-left">
            {EARLY_ACCESS_PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3 text-sm text-slate-300 font-sans">
                <CheckCircle size={13} className="text-gold-400 flex-shrink-0" />
                {perk}
              </div>
            ))}
          </div>
          <p className="text-slate-700 text-xs mt-10 uppercase tracking-widest">
            No credit card required &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">Features</p>
            <h2 className="font-card text-5xl sm:text-6xl text-white uppercase mb-5 tracking-widest">
              Everything your collection needs
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-sans leading-relaxed">
              CardIQ combines AI vision, live market data, and intelligent signals into one platform built for serious collectors.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, tag, title, description, bullets, iconBg, iconColor }) => (
              <div
                key={title}
                className="foil chrome-panel p-8 group hover:border-[rgba(192,200,216,0.22)] hover:shadow-chrome-card-hover transition-all duration-300 cursor-default"
              >
                <p className={`text-[10px] font-black uppercase tracking-widest mb-5 ${iconColor}`}>{tag}</p>
                <div className={`w-11 h-11 border flex items-center justify-center mb-6 rounded-md ${iconBg}`}>
                  <Icon size={19} className={iconColor} />
                </div>
                <h3 className="font-display font-bold text-white text-xl uppercase tracking-wide mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-sans">{description}</p>
                <ul className="space-y-2.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-slate-400 font-sans">
                      <span className="w-1 h-1 bg-gold-400 rounded-full flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[rgba(13,26,48,0.5)] border-y border-[rgba(192,200,216,0.06)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">How it works</p>
            <h2 className="font-card text-4xl sm:text-5xl text-white uppercase tracking-widest">
              From photo to portfolio in seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }, i) => (
              <div key={step} className="relative text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-6 h-px pointer-events-none"
                    style={{
                      left: 'calc(50% + 44px)',
                      right: 'calc(-50% + 44px)',
                      background: 'linear-gradient(90deg, rgba(245,200,66,0.25) 0%, transparent 100%)',
                    }}
                  />
                )}
                <div className="w-12 h-12 border border-[rgba(245,200,66,0.28)] bg-[rgba(245,200,66,0.07)] flex items-center justify-center mx-auto mb-5 rounded-md">
                  <Icon size={20} className="text-gold-400" />
                </div>
                <p className="text-[10px] font-black text-gold-500 mb-1.5 tracking-widest uppercase font-display">{step}</p>
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-2.5 text-lg">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel px-10 py-16 text-center relative overflow-hidden">
            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(245,200,66,0.05) 0%, transparent 70%)' }}
            />
            <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-6 relative">
              Built for serious collectors
            </p>
            <h2 className="font-card text-5xl sm:text-6xl text-white mb-5 uppercase tracking-widest leading-none relative">
              Start tracking<br />smarter today
            </h2>
            <p className="text-slate-400 text-lg mb-10 font-sans leading-relaxed max-w-lg mx-auto relative">
              Join collectors using CardIQ to make better buy and sell decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
              <Link
                href="/dashboard"
                className="btn-gold inline-flex items-center justify-center gap-2 px-9 py-4 font-black text-sm uppercase tracking-widest"
              >
                Launch App Free
                <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-ghost inline-flex items-center justify-center gap-2 px-9 py-4 font-bold text-sm uppercase tracking-widest"
              >
                See Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(245,200,66,0.1)] py-10 px-4 bg-[rgba(4,11,22,0.8)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-6 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-[#060E1C] text-[10px] font-black z-10">IQ</span>
            </div>
            <span className="font-card text-base tracking-widest chrome-text select-none">CARDIQ</span>
          </div>
          <p className="text-slate-700 text-xs uppercase tracking-widest">
            © {new Date().getFullYear()} CardIQ. All rights reserved.
          </p>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-gold-400 transition-colors duration-200 flex items-center gap-1 uppercase tracking-widest font-semibold"
          >
            Launch App <ChevronRight size={11} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
