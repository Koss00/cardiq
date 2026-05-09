'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Target, Clock, BarChart2, Star,
  Layers, Activity, Newspaper, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { CardSignal } from '@/types';
import { formatCurrency } from '@/lib/utils';
import PriceSparkline from './PriceSparkline';

const SIGNAL_CONFIG = {
  BUY: {
    border: 'border-emerald-500/30',
    headerBg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    bar: 'bg-emerald-500',
    label: 'text-emerald-400',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
  },
  SELL: {
    border: 'border-red-500/30',
    headerBg: 'bg-red-500/10',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
    bar: 'bg-red-500',
    label: 'text-red-400',
    icon: TrendingDown,
    iconColor: 'text-red-400',
  },
  HOLD: {
    border: 'border-amber-500/30',
    headerBg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    bar: 'bg-amber-500',
    label: 'text-amber-400',
    icon: Minus,
    iconColor: 'text-amber-400',
  },
};

const DIMENSIONS = [
  { key: 'priceTrend'    as const, label: 'Price Trend',        icon: BarChart2, color: 'text-blue-400'   },
  { key: 'playerContext' as const, label: 'Player Performance', icon: Star,      color: 'text-gold-400'   },
  { key: 'scarcityNote'  as const, label: 'Scarcity & Grade',   icon: Layers,    color: 'text-purple-400' },
];

interface Props {
  signal: CardSignal;
  streaming?: boolean;
  activeField?: string;
}

export default function SignalCard({ signal, streaming = false, activeField }: Props) {
  const [showConfidence, setShowConfidence] = useState(false);
  const [showNews, setShowNews]             = useState(false);

  const cfg  = SIGNAL_CONFIG[signal.signal];
  const Icon = cfg.icon;

  const hasDetailedAnalysis =
    streaming || Boolean(signal.priceTrend && signal.playerContext && signal.scarcityNote);
  const hasNews         = signal.newsItems && signal.newsItems.length > 0;
  const hasPriceHistory = signal.priceHistory && signal.priceHistory.length >= 2;
  const hasFactors      = signal.confidenceFactors && signal.confidenceFactors.length > 0;

  return (
    <div className={`holo-shimmer chrome-panel overflow-hidden border ${cfg.border}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`${cfg.headerBg} px-5 py-4 border-b border-[rgba(0,212,255,0.06)]`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 ${cfg.badge}`}>
              <Icon size={17} className={cfg.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="font-card text-xl text-white truncate tracking-wide uppercase leading-tight">{signal.player}</p>
              <span className={`inline-block text-[10px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm mt-0.5 ${cfg.badge}`}>
                {signal.signal}
              </span>
            </div>
          </div>

          {/* Confidence meter + breakdown toggle */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-center justify-end gap-1.5 mb-1">
              <p className="text-[10px] font-display font-black text-chrome-500 uppercase tracking-widest">Confidence</p>
              {hasFactors && (
                <button
                  onClick={() => setShowConfidence((v) => !v)}
                  className="text-chrome-600 hover:text-chrome-300 transition-colors"
                  title="Why this score?"
                >
                  <Info size={11} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${cfg.bar}`}
                  style={{ width: `${signal.confidence}%` }}
                />
              </div>
              <span className={`text-xs font-display font-black w-8 text-right ${cfg.label}`}>{signal.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Confidence breakdown — expandable */}
        {showConfidence && hasFactors && (
          <div className="mt-3 pt-3 border-t border-[rgba(0,212,255,0.08)] grid grid-cols-2 gap-2">
            {signal.confidenceFactors!.map((f) => (
              <div key={f.label} className="bg-navy-900/60 rounded-sm px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-display font-black uppercase tracking-widest text-chrome-500">{f.label}</span>
                  <span
                    className="text-[10px] font-display font-black"
                    style={{ color: f.value >= 75 ? '#10b981' : f.value >= 50 ? '#F5C842' : '#ef4444' }}
                  >
                    {f.value}%
                  </span>
                </div>
                <div className="w-full h-0.5 bg-navy-700 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${f.value}%`,
                      background: f.value >= 75 ? '#10b981' : f.value >= 50 ? '#F5C842' : '#ef4444',
                    }}
                  />
                </div>
                <p className="text-[9px] text-chrome-600 font-display leading-tight">{f.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Summary ─────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-[rgba(0,212,255,0.06)] bg-navy-900/40">
        <p className="text-chrome-200 text-sm font-semibold leading-relaxed">
          {signal.summary ?? signal.reason}
        </p>
      </div>

      {/* ── Price sparkline ─────────────────────────────────────────────────── */}
      {hasPriceHistory && (
        <div className="px-5 py-2.5 border-b border-[rgba(0,212,255,0.06)] bg-[rgba(0,212,255,0.02)]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-display font-black uppercase tracking-widest text-blue-400">Price History</span>
          </div>
          <PriceSparkline
            points={signal.priceHistory!}
            cardId={signal.cardId}
            className="w-full"
          />
        </div>
      )}

      {/* ── Three-dimension analysis ─────────────────────────────────────────── */}
      {hasDetailedAnalysis ? (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[rgba(0,212,255,0.06)] bg-navy-900/20">
          {DIMENSIONS.map(({ key, label, icon: DimIcon, color }) => (
            <div key={key} className="px-4 py-4">
              <div className="flex items-center gap-1.5 mb-2">
                <DimIcon size={11} className={color} />
                <span className={`text-[9px] font-display font-black uppercase tracking-widest ${color}`}>
                  {label}
                </span>
              </div>
              <p className="text-chrome-400 text-xs leading-relaxed">
                {signal[key] || <span className="text-chrome-600 italic">Analyzing…</span>}
                {streaming && activeField === key && (
                  <span className="inline-block w-px h-3 bg-gold-400 ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            </div>
          ))}
        </div>
      ) : signal.reason ? (
        <div className="px-5 py-4 bg-navy-900/20">
          <p className="text-chrome-400 text-sm leading-relaxed">{signal.reason}</p>
        </div>
      ) : null}

      {/* ── Live stats strip ─────────────────────────────────────────────────── */}
      {!streaming && (
        <div className="px-5 py-3 border-t border-[rgba(0,212,255,0.06)] bg-[rgba(0,212,255,0.02)]">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="flex items-center gap-1 bg-electric/20 text-electric border border-electric/40 text-[9px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
              <Activity size={8} />
              Live Stats
            </span>
            {signal.playerStats && (
              <span className="text-[10px] text-chrome-600 font-display">
                {signal.playerStats.season}
                {signal.playerStats.team && ` · ${signal.playerStats.team}`}
              </span>
            )}
          </div>

          {signal.playerStats && signal.playerStats.stats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {signal.playerStats.stats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline gap-1 bg-navy-800 border border-[rgba(0,212,255,0.12)] rounded-sm px-2.5 py-1"
                >
                  <span className="text-[9px] font-display font-black uppercase tracking-widest text-chrome-500">{s.label}</span>
                  <span className="text-[12px] font-display font-black text-white">{s.value}</span>
                </div>
              ))}
              {signal.playerStats.injuryStatus && (
                <div className="flex items-baseline gap-1 bg-red-500/10 border border-red-500/25 rounded-sm px-2.5 py-1">
                  <span className="text-[9px] font-display font-black uppercase tracking-widest text-red-400">Status</span>
                  <span className="text-[12px] font-display font-black text-red-300">{signal.playerStats.injuryStatus}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-chrome-600 text-[11px] font-display italic">Stats unavailable for this player</p>
          )}
        </div>
      )}

      {/* ── Recent news ─────────────────────────────────────────────────────── */}
      {hasNews && !streaming && (
        <div className="border-t border-[rgba(0,212,255,0.06)]">
          <button
            onClick={() => setShowNews((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-navy-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Newspaper size={11} className="text-chrome-500" />
              <span className="text-[9px] font-display font-black uppercase tracking-widest text-chrome-500">
                Recent News
              </span>
              <span className="text-[9px] font-display text-chrome-600 bg-navy-700 px-1.5 py-0.5 rounded-sm">
                {signal.newsItems!.length}
              </span>
            </div>
            {showNews
              ? <ChevronUp size={11} className="text-chrome-600" />
              : <ChevronDown size={11} className="text-chrome-600" />
            }
          </button>
          {showNews && (
            <div className="px-5 pb-3 space-y-2 bg-navy-900/20">
              {signal.newsItems!.map((headline, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[9px] font-display font-black text-chrome-600 mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <p className="text-chrome-400 text-[11px] font-display leading-snug">{headline}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-[rgba(0,212,255,0.06)] bg-navy-950/40 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {signal.priceTarget && (
            <div className="flex items-center gap-1.5 text-xs">
              <Target size={11} className="text-chrome-500" />
              <span className="text-chrome-500 font-display font-black uppercase tracking-widest">Target:</span>
              <span className="text-gold-400 font-display font-black">{formatCurrency(signal.priceTarget)}</span>
            </div>
          )}
          {signal.timeframe && (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock size={11} className="text-chrome-500" />
              <span className="text-chrome-500 font-display uppercase tracking-widest">{signal.timeframe}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-chrome-700">
          {new Date(signal.generatedAt).toLocaleString()}
        </p>
      </div>

    </div>
  );
}
