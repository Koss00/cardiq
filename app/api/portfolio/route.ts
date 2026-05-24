import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbGetCards, dbUpsertCard, dbDeleteCard, initSchema } from '@/lib/db';
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
