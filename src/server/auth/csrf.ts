import 'server-only';
import { headers } from 'next/headers';
import { ForbiddenError } from '@/lib/errors';

/**
 * Defence in depth in addition to Next.js Server Action origin checks and
 * SameSite cookies. Rejects cross-origin form posts explicitly.
 */
export async function assertSameOrigin(): Promise<void> {
  const headerStore = await headers();
  const origin = headerStore.get('origin');
  const host = headerStore.get('host');
  if (!origin) return;
  try {
    const originUrl = new URL(origin);
    const expectedHost = host ?? new URL(process.env.APP_URL ?? 'http://localhost:3000').host;
    if (originUrl.host !== expectedHost) {
      throw new ForbiddenError('This request could not be verified.');
    }
  } catch {
    throw new ForbiddenError('This request could not be verified.');
  }
}
