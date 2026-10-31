import 'server-only';
import { headers } from 'next/headers';
import { clientIpFromHeaders, hashIp, sha256 } from './crypto';

export async function requestPrivacyHash(): Promise<string | null> {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  try {
    const hashed = hashIp(ip);
    if (hashed) return hashed;
  } catch {
    // Fall through to a non-identifying user-agent fingerprint.
  }
  const userAgent = headerStore.get('user-agent');
  return userAgent ? sha256(userAgent).slice(0, 32) : null;
}

export async function requestClientIpHash(): Promise<string | null> {
  const headerStore = await headers();
  try {
    return hashIp(clientIpFromHeaders(headerStore));
  } catch {
    return null;
  }
}
