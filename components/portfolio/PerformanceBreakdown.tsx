'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card } from '@/types';
import { formatCurrency, calcRoi } from '@/lib/utils';

interface Props {
  cards: Card[];
}

export default function PerformanceBreakdown({ cards }: Props) {
  if (cards.length === 0) return null;

  const withRoi = cards
    .filter((c) => c.purchasePrice > 0)
    .map((c) => ({
      ...c,
      roi:    calcRoi(c.purchasePrice, c.currentValue),
      pl:     c.currentValue - c.purchasePrice,
    }))
    .sort((a, b) => b.roi - a.roi);

  if (withRoi.length === 0) return null;

  const totalInvested = cards.reduce((s, c) => s + c.purchasePrice, 0);
  const totalValue    = cards.reduce((s, c) => s + c.currentValue, 0);
  const totalPL       = totalValue - totalInvested;
  const totalRoi      = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  const best  = withRoi.slice(0, 3);
  const worst = [...withRoi].reverse().slice(0, 3);

  return (
    <div className="chrome-panel p-5">
      {/* Header + total P&L */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400">
          Performance
        </p>
        <div className="flex items-center gap-1.5">
          <DollarSign size={10} className={totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <span className={`text-sm font-display font-black ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
          </span>
          <span className="text-chrome-600 text-xs font-display">
            ({totalRoi >= 0 ? '+' : ''}{totalRoi.toFixed(1)}% total ROI)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Best performers */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={10} className="text-emerald-400" />
            <span className="text-[9px] font-display font-black uppercase tracking-widest text-emerald-400">
              Best
            </span>
          </div>
          <div className="space-y-1.5">
            {best.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-emerald-500/[0.05] border border-emerald-500/10 rounded-sm px-2.5 py-1.5">
                <span className="text-xs text-slate-300 font-sans truncate max-w-[120px]">{c.player}</span>
                <span className="text-xs font-display font-black text-emerald-400 flex-shrink-0 ml-2">
                  +{c.roi.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Worst performers */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={10} className="text-red-400" />
            <span className="text-[9px] font-display font-black uppercase tracking-widest text-red-400">
              Needs Attention
            </span>
          </div>
          <div className="space-y-1.5">
            {worst.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-red-500/[0.05] border border-red-500/10 rounded-sm px-2.5 py-1.5">
                <span className="text-xs text-slate-300 font-sans truncate max-w-[120px]">{c.player}</span>
                <span className="text-xs font-display font-black text-red-400 flex-shrink-0 ml-2">
                  {c.roi.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
