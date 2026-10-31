import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import { ForgotPasswordForm } from '@/components/site/forgot-password-form';

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['auth.forgotTitle'],
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
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
            {dict['auth.forgotTitle']}
          </h1>
          <p className="relative mt-2 text-sm leading-relaxed text-warm-ivory/60">
            {dict['auth.forgotBody']}
          </p>
        </div>
        <div className="p-7 sm:p-9">
          <ForgotPasswordForm dict={dict} />
        </div>
      </div>
    </div>
  );
}
