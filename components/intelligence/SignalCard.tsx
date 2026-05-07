'use client';

import { TrendingUp, TrendingDown, Minus, Target, Clock, BarChart2, Star, Layers, Activity } from 'lucide-react';
import { CardSignal } from '@/types';
import { formatCurrency } from '@/lib/utils';

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
  {
    key: 'priceTrend' as const,
    label: 'Price Trend',
    icon: BarChart2,
    color: 'text-blue-400',
    dot: 'bg-blue-500',
  },
  {
    key: 'playerContext' as const,
    label: 'Player Performance',
    icon: Star,
    color: 'text-gold-400',
    dot: 'bg-gold-400',
  },
  {
    key: 'scarcityNote' as const,
    label: 'Scarcity & Grade',
    icon: Layers,
    color: 'text-purple-400',
    dot: 'bg-purple-500',
  },
];

interface Props {
  signal: CardSignal;
  streaming?: boolean;
  activeField?: string;
}

export default function SignalCard({ signal, streaming = false, activeField }: Props) {
  const cfg = SIGNAL_CONFIG[signal.signal];
  const Icon = cfg.icon;

  const hasDetailedAnalysis =
    streaming || Boolean(signal.priceTrend && signal.playerContext && signal.scarcityNote);

  return (
    <div className={`holo-shimmer chrome-panel overflow-hidden border ${cfg.border}`}>
      {/* Header */}
      <div className={`${cfg.headerBg} px-5 py-4 flex items-start justify-between gap-4 border-b border-[rgba(0,212,255,0.06)]`}>
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

        {/* Confidence meter */}
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-display font-black text-chrome-500 uppercase tracking-widest mb-1">Confidence</p>
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

      {/* Summary */}
      <div className="px-5 py-3 border-b border-[rgba(0,212,255,0.06)] bg-navy-900/40">
        <p className="text-chrome-200 text-sm font-semibold leading-relaxed">
          {signal.summary ?? signal.reason}
        </p>
      </div>

      {/* Three-dimension analysis */}
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
                {signal[key] || (
                  <span className="text-chrome-600 italic">Analyzing…</span>
                )}
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

      {/* Player Stats strip */}
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
                  <span className="text-[9px] font-display font-black uppercase tracking-widest text-red-400">Inj</span>
                  <span className="text-[12px] font-display font-black text-red-300">{signal.playerStats.injuryStatus}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-chrome-600 text-[11px] font-display italic">Stats unavailable for this player</p>
          )}
        </div>
      )}

      {/* Footer */}
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
