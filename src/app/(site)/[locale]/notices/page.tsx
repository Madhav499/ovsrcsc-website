import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { localeAlternates } from '@/lib/meridian/site';
import { getActiveNotices, getNoticeArchive } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { NoticeRow } from '@/components/meridian/cards/notice-row';
import { EmptyState } from '@/components/meridian/states/states';

interface NoticesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ section?: string }>;
}

export async function generateMetadata({ params }: NoticesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['notices.title'],
    description: dict['notices.intro'],
    alternates: localeAlternates(locale, '/notices'),
  };
}

export default async function NoticesPage({ params, searchParams }: NoticesPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const { section: rawSection } = await searchParams;
  const [active, archive] = await Promise.all([getActiveNotices(locale, 30), getNoticeArchive(locale, 20)]);

  const sections = Array.from(new Set([...active, ...archive].map((notice) => notice.sectionName))).sort();
  const section = rawSection && sections.includes(rawSection) ? rawSection : null;
  const filter = <T extends { sectionName: string }>(list: T[]) =>
    section ? list.filter((notice) => notice.sectionName === section) : list;
  const current = filter(active);
  const past = filter(archive);
  const important = current.filter((notice) => notice.isPinned);
  const regular = current.filter((notice) => !notice.isPinned);
  const base = `/${locale}/notices`;
  const labels = {
    important: dict['mx.notices.important'],
    validUntil: dict['notices.validUntil'],
    attachments: dict['mx.notices.attachments'],
  };

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['notices.title'] }]}
        eyebrow={dict['home.notices.eyebrow']}
        title={dict['notices.title']}
        intro={dict['notices.intro']}
        motif="meridian"
      />

      <div className="mx-surface-white">
        <div className="mx-container mx-section !pt-14">
          {sections.length > 1 ? (
            <nav aria-label={dict['mx.notices.filter']} className="mx-hide-scrollbar mb-12 overflow-x-auto">
              <ul className="flex gap-2">
                <li>
                  <Link href={base} className="mx-chip" aria-current={!section ? 'true' : undefined} scroll={false}>
                    {dict['common.all']}
                  </Link>
                </li>
                {sections.map((item) => (
                  <li key={item}>
                    <Link
                      href={`${base}?section=${encodeURIComponent(item)}`}
                      className="mx-chip"
                      aria-current={section === item ? 'true' : undefined}
                      scroll={false}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-[calc(var(--mx-header-h)+2rem)]">
                <h2 className="mx-h2">{dict['notices.current']}</h2>
                <p className="mt-4 max-w-sm text-(--mx-fg-2)">{dict['notices.intro']}</p>
              </div>
            </div>
            <div className="lg:col-span-8">
              {current.length ? (
                <div className="sm:pl-4">
                  {important.length ? (
                    <section aria-label={dict['mx.notices.important']} className="mb-10">
                      <p className="mx-tag mx-tag-amber">{dict['mx.notices.important']}</p>
                      <div className="mt-3 border-b border-(--mx-line)">
                        {important.map((notice) => (
                          <NoticeRow key={notice.id} notice={notice} locale={locale} labels={labels} headingLevel="h3" />
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {regular.length ? (
                    <div className="border-b border-(--mx-line)">
                      {regular.map((notice) => (
                        <NoticeRow key={notice.id} notice={notice} locale={locale} labels={labels} headingLevel="h3" />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState title={dict['notices.empty']} />
              )}
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="notice-archive" className="mx-surface-ivory mx-section">
        <div className="mx-container grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2 id="notice-archive" className="mx-h2">
              {dict['notices.archive']}
            </h2>
          </div>
          <div className="lg:col-span-8">
            {past.length ? (
              <div className="border-b border-(--mx-line) sm:pl-4">
                {past.map((notice) => (
                  <NoticeRow key={notice.id} notice={notice} locale={locale} labels={labels} showExcerpt={false} headingLevel="h3" />
                ))}
              </div>
            ) : (
              <p className="border-y border-(--mx-line) py-10 text-(--mx-fg-2)">{dict['notices.emptyArchive']}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
