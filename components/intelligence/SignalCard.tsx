'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Target, Clock, BarChart2, Star,
  Layers, Activity, Newspaper, Info, ChevronDown, ChevronUp, Globe,
} from 'lucide-react';
import { CardSignal } from '@/types';
import { formatCurrency } from '@/lib/utils';
import PriceSparkline from './PriceSparkline';

const SIGNAL_CONFIG = {
  BUY: {
    border: 'border-emerald-500/40',
    headerBg: 'bg-emerald-950/60',
    badge: 'bg-emerald-500 text-[#060E1C] font-black',
    iconBox: 'bg-emerald-500/20 border border-emerald-500/40',
    bar: 'from-emerald-600 to-emerald-400',
    label: 'text-emerald-400',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
  },
  SELL: {
    border: 'border-red-500/40',
    headerBg: 'bg-red-950/60',
    badge: 'bg-red-500 text-white font-black',
    iconBox: 'bg-red-500/20 border border-red-500/40',
    bar: 'from-red-600 to-red-400',
    label: 'text-red-400',
    icon: TrendingDown,
    iconColor: 'text-red-400',
  },
  HOLD: {
    border: 'border-amber-500/40',
    headerBg: 'bg-amber-950/60',
    badge: 'bg-amber-500 text-[#060E1C] font-black',
    iconBox: 'bg-amber-500/20 border border-amber-500/40',
    bar: 'from-amber-600 to-amber-400',
    label: 'text-amber-400',
    icon: Minus,
    iconColor: 'text-amber-400',
  },
};

const DIMENSIONS = [
  { key: 'priceTrend'    as const, label: 'Price Trend',        icon: BarChart2, color: 'text-blue-400',   bg: 'bg-blue-500/[0.07]'   },
  { key: 'playerContext' as const, label: 'Player Performance', icon: Star,      color: 'text-gold-400',   bg: 'bg-[rgba(245,200,66,0.07)]'   },
  { key: 'scarcityNote'  as const, label: 'Scarcity & Grade',   icon: Layers,    color: 'text-purple-400', bg: 'bg-purple-500/[0.07]' },
  { key: 'marketContext' as const, label: 'Market Context',     icon: Globe,     color: 'text-blue-300',   bg: 'bg-blue-400/[0.07]'   },
];

const WYCKOFF_STYLES: Record<string, { label: string; classes: string }> = {
  ACCUMULATION: { label: 'ACCUMULATION', classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  MARKUP:       { label: 'MARKUP',       classes: 'text-blue-400   bg-blue-500/10   border-blue-500/30'   },
  DISTRIBUTION: { label: 'DISTRIBUTION', classes: 'text-amber-400  bg-amber-500/10  border-amber-500/30'  },
  MARKDOWN:     { label: 'MARKDOWN',     classes: 'text-red-400    bg-red-500/10    border-red-500/30'    },
};

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
    streaming || Boolean(signal.priceTrend || signal.playerContext || signal.scarcityNote || signal.marketContext);
  const hasNews         = signal.newsItems && signal.newsItems.length > 0;
  const hasPriceHistory = signal.priceHistory && signal.priceHistory.length >= 2;
  const hasFactors      = signal.confidenceFactors && signal.confidenceFactors.length > 0;

  return (
    <div className={`holo-shimmer chrome-panel overflow-hidden border ${cfg.border} ${
      signal.signal === 'BUY' ? 'signal-buy-glow' :
      signal.signal === 'SELL' ? 'signal-sell-glow' :
      'signal-hold-glow'
    }`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`${cfg.headerBg} px-5 py-4 border-b border-[rgba(30,45,69,0.8)]`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${cfg.iconBox}`}>
              <Icon size={18} className={cfg.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-lg text-white truncate leading-tight">{signal.player}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`text-[11px] tracking-widest px-3 py-0.5 rounded-sm uppercase ${cfg.badge}`}>
                  {signal.signal}
                </span>
                {!streaming && signal.wyckoffRegime && WYCKOFF_STYLES[signal.wyckoffRegime] && (
                  <span className={`text-[9px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${WYCKOFF_STYLES[signal.wyckoffRegime].classes}`}>
                    {WYCKOFF_STYLES[signal.wyckoffRegime].label}
                  </span>
                )}
                {!streaming && signal.hasDrift && (
                  <span className="text-[9px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border text-amber-400 bg-amber-500/10 border-amber-500/30">
                    Signal Changed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Confidence meter + breakdown toggle */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-center justify-end gap-1.5 mb-2">
              <p className="text-[10px] font-display font-semibold text-muted uppercase tracking-widest">Confidence</p>
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
              <div className="w-24 h-2 bg-navy-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all bg-gradient-to-r ${cfg.bar}`}
                  style={{ width: `${signal.confidence}%` }}
                />
              </div>
              <span className={`text-sm font-display font-black w-9 text-right ${cfg.label}`}>{signal.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Confidence breakdown — expandable */}
        {showConfidence && hasFactors && (
          <div className="mt-3 pt-3 border-t border-[#1E2D45] grid grid-cols-2 gap-2">
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
      <div className="px-5 py-4 border-b border-[rgba(30,45,69,0.8)] bg-navy-900/40">
        <p className="text-chrome-200 text-sm leading-relaxed">
          {signal.summary ?? signal.reason}
        </p>
      </div>

      {/* ── Price sparkline ─────────────────────────────────────────────────── */}
      {hasPriceHistory && (
        <div className="px-5 py-2.5 border-b border-[rgba(30,45,69,0.8)] bg-[rgba(0,212,170,0.02)]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-display font-semibold uppercase tracking-widest text-muted">Price History</span>
          </div>
          <PriceSparkline
            points={signal.priceHistory!}
            cardId={signal.cardId}
            className="w-full"
          />
        </div>
      )}

      {/* ── Analysis dimensions ─────────────────────────────────────────────── */}
      {hasDetailedAnalysis ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[rgba(30,45,69,0.8)] bg-[#0A1628]/30">
          {DIMENSIONS.map(({ key, label, icon: DimIcon, color, bg }) => {
            const text = signal[key as keyof CardSignal] as string | undefined;
            // Skip marketContext if empty and not streaming
            if (key === 'marketContext' && !streaming && !text) return null;
            return (
              <div key={key} className={`px-4 py-4 ${bg}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <DimIcon size={10} className={color} />
                  <span className={`text-[9px] font-display font-semibold uppercase tracking-widest ${color}`}>
                    {label}
                  </span>
                </div>
                <p className="text-chrome-400 text-xs leading-relaxed">
                  {text || <span className="text-chrome-600 italic">Analyzing…</span>}
                  {streaming && activeField === key && (
                    <span className="inline-block w-px h-3 bg-gold-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            );
          })}
        </div>
      ) : signal.reason ? (
        <div className="px-5 py-4 bg-[#0A1628]/30">
          <p className="text-chrome-400 text-sm leading-relaxed">{signal.reason}</p>
        </div>
      ) : null}

      {/* ── Live stats strip ─────────────────────────────────────────────────── */}
      {!streaming && (
        <div className="px-5 py-3 border-t border-[rgba(30,45,69,0.8)] bg-[rgba(0,212,170,0.02)]">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="flex items-center gap-1 bg-[rgba(0,212,170,0.12)] text-electric border border-[rgba(0,212,170,0.3)] text-[9px] font-display font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md">
              <Activity size={8} />
              {signal.playerStats?.isRetired && !signal.playerStats?.knownActive ? 'Career Stats' : 'Live Stats'}
            </span>
            {signal.playerStats && (
              <span className="text-[10px] text-muted font-display">
                {signal.playerStats.season}
                {signal.playerStats.source && ` · ${signal.playerStats.source}`}
                {signal.playerStats.team && ` · ${signal.playerStats.team}`}
              </span>
            )}
          </div>

          {signal.playerStats && signal.playerStats.stats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {signal.playerStats.stats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline gap-1.5 bg-[#111D33] border border-[#1E2D45] rounded-md px-3 py-1.5"
                >
                  <span className="text-[9px] font-display font-semibold uppercase tracking-widest text-muted">{s.label}</span>
                  <span className="text-[13px] font-display font-black text-white">{s.value}</span>
                </div>
              ))}
              {signal.playerStats.injuryStatus && (
                <div className="flex items-baseline gap-1.5 bg-red-500/10 border border-red-500/25 rounded-md px-3 py-1.5">
                  <span className="text-[9px] font-display font-semibold uppercase tracking-widest text-red-400">Status</span>
                  <span className="text-[13px] font-display font-black text-red-300">{signal.playerStats.injuryStatus}</span>
                </div>
              )}
            </div>
          ) : signal.playerStats?.knownActive ? (
            <p className="text-muted text-[11px] font-display italic">Active player — live stats temporarily unavailable</p>
          ) : (
            <p className="text-muted text-[11px] font-display italic">Historical player — using market data only</p>
          )}
        </div>
      )}

      {/* ── Recent news ─────────────────────────────────────────────────────── */}
      {hasNews && !streaming && (
        <div className="border-t border-[rgba(30,45,69,0.8)]">
          <button
            onClick={() => setShowNews((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-navy-900/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Newspaper size={11} className="text-muted" />
              <span className="text-[9px] font-display font-semibold uppercase tracking-widest text-muted">
                Recent News
              </span>
              <span className="text-[9px] font-display text-chrome-600 bg-[#1E2D45] px-1.5 py-0.5 rounded">
                {signal.newsItems!.length}
              </span>
            </div>
            {showNews
              ? <ChevronUp size={11} className="text-chrome-600" />
              : <ChevronDown size={11} className="text-chrome-600" />
            }
          </button>
          {showNews && (
            <div className="px-5 pb-3 space-y-2 bg-[#0A1628]/30">
              {signal.newsItems!.map((headline, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[9px] font-display font-semibold text-chrome-600 mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <p className="text-chrome-400 text-[11px] font-display leading-snug">{headline}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-[rgba(30,45,69,0.8)] bg-navy-950/40 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
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
          {!streaming && signal.evPerDollar !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-chrome-500 font-display font-black uppercase tracking-widest">EV:</span>
              <span className={`font-display font-black ${signal.evPerDollar >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {signal.evPerDollar >= 0 ? '+' : ''}{(signal.evPerDollar * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!streaming && signal.qualityScore !== undefined && (
            <span
              className="text-[9px] font-display text-chrome-600 tabular-nums"
              title={signal.qualityRationale ?? 'Data quality score'}
            >
              Q: {signal.qualityScore}/10
            </span>
          )}
          <p className="text-xs text-chrome-700">
            {new Date(signal.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>

    </div>
  );
}
