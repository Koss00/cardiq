'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Snapshot { date: string; totalValue: number }

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111D33] border border-[#1E2D45] rounded-md px-3 py-2">
      <p className="text-[10px] font-display uppercase tracking-widest text-chrome-500 mb-0.5">{label}</p>
      <p className="text-sm font-display font-black text-white">
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}

export default function PortfolioValueChart() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch('/api/portfolio/value-history?days=90')
      .then((r) => r.json())
      .then(({ snapshots: s }: { snapshots: Snapshot[] }) => setSnapshots(s ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="chrome-panel p-5 animate-pulse">
        <div className="h-3 bg-[#1E2D45] rounded w-32 mb-4" />
        <div className="h-28 bg-[#1E2D45] rounded" />
      </div>
    );
  }

  if (snapshots.length < 2) {
    return (
      <div className="chrome-panel p-5">
        <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-2">
          Portfolio Value History
        </p>
        <p className="text-sm text-chrome-600 font-sans">
          History builds as prices are refreshed nightly. Check back tomorrow.
        </p>
      </div>
    );
  }

  const first = snapshots[0].totalValue;
  const last  = snapshots[snapshots.length - 1].totalValue;
  const diff  = last - first;
  const pct   = first > 0 ? (diff / first) * 100 : 0;
  const isUp  = diff >= 0;

  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#8892A4';

  const chartData = snapshots.map((s) => ({
    date:  new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: s.totalValue,
  }));

  return (
    <div className="chrome-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400">
          Portfolio Value — 90 Days
        </p>
        <div className="flex items-center gap-1.5">
          <TrendIcon size={12} style={{ color: trendColor }} />
          <span className="text-sm font-display font-black" style={{ color: trendColor }}>
            {isUp ? '+' : ''}{pct.toFixed(1)}%
          </span>
          <span className="text-chrome-600 text-xs font-display">
            ({isUp ? '+' : ''}${diff.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
              <stop offset="95%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#8892A4', fontSize: 9, fontFamily: 'system-ui' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isUp ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            fill="url(#portfolioGradient)"
            dot={false}
            activeDot={{ r: 4, fill: isUp ? '#10b981' : '#ef4444', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
