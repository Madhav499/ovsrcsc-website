'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { sha256 } from '@/server/auth/crypto';
import { consumeRateLimit, clearRateLimit } from '@/server/auth/rate-limit';
import { requestPrivacyHash } from '@/server/auth/request-context';
import { createSession, destroyCurrentSession, revokeAllSessionsForUser } from '@/server/auth/session';
import { requireActor } from '@/server/auth/actor';
import { changeOwnPassword, authenticateUser, requestPasswordReset, resetPasswordWithToken } from '@/server/services/users';
import { writeAuditLog } from '@/server/services/audit';

export interface AuthFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const GENERIC_LOGIN_ERROR = 'Email or password is incorrect.';
const GENERIC_RESET_MESSAGE =
  'If an account exists for that email address, a password reset link has been sent.';

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  await assertSameOrigin();
  const parsed = z
    .object({
      email: z.string().trim().email().max(200),
      password: z.string().min(1).max(200),
    })
    .safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

  if (!parsed.success) {
    return {
      status: 'error',
      message: GENERIC_LOGIN_ERROR,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const ipHash = await requestPrivacyHash();
  const [ipRate, emailRate] = await Promise.all([
    consumeRateLimit(`login-ip:${ipHash ?? 'unknown'}`, 20, 15 * 60),
    consumeRateLimit(`login-email:${sha256(email)}`, 6, 15 * 60),
  ]);

  if (!ipRate.allowed || !emailRate.allowed) {
    return {
      status: 'error',
      message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
    };
  }

  const user = await authenticateUser(email, parsed.data.password);
  if (!user) {
    return { status: 'error', message: GENERIC_LOGIN_ERROR };
  }

  await clearRateLimit(`login-email:${sha256(email)}`);
  await createSession(user.id);
  await writeAuditLog({
    actorId: user.id,
    action: 'auth.login',
    entityType: 'User',
    entityId: user.id,
    summary: `${user.email} signed in`,
    metadata: { ipHash },
  });
  redirect(user.mustChangePassword ? '/admin/change-password' : '/admin');
}

export async function logoutAction(): Promise<void> {
  const actor = await requireActor().catch(() => null);
  if (actor) {
    await writeAuditLog({
      actorId: actor.id,
      action: 'auth.logout',
      entityType: 'User',
      entityId: actor.id,
      summary: `${actor.email} signed out`,
    });
  }
  await destroyCurrentSession();
  redirect('/admin/login');
}

export async function forgotPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  await assertSameOrigin();
  const parsed = z
    .object({ email: z.string().trim().email().max(200) })
    .safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Enter a valid email address.',
      fieldErrors: { email: 'Enter a valid email address.' },
    };
  }

  const ipHash = await requestPrivacyHash();
  const [ipRate, emailRate] = await Promise.all([
    consumeRateLimit(`forgot-ip:${ipHash ?? 'unknown'}`, 8, 60 * 60),
    consumeRateLimit(`forgot-email:${sha256(parsed.data.email.toLowerCase())}`, 4, 60 * 60),
  ]);
  if (!ipRate.allowed || !emailRate.allowed) {
    return {
      status: 'error',
      message: 'Too many reset requests. Please wait before trying again.',
    };
  }

  try {
    const result = await requestPasswordReset(parsed.data.email);
    return {
      status: 'success',
      message:
        process.env.NODE_ENV !== 'production' && result.resetUrl
          ? `${GENERIC_RESET_MESSAGE} Development link: ${result.resetUrl}`
          : GENERIC_RESET_MESSAGE,
    };
  } catch (error) {
    console.error('[forgot-password]', error);
    return { status: 'success', message: GENERIC_RESET_MESSAGE };
  }
}

export async function resetPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  await assertSameOrigin();
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!token) {
    return { status: 'error', message: 'This password reset link is invalid. Please request a new link.' };
  }
  if (password !== confirmPassword) {
    return {
      status: 'error',
      message: 'The two passwords do not match.',
      fieldErrors: { confirmPassword: 'The two passwords do not match.' },
    };
  }

  try {
    await resetPasswordWithToken(token, password);
    return {
      status: 'success',
      message: 'Your password has been changed. You can now sign in with your new password.',
    };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    console.error('[reset-password]', error);
    return { status: 'error', message: 'Something went wrong. Please request a new reset link.' };
  }
}

export async function changePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!currentPassword) {
    return {
      status: 'error',
      message: 'Enter your current password.',
      fieldErrors: { currentPassword: 'Enter your current password.' },
    };
  }
  if (password !== confirmPassword) {
    return {
      status: 'error',
      message: 'The two new passwords do not match.',
      fieldErrors: { confirmPassword: 'The two new passwords do not match.' },
    };
  }

  try {
    await changeOwnPassword(actor, currentPassword, password);
    return { status: 'success', message: 'Your password has been updated.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    console.error('[change-password]', error);
    return { status: 'error', message: 'Could not change your password. Please try again.' };
  }
}

export async function setNewPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  if (!actor.mustChangePassword) {
    return {
      status: 'error',
      message: 'Your account does not require a password change.',
    };
  }

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!currentPassword) {
    return {
      status: 'error',
      message: 'Enter your current (temporary) password.',
      fieldErrors: { currentPassword: 'Enter your current (temporary) password.' },
    };
  }
  if (password !== confirmPassword) {
    return {
      status: 'error',
      message: 'The two new passwords do not match.',
      fieldErrors: { confirmPassword: 'The two new passwords do not match.' },
    };
  }

  try {
    await changeOwnPassword(actor, currentPassword, password);
    await revokeAllSessionsForUser(actor.id);
    await destroyCurrentSession();
    redirect('/admin');
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    console.error('[set-new-password]', error);
    return { status: 'error', message: 'Could not set your new password. Please try again.' };
  }
}
