'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ScanLine,
  Brain,
  BarChart3,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Zap,
  ChevronRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ScanLine,
    accent: 'blue',
    tag: 'SCAN',
    title: 'AI Card Scanner',
    description:
      'Photograph any card and Claude Vision AI instantly identifies the player, year, brand, set, and variation — no manual entry required.',
    bullets: [
      'Identifies in under 3 seconds',
      'Works on raw and graded cards',
      'Supports all major sports & brands',
    ],
  },
  {
    icon: BarChart3,
    accent: 'emerald',
    tag: 'TRACK',
    title: 'Live Portfolio Tracker',
    description:
      "Every card's cost basis, current market value, and ROI — updated with real eBay sold-price data cached and refreshed automatically.",
    bullets: [
      'Live eBay sold-price data',
      'ROI calculated per card',
      'Sortable, filterable dashboard',
    ],
  },
  {
    icon: Brain,
    accent: 'gold',
    tag: 'INTELLIGENCE',
    title: 'Market Intelligence',
    description:
      'AI analyzes your portfolio and delivers buy, sell, or hold signals based on player performance, card scarcity, and market trends.',
    bullets: [
      'BUY / SELL / HOLD signals',
      'Confidence score per card',
      'Price targets included',
    ],
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
    description: 'Upload a photo. Our AI identifies the card details instantly.',
    icon: ScanLine,
  },
  {
    step: '02',
    title: 'Track Your Portfolio',
    description: 'Cards are added with live eBay pricing and ROI calculated automatically.',
    icon: TrendingUp,
  },
  {
    step: '03',
    title: 'Act on Intelligence',
    description: 'Get AI buy/sell/hold signals and price targets for every card you own.',
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
    <div className="min-h-screen bg-navy-900 text-slate-100 overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(245,200,66,0.12)] bg-navy-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-navy-900 text-xs font-black tracking-tight z-10">IQ</span>
            </div>
            <span className="font-card text-xl tracking-widest chrome-text">
              CARD<span>IQ</span>
            </span>
          </div>
          <Link
            href="/dashboard"
            className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-black uppercase tracking-widest"
          >
            Launch App <ChevronRight size={12} />
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-64 h-64 bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 border border-[rgba(245,200,66,0.3)] bg-gold-400/8 text-gold-400 text-[11px] font-black px-3 py-1.5 rounded-sm mb-8 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-glow-pulse" />
          Now in Early Access
        </div>

        {/* Headline */}
        <h1 className="relative font-card text-6xl sm:text-7xl lg:text-8xl text-white mb-6 max-w-4xl leading-none uppercase tracking-widest">
          Your Cards.{' '}
          <span className="chrome-text">
            Smarter.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="relative text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          The AI-powered sports card portfolio platform. Identify any card from a photo,
          track real-time values, and get market intelligence to buy and sell at the right time.
        </p>

        {/* Email waitlist */}
        {!submitted ? (
          <form
            onSubmit={handleWaitlist}
            className="relative flex flex-col sm:flex-row gap-3 w-full max-w-md mb-6"
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-navy-800 border border-[rgba(245,200,66,0.2)] text-white rounded-sm px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-gold-400 transition-colors"
            />
            <button
              type="submit"
              className="btn-gold px-6 py-3 rounded-sm text-sm uppercase tracking-widest whitespace-nowrap"
            >
              Join Waitlist
            </button>
          </form>
        ) : (
          <div className="relative flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-3 rounded-sm text-sm font-semibold mb-6">
            <CheckCircle size={16} />
            You&apos;re on the list! We&apos;ll be in touch soon.
          </div>
        )}

        {/* Launch App CTA */}
        <Link
          href="/dashboard"
          className="relative inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors group mb-14"
        >
          Or launch the app now
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Trust row */}
        <div className="relative flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 uppercase tracking-widest">
          {['Free to use', 'No credit card required', 'Powered by AI'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle size={11} className="text-gold-400" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Early Access ─────────────────────────────────────────────────── */}
      <section className="border-y border-[rgba(245,200,66,0.18)] bg-gold-400/5 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-3">
            Limited Availability
          </p>
          <h3 className="font-display font-black text-white text-3xl uppercase mb-2 tracking-wide">
            Join the first 100 collectors to get access
          </h3>
          <p className="text-slate-400 text-sm mb-8">
            Spots are limited during early access. Every member gets full access to all features
            from day one.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
            {EARLY_ACCESS_PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-2.5 text-sm text-slate-300">
                <CheckCircle size={13} className="text-gold-400 flex-shrink-0" />
                {perk}
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs mt-8 uppercase tracking-widest">
            No credit card required &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-card text-5xl sm:text-6xl text-white uppercase mb-4 tracking-widest">
              Everything your collection needs
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              CardIQ combines AI vision, live market data, and intelligent signals into one platform built for serious collectors.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[rgba(245,200,66,0.12)] border border-[rgba(245,200,66,0.12)]">
            {FEATURES.map(({ icon: Icon, tag, title, description, bullets }) => (
              <div
                key={title}
                className="foil bg-navy-800 p-7 group hover:bg-navy-700 transition-all"
              >
                <p className="text-gold-400 text-[10px] font-black uppercase tracking-widest mb-4">{tag}</p>
                <div className="w-10 h-10 border border-[rgba(245,200,66,0.25)] bg-gold-400/10 flex items-center justify-center mb-5 rounded-sm">
                  <Icon size={18} className="text-gold-400" />
                </div>
                <h3 className="font-display font-bold text-white text-xl uppercase tracking-wide mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{description}</p>
                <ul className="space-y-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-400">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-navy-800/40 border-y border-[rgba(245,200,66,0.08)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-card text-4xl sm:text-5xl text-white uppercase tracking-widest">
              From photo to portfolio in seconds
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }, i) => (
              <div key={step} className="relative text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+3rem)] right-[-calc(50%-3rem)] h-px bg-gradient-to-r from-[rgba(245,200,66,0.3)] to-transparent" />
                )}
                <div className="w-12 h-12 border border-[rgba(245,200,66,0.3)] bg-gold-400/10 flex items-center justify-center mx-auto mb-4 rounded-sm">
                  <Icon size={20} className="text-gold-400" />
                </div>
                <p className="text-[10px] font-black text-gold-500 mb-1 tracking-widest uppercase">{step}</p>
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-6">
            Built for serious collectors
          </p>
          <h2 className="font-card text-6xl sm:text-7xl text-white mb-5 uppercase tracking-widest leading-none">
            Start tracking<br />smarter today
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Join collectors using CardIQ to make better buy and sell decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 rounded-sm font-black text-sm uppercase tracking-widest"
            >
              Launch App Free
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('section:nth-of-type(3)')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-600 border border-[rgba(245,200,66,0.15)] text-slate-200 px-8 py-4 rounded-sm font-bold text-sm uppercase tracking-widest transition-all"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(245,200,66,0.12)] py-10 px-4 bg-navy-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-6 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-navy-900 text-[10px] font-black z-10">IQ</span>
            </div>
            <span className="font-card text-base tracking-widest chrome-text">CARDIQ</span>
          </div>
          <p className="text-slate-600 text-xs uppercase tracking-widest">
            © {new Date().getFullYear()} CardIQ. All rights reserved.
          </p>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-gold-400 transition-colors flex items-center gap-1 uppercase tracking-widest font-semibold"
          >
            Launch App <ChevronRight size={11} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
