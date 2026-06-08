import Stripe from 'stripe';

// Stripe client — only instantiated if STRIPE_SECRET_KEY is set.
// The app builds and runs without it; upgrade flow simply won't work.
export const stripe = process.env.STRIPE_SECRET_KEY
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' as any })
  : null;

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? '';
