import 'server-only';
import { db } from '@/lib/db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Persistent fixed-window rate limiter. Keys must not contain raw personal data
 * (hash IP addresses and email addresses before use).
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  const bucket = await db.$transaction(async (transaction) => {
    const existing = await transaction.rateLimitBucket.findUnique({ where: { key } });
    if (!existing || existing.resetAt <= now) {
      return transaction.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
    }
    return transaction.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
  });

  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function clearRateLimit(key: string): Promise<void> {
  await db.rateLimitBucket.deleteMany({ where: { key } });
}
