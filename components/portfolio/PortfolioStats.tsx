'use client';

import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';
import { Card } from '@/types';
import { formatCurrency, formatPct, calcRoi } from '@/lib/utils';

export default function PortfolioStats({ cards }: { cards: Card[] }) {
  const totalValue = cards.reduce((s, c) => s + c.currentValue, 0);
  const totalCost = cards.reduce((s, c) => s + c.purchasePrice, 0);
  const totalGain = totalValue - totalCost;
  const totalRoi = calcRoi(totalCost, totalValue);

  const withRoi = cards.map((c) => ({ ...c, roi: calcRoi(c.purchasePrice, c.currentValue) }));
  const best = withRoi.length ? withRoi.reduce((a, b) => (a.roi > b.roi ? a : b)) : null;
  const worst = withRoi.length ? withRoi.reduce((a, b) => (a.roi < b.roi ? a : b)) : null;

  const stats = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(totalValue),
      sub: `${totalGain >= 0 ? '+' : ''}${formatCurrency(totalGain)} (${formatPct(totalRoi)})`,
      subColor: totalGain >= 0 ? 'text-emerald-400' : 'text-red-400',
      icon: totalGain >= 0 ? TrendingUp : TrendingDown,
      iconColor: totalGain >= 0 ? 'text-emerald-400' : 'text-red-400',
      foil: true,
    },
    {
      label: 'Total Invested',
      value: formatCurrency(totalCost),
      sub: `${cards.length} card${cards.length !== 1 ? 's' : ''}`,
      subColor: 'text-slate-500',
      icon: null,
      foil: false,
    },
    {
      label: 'Best Performer',
      value: best ? best.player : '—',
      sub: best ? formatPct(best.roi) : '',
      subColor: 'text-emerald-400',
      icon: Trophy,
      iconColor: 'text-gold-400',
      foil: false,
    },
    {
      label: 'Weakest Hold',
      value: worst ? worst.player : '—',
      sub: worst ? formatPct(worst.roi) : '',
      subColor: worst && worst.roi < 0 ? 'text-red-400' : 'text-slate-500',
      icon: worst && worst.roi < 0 ? AlertTriangle : null,
      iconColor: 'text-red-400',
      foil: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className={`stat-card p-4 ${s.foil ? 'foil' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-display font-semibold uppercase tracking-widest text-muted">{s.label}</p>
            {s.icon && <s.icon size={14} className={s.iconColor} />}
          </div>
          <p className={`font-display font-black text-2xl truncate leading-tight ${s.foil ? 'title-gold' : 'text-white'}`}>{s.value}</p>
          {s.sub && <p className={`text-xs mt-1 font-display font-medium ${s.subColor}`}>{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}
