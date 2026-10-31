import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ROLE_LABELS } from '@/lib/permissions';
import { requireActor } from '@/server/auth/actor';
import { ChangePasswordForm } from '@/components/admin/change-password-form';
import { logoutAction } from '@/server/actions/auth';

export const metadata: Metadata = { title: 'My account' };

export default async function AccountPage() {
  const actor = await requireActor();
  const user = await db.user.findUnique({
    where: { id: actor.id },
    include: {
      sections: { include: { section: { select: { nameEn: true } } } },
    },
  });
  if (!user) redirect('/admin/login');

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">My account</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Account & password</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-display text-xl font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Choose a strong password that you do not use on any other website.
          </p>
          <div className="mt-5">
            <ChangePasswordForm />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-display text-lg font-semibold">Account details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Name</dt>
                <dd className="mt-0.5 font-semibold">{user.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Email</dt>
                <dd className="mt-0.5 break-all font-semibold">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Roles</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {actor.roles.map((role) => (
                    <span key={role} className="rounded-full bg-sky px-2.5 py-1 text-[11px] font-bold text-teal-dark">
                      {ROLE_LABELS[role]}
                    </span>
                  ))}
                </dd>
              </div>
              {user.sections.length > 0 ? (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    Assigned sections
                  </dt>
                  <dd className="mt-1 text-ink-soft">
                    {user.sections.map((section) => section.section.nameEn).join(', ')}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-display text-lg font-semibold">Session</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Your staff session is valid for up to 12 hours. Sign out when using a shared computer.
            </p>
            <form action={logoutAction} className="mt-4">
              <button type="submit" className="btn btn-outline !py-2 !text-xs">
                Sign out of this session
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
