import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import { AuthShell } from '@/components/meridian/layout/auth-shell';
import { ResetPasswordForm } from '@/components/meridian/forms/password-forms';
import { FormAlert } from '@/components/meridian/forms/field';

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
    <AuthShell
      eyebrow={dict['auth.eyebrow']}
      title={dict['auth.resetTitle']}
      body={token ? dict['auth.resetBody'] : undefined}
      note={dict['mx.auth.staffOnly']}
    >
      {token ? (
        <ResetPasswordForm token={token} dict={dict} />
      ) : (
        <div className="grid gap-5">
          <FormAlert tone="error">{dict['auth.missingToken']}</FormAlert>
          <Link href={`/${rawLocale}/forgot-password`} className="mx-btn mx-btn-ink mx-btn-block">
            {dict['auth.requestNewLink']}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
