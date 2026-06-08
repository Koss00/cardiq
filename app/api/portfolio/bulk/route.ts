import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbUpsertCard, dbGetCards, initSchema } from '@/lib/db';
import { checkCardLimit, FREE_CARD_LIMIT } from '@/lib/gates';
import { Card } from '@/types';
import { generateId } from '@/lib/utils';

const MAX_IMPORT = 200;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initSchema().catch(() => {});

  let cards: Partial<Card>[];
  try {
    const body = await req.json() as { cards: Partial<Card>[] };
    cards = body.cards?.slice(0, MAX_IMPORT) ?? [];
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (cards.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: [] });
  }

  // Check plan limits
  const existing = await dbGetCards(userId).catch(() => []);
  const gate = await checkCardLimit(userId, existing.length);

  const allowedSlots = gate.limit !== null ? Math.max(0, gate.limit - existing.length) : cards.length;
  const toImport     = gate.limit !== null ? cards.slice(0, allowedSlots) : cards;
  const skipped      = cards.length - toImport.length;

  const errors: string[] = [];
  let imported = 0;

  for (const raw of toImport) {
    if (!raw.player || !raw.year || !raw.brand) {
      errors.push(`Row missing required fields (player: "${raw.player}", year: "${raw.year}", brand: "${raw.brand}")`);
      continue;
    }

    try {
      const card: Card = {
        id:            raw.id ?? generateId(),
        player:        String(raw.player).trim(),
        year:          Number(raw.year),
        brand:         String(raw.brand).trim(),
        cardNumber:    raw.cardNumber ? String(raw.cardNumber).trim() : undefined,
        variation:     raw.variation  ? String(raw.variation).trim()  : undefined,
        condition:     (raw.condition ?? 'Raw') as Card['condition'],
        sport:         (raw.sport     ?? 'Baseball') as Card['sport'],
        purchasePrice: Number(raw.purchasePrice ?? 0),
        currentValue:  Number(raw.currentValue  ?? 0),
        addedAt:       raw.addedAt ?? new Date().toISOString(),
        lastPriceUpdate: raw.lastPriceUpdate,
        imageUrl:      raw.imageUrl,
      };
      await dbUpsertCard({
        id:                card.id,
        user_id:           userId,
        player:            card.player,
        year:              card.year,
        brand:             card.brand,
        card_number:       card.cardNumber,
        variation:         card.variation,
        condition:         card.condition,
        sport:             card.sport,
        purchase_price:    card.purchasePrice,
        current_value:     card.currentValue,
        added_at:          card.addedAt,
        last_price_update: card.lastPriceUpdate,
        image_url:         card.imageUrl,
      });
      imported++;
    } catch (err) {
      errors.push(`Failed to import "${raw.player}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    errors,
    limitReached: gate.limit !== null && (existing.length + imported) >= gate.limit,
    upgradeRequired: gate.limit !== null && existing.length >= gate.limit,
    limit: gate.limit ?? null,
  });
}
