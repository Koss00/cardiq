import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbGetCards, dbUpsertCard, dbDeleteCard, initSchema } from '@/lib/db';
import { checkCardLimit } from '@/lib/gates';
import { Card } from '@/types';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ cards: [] }, { status: 401 });
    await initSchema();
    const cards = await dbGetCards(userId);
    return NextResponse.json({ cards });
  } catch (err) {
    console.error('[portfolio] GET error:', err);
    return NextResponse.json({ cards: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
    await initSchema();
    const { card }: { card: Card } = await req.json();

    // Check plan limit — only enforced on new cards (not updates to existing ones)
    const existing = await dbGetCards(userId);
    const isNewCard = !existing.find((c) => c.id === card.id);
    if (isNewCard) {
      const gate = await checkCardLimit(userId, existing.length);
      if (!gate.allowed) {
        return NextResponse.json(
          { ok: false, error: 'CARD_LIMIT', limit: gate.limit, count: gate.count },
          { status: 402 },
        );
      }
    }

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
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[portfolio] POST error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
    const { id }: { id: string } = await req.json();
    await dbDeleteCard(id, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[portfolio] DELETE error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
