import Link from 'next/link';
import {
  ScanLine, Brain, BarChart3, ArrowRight, CheckCircle,
  TrendingUp, Zap, ChevronRight, TrendingDown, Minus,
} from 'lucide-react';
import EmailForm from '@/components/landing/EmailForm';

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
    hoverBorder: 'hover:border-[rgba(0,212,170,0.35)]',
    hoverGlow: 'rgba(0,212,170,0.06)',
    accentGlow: 'rgba(0,212,170,0.12)',
    iconBg: 'border-[rgba(0,212,170,0.3)] bg-[rgba(0,212,170,0.1)]',
    iconColor: 'text-electric',
    tagColor: 'text-electric',
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
    hoverBorder: 'hover:border-[rgba(52,211,153,0.35)]',
    hoverGlow: 'rgba(52,211,153,0.06)',
    accentGlow: 'rgba(52,211,153,0.12)',
    iconBg: 'border-emerald-500/25 bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    tagColor: 'text-emerald-400',
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
    hoverBorder: 'hover:border-[rgba(245,200,66,0.35)]',
    hoverGlow: 'rgba(245,200,66,0.06)',
    accentGlow: 'rgba(245,200,66,0.12)',
    iconBg: 'border-[rgba(245,200,66,0.25)] bg-gold-400/10',
    iconColor: 'text-gold-400',
    tagColor: 'text-gold-400',
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

/* ── Floating card mockup ─────────────────────────────────────────────────── */
function FloatingCardMockup() {
  return (
    <div className="relative mx-auto mt-20 mb-6 w-full max-w-3xl px-4 pointer-events-none select-none">
      {/* Ambient bloom behind cards */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,200,66,0.1) 0%, rgba(0,212,170,0.05) 40%, transparent 70%)',
        filter: 'blur(20px)',
      }} />

      <div className="flex items-end justify-center gap-4 sm:gap-6">
        {/* Card 1 — tilted left */}
        <div
          className="relative w-28 sm:w-36 rounded-xl overflow-hidden flex-shrink-0"
          style={{
            aspectRatio: '5/7',
            transform: 'rotate(-8deg) translateY(12px)',
            background: 'linear-gradient(155deg, #0D3320 0%, #1E6B3C 45%, #0F1A2E 100%)',
            border: '1px solid rgba(52,211,153,0.25)',
            boxShadow: '0 24px 48px rgba(4,11,22,0.7), 0 0 0 1px rgba(52,211,153,0.15)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="h-1 w-8 bg-emerald-400/30 rounded mb-1" />
            <div className="h-3 w-14 bg-white/15 rounded mb-0.5" />
            <div className="h-2 w-10 bg-white/8 rounded" />
          </div>
          <div className="absolute top-2 right-2">
            <div className="text-[7px] font-black text-emerald-400/60 bg-emerald-500/20 px-1 py-0.5 rounded">RAW</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-card text-3xl text-white/10 uppercase">RC</div>
          </div>
        </div>

        {/* Card 2 — center, upright, with signal glow */}
        <div
          className="relative w-36 sm:w-44 rounded-xl overflow-hidden flex-shrink-0"
          style={{
            aspectRatio: '5/7',
            transform: 'translateY(0)',
            background: 'linear-gradient(155deg, #0A1E3D 0%, #1E4080 45%, #0F1A2E 100%)',
            border: '1px solid rgba(245,200,66,0.45)',
            boxShadow: '0 32px 64px rgba(4,11,22,0.8), 0 0 0 1px rgba(245,200,66,0.3), 0 0 40px rgba(245,200,66,0.12)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,200,66,0.9), transparent)' }} />
          {/* BUY badge */}
          <div className="absolute top-2 right-2 bg-emerald-500 text-[#060E1C] text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">BUY</div>
          <div className="absolute top-2 left-2 text-[7px] font-black text-gold-400/60 uppercase tracking-wider">2023 · PSA</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-card text-4xl text-white/10 uppercase">QB</div>
          </div>
          {/* ROI */}
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-3">
            <div className="h-2 w-12 bg-gold-400/20 rounded mb-1.5" />
            <div className="font-card text-lg text-white/20 leading-none">MAHOMES</div>
            <div className="h-2 w-8 bg-emerald-400/30 rounded mt-1.5" />
          </div>
        </div>

        {/* Card 3 — tilted right */}
        <div
          className="relative w-28 sm:w-36 rounded-xl overflow-hidden flex-shrink-0"
          style={{
            aspectRatio: '5/7',
            transform: 'rotate(8deg) translateY(12px)',
            background: 'linear-gradient(155deg, #3D1200 0%, #A84000 45%, #0F1A2E 100%)',
            border: '1px solid rgba(244,162,97,0.25)',
            boxShadow: '0 24px 48px rgba(4,11,22,0.7), 0 0 0 1px rgba(244,162,97,0.15)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(244,162,97,0.6), transparent)' }} />
          <div className="absolute top-2 right-2">
            <div className="text-[7px] font-black text-amber-400/60 bg-amber-500/20 px-1 py-0.5 rounded">HOLD</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-card text-3xl text-white/10 uppercase">SF</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="h-1 w-8 bg-orange-400/20 rounded mb-1" />
            <div className="h-3 w-14 bg-white/15 rounded mb-0.5" />
            <div className="h-2 w-10 bg-white/8 rounded" />
          </div>
        </div>
      </div>

      {/* Stats strip below cards */}
      <div className="flex items-center justify-center gap-6 mt-8">
        {[
          { label: 'Portfolio Value', value: '$4,280', color: 'text-gold-400' },
          { label: 'Total ROI', value: '+34.2%', color: 'text-electric' },
          { label: 'Active Signals', value: '3 BUY', color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={`font-display font-black text-lg ${color} leading-none`}>{value}</p>
            <p className="text-[10px] text-chrome-600 uppercase tracking-widest font-display mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060E1C] text-slate-100 overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1E2D45] bg-[rgba(6,14,28,0.95)] backdrop-blur-xl">
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,200,66,0.6) 30%, rgba(250,224,122,0.8) 50%, rgba(245,200,66,0.6) 70%, transparent 100%)' }}
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
      <section className="relative pt-40 pb-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden">
        {/* Background layers — layered glows for depth */}
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

        {/* Deep gold radial at top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,200,66,0.13) 0%, rgba(212,160,23,0.06) 35%, transparent 70%)',
          filter: 'blur(2px)',
        }} />

        {/* Teal accent — bottom left */}
        <div className="absolute top-64 -left-32 w-96 h-96 pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />

        {/* Purple depth — bottom right */}
        <div className="absolute top-48 -right-24 w-72 h-72 pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(123,47,255,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />

        {/* Second gold bloom — centered */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(245,200,66,0.07) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }} />

        {/* Live badge */}
        <div className="relative inline-flex items-center gap-2 border border-[rgba(245,200,66,0.3)] bg-[rgba(245,200,66,0.08)] text-gold-400 text-[11px] font-black px-4 py-2 rounded-full mb-10 uppercase tracking-widest fade-in-up">
          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-glow-pulse" />
          Now in Early Access
        </div>

        {/* Headline */}
        <h1 className="relative font-card text-6xl sm:text-7xl lg:text-8xl xl:text-[6.5rem] text-white mb-7 max-w-5xl leading-none uppercase tracking-widest fade-in-up fade-in-up-delay-1">
          Your Cards.{' '}
          <span style={{
            background: 'linear-gradient(90deg, #D4A017 0%, #F5C842 30%, #FAE07A 50%, #F5C842 70%, #D4A017 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'chrome-sweep 3s linear infinite',
          }}>Smarter.</span>
        </h1>

        {/* Subheadline */}
        <p className="relative text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-sans fade-in-up fade-in-up-delay-2">
          The AI-powered sports card portfolio platform. Identify any card from a photo,
          track real-time values, and get market intelligence to buy and sell at the right time.
        </p>

        {/* Email waitlist */}
        <div className="relative w-full max-w-md mb-5 fade-in-up fade-in-up-delay-3">
          <EmailForm />
        </div>

        {/* Secondary CTA */}
        <Link
          href="/dashboard"
          className="relative inline-flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm font-semibold transition-colors duration-200 group mb-4"
        >
          Or launch the app now
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>

        {/* Trust row */}
        <div className="relative flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-600 uppercase tracking-widest mb-2">
          {['Free to use', 'No credit card required', 'Powered by Claude AI'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle size={11} className="text-gold-400" />
              {item}
            </span>
          ))}
        </div>

        {/* Floating card mockup */}
        <FloatingCardMockup />
      </section>

      {/* ── Signal ticker strip ──────────────────────────────────────────── */}
      <div className="border-y border-[#1E2D45] bg-[#060E1C] py-4 overflow-hidden">
        <div className="flex items-center justify-center gap-8 px-4 flex-wrap">
          {[
            { label: 'PSA 10 Mahomes RC', signal: 'BUY', price: '$4,200', change: '+12.4%', icon: TrendingUp },
            { label: 'Luka Dončić Prizm', signal: 'HOLD', price: '$890', change: '+2.1%', icon: Minus },
            { label: '2019 Trout Auto /25', signal: 'SELL', price: '$1,150', change: '-8.3%', icon: TrendingDown },
            { label: 'Wemby RC BGS 9.5', signal: 'BUY', price: '$620', change: '+18.7%', icon: TrendingUp },
          ].map(({ label, signal, price, change, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2.5 flex-shrink-0">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                signal === 'BUY' ? 'bg-emerald-500 text-[#060E1C]' :
                signal === 'SELL' ? 'bg-red-500 text-white' :
                'bg-amber-500 text-[#060E1C]'
              }`}>{signal}</span>
              <span className="text-chrome-400 text-xs font-display font-semibold hidden sm:inline">{label}</span>
              <span className="text-white text-xs font-display font-black">{price}</span>
              <span className={`text-xs font-display font-bold flex items-center gap-0.5 ${
                change.startsWith('+') ? 'text-electric' : 'text-red-400'
              }`}>
                <Icon size={10} />
                {change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Early Access band ────────────────────────────────────────────── */}
      <section className="border-b border-[#1E2D45] bg-[rgba(245,200,66,0.03)] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">
            Limited Availability
          </p>
          <h3 className="font-card text-3xl sm:text-4xl mb-3 tracking-widest uppercase">
            <span className="title-gold">Join the first 100 collectors</span>
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
          <p className="text-chrome-700 text-xs mt-10 uppercase tracking-widest">
            No credit card required &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">Features</p>
            <h2 className="font-card text-5xl sm:text-6xl uppercase mb-5 tracking-widest">
              <span className="title-chrome">Everything your collection needs</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-sans leading-relaxed">
              CardIQ combines AI vision, live market data, and intelligent signals into one platform built for serious collectors.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, tag, title, description, bullets, iconBg, iconColor, tagColor, hoverBorder, hoverGlow, accentGlow }) => (
              <div
                key={title}
                className={`chrome-panel p-8 group relative overflow-hidden transition-all duration-300 cursor-default ${hoverBorder}`}
                style={{ transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
              >
                {/* Hover glow overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accentGlow} 0%, transparent 70%)` }}
                />

                <p className={`text-[10px] font-black uppercase tracking-widest mb-5 relative ${tagColor}`}>{tag}</p>
                <div className={`w-11 h-11 border flex items-center justify-center mb-6 rounded-md relative ${iconBg}`}>
                  <Icon size={19} className={iconColor} />
                </div>
                <h3 className="font-display font-bold text-white text-xl uppercase tracking-wide mb-3 relative">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-sans relative">{description}</p>
                <ul className="space-y-2.5 relative">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-slate-400 font-sans">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${iconColor.replace('text-', 'bg-')}`} />
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
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[rgba(13,26,48,0.4)] border-y border-[#1E2D45]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">How it works</p>
            <h2 className="font-card text-4xl sm:text-5xl uppercase tracking-widest">
              <span className="title-gold">From photo to portfolio in seconds</span>
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
                      background: 'linear-gradient(90deg, rgba(245,200,66,0.3) 0%, transparent 100%)',
                    }}
                  />
                )}
                <div className="w-14 h-14 border border-[rgba(245,200,66,0.3)] bg-[rgba(245,200,66,0.08)] flex items-center justify-center mx-auto mb-5 rounded-xl" style={{
                  boxShadow: '0 0 0 4px rgba(245,200,66,0.05), 0 8px 24px rgba(4,11,22,0.5)',
                }}>
                  <Icon size={22} className="text-gold-400" />
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
          <div className="relative overflow-hidden rounded-2xl" style={{
            background: 'linear-gradient(145deg, #131E34 0%, #0D1727 50%, #131E34 100%)',
            border: '1px solid rgba(245,200,66,0.2)',
            boxShadow: '0 0 0 1px rgba(245,200,66,0.08), 0 24px 80px rgba(4,11,22,0.7), 0 0 60px rgba(245,200,66,0.06)',
          }}>
            {/* Dramatic gold radial glow inside */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 80% 70% at 50% -10%, rgba(245,200,66,0.14) 0%, transparent 65%)',
            }} />
            <div className="absolute inset-x-0 top-0 h-px" style={{
              background: 'linear-gradient(90deg, transparent, rgba(245,200,66,0.8) 30%, rgba(250,224,122,1) 50%, rgba(245,200,66,0.8) 70%, transparent)',
            }} />

            <div className="relative px-10 py-16 text-center">
              <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-6">
                Built for serious collectors
              </p>
              <h2 className="font-card text-5xl sm:text-6xl mb-5 uppercase tracking-widest leading-none">
                <span className="title-gold">Start tracking smarter today</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 font-sans leading-relaxed max-w-lg mx-auto">
                Join collectors using CardIQ to make better buy and sell decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="btn-gold inline-flex items-center justify-center gap-2 px-9 py-4 font-black text-sm uppercase tracking-widest"
                >
                  Launch App Free
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#features"
                  className="btn-ghost inline-flex items-center justify-center gap-2 px-9 py-4 font-bold text-sm uppercase tracking-widest"
                >
                  See Features
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1E2D45] py-10 px-4 bg-[rgba(4,11,22,0.8)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-6 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-[#060E1C] text-[10px] font-black z-10">IQ</span>
            </div>
            <span className="font-card text-base tracking-widest chrome-text select-none">CARDIQ</span>
          </div>
          <p className="text-chrome-700 text-xs uppercase tracking-widest">
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
