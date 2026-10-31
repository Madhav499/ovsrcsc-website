import 'server-only';
import argon2 from 'argon2';
import { randomInt } from 'node:crypto';

const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export interface PasswordPolicyResult {
  valid: boolean;
  message?: string;
}

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters long.' };
  }
  if (password.length > 200) {
    return { valid: false, message: 'Password must be 200 characters or fewer.' };
  }
  const categories = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  if (categories < 3) {
    return {
      valid: false,
      message: 'Password must contain at least three of: lowercase letters, uppercase letters, numbers and symbols.',
    };
  }
  if (/^(password|123456|qwerty|admin|welcome)/i.test(password)) {
    return { valid: false, message: 'Password is too easy to guess.' };
  }
  return { valid: true };
}

export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let password = 'Tmp-';
  for (let index = 0; index < 16; index += 1) {
    password += alphabet[randomInt(0, alphabet.length)];
  }
  return password;
}
