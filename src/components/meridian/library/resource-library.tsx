'use client';

import { useId, useMemo, useState } from 'react';
import { ArrowUpRight, Download, FileText, Link2, Search } from 'lucide-react';

export interface LibraryLink {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  isExternal: boolean;
}

export interface LibraryDocument {
  id: string;
  title: string;
  fileName: string;
  href: string;
  type: string;
  size: string;
  date: string;
}

interface ResourceLibraryProps {
  links: LibraryLink[];
  documents: LibraryDocument[];
  labels: {
    filter: string;
    placeholder: string;
    noMatch: string;
    links: string;
    linksNote: string;
    documents: string;
    download: string;
    open: string;
    newTab: string;
    empty: string;
  };
}

function matches(query: string, ...values: Array<string | null>) {
  if (!query) return true;
  const q = query.toLocaleLowerCase();
  return values.some((value) => value?.toLocaleLowerCase().includes(q));
}

/** Organised, searchable resource library over the existing CMS data. */
export function ResourceLibrary({ links, documents, labels }: ResourceLibraryProps) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  const groupedLinks = useMemo(() => {
    const groups = new Map<string, LibraryLink[]>();
    for (const link of links) {
      if (!matches(trimmed, link.title, link.description, link.category)) continue;
      groups.set(link.category, [...(groups.get(link.category) ?? []), link]);
    }
    return Array.from(groups.entries());
  }, [links, trimmed]);

  const visibleDocuments = useMemo(
    () => documents.filter((document) => matches(trimmed, document.title, document.fileName, document.type)),
    [documents, trimmed],
  );

  const nothing = groupedLinks.length === 0 && visibleDocuments.length === 0;

  if (!links.length && !documents.length) {
    return <p className="border-y border-(--mx-line) py-10 text-(--mx-fg-2)">{labels.empty}</p>;
  }

  return (
    <div>
      <div className="relative max-w-2xl">
        <label htmlFor={inputId} className="mx-label">
          {labels.filter}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-(--mx-fg-3)" aria-hidden="true" />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.placeholder}
            className="mx-input !pl-11"
            autoComplete="off"
          />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {nothing ? labels.noMatch : ''}
      </p>

      {nothing ? (
        <p className="mt-12 border-y border-(--mx-line) py-10 text-(--mx-fg-2)">{labels.noMatch}</p>
      ) : null}

      {visibleDocuments.length ? (
        <section aria-labelledby={`${inputId}-documents`} className="mt-14">
          <h2 id={`${inputId}-documents`} className="mx-h3">
            {labels.documents}
          </h2>
          <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
            {visibleDocuments.map((document) => (
              <li key={document.id}>
                <a
                  href={document.href}
                  className="mx-card group flex h-full items-center gap-4 p-4 sm:p-5"
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-(--mx-radius-sm) bg-(--mx-midnight) text-[0.7rem] font-bold tracking-wider text-(--mx-ivory)">
                    {document.type || <FileText className="size-5" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug [overflow-wrap:anywhere] group-hover:text-(--mx-accent)">{document.title}</span>
                    <span className="mx-meta mt-1 block truncate">
                      {document.size} · {document.date}
                    </span>
                  </span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-(--mx-line-strong) transition-colors group-hover:border-(--mx-fg) group-hover:bg-(--mx-fg) group-hover:text-(--mx-bg)">
                    <Download className="size-4" aria-hidden="true" />
                  </span>
                  <span className="sr-only">{labels.download}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {groupedLinks.length ? (
        <section aria-labelledby={`${inputId}-links`} className="mt-16">
          <h2 id={`${inputId}-links`} className="mx-h3">
            {labels.links}
          </h2>
          <p className="mt-2 text-[0.9375rem] text-(--mx-fg-3)">{labels.linksNote}</p>
          <div className="mt-8 grid gap-10">
            {groupedLinks.map(([category, items]) => (
              <div key={category} className="grid gap-4 border-t border-(--mx-line-strong) pt-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
                <h3 className="mx-mono-label pt-1">{category}</h3>
                <ul className="grid gap-1">
                  {items.map((link) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        {...(link.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group flex items-start gap-4 rounded-(--mx-radius-sm) py-3"
                      >
                        <Link2 className="mt-1 size-4 shrink-0 text-(--mx-accent)" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold group-hover:text-(--mx-accent)">{link.title}</span>
                          {link.description ? (
                            <span className="mt-1 block text-[0.9375rem] text-(--mx-fg-2)">{link.description}</span>
                          ) : null}
                        </span>
                        {link.isExternal ? (
                          <>
                            <ArrowUpRight className="mt-1 size-4 shrink-0 text-(--mx-fg-3) transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                            <span className="sr-only">({labels.newTab})</span>
                          </>
                        ) : (
                          <span className="sr-only">{labels.open}</span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
