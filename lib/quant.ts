const RF_DAILY = 0.02 / 252;
const KELLY_CAP = 0.5;
const MIN_POINTS = 3;

export function buildReturns(prices: number[]): number[] {
  const clean = prices.filter(isFinite);
  if (clean.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < clean.length; i++) {
    if (clean[i - 1] !== 0) returns.push((clean[i] - clean[i - 1]) / clean[i - 1]);
  }
  return returns;
}

export function mean(arr: number[]): number {
  const clean = arr.filter(isFinite);
  if (clean.length === 0) return 0;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

export function stdev(arr: number[]): number {
  const clean = arr.filter(isFinite);
  if (clean.length < 2) return 0;
  const m = mean(clean);
  const variance = clean.reduce((s, x) => s + (x - m) ** 2, 0) / (clean.length - 1);
  return Math.sqrt(variance);
}

export function sharpeRatio(returns: number[], rfDaily: number = RF_DAILY): number | null {
  const clean = returns.filter(isFinite);
  if (clean.length === 0) return null;
  const s = stdev(clean);
  if (s === 0) return null;
  return (mean(clean) - rfDaily) / s;
}

export function maxDrawdown(prices: number[]): number | null {
  const clean = prices.filter(isFinite);
  if (clean.length < MIN_POINTS) return null;
  let peak = clean[0];
  let maxDD = 0;
  for (const price of clean) {
    if (price > peak) peak = price;
    const dd = peak > 0 ? (peak - price) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function kellyAllocation(returns: number[]): number | null {
  const clean = returns.filter(isFinite);
  if (clean.length === 0) return null;
  const wins   = clean.filter((r) => r > 0);
  const losses = clean.filter((r) => r < 0);
  if (wins.length === 0) return 0;
  const p      = wins.length / clean.length;
  const q      = 1 - p;
  const avgWin = wins.reduce((a, b) => a + b, 0) / wins.length;
  if (losses.length === 0) return KELLY_CAP;
  const avgLoss = Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length);
  if (avgLoss === 0) return null;
  const b = avgWin / avgLoss;
  const f = (b * p - q) / b;
  if (f < 0) return 0;
  return Math.min(f, KELLY_CAP);
}

export function buildPortfolioReturns(
  cardHistories: Array<{ prices: number[]; weight: number }>,
): number[] {
  const eligible = cardHistories.filter(
    (h) => h.prices.filter(isFinite).length >= MIN_POINTS && h.weight > 0,
  );
  if (eligible.length === 0) return [];

  const series = eligible
    .map((h) => ({ returns: buildReturns(h.prices.filter(isFinite)), weight: h.weight }))
    .filter((s) => s.returns.length > 0);

  if (series.length === 0) return [];

  const minLen     = Math.min(...series.map((s) => s.returns.length));
  const totalWeight = series.reduce((s, r) => s + r.weight, 0);

  const portfolio: number[] = [];
  for (let i = 0; i < minLen; i++) {
    portfolio.push(
      series.reduce((sum, s) => sum + (s.returns[i] * s.weight) / totalWeight, 0),
    );
  }
  return portfolio;
}
