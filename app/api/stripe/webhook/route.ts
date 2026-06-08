import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import {
  dbSetUserPlan, dbGetUserByStripeCustomerId, initSchema,
} from '@/lib/db';
import type Stripe from 'stripe';

export const runtime = 'nodejs'; // Stripe needs the raw body

export async function POST(req: NextRequest) {
  if (!stripe) return new Response('Payments not configured', { status: 503 });

  const sig     = req.headers.get('stripe-signature');
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  await initSchema().catch(() => {});

  // Resolve the Clerk user ID from event metadata or customer ID
  async function resolveClerkUserId(obj: Record<string, unknown>): Promise<string | null> {
    const meta = obj.metadata as Record<string, string> | undefined;
    if (meta?.clerkUserId) return meta.clerkUserId;
    const customerId = obj.customer as string | undefined;
    if (customerId) {
      const row = await dbGetUserByStripeCustomerId(customerId).catch(() => null);
      return row?.clerkUserId ?? null;
    }
    return null;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = await resolveClerkUserId(session as unknown as Record<string, unknown>);
      if (clerkUserId) {
        await dbSetUserPlan(clerkUserId, 'pro').catch(() => {});
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const clerkUserId = await resolveClerkUserId(sub as unknown as Record<string, unknown>);
      if (clerkUserId) {
        await dbSetUserPlan(clerkUserId, 'free').catch(() => {});
      }
      break;
    }

    case 'invoice.payment_failed': {
      // Log it — don't downgrade immediately on first failure
      const invoice = event.data.object as Stripe.Invoice;
      console.warn('[stripe] payment failed for customer:', (invoice as unknown as Record<string, unknown>).customer);
      break;
    }

    default:
      break;
  }

  return new Response('ok', { status: 200 });
}
