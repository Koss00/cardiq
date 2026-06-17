import { NextRequest, NextResponse } from 'next/server';
import { dbGetAllCards, dbGetPriceHistory, dbCreateAlert, dbSavePortfolioSnapshot, initSchema, dbSetEbayCache } from '@/lib/db';
import { sendPriceAlertEmail } from '@/lib/email';
import { setCachedEbay, recordPriceHistory } from '@/lib/cache';
import { getEbayAppToken } from '@/lib/ebay-auth';
import { buildEbayQuery, fetchFindingSold } from '@/lib/ebay-utils';
import { clerkClient } from '@clerk/nextjs/server';

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

  const appId = process.env.EBAY_APP_ID ?? '';

  // Resolve a card owner's email from Clerk (email isn't stored in our DB), cached
  // per user so repeated alerts in one run cost one lookup. Returns null on miss.
  const emailCache = new Map<string, string | null>();
  let clerk: Awaited<ReturnType<typeof clerkClient>> | null = null;
  async function ownerEmailFor(userId: string | undefined): Promise<string | null> {
    if (!userId || userId === 'legacy') return null;
    if (emailCache.has(userId)) return emailCache.get(userId)!;
    try {
      if (!clerk) clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
      emailCache.set(userId, email);
      return email;
    } catch {
      emailCache.set(userId, null);
      return null;
    }
  }

  for (const card of cards) {
    const query = buildEbayQuery(card.year, card.brand, card.player, card.variation, card.condition);
    const cacheKey = `ebay:${query}`;
    try {
      // ── Primary: Finding API (real sold prices) ──────────────────────────
      let listings: Array<{ title: string; price: number; url: string; imageUrl?: string; listedAt?: string }> = [];
      let source: 'sold' | 'active' = 'active';

      if (appId) {
        const soldListings = await fetchFindingSold(query, appId, card.player).catch(() => null);
        if (soldListings && soldListings.length > 0) {
          listings = soldListings;
          source   = 'sold';
        }
      }

      // ── Fallback: Browse API (active listings) ────────────────────────────
      if (listings.length === 0) {
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
        listings = items
          .map((item) => {
            const priceVal = (item.price as Record<string, string> | undefined)?.value;
            const price = parseFloat(priceVal ?? '0');
            const imageUrl = (item.image as Record<string, string> | undefined)?.imageUrl;
            return { title: item.title as string, price, url: item.itemWebUrl as string, imageUrl };
          })
          .filter((l) => l.price > 0)
          .sort((a, b) => a.price - b.price);
      }

      if (listings.length > 0) {
        setCachedEbay(cacheKey, listings, source);
        setCachedEbay(`active:${query}`, listings, source);
        dbSetEbayCache(cacheKey, listings, source).catch(() => {});

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
              const alertType = pctChange > 0 ? 'SPIKE' : 'DROP';
              await dbCreateAlert({
                cardId:    card.id,
                player:    card.player,
                alertType,
                oldPrice:  prevPrice,
                newPrice:  currPrice,
                pctChange: Math.round(pctChange * 100) / 100,
              });
              // Send email alert (requires RESEND_API_KEY; email resolved from Clerk)
              const ownerEmail = await ownerEmailFor(card.userId);
              if (ownerEmail) {
                sendPriceAlertEmail({
                  to:         ownerEmail,
                  player:     card.player,
                  alertType,
                  oldPrice:   prevPrice,
                  newPrice:   currPrice,
                  pctChange:  Math.round(pctChange * 100) / 100,
                }).catch(() => {});
              }
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

  // Save per-user portfolio snapshots for the value-over-time chart
  // Group updated cards by user and sum their current values
  const userValues = new Map<string, number>();
  for (const card of cards) {
    const uid = card.userId ?? 'legacy';
    userValues.set(uid, (userValues.get(uid) ?? 0) + card.currentValue);
  }
  for (const [uid, total] of userValues) {
    dbSavePortfolioSnapshot(uid, total).catch(() => {});
  }

  return NextResponse.json({ refreshed, total: cards.length, errors });
}
