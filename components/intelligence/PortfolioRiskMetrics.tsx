'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Target, BarChart2, TrendingDown, type LucideIcon } from 'lucide-react';
import type { PortfolioMetrics } from '@/types';

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'just now';
}

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: LucideIcon;
}

function MetricCard({ label, value, sub, color, icon: Icon }: MetricCardProps) {
  return (
    <div className="chrome-panel p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <Icon size={10} className={color} />
        <span className={`text-[9px] font-display font-black uppercase tracking-widest ${color}`}>
          {label}
        </span>
      </div>
      <p className={`font-card text-3xl tabular-nums ${color}`}>{value}</p>
      <p className="text-[9px] font-display text-chrome-600 uppercase tracking-widest mt-1">{sub}</p>
    </div>
  );
}

function kellyColor(v: number | null): string {
  if (v === null) return 'text-chrome-500';
  return v >= 0.3 ? 'text-emerald-400' : 'text-gold-400';
}

function sharpeColor(v: number | null): string {
  if (v === null) return 'text-chrome-500';
  if (v >= 1)  return 'text-emerald-400';
  if (v >= 0)  return 'text-gold-400';
  return 'text-red-400';
}

function drawdownColor(v: number | null): string {
  if (v === null) return 'text-chrome-500';
  if (v <= 0.15) return 'text-emerald-400';
  if (v <= 0.30) return 'text-gold-400';
  return 'text-red-400';
}

function fmtKelly(v: number | null): string {
  return v === null ? 'N/A' : `${(v * 100).toFixed(1)}%`;
}

function fmtSharpe(v: number | null): string {
  return v === null ? 'N/A' : v.toFixed(2);
}

function fmtDrawdown(v: number | null): string {
  return v === null ? 'N/A' : `−${(v * 100).toFixed(1)}%`;
}

export default function PortfolioRiskMetrics() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/portfolio/metrics')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PortfolioMetrics>;
      })
      .then(setMetrics)
      .catch(() => setError('Unable to load risk metrics'))
      .finally(() => setLoading(false));
  }, []);

  const insufficientData = metrics && metrics.cards.every((c) => c.pricePoints < 3);

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <ShieldAlert size={14} className="text-gold-400" />
        <h2 className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400">
          Portfolio Risk Metrics
        </h2>
        {metrics && (
          <span className="text-[9px] font-display text-chrome-600 uppercase tracking-widest ml-auto">
            Updated {timeAgo(metrics.computedAt)}
          </span>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="chrome-panel p-5 animate-pulse">
              <div className="h-2 bg-[#1E2D45] rounded mb-4 w-2/3" />
              <div className="h-8 bg-[#1E2D45] rounded mb-2 w-1/2" />
              <div className="h-2 bg-[#1E2D45] rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-chrome-600 text-xs font-display italic">{error}</p>
      )}

      {metrics && !insufficientData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Kelly Allocation"
            value={fmtKelly(metrics.portfolioKelly)}
            sub="optimal bet fraction"
            color={kellyColor(metrics.portfolioKelly)}
            icon={Target}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={fmtSharpe(metrics.portfolioSharpe)}
            sub="risk-adj. return"
            color={sharpeColor(metrics.portfolioSharpe)}
            icon={BarChart2}
          />
          <MetricCard
            label="Max Drawdown"
            value={fmtDrawdown(metrics.portfolioMaxDrawdown)}
            sub="peak-to-trough"
            color={drawdownColor(metrics.portfolioMaxDrawdown)}
            icon={TrendingDown}
          />
        </div>
      )}

      {metrics && insufficientData && (
        <p className="text-chrome-600 text-xs font-display italic">
          Building history — need 3+ price refreshes per card for risk metrics.
        </p>
      )}
    </section>
  );
}
