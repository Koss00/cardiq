import { NextRequest, NextResponse } from 'next/server';
import { dbGetAllCards, dbGetPriceHistory, dbCreateAlert, initSchema } from '@/lib/db';
import { setCachedEbay, recordPriceHistory } from '@/lib/cache';
import { getEbayAppToken } from '@/lib/ebay-auth';
import { buildEbayQuery } from '@/lib/ebay-utils';

const BROWSE_API          = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const ALERT_THRESHOLD_PCT = 10;

export async function POST(req: NextRequest) {
  // Verify secret so only GitHub Actions can trigger this
  const auth = req.headers.get('authorization');
  const secret = process.env.PRICE_REFRESH_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Price refresh runs as a cron job — refresh ALL cards across all users
  const cards = await dbGetAllCards();
  if (!cards.length) {
    return NextResponse.json({ refreshed: 0, message: 'No cards in portfolio' });
  }

  let token: string;
  try {
    token = await getEbayAppToken();
  } catch {
    return NextResponse.json({ error: 'eBay auth failed' }, { status: 500 });
  }

  await initSchema().catch(() => {});

  let refreshed = 0;
  const errors: string[] = [];

  for (const card of cards) {
    const query = buildEbayQuery(card.year, card.brand, card.player, card.variation, card.condition);
    try {
      const params = new URLSearchParams({
        q:      query,
        filter: 'buyingOptions:{FIXED_PRICE|AUCTION}',
        sort:   'price',
        limit:  '10',
      });

      const res = await fetch(`${BROWSE_API}?${params}`, {
        headers: {
          'Authorization':           `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      });

      if (!res.ok) {
        errors.push(`${card.player}: eBay ${res.status}`);
        continue;
      }

      const data = await res.json() as Record<string, unknown>;
      const items = (data.itemSummaries as Record<string, unknown>[]) ?? [];
      const listings = items
        .map((item) => {
          const priceVal = (item.price as Record<string, string> | undefined)?.value;
          const price = parseFloat(priceVal ?? '0');
          const imageUrl = (item.image as Record<string, string> | undefined)?.imageUrl;
          return { title: item.title as string, price, url: item.itemWebUrl as string, imageUrl };
        })
        .filter((l) => l.price > 0)
        .sort((a, b) => a.price - b.price);

      if (listings.length > 0) {
        // Bust the eBay cache so next page load gets fresh data
        setCachedEbay(`sold-completed:${query}`, listings);
        setCachedEbay(`active:${query}`, listings);

        const avg = listings.reduce((s, l) => s + l.price, 0) / listings.length;
        recordPriceHistory(`history:${query}`, Math.round(avg * 100) / 100);
        refreshed++;

        // ── Alert detection ───────────────────────────────────────────────
        const history = await dbGetPriceHistory(`history:${query}`);
        if (history.length >= 2) {
          const prevPrice = history[history.length - 2].price;
          const currPrice = history[history.length - 1].price;
          if (prevPrice > 0) {
            const pctChange = ((currPrice - prevPrice) / prevPrice) * 100;
            if (Math.abs(pctChange) >= ALERT_THRESHOLD_PCT) {
              await dbCreateAlert({
                cardId:    card.id,
                player:    card.player,
                alertType: pctChange > 0 ? 'SPIKE' : 'DROP',
                oldPrice:  prevPrice,
                newPrice:  currPrice,
                pctChange: Math.round(pctChange * 100) / 100,
              });
            }
          }
        }
      }

      // Throttle — avoid eBay rate limits
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      errors.push(`${card.player}: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  console.log(`[price-refresh] refreshed ${refreshed}/${cards.length} cards`);
  return NextResponse.json({ refreshed, total: cards.length, errors });
}
