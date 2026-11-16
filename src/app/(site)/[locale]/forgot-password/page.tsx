import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import { AuthShell } from '@/components/meridian/layout/auth-shell';
import { ForgotPasswordForm } from '@/components/meridian/forms/password-forms';

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
    <AuthShell
      eyebrow={dict['auth.eyebrow']}
      title={dict['auth.forgotTitle']}
      body={dict['auth.forgotBody']}
      note={dict['mx.auth.staffOnly']}
    >
      <ForgotPasswordForm dict={dict} />
    </AuthShell>
  );
}
