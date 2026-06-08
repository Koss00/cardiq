'use client';

import { AlertTriangle } from 'lucide-react';
import { Card } from '@/types';
import { CardSignal, SignalType } from '@/types';

interface Props {
  cards:   Card[];
  signals: CardSignal[];
}

const SPORT_COLORS: Record<string, string> = {
  Baseball:   'bg-emerald-500',
  Basketball: 'bg-orange-400',
  Football:   'bg-blue-500',
  Hockey:     'bg-cyan-400',
  Soccer:     'bg-lime-500',
  Golf:       'bg-yellow-400',
};

const SIGNAL_STYLES: Record<SignalType, { label: string; color: string; bg: string }> = {
  BUY:  { label: 'BUY',  color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  SELL: { label: 'SELL', color: 'text-red-400',     bg: 'bg-red-500/20'     },
  HOLD: { label: 'HOLD', color: 'text-amber-400',   bg: 'bg-amber-500/20'   },
};

export default function ConcentrationPanel({ cards, signals }: Props) {
  if (cards.length === 0) return null;

  // Sport breakdown
  const sportCounts = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.sport] = (acc[c.sport] ?? 0) + 1;
    return acc;
  }, {});

  const totalValue = cards.reduce((s, c) => s + c.currentValue, 0);

  // Single-card risk: top card by value
  const topCard    = [...cards].sort((a, b) => b.currentValue - a.currentValue)[0];
  const topPct     = totalValue > 0 ? (topCard.currentValue / totalValue) * 100 : 0;
  const isConcentrated = topPct > 40;

  // Signal distribution
  const sigCounts = signals.reduce<Partial<Record<SignalType, number>>>((acc, s) => {
    acc[s.signal] = (acc[s.signal] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="chrome-panel p-5">
      <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400 mb-4">
        Portfolio Composition
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sport breakdown */}
        <div>
          <p className="text-[9px] font-display uppercase tracking-widest text-chrome-600 mb-2">By Sport</p>
          <div className="space-y-1.5">
            {Object.entries(sportCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([sport, count]) => {
                const pct = (count / cards.length) * 100;
                return (
                  <div key={sport}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-slate-300 font-sans">{sport}</span>
                      <span className="text-[10px] font-display text-chrome-500">{count} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1E2D45] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SPORT_COLORS[sport] ?? 'bg-chrome-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Signal distribution + concentration */}
        <div className="space-y-3">
          {/* Signals */}
          {signals.length > 0 && (
            <div>
              <p className="text-[9px] font-display uppercase tracking-widest text-chrome-600 mb-2">Signals</p>
              <div className="flex gap-2">
                {(['BUY', 'SELL', 'HOLD'] as SignalType[]).map((type) => {
                  const n = sigCounts[type] ?? 0;
                  const s = SIGNAL_STYLES[type];
                  return (
                    <div key={type} className={`flex-1 ${s.bg} rounded-sm px-2 py-1.5 text-center`}>
                      <p className={`text-[9px] font-display font-black uppercase ${s.color}`}>{type}</p>
                      <p className={`text-lg font-display font-black ${s.color} tabular-nums`}>{n}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Concentration warning */}
          {isConcentrated && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
              <AlertTriangle size={11} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-display font-black uppercase tracking-widest text-amber-400">
                  Concentrated Position
                </p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  {topCard.player} is {topPct.toFixed(0)}% of portfolio value
                </p>
              </div>
            </div>
          )}

          {!isConcentrated && totalValue > 0 && (
            <div className="bg-emerald-500/[0.05] border border-emerald-500/10 rounded-md px-3 py-2">
              <p className="text-[10px] font-display font-black uppercase tracking-widest text-emerald-400">
                Well Diversified
              </p>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Largest position is {topPct.toFixed(0)}% of total value
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
