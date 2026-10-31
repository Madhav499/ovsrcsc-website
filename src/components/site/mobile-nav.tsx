'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ExternalLink, Menu, Search, X } from 'lucide-react';
import type { NavItem } from '@/lib/navigation';
import type { LocaleCode } from '@/lib/constants';
import { LanguageSwitcher } from './language-switcher';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  items: NavItem[];
  locale: LocaleCode;
  labels: {
    open: string;
    close: string;
    menu: string;
    search: string;
    language: string;
    admin: string;
  };
  adminHref: string;
}

export function MobileNav({ items, locale, labels, adminHref }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  const isActive = (href: string) => {
    if (href === `/${locale}`) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-warm-ivory lg:hidden"
        aria-label={labels.open}
        aria-expanded={open}
        aria-controls="mobile-navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id="mobile-navigation"
          className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={labels.menu}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display text-lg font-semibold">{labels.menu}</span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-11 items-center justify-center rounded-full border border-ink/15 hover:bg-warm-ivory"
              aria-label={labels.close}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav
            className="flex-1 overflow-y-auto px-5 py-5"
            aria-label={labels.menu}
          >
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-semibold',
                      isActive(item.href) ? 'bg-carbon text-warm-ivory' : 'text-ink hover:bg-warm-ivory',
                    )}
                  >
                    {item.label}
                    {item.external ? <ExternalLink className="size-4" aria-hidden="true" /> : null}
                  </Link>
                  {item.children ? (
                    <ul className="mb-2 ml-2 border-l border-line pl-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            {...(child.external
                              ? { target: '_blank', rel: 'noopener noreferrer' }
                              : {})}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm',
                              isActive(child.href)
                                ? 'font-semibold text-brass-dark'
                                : 'text-ink-muted hover:text-ink',
                            )}
                          >
                            {child.label}
                            {child.external ? (
                              <ExternalLink className="size-3.5" aria-hidden="true" />
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-line px-5 py-4">
            <Link
              href={`/${locale}/search`}
              onClick={() => setOpen(false)}
              className="mb-4 flex items-center gap-2 rounded-xl border border-line px-3 py-3 text-sm font-semibold text-ink-muted"
            >
              <Search className="size-4" aria-hidden="true" />
              {labels.search}
            </Link>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                {labels.language}
              </span>
              <LanguageSwitcher currentLocale={locale} label={labels.language} />
            </div>
            <Link
              href={adminHref}
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              {labels.admin}
              <ChevronDown className="size-3 -rotate-90" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
