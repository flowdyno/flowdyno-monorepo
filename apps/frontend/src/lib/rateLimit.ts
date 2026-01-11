import { getUserPlan } from './env';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days
const FREE_USER_LIMIT = 1;
const BASIC_USER_LIMIT = 60;

function getUserLimit(): number {
  const plan = getUserPlan();
  if (plan === 'free') return FREE_USER_LIMIT;
  if (plan === 'basic') return BASIC_USER_LIMIT;
  if (plan === 'pro') return Infinity;
  return FREE_USER_LIMIT;
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

export function checkRateLimit(
  identifier: string,
  limit?: number
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const userLimit = limit ?? getUserLimit();
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: userLimit - 1, resetAt };
  }

  if (entry.count >= userLimit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: userLimit - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitStatus(
  identifier: string,
  limit?: number
): {
  remaining: number;
  resetAt: number;
} {
  const userLimit = limit ?? getUserLimit();
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry || now > entry.resetAt) {
    return { remaining: userLimit, resetAt: now + RATE_LIMIT_WINDOW };
  }

  return { remaining: Math.max(0, userLimit - entry.count), resetAt: entry.resetAt };
}
