'use client';

import Link from 'next/link';
import { ScanLine, Brain, ArrowRight, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatPct, calcRoi, roiColor } from '@/lib/utils';
import { SAMPLE_CARDS } from '@/lib/sample-data';
import { SignalType } from '@/types';

const SIGNAL_STYLES: Record<SignalType, string> = {
  BUY: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  SELL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HOLD: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
};

export default function Dashboard() {
  const { state, dispatch } = useStore();
  const { cards, signals } = state;

  const totalValue = cards.reduce((s, c) => s + c.currentValue, 0);
  const totalCost = cards.reduce((s, c) => s + c.purchasePrice, 0);
  const totalGain = totalValue - totalCost;
  const totalRoi = calcRoi(totalCost, totalValue);

  const buys = signals.filter((s) => s.signal === 'BUY').length;
  const sells = signals.filter((s) => s.signal === 'SELL').length;
  const holds = signals.filter((s) => s.signal === 'HOLD').length;

  function loadSampleData() {
    SAMPLE_CARDS.forEach((card) => {
      if (!cards.find((c) => c.id === card.id)) {
        dispatch({ type: 'ADD_CARD', card });
      }
    });
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-20 h-20 border border-[rgba(245,200,66,0.3)] bg-gold-400/10 flex items-center justify-center mb-6 rounded-sm">
          <ScanLine className="text-gold-400" size={32} />
        </div>
        <h1 className="font-display font-black text-4xl uppercase tracking-wide text-white mb-3">
          Welcome to CardIQ
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-md">
          AI-powered sports card portfolio intelligence. Scan cards, track values, and get market signals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/scan"
            className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-sm font-black text-sm uppercase tracking-widest"
          >
            <ScanLine size={16} />
            Scan Your First Card
          </Link>
          <button
            onClick={loadSampleData}
            className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-600 border border-[rgba(245,200,66,0.15)] text-slate-200 px-6 py-3 rounded-sm font-bold text-sm uppercase tracking-widest transition-all"
          >
            <Plus size={16} />
            Load Sample Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.12)] chrome-texture">
        <div className="foil bg-navy-800 p-6">
          <p className="text-chrome-500 text-[10px] font-display font-black uppercase tracking-widest mb-1">Portfolio Value</p>
          <p className="font-card text-4xl text-white">{formatCurrency(totalValue)}</p>
          <p className={`text-sm mt-1.5 font-semibold flex items-center gap-1 ${totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalGain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} ({formatPct(totalRoi)})
          </p>
        </div>

        <div className="bg-navy-800 p-6">
          <p className="text-chrome-500 text-[10px] font-display font-black uppercase tracking-widest mb-1">Total Invested</p>
          <p className="font-card text-4xl text-white">{formatCurrency(totalCost)}</p>
          <p className="text-sm mt-1.5 text-chrome-500 font-display">{cards.length} card{cards.length !== 1 ? 's' : ''} in portfolio</p>
        </div>

        <div className="bg-navy-800 p-6">
          <p className="text-chrome-500 text-[10px] font-display font-black uppercase tracking-widest mb-1">Market Signals</p>
          {signals.length > 0 ? (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-emerald-400 font-card text-3xl">{buys} BUY</span>
              <span className="text-red-400 font-card text-3xl">{sells} SELL</span>
              <span className="text-amber-400 font-card text-3xl">{holds} HOLD</span>
            </div>
          ) : (
            <p className="text-chrome-500 text-sm mt-2 font-display">No signals yet</p>
          )}
          <Link href="/intelligence" className="text-xs text-electric hover:text-white mt-2 inline-block uppercase tracking-widest font-display font-black transition-colors">
            {signals.length > 0 ? 'View all →' : 'Generate signals →'}
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/scan"
          className="group chrome-panel p-6 hover:border-[rgba(0,212,255,0.3)] hover:bg-navy-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 border border-[rgba(0,212,255,0.2)] bg-electric/10 flex items-center justify-center mb-3 rounded-sm">
                <ScanLine className="text-electric" size={18} />
              </div>
              <h3 className="font-display font-black text-white uppercase tracking-widest text-base">Scan a Card</h3>
              <p className="text-chrome-400 text-sm mt-1">AI photo recognition identifies your card and looks up live eBay pricing</p>
            </div>
            <ArrowRight className="text-chrome-600 group-hover:text-electric transition-colors flex-shrink-0 ml-4" />
          </div>
        </Link>

        <Link
          href="/intelligence"
          className="group chrome-panel p-6 hover:border-[rgba(0,212,255,0.3)] hover:bg-navy-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 border border-[rgba(245,200,66,0.25)] bg-gold-400/10 flex items-center justify-center mb-3 rounded-sm">
                <Brain className="text-gold-400" size={18} />
              </div>
              <h3 className="font-display font-black text-white uppercase tracking-widest text-base">Get AI Signals</h3>
              <p className="text-chrome-400 text-sm mt-1">Buy, sell, and hold recommendations based on market trends and player performance</p>
            </div>
            <ArrowRight className="text-chrome-600 group-hover:text-gold-400 transition-colors flex-shrink-0 ml-4" />
          </div>
        </Link>
      </div>

      {/* Recent cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-accent font-card text-3xl text-white uppercase tracking-widest">Recent Cards</h2>
          <Link href="/portfolio" className="text-xs text-electric hover:text-white transition-colors uppercase tracking-widest font-display font-black">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.slice(0, 6).map((card) => {
            const roi = calcRoi(card.purchasePrice, card.currentValue);
            const signal = signals.find((s) => s.cardId === card.id);
            return (
              <div key={card.id} className="chrome-panel p-4 hover:border-[rgba(0,212,255,0.2)] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-card text-lg text-white truncate uppercase tracking-wide leading-tight">{card.player}</p>
                    <p className="text-sm text-chrome-400 font-display">{card.year} {card.brand}</p>
                    {card.variation && (
                      <span className="inline-block mt-1 text-[10px] font-display font-black uppercase tracking-wider text-gold-400 bg-gold-400/10 border border-[rgba(245,200,66,0.2)] px-1.5 py-0.5 rounded-sm">
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
                <div className="mt-4 pt-3 border-t border-[rgba(0,212,255,0.06)] flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-display font-black text-chrome-500 uppercase tracking-widest">Value</p>
                    <p className="text-white font-card text-lg leading-tight">{formatCurrency(card.currentValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-display font-black text-chrome-500 uppercase tracking-widest">ROI</p>
                    <p className={`text-sm font-display font-black ${roiColor(roi)}`}>{formatPct(roi)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
