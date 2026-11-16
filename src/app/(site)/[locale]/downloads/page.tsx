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
                <h2 className="font-display text-2xl font-semibold text-midnight">{dict['downloads.links']}</h2>
                <p className="mt-1 text-sm text-slate-muted">{dict['downloads.externalNote']}</p>
                <div className="mt-6 space-y-8">
                  {Array.from(categories.entries()).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-solar">
                        <FolderOpen className="size-4 text-cyan" aria-hidden="true" />
                        {category}
                      </h3>
                      <ul className="mt-3.5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
                        {items.map((link) => (
                          <li key={link.id}>
                            <a
                              href={link.url}
                              target={link.isExternal ? '_blank' : undefined}
                              rel={link.isExternal ? 'noopener noreferrer' : undefined}
                              className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-warm-ivory/40"
                            >
                              <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-midnight text-cyan">
                                <FileText className="size-5" aria-hidden="true" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-midnight group-hover:text-solar transition-colors">
                                  {link.title}
                                </span>
                                {link.description ? (
                                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-muted">
                                    {link.description}
                                  </span>
                                ) : null}
                              </span>
                              {link.isExternal ? (
                                <ArrowUpRight className="mt-1 size-4 shrink-0 text-slate-muted group-hover:text-solar transition-colors" aria-hidden="true" />
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
              <h2 className="font-display text-2xl font-semibold text-midnight">{dict['downloads.documents']}</h2>
              {documents.length > 0 ? (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {documents.map((document) => (
                    <li key={document.id}>
                      <a
                        href={`${mediaUrl(document.storageKey)}?download=1`}
                        className="meridian-card group flex h-full items-start gap-4 p-5"
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-midnight text-cyan">
                          <FileText className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 font-semibold leading-snug text-midnight group-hover:text-solar transition-colors">
                            {document.title}
                          </span>
                          <span className="mt-1.5 block text-xs font-medium text-slate-muted">
                            {formatFileSize(document.sizeBytes)} · {formatDate(document.createdAt, locale)}
                          </span>
                        </span>
                        <span className="grid size-8 place-items-center rounded-full bg-cream text-slate-muted group-hover:bg-cyan/15 group-hover:text-cyan transition-colors">
                          <Download className="size-4" aria-hidden="true" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : links.length === 0 ? (
                <EmptyState className="mt-5" icon={<Download className="size-5" aria-hidden="true" />}>
                  {dict['downloads.empty']}
                </EmptyState>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-line bg-white/60 p-6 text-sm text-slate-muted">
                  {dict['downloads.empty']}
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-line bg-white p-6 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-solar">
                {dict['downloads.categories']}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm font-medium text-slate-muted">
                {Array.from(categories.keys()).map((category) => (
                  <li key={category} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-cyan" />
                    <span>{category}</span>
                  </li>
                ))}
                {documents.length > 0 ? (
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-solar" />
                    <span>{dict['downloads.documents']}</span>
                  </li>
                ) : null}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-midnight p-6 text-warm-ivory border border-cosmic">
              <div className="science-grid-dark absolute inset-0 opacity-40" aria-hidden="true" />
              <div className="relative">
                <p className="font-display text-lg font-semibold text-white">{dict['site.tagline']}</p>
                <p className="mt-2 text-xs leading-relaxed text-warm-ivory/70">{dict['footer.about']}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
