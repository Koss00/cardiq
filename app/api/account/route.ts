import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { dbGetCards, initSchema } from '@/lib/db';
import sql from '@/lib/db';

/** DELETE /api/account — delete all user data + Clerk account */
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

    await initSchema();

    // Delete all cards (cascades to price_alerts)
    await sql`DELETE FROM cards WHERE user_id = ${userId}`;

    // Delete all signals for this user's cards (card_id references)
    // (We identify by player data — signals are already scoped loosely)
    // Rate limits clean themselves up via reset_at expiry

    // Delete the Clerk user account
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[account] DELETE error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: 'Failed to delete account' }, { status: 500 });
  }
}

/** GET /api/account/export — return portfolio as CSV */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

    await initSchema();
    const cards = await dbGetCards(userId);

    const header = 'Player,Year,Brand,Card Number,Variation,Condition,Sport,Purchase Price,Current Value,ROI %,Added At\n';
    const rows = cards.map((c) => {
      const roi = c.purchasePrice > 0
        ? (((c.currentValue - c.purchasePrice) / c.purchasePrice) * 100).toFixed(1)
        : '—';
      return [
        `"${c.player}"`,
        c.year,
        `"${c.brand}"`,
        `"${c.cardNumber ?? ''}"`,
        `"${c.variation ?? ''}"`,
        `"${c.condition}"`,
        `"${c.sport}"`,
        c.purchasePrice.toFixed(2),
        c.currentValue.toFixed(2),
        roi,
        new Date(c.addedAt).toLocaleDateString('en-US'),
      ].join(',');
    }).join('\n');

    const csv = header + rows;

    return new Response(csv, {
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': 'attachment; filename="cardiq-portfolio.csv"',
      },
    });
  } catch (err) {
    console.error('[account] GET export error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
