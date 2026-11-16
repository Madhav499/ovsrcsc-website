import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import { ResetPasswordForm } from '@/components/site/reset-password-form';

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['auth.resetTitle'],
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const { token } = await searchParams;
  const dict = getDictionary(rawLocale);

  return (
    <div className="site-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="relative bg-midnight px-8 pb-7 pt-8 text-warm-ivory border-b border-cosmic">
          <div className="science-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-cyan">
            {dict['auth.eyebrow']}
          </p>
          <h1 className="relative mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
            {dict['auth.resetTitle']}
          </h1>
          {token ? (
            <p className="relative mt-2 text-sm leading-relaxed text-warm-ivory/70">
              {dict['auth.resetBody']}
            </p>
          ) : null}
        </div>
        <div className="p-8 sm:p-9">
          {token ? (
            <ResetPasswordForm token={token} dict={dict} />
          ) : (
            <div>
              <p className="rounded-2xl border border-red-500/25 bg-red-50/60 px-4 py-3 text-sm text-red-700">
                {dict['auth.missingToken']}
              </p>
              <Link href={`/${rawLocale}/forgot-password`} className="btn btn-primary mt-6">
                {dict['auth.requestNewLink']}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
