import { NextRequest, NextResponse } from 'next/server';
import { dbGetCards, dbUpsertCard, dbDeleteCard, initSchema } from '@/lib/db';
import { Card } from '@/types';

export async function GET() {
  try {
    await initSchema();
    const cards = await dbGetCards();
    return NextResponse.json({ cards });
  } catch (err) {
    console.error('[portfolio] GET error:', err);
    return NextResponse.json({ cards: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const { card }: { card: Card } = await req.json();
    await dbUpsertCard({
      id:               card.id,
      player:           card.player,
      year:             card.year,
      brand:            card.brand,
      card_number:      card.cardNumber,
      variation:        card.variation,
      condition:        card.condition,
      sport:            card.sport,
      purchase_price:   card.purchasePrice,
      current_value:    card.currentValue,
      added_at:         card.addedAt,
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
    const { id }: { id: string } = await req.json();
    await dbDeleteCard(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[portfolio] DELETE error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
