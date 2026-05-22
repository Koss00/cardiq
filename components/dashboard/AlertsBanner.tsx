'use client';

import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'just now';
}

export default function AlertsBanner() {
  const { state, dispatch } = useStore();
  const { alerts } = state;

  if (alerts.length === 0) return null;

  function dismiss(id: number) {
    dispatch({ type: 'DISMISS_ALERT', id });
  }

  function dismissAll() {
    alerts.forEach((a) => dispatch({ type: 'DISMISS_ALERT', id: a.id }));
  }

  return (
    <div className="space-y-2 mb-5 fade-in-up">
      {alerts.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={dismissAll}
            className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-600 hover:text-chrome-300 transition-colors cursor-pointer"
          >
            Dismiss all
          </button>
        </div>
      )}
      {alerts.map((alert) => {
        const isSpike = alert.alertType === 'SPIKE';
        const color   = isSpike ? 'text-emerald-400' : 'text-red-400';
        const accent  = isSpike ? 'bg-emerald-500' : 'bg-red-500';
        const badgeBg = isSpike ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400';
        const Icon    = isSpike ? TrendingUp : TrendingDown;

        return (
          <div key={alert.id} className="chrome-panel p-4 flex items-center gap-4 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />

            <Icon size={16} className={`${color} flex-shrink-0 ml-1`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-black text-white text-sm truncate">{alert.player}</span>
                <span className={`text-[9px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${badgeBg}`}>
                  {alert.alertType}
                </span>
              </div>
              <p className="text-[11px] font-display mt-0.5 tabular-nums">
                <span className="text-chrome-400">{formatCurrency(alert.oldPrice)}</span>
                <span className="text-chrome-600 mx-1.5">→</span>
                <span className={`font-black ${color}`}>{formatCurrency(alert.newPrice)}</span>
                <span className={`ml-2 font-black ${color}`}>
                  {alert.pctChange > 0 ? '+' : ''}{alert.pctChange.toFixed(1)}%
                </span>
              </p>
            </div>

            <span className="text-[10px] text-chrome-600 font-display flex-shrink-0">
              {timeAgo(alert.createdAt)}
            </span>

            <button
              onClick={() => dismiss(alert.id)}
              className="text-chrome-600 hover:text-chrome-200 transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
