export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function roiColor(roi: number): string {
  if (roi > 0) return 'text-emerald-400';
  if (roi < 0) return 'text-red-400';
  return 'text-gray-400';
}

export function calcRoi(purchasePrice: number, currentValue: number): number {
  if (purchasePrice === 0) return 0;
  return ((currentValue - purchasePrice) / purchasePrice) * 100;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
