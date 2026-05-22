import { NextRequest, NextResponse } from 'next/server';
import { dbGetCards, dbGetPriceHistory, initSchema } from '@/lib/db';
import {
  buildReturns, sharpeRatio, maxDrawdown, kellyAllocation, buildPortfolioReturns,
} from '@/lib/quant';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';
import type { PortfolioMetrics, CardMetrics } from '@/types';

const METRICS_TTL_MS = 60 * 60 * 1000;

let cachedMetrics: PortfolioMetrics | null = null;
let cacheExpiresAt = 0;

let schemaReady = false;
async function ensureSchema() {
  if (!schemaReady) { await initSchema(); schemaReady = true; }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'portfolio-metrics', 20);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  if (cachedMetrics && Date.now() < cacheExpiresAt) {
    return NextResponse.json(cachedMetrics);
  }

  try {
    await ensureSchema();
    const cards = await dbGetCards();

    const cardResults: CardMetrics[] = [];
    const portfolioInputs: Array<{ prices: number[]; weight: number }> = [];
    const totalValue = cards.reduce((s, c) => s + c.currentValue, 0);

    await Promise.allSettled(
      cards.map(async (card) => {
        const query = `${card.year} ${card.brand} ${card.player} ${card.variation ?? ''}`.trim();
        const history = await dbGetPriceHistory(`history:${query}`);
        const prices  = history.map((p) => p.price);
        const returns = buildReturns(prices);

        cardResults.push({
          cardId:      card.id,
          player:      card.player,
          kelly:       kellyAllocation(returns),
          sharpe:      sharpeRatio(returns),
          maxDrawdown: maxDrawdown(prices),
          pricePoints: prices.length,
        });

        if (totalValue > 0) {
          portfolioInputs.push({ prices, weight: card.currentValue / totalValue });
        }
      }),
    );

    const portReturns = buildPortfolioReturns(portfolioInputs);
    const portPrices  = portfolioInputs.flatMap((h) => h.prices);

    const metrics: PortfolioMetrics = {
      portfolioKelly:       kellyAllocation(portReturns),
      portfolioSharpe:      sharpeRatio(portReturns),
      portfolioMaxDrawdown: maxDrawdown(portPrices.length >= 3 ? portPrices : []),
      cards:                cardResults,
      computedAt:           new Date().toISOString(),
    };

    cachedMetrics    = metrics;
    cacheExpiresAt   = Date.now() + METRICS_TTL_MS;

    return NextResponse.json(metrics);
  } catch (err) {
    console.error('[portfolio/metrics] error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Unable to compute metrics' }, { status: 500 });
  }
}
