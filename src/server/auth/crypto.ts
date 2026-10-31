import 'server-only';
import { createHash, createHmac, randomBytes } from 'node:crypto';

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    throw new Error('IP_HASH_SECRET is not configured');
  }
  return createHmac('sha256', secret).update(ip).digest('hex');
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip');
}

export function timingSafeTokenMatch(rawToken: string, storedHash: string): boolean {
  const candidate = Buffer.from(sha256(rawToken), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    diff |= candidate[index] ^ expected[index];
  }
  return diff === 0;
}
