import { dbGetUserPlan } from './db';
import { FREE_CARD_LIMIT, FREE_SIGNAL_LIMIT } from './plan-limits';
export { FREE_CARD_LIMIT, FREE_SIGNAL_LIMIT } from './plan-limits';

/**
 * Check whether this user can add another card.
 * Pro users have no limit. Free users are capped at FREE_CARD_LIMIT.
 */
export async function checkCardLimit(
  userId: string,
  currentCardCount: number,
): Promise<{ allowed: boolean; count: number; limit: number | null }> {
  try {
    const plan = await dbGetUserPlan(userId);
    if (plan === 'pro') return { allowed: true, count: currentCardCount, limit: null };
    if (currentCardCount >= FREE_CARD_LIMIT) {
      return { allowed: false, count: currentCardCount, limit: FREE_CARD_LIMIT };
    }
    return { allowed: true, count: currentCardCount, limit: FREE_CARD_LIMIT };
  } catch {
    // DB unavailable — fail open (don't block users)
    return { allowed: true, count: currentCardCount, limit: FREE_CARD_LIMIT };
  }
}

/**
 * Check whether this user has remaining signal refreshes today.
 * Pro users have no limit.
 * Uses the existing rate_limits table (key = `signals-daily:{userId}`).
 */
export async function checkSignalQuota(
  userId: string,
): Promise<{ allowed: boolean; remaining: number | null }> {
  try {
    const plan = await dbGetUserPlan(userId);
    if (plan === 'pro') return { allowed: true, remaining: null };

    // Reuse the existing rate_limits infrastructure
    const { checkRateLimit } = await import('./rate-limit');
    const result = await checkRateLimit(userId, 'signals-daily', FREE_SIGNAL_LIMIT);
    return { allowed: result.allowed, remaining: result.allowed ? FREE_SIGNAL_LIMIT : 0 };
  } catch {
    return { allowed: true, remaining: null };
  }
}
