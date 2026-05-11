'use client';

import { PricePoint } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  points: PricePoint[];
  cardId: string;
  height?: number;
}

export default function PriceHistoryChart({ points, cardId, height = 160 }: Props) {
  if (points.length < 2) {
    return (
      <p className="text-chrome-600 text-xs font-display italic">
        Tracking price history… refresh the price a few times to build a trend line.
      </p>
    );
  }

  const prices  = points.map((p) => p.price);
  const rawMin  = Math.min(...prices);
  const rawMax  = Math.max(...prices);
  const rawRange = rawMax - rawMin || rawMax * 0.1 || 1;
  const padMin  = rawMin - rawRange * 0.15;
  const padMax  = rawMax + rawRange * 0.15;
  const padRange = padMax - padMin;

  const W = 560;
  const H = height;
  const PL = 52; // left padding for Y labels
  const PR = 12;
  const PT = 14;
  const PB = 28;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const toX = (i: number) => PL + (i / (points.length - 1)) * cW;
  const toY = (price: number) => PT + (1 - (price - padMin) / padRange) * cH;

  const lineStr = points.map((p, i) => `${toX(i)},${toY(p.price)}`).join(' ');
  const fillStr = `${PL},${PT + cH} ${lineStr} ${PL + cW},${PT + cH}`;

  const first  = prices[0];
  const last   = prices[prices.length - 1];
  const pct    = ((last - first) / first) * 100;
  const trend  = pct > 2 ? 'up' : pct < -2 ? 'down' : 'flat';
  const color  = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#F5C842';

  const fillId = `phfill-${cardId.replace(/[^a-z0-9]/gi, '')}`;

  // Y-axis: 3 grid lines
  const yTicks = [0.25, 0.5, 0.75].map((f) => padMin + f * padRange);

  // X-axis: show ~4 date labels
  const xIdxs = points.length <= 5
    ? points.map((_, i) => i)
    : [0, Math.round(points.length * 0.33), Math.round(points.length * 0.66), points.length - 1];

  const fmtDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="w-full">
      {/* Summary row */}
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-card text-3xl text-white">{formatCurrency(last)}</span>
          <span className="text-sm font-display font-black" style={{ color }}>
            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
          </span>
          <span className="text-xs text-chrome-500 font-display">
            from {formatCurrency(first)}
          </span>
        </div>
        <span className="text-[10px] font-display text-chrome-600 uppercase tracking-widest">
          {points.length} pts · {fmtDate(points[0].timestamp)}–{fmtDate(points[points.length - 1].timestamp)}
        </span>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y grid lines + labels */}
        {yTicks.map((price, i) => (
          <g key={i}>
            <line
              x1={PL} y1={toY(price)} x2={PL + cW} y2={toY(price)}
              stroke="rgba(192,200,216,0.07)" strokeWidth="1" strokeDasharray="3 5"
            />
            <text
              x={PL - 6} y={toY(price) + 3.5}
              fill="rgba(192,200,216,0.4)"
              fontSize="10"
              textAnchor="end"
              fontFamily="monospace"
            >
              ${Math.round(price)}
            </text>
          </g>
        ))}

        {/* Baseline */}
        <line
          x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH}
          stroke="rgba(0,212,255,0.1)" strokeWidth="1"
        />

        {/* Fill area */}
        <polygon points={fillStr} fill={`url(#${fillId})`} />

        {/* Line */}
        <polyline
          points={lineStr}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <circle
              key={i}
              cx={toX(i)}
              cy={toY(p.price)}
              r={isLast ? 4 : 2.5}
              fill={color}
              stroke={isLast ? 'rgba(255,255,255,0.4)' : 'none'}
              strokeWidth="1.5"
            />
          );
        })}

        {/* X labels */}
        {xIdxs.map((i) => (
          <text
            key={i}
            x={toX(i)}
            y={H - 4}
            fill="rgba(192,200,216,0.45)"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {fmtDate(points[i].timestamp)}
          </text>
        ))}
      </svg>
    </div>
  );
}
