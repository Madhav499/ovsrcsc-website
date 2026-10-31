import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Download, FileText, FolderOpen } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { formatFileSize, mediaUrl } from '@/lib/media';
import { getPublishedDocuments, getPublishedResourceLinks } from '@/server/public/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmptyState } from '@/components/ui/empty-state';

interface DownloadsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DownloadsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: dict['downloads.title'],
    description: dict['downloads.intro'],
    alternates: {
      canonical: `${appUrl}/${locale}/downloads`,
      languages: {
        'en-IN': `${appUrl}/en/downloads`,
        'gu-IN': `${appUrl}/gu/downloads`,
        'hi-IN': `${appUrl}/hi/downloads`,
        'x-default': `${appUrl}/en/downloads`,
      },
    },
  };
}

export default async function DownloadsPage({ params }: DownloadsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const [links, documents] = await Promise.all([
    getPublishedResourceLinks(),
    getPublishedDocuments(),
  ]);

  const categories = new Map<string, typeof links>();
  for (const link of links) {
    const category = link.category?.trim() || dict['downloads.links'];
    const existing = categories.get(category) ?? [];
    existing.push(link);
    categories.set(category, existing);
  }

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[{ label: dict['downloads.title'] }]}
        />
      </div>
      <PageHeader
        tone="ink"
        eyebrow={dict['nav.downloads']}
        title={dict['downloads.title']}
        intro={dict['downloads.intro']}
      />

      <div className="site-container py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          <div className="space-y-12">
            {categories.size > 0 ? (
              <section>
                <h2 className="font-display text-2xl font-semibold">{dict['downloads.links']}</h2>
                <p className="mt-1 text-sm text-ink-muted">{dict['downloads.externalNote']}</p>
                <div className="mt-5 space-y-7">
                  {Array.from(categories.entries()).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sage">
                        <FolderOpen className="size-3.5" aria-hidden="true" />
                        {category}
                      </h3>
                      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
                        {items.map((link) => (
                          <li key={link.id}>
                            <a
                              href={link.url}
                              target={link.isExternal ? '_blank' : undefined}
                              rel={link.isExternal ? 'noopener noreferrer' : undefined}
                              className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-cream sm:px-5"
                            >
                              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-carbon text-warm-ivory">
                                <FileText className="size-4" aria-hidden="true" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-ink">{link.title}</span>
                                {link.description ? (
                                  <span className="mt-0.5 block text-sm text-ink-muted">
                                    {link.description}
                                  </span>
                                ) : null}
                              </span>
                              {link.isExternal ? (
                                <ArrowUpRight className="mt-1 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                              ) : null}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="font-display text-2xl font-semibold">{dict['downloads.documents']}</h2>
              {documents.length > 0 ? (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {documents.map((document) => (
                    <li key={document.id}>
                      <a
                        href={`${mediaUrl(document.storageKey)}?download=1`}
                        className="flex h-full items-start gap-3 rounded-2xl border border-line bg-paper p-4 transition-all hover:-translate-y-0.5 hover:border-brass/40 hover:shadow-card"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-carbon text-warm-ivory">
                          <FileText className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 font-semibold leading-snug text-ink">
                            {document.title}
                          </span>
                          <span className="mt-1 block text-[11px] text-ink-muted">
                            {formatFileSize(document.sizeBytes)} · {formatDate(document.createdAt, locale)}
                          </span>
                        </span>
                        <Download className="mt-1 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : links.length === 0 ? (
                <EmptyState className="mt-5" icon={<Download className="size-5" aria-hidden="true" />}>
                  {dict['downloads.empty']}
                </EmptyState>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-paper/60 p-5 text-sm text-ink-muted">
                  {dict['downloads.empty']}
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-line bg-paper p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sage">
                {dict['downloads.categories']}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {Array.from(categories.keys()).map((category) => (
                  <li key={category}>{category}</li>
                ))}
                {documents.length > 0 ? <li>{dict['downloads.documents']}</li> : null}
              </ul>
            </div>
            <div className="rounded-2xl bg-ink p-5 text-paper">
              <p className="font-display text-lg font-semibold">{dict['site.tagline']}</p>
              <p className="mt-2 text-xs leading-relaxed text-paper/60">{dict['footer.about']}</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
