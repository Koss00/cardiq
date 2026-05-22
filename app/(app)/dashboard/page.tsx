'use client';

import Link from 'next/link';
import { ScanLine, Brain, ArrowRight, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatPct, calcRoi, roiColor } from '@/lib/utils';
import { SAMPLE_CARDS } from '@/lib/sample-data';
import { SignalType } from '@/types';
import AlertsBanner from '@/components/dashboard/AlertsBanner';

const SIGNAL_STYLES: Record<SignalType, string> = {
  BUY:  'bg-emerald-500 text-[#060E1C] font-black',
  SELL: 'bg-red-500 text-white font-black',
  HOLD: 'bg-amber-500 text-[#060E1C] font-black',
};

export default function Dashboard() {
  const { state, dispatch } = useStore();
  const { cards, signals } = state;

  const totalValue = cards.reduce((s, c) => s + c.currentValue, 0);
  const totalCost  = cards.reduce((s, c) => s + c.purchasePrice, 0);
  const totalGain  = totalValue - totalCost;
  const totalRoi   = calcRoi(totalCost, totalValue);

  const buys  = signals.filter((s) => s.signal === 'BUY').length;
  const sells = signals.filter((s) => s.signal === 'SELL').length;
  const holds = signals.filter((s) => s.signal === 'HOLD').length;

  function loadSampleData() {
    SAMPLE_CARDS.forEach((card) => {
      if (!cards.find((c) => c.id === card.id)) dispatch({ type: 'ADD_CARD', card });
    });
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[72vh] text-center fade-in-up">
        <div className="relative mb-8">
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)', transform: 'scale(2.5)', filter: 'blur(20px)' }}
          />
          <div className="relative w-20 h-20 border border-[rgba(245,200,66,0.28)] bg-[rgba(245,200,66,0.07)] flex items-center justify-center rounded-xl">
            <ScanLine className="text-gold-400" size={34} strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="font-card text-5xl uppercase tracking-widest mb-3">
          <span className="title-gold">Welcome to CardIQ</span>
        </h1>
        <p className="text-slate-400 text-lg mb-10 max-w-md font-sans leading-relaxed">
          AI-powered sports card portfolio intelligence. Scan cards, track live values, and get market signals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/scan"
            className="btn-gold inline-flex items-center gap-2 px-7 py-3.5 font-black text-sm uppercase tracking-widest"
          >
            <ScanLine size={16} />
            Scan Your First Card
          </Link>
          <button
            onClick={loadSampleData}
            className="btn-ghost inline-flex items-center gap-2 px-7 py-3.5 font-bold text-sm uppercase tracking-widest"
          >
            <Plus size={16} />
            Load Sample Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 fade-in-up">

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Portfolio Value */}
        <div className="stat-card p-7">
          <p className="text-muted text-[10px] font-display font-semibold uppercase tracking-widest mb-2">
            Portfolio Value
          </p>
          <p className="font-card text-4xl tabular-nums title-gold">{formatCurrency(totalValue)}</p>
          <p className={`text-sm mt-2 font-semibold flex items-center gap-1.5 tabular-nums ${totalGain >= 0 ? 'text-electric' : 'text-red-400'}`}>
            {totalGain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}{' '}
            <span className="text-xs opacity-80">({formatPct(totalRoi)})</span>
          </p>
        </div>

        {/* Total Invested */}
        <div className="stat-card p-7">
          <p className="text-chrome-400 text-[10px] font-display font-black uppercase tracking-widest mb-2">
            Total Invested
          </p>
          <p className="font-card text-4xl text-white tabular-nums">{formatCurrency(totalCost)}</p>
          <p className="text-sm mt-2 text-slate-500 font-sans tabular-nums">
            {cards.length} card{cards.length !== 1 ? 's' : ''} in portfolio
          </p>
        </div>

        {/* Market Signals */}
        <div className="stat-card p-7">
          <p className="text-chrome-400 text-[10px] font-display font-black uppercase tracking-widest mb-2">
            Market Signals
          </p>
          {signals.length > 0 ? (
            <div className="flex items-center gap-5 mt-1">
              <span className="text-emerald-400 font-card text-3xl tabular-nums">{buys}<span className="text-base ml-1 font-display font-black">BUY</span></span>
              <span className="text-red-400 font-card text-3xl tabular-nums">{sells}<span className="text-base ml-1 font-display font-black">SELL</span></span>
              <span className="text-amber-400 font-card text-3xl tabular-nums">{holds}<span className="text-base ml-1 font-display font-black">HOLD</span></span>
            </div>
          ) : (
            <p className="text-slate-500 text-sm mt-2 font-sans">No signals yet</p>
          )}
          <Link
            href="/intelligence"
            className="text-[11px] text-electric hover:text-white mt-3 inline-block uppercase tracking-widest font-display font-black transition-colors duration-200"
          >
            {signals.length > 0 ? 'View all →' : 'Generate signals →'}
          </Link>
        </div>
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/scan"
          className="group chrome-panel p-7 hover:border-[rgba(0,212,170,0.25)] hover:bg-[#0F2040] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-11 h-11 border border-[rgba(0,212,170,0.2)] bg-electric/[0.08] flex items-center justify-center mb-4 rounded-md">
                <ScanLine className="text-electric" size={19} />
              </div>
              <h3 className="font-display font-black text-white uppercase tracking-widest text-base mb-1.5">Scan a Card</h3>
              <p className="text-slate-500 text-sm font-sans leading-relaxed">
                AI photo recognition identifies your card and looks up live eBay pricing
              </p>
            </div>
            <ArrowRight
              className="text-chrome-700 group-hover:text-electric transition-colors duration-200 flex-shrink-0 ml-6"
              size={18}
            />
          </div>
        </Link>

        <Link
          href="/intelligence"
          className="group chrome-panel p-7 hover:border-[rgba(245,200,66,0.22)] hover:bg-[#0F1E32] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-11 h-11 border border-[rgba(245,200,66,0.22)] bg-[rgba(245,200,66,0.07)] flex items-center justify-center mb-4 rounded-md">
                <Brain className="text-gold-400" size={19} />
              </div>
              <h3 className="font-display font-black text-white uppercase tracking-widest text-base mb-1.5">Get AI Signals</h3>
              <p className="text-slate-500 text-sm font-sans leading-relaxed">
                Buy, sell, and hold recommendations based on market trends and player performance
              </p>
            </div>
            <ArrowRight
              className="text-chrome-700 group-hover:text-gold-400 transition-colors duration-200 flex-shrink-0 ml-6"
              size={18}
            />
          </div>
        </Link>
      </div>

      {/* ── Price alerts ───────────────────────────────────────────────── */}
      <AlertsBanner />

      {/* ── Recent cards ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-accent font-card text-3xl text-white uppercase tracking-widest">Recent Cards</h2>
          <Link
            href="/portfolio"
            className="text-xs text-electric hover:text-white transition-colors duration-200 uppercase tracking-widest font-display font-black"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.slice(0, 6).map((card) => {
            const roi    = calcRoi(card.purchasePrice, card.currentValue);
            const signal = signals.find((s) => s.cardId === card.id);
            return (
              <Link
                key={card.id}
                href={`/portfolio/${card.id}`}
                className="chrome-panel p-5 hover:border-[rgba(245,200,66,0.2)] hover:bg-[#0F2040] transition-all duration-200 cursor-pointer block"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-card text-lg text-white truncate uppercase tracking-wide leading-tight">
                      {card.player}
                    </p>
                    <p className="text-sm text-slate-500 font-sans mt-0.5">
                      {card.year} {card.brand}
                    </p>
                    {card.variation && (
                      <span className="inline-block mt-1.5 text-[10px] font-display font-black uppercase tracking-wider text-gold-400 bg-[rgba(245,200,66,0.08)] border border-[rgba(245,200,66,0.18)] px-2 py-0.5 rounded-sm">
                        {card.variation}
                      </span>
                    )}
                  </div>
                  {signal && (
                    <span className={`text-[10px] font-display font-black uppercase tracking-widest px-2 py-1 rounded-sm flex-shrink-0 ${SIGNAL_STYLES[signal.signal]}`}>
                      {signal.signal}
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-3.5 border-t border-[rgba(192,200,216,0.06)] flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-display font-black text-chrome-500 uppercase tracking-widest mb-1">Value</p>
                    <p className="text-white font-card text-xl leading-tight tabular-nums">{formatCurrency(card.currentValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-display font-black text-chrome-500 uppercase tracking-widest mb-1">ROI</p>
                    <p className={`text-sm font-display font-black tabular-nums ${roiColor(roi)}`}>{formatPct(roi)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
