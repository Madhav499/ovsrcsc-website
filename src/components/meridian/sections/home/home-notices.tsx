import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import type { PublicNotice } from '@/server/public/queries';
import { NoticeRow } from '@/components/meridian/cards/notice-row';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';

export function HomeNotices({
  locale,
  dict,
  notices,
}: {
  locale: LocaleCode;
  dict: Dictionary;
  notices: PublicNotice[];
}) {
  return (
    <section aria-labelledby="home-notices-title" className="mx-surface-white mx-section">
      <div className="mx-container grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--mx-header-h)+2rem)]">
            <SectionHeading
              id="home-notices-title"
              index="08"
              eyebrow={dict['home.notices.eyebrow']}
              title={dict['home.notices.title']}
              intro={<p>{dict['notices.intro']}</p>}
              action={
                <Link href={`/${locale}/notices`} className="mx-link">
                  {dict['mx.home.noticesAll']}
                  <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                </Link>
              }
            />
          </div>
        </div>
        <div className="lg:col-span-8">
          {notices.length ? (
            <div className="border-b border-(--mx-line)">
              {notices.slice(0, 4).map((notice) => (
                <NoticeRow
                  key={notice.id}
                  notice={notice}
                  locale={locale}
                  labels={{
                    important: dict['mx.notices.important'],
                    validUntil: dict['notices.validUntil'],
                    attachments: dict['mx.notices.attachments'],
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="border-y border-(--mx-line) py-10 text-(--mx-fg-2)">{dict['home.notices.empty']}</p>
          )}
        </div>
      </div>
    </section>
  );
}
