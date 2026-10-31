import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/actor';
import { AdminLogo } from '@/components/admin/admin-logo';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
};

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const actor = await getActor();
  if (actor) redirect('/admin');
  const { reset } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <div className="dot-grid absolute inset-0 opacity-[0.07]" aria-hidden="true" />
        <div
          className="absolute -right-40 top-1/3 size-[30rem] rounded-full border border-paper/10"
          aria-hidden="true"
        />
        <div
          className="absolute -right-24 top-1/3 size-[22rem] rounded-full border border-saffron/25"
          aria-hidden="true"
        />
        <div className="relative">
          <AdminLogo light />
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-saffron">Staff area</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight">
            Manage the science centre website.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-paper/65">
            Publish pages, notices, events, photo galleries and downloads. Enquiries and event
            registrations arrive here for follow-up.
          </p>
        </div>
        <p className="relative text-xs text-paper/40">
          Shri O. V. Sheth Regional Community Science Center, Rajkot
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <AdminLogo />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Website admin</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Sign in with the account provided by your Super Admin.
          </p>
          <div className="mt-8">
            <LoginForm resetSuccess={reset === '1'} />
          </div>
          <p className="mt-8 text-xs leading-relaxed text-ink-muted">
            This area is restricted to authorised staff. Sign-in attempts are rate limited and
            recorded for security.
          </p>
        </div>
      </section>
    </main>
  );
}
