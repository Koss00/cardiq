import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dbGetPortfolioSnapshots, initSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ snapshots: [] }, { status: 401 });

  const days = parseInt(new URL(req.url).searchParams.get('days') ?? '90', 10);

  await initSchema().catch(() => {});
  const snapshots = await dbGetPortfolioSnapshots(userId, Math.min(days, 365)).catch(() => []);
  return NextResponse.json({ snapshots });
}
