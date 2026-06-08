import { NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe';
import { dbSetStripeCustomerId, initSchema } from '@/lib/db';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cardiq-rho.vercel.app';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return Response.json({ error: 'Payments not configured yet.' }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  await initSchema().catch(() => {});

  // Create or retrieve a Stripe customer so we can link the subscription back
  let customerId: string | undefined;
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { clerkUserId: userId },
      });
      customerId = customer.id;
    }
    await dbSetStripeCustomerId(userId, customerId).catch(() => {});
  }

  const source = (await req.json().catch(() => ({}))) as { source?: string };
  const cancelUrl = source?.source === 'pricing'
    ? `${APP_URL}/pricing`
    : `${APP_URL}/dashboard`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode:     'subscription',
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${APP_URL}/dashboard?upgraded=true`,
    cancel_url:  cancelUrl,
    metadata:    { clerkUserId: userId },
    subscription_data: {
      metadata: { clerkUserId: userId },
    },
  });

  return Response.json({ url: session.url });
}
