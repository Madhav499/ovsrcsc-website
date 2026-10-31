import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireActor } from '@/server/auth/actor';

import { SetNewPasswordForm } from '@/components/admin/set-new-password-form';

export const metadata: Metadata = {
  title: 'Set a new password',
};

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const actor = await requireActor();
  if (!actor.mustChangePassword) redirect('/admin');

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">
          Set a new password
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Change your temporary password
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Your account is currently using a temporary password. Choose a new, strong password to
          complete your first sign in.
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="font-display text-xl font-semibold">Set new password</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Enter your temporary password, then choose your new password.
        </p>
        <div className="mt-5 max-w-sm">
          <SetNewPasswordForm />
        </div>
      </section>
    </div>
  );
}
