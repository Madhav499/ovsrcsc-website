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
      <div className="w-full overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
        <div className="relative bg-carbon px-7 pb-6 pt-7 text-warm-ivory sm:px-9">
          <div className="science-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-brass">
            {dict['auth.eyebrow']}
          </p>
          <h1 className="relative mt-2 font-display text-2xl font-semibold sm:text-3xl">
            {dict['auth.resetTitle']}
          </h1>
          {token ? (
            <p className="relative mt-2 text-sm leading-relaxed text-warm-ivory/60">
              {dict['auth.resetBody']}
            </p>
          ) : null}
        </div>
        <div className="p-7 sm:p-9">
          {token ? (
            <ResetPasswordForm token={token} dict={dict} />
          ) : (
            <div>
              <p className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
                {dict['auth.missingToken']}
              </p>
              <Link href={`/${rawLocale}/forgot-password`} className="btn btn-primary mt-5">
                {dict['auth.requestNewLink']}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
