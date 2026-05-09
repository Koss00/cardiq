'use client';

import { PricePoint } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  points: PricePoint[];
  cardId: string; // used as SVG gradient ID to avoid collisions across cards
  className?: string;
}

export default function PriceSparkline({ points, cardId, className = '' }: Props) {
  const last7 = points.slice(-7);
  if (last7.length < 2) return null;

  const prices = last7.map((p) => p.price);
  const min    = Math.min(...prices);
  const max    = Math.max(...prices);
  const range  = max - min || 1;

  const W   = 140;
  const H   = 40;
  const PAD = 4;

  const xStep = (W - PAD * 2) / (last7.length - 1);
  const toX   = (i: number) => PAD + i * xStep;
  const toY   = (price: number) => H - PAD - ((price - min) / range) * (H - PAD * 2 - 2);

  const pointStr  = last7.map((p, i) => `${toX(i)},${toY(p.price)}`).join(' ');
  const fillStr   = `${PAD},${H} ${pointStr} ${toX(last7.length - 1)},${H}`;

  const first  = prices[0];
  const latest = prices[prices.length - 1];
  const pct    = ((latest - first) / first) * 100;
  const trend  = pct > 2 ? 'up' : pct < -2 ? 'down' : 'flat';

  const color  = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#F5C842';
  const fillId = `spark-${cardId.replace(/[^a-z0-9]/gi, '')}`;

  const dateRange = (() => {
    const fmt = (ts: string) =>
      new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(last7[0].timestamp)} – ${fmt(last7[last7.length - 1].timestamp)}`;
  })();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="flex-shrink-0 overflow-visible"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Fill */}
        <polygon points={fillStr} fill={`url(#${fillId})`} />
        {/* Line */}
        <polyline
          points={pointStr}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots at each data point */}
        {last7.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.price)} r={i === last7.length - 1 ? 2.5 : 1.5} fill={color} />
        ))}
      </svg>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[11px] font-display font-black tabular-nums"
            style={{ color }}
          >
            {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
          </span>
          <span className="text-[10px] font-display text-chrome-600">
            {formatCurrency(first)} → {formatCurrency(latest)}
          </span>
        </div>
        <p className="text-[9px] font-display text-chrome-600 uppercase tracking-widest">
          {dateRange} · {last7.length} pts
        </p>
      </div>
    </div>
  );
}
