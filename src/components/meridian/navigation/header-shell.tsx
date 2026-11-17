'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ChevronDown, Mail, Menu, Phone, Search, X } from 'lucide-react';
import type { LocaleCode } from '@/lib/constants';
import type { NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/meridian/layout/logo';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { LanguageSwitcher } from './language-switcher';

type HeaderMode = 'overlay-dark' | 'overlay-light' | 'solid';

interface HeaderLabels {
  name: string;
  familiar: string;
  logoAlt: string;
  home: string;
  mainNav: string;
  openMenu: string;
  closeMenu: string;
  menu: string;
  language: string;
  visit: string;
  searchOpen: string;
  searchClose: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchButton: string;
  explore: string;
  submenu: string;
  external: string;
  viewSection: string;
  phone: string;
  email: string;
}

interface HeaderShellProps {
  locale: LocaleCode;
  items: NavItem[];
  contact: { phone: string; email: string };
  labels: HeaderLabels;
}

function isActive(pathname: string, href: string, home: string): boolean {
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemActive(pathname: string, item: NavItem, home: string): boolean {
  if (isActive(pathname, item.href, home)) return true;
  return Boolean(item.children?.some((child) => !child.external && isActive(pathname, child.href, home)));
}

export function HeaderShell({ locale, items, contact, labels }: HeaderShellProps) {
  const pathname = usePathname();
  const home = `/${locale}`;
  const headerRef = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<HeaderMode>('overlay-dark');
  const [hidden, setHidden] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openKeyRef = useRef<string | null>(null);
  const hoverTimer = useRef<number | null>(null);

  openKeyRef.current = openKey;

  // Tone follows the page hero while it sits under the header; solid afterwards.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const headerHeight = headerRef.current?.offsetHeight ?? 80;
      const hero = document.querySelector<HTMLElement>('[data-mx-hero]');
      let next: HeaderMode = 'solid';
      if (hero && hero.getBoundingClientRect().bottom > headerHeight) {
        next = hero.dataset.mxHero === 'light' ? 'overlay-light' : 'overlay-dark';
      }
      setMode(next);
      const delta = y - lastY;
      if (y < 240 || openKeyRef.current) setHidden(false);
      else if (delta > 8) setHidden(true);
      else if (delta < -8) setHidden(false);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // Close transient UI whenever the route changes.
  useEffect(() => {
    setOpenKey(null);
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Close dropdowns on outside pointer or Escape anywhere on the page.
  useEffect(() => {
    if (!openKey) return;
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenKey(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenKey(null);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [openKey]);

  const hoverOpen = useCallback((key: string, pointerType: string) => {
    if (pointerType !== 'mouse') return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setOpenKey(key);
  }, []);

  const hoverClose = useCallback((pointerType: string) => {
    if (pointerType !== 'mouse') return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpenKey(null), 180);
  }, []);

  const desktopItems = items.filter((item) => item.href !== home);
  const contactHref = `${home}/visit`;

  return (
    <>
      <header
        ref={headerRef}
        className="mx-header"
        data-mode={menuOpen || openKey ? 'solid' : mode}
        data-hidden={hidden && !menuOpen && !searchOpen ? 'true' : 'false'}
      >
        <div className="mx-container flex h-full items-center justify-between gap-4">
          <Logo
            href={home}
            name={labels.name}
            familiarName={labels.familiar}
            alt={labels.logoAlt}
            homeLabel={labels.home}
            className="max-w-[min(62vw,20rem)]"
          />

          <nav aria-label={labels.mainNav} className="hidden xl:block">
            <ul className="flex items-center gap-0.5">
              {desktopItems.map((item, itemIndex) => {
                const active = itemActive(pathname, item, home);
                if (!item.children?.length) {
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="mx-nav-link"
                        aria-current={active ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }
                return (
                  <DesktopDropdown
                    key={item.href}
                    item={item}
                    index={itemIndex + 1}
                    active={active}
                    open={openKey === item.href}
                    pathname={pathname}
                    home={home}
                    submenuLabel={labels.submenu}
                    externalLabel={labels.external}
                    viewSectionLabel={labels.viewSection}
                    onToggle={() => setOpenKey((current) => (current === item.href ? null : item.href))}
                    onClose={() => setOpenKey(null)}
                    onHoverOpen={(pointerType) => hoverOpen(item.href, pointerType)}
                    onHoverClose={hoverClose}
                  />
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="mx-icon-btn"
              aria-label={labels.searchOpen}
              aria-haspopup="dialog"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-[1.1rem]" aria-hidden="true" />
            </button>
            <Suspense fallback={null}>
              <LanguageSwitcher currentLocale={locale} label={labels.language} className="hidden lg:inline-flex" />
            </Suspense>
            <Link href={contactHref} className="mx-btn mx-btn-primary mx-btn-sm hidden sm:inline-flex">
              {labels.visit}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="mx-icon-btn xl:hidden"
              aria-label={labels.openMenu}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        action={`${home}/search`}
        labels={labels}
      />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        locale={locale}
        items={items}
        pathname={pathname}
        home={home}
        contact={contact}
        contactHref={contactHref}
        labels={labels}
      />
    </>
  );
}

interface DesktopDropdownProps {
  item: NavItem;
  index: number;
  active: boolean;
  open: boolean;
  pathname: string;
  home: string;
  submenuLabel: string;
  externalLabel: string;
  viewSectionLabel: string;
  onToggle: () => void;
  onClose: () => void;
  onHoverOpen: (pointerType: string) => void;
  onHoverClose: (pointerType: string) => void;
}

/**
 * Mega-menu: a full-width editorial panel under the header — a curated
 * photograph as a numbered figure, the section's introduction and its links
 * with one-line descriptions. Opens on hover intent (mouse only) or on the
 * chevron button (keyboard / touch); Escape returns focus to the toggle.
 */
function DesktopDropdown({
  item,
  index,
  active,
  open,
  pathname,
  home,
  submenuLabel,
  externalLabel,
  viewSectionLabel,
  onToggle,
  onClose,
  onHoverOpen,
  onHoverClose,
}: DesktopDropdownProps) {
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const children = item.children ?? [];
  const photo = item.image ? BRAND_PHOTOS[item.image] : null;
  const folio = String(index).padStart(2, '0');

  return (
    <li
      onPointerEnter={(event) => onHoverOpen(event.pointerType)}
      onPointerLeave={(event) => onHoverClose(event.pointerType)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          onClose();
          toggleRef.current?.focus();
        }
      }}
    >
      <div className="flex items-center">
        <Link href={item.href} className="mx-nav-link pr-1" aria-current={active ? 'page' : undefined}>
          {item.label}
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="mx-nav-link !px-1.5"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${submenuLabel} ${item.label}`}
          onClick={onToggle}
        >
          <ChevronDown
            className={cn('size-3.5 transition-transform duration-300', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            className="mx-mega mx-surface-ivory mx-grain"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.42, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="mx-container grid grid-cols-[15rem_minmax(0,1fr)_minmax(0,1.6fr)] gap-10 py-10 2xl:grid-cols-[18rem_minmax(0,1fr)_minmax(0,1.6fr)]">
              {photo ? (
                <figure className="min-w-0">
                  <div className="mx-plate relative aspect-[4/5] w-full">
                    <Image src={photo} alt="" fill sizes="18rem" className="object-cover" placeholder="blur" />
                    <span aria-hidden="true" className="mx-ticks" />
                  </div>
                  {item.imageCaption ? (
                    <figcaption className="mx-figcap">
                      <span className="mx-figcap-num">Fig. {folio}</span>
                      <span>{item.imageCaption}</span>
                    </figcaption>
                  ) : null}
                </figure>
              ) : (
                <span />
              )}
              <div className="flex min-w-0 flex-col">
                <p className="mx-eyebrow">
                  <span className="mx-eyebrow-index">{folio}</span>
                  {item.label}
                </p>
                {item.intro ? <p className="mx-h3 mt-5 max-w-[20ch] text-(--mx-fg)">{item.intro}</p> : null}
                <Link href={item.href} className="mx-link mt-auto self-start pt-8 text-[0.9375rem]">
                  {viewSectionLabel}
                  <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                </Link>
              </div>
              <ul className="grid content-start gap-x-8 sm:grid-cols-2">
                {children.map((child) => {
                  const childActive = !child.external && isActive(pathname, child.href, home);
                  const body = (
                    <>
                      <span className="flex items-center gap-2 font-semibold text-(--mx-fg)">
                        {child.label}
                        {child.external ? (
                          <ArrowUpRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
                        ) : null}
                      </span>
                      {child.description ? (
                        <span className="mt-0.5 block text-[0.8125rem] leading-snug text-(--mx-fg-3)">
                          {child.description}
                        </span>
                      ) : null}
                      {child.external ? <span className="sr-only">({externalLabel})</span> : null}
                    </>
                  );
                  return (
                    <li key={child.href} className="border-t border-(--mx-line)">
                      {child.external ? (
                        <a href={child.href} target="_blank" rel="noopener noreferrer" className="mx-mega-link">
                          {body}
                        </a>
                      ) : (
                        <Link href={child.href} className="mx-mega-link" aria-current={childActive ? 'page' : undefined}>
                          {body}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

function useModalDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute('open', '');
      }
      document.documentElement.style.overflow = 'hidden';
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.documentElement.style.overflow = '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);
  return ref;
}

function SearchDialog({
  open,
  onClose,
  action,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  action: string;
  labels: HeaderLabels;
}) {
  const ref = useModalDialog(open);
  const inputId = useId();
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-label={labels.searchLabel}
      className="mx-dialog mx-surface-dark mt-0 w-full max-w-none bg-transparent p-0"
    >
      <div className="mx-surface-dark border-b border-(--mx-line) shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]">
        <div className="mx-container py-6 sm:py-10">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor={inputId} className="mx-eyebrow">
              {labels.searchLabel}
            </label>
            <button type="button" onClick={onClose} className="mx-icon-btn" aria-label={labels.searchClose}>
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <form action={action} method="get" role="search" className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-0 top-1/2 size-6 -translate-y-1/2 text-(--mx-fg-3)"
                aria-hidden="true"
              />
              <input
                id={inputId}
                name="q"
                type="search"
                required
                minLength={2}
                autoFocus
                autoComplete="off"
                placeholder={labels.searchPlaceholder}
                className="w-full border-0 border-b border-(--mx-line-strong) bg-transparent py-3 pl-10 text-[clamp(1.35rem,1rem+1.6vw,2.25rem)] text-(--mx-fg) outline-none placeholder:text-(--mx-fg-3) focus:border-(--mx-cyan)"
                style={{ fontFamily: 'var(--mx-font-display)' }}
              />
            </div>
            <button type="submit" className="mx-btn mx-btn-primary">
              {labels.searchButton}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  locale: LocaleCode;
  items: NavItem[];
  pathname: string;
  home: string;
  contact: { phone: string; email: string };
  contactHref: string;
  labels: HeaderLabels;
}

function MobileMenu({
  open,
  onClose,
  locale,
  items,
  pathname,
  home,
  contact,
  contactHref,
  labels,
}: MobileMenuProps) {
  const ref = useModalDialog(open);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={labels.menu}
      className="mx-dialog mx-surface-dark m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto p-0"
    >
      <div aria-hidden="true" className="mx-atmosphere pointer-events-none fixed inset-0" />
      <div className="relative flex min-h-full flex-col">
        <div className="mx-container flex h-(--mx-header-h) shrink-0 items-center justify-between gap-4">
          <Logo
            href={home}
            name={labels.name}
            familiarName={labels.familiar}
            alt={labels.logoAlt}
            homeLabel={labels.home}
            className="max-w-[70vw]"
          />
          <button type="button" onClick={onClose} className="mx-icon-btn" aria-label={labels.closeMenu}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label={labels.mainNav} className="mx-container flex-1 pb-10 pt-6">
          <p className="mx-mono-label">{labels.explore}</p>
          <ul className="mt-4 divide-y divide-(--mx-line) border-y border-(--mx-line)">
            {items.map((item, index) => {
              const active = itemActive(pathname, item, home);
              const children = (item.children ?? []).filter((child) => child.href !== item.href);
              return (
                <li key={item.href} className="py-3">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-baseline gap-4 py-1.5 text-[clamp(1.5rem,1.1rem+2vw,2.25rem)] leading-tight transition-colors',
                      active ? 'text-(--mx-amber)' : 'text-(--mx-fg) hover:text-(--mx-cyan)',
                    )}
                    style={{ fontFamily: 'var(--mx-font-display)' }}
                  >
                    <span className="mx-mono-label w-6 shrink-0 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                    <span>{item.label}</span>
                  </Link>
                  {children.length ? (
                    <ul className="mb-1 ml-10 mt-1 grid gap-x-6 sm:grid-cols-2">
                      {children.map((child) => (
                        <li key={child.href}>
                          {child.external ? (
                            <a
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex min-h-11 items-center gap-1.5 text-[0.95rem] text-(--mx-fg-2) hover:text-(--mx-fg)"
                            >
                              {child.label}
                              <ArrowUpRight className="size-3.5" aria-hidden="true" />
                              <span className="sr-only">({labels.external})</span>
                            </a>
                          ) : (
                            <Link
                              href={child.href}
                              aria-current={isActive(pathname, child.href, home) ? 'page' : undefined}
                              className="flex min-h-11 items-center text-[0.95rem] text-(--mx-fg-2) hover:text-(--mx-fg) aria-[current=page]:text-(--mx-amber)"
                            >
                              {child.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="mx-mono-label">{labels.language}</p>
              <Suspense fallback={null}>
                <LanguageSwitcher currentLocale={locale} label={labels.language} display="full" className="mt-3" />
              </Suspense>
            </div>
            <div className="grid gap-2 text-[0.95rem]">
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="inline-flex min-h-11 items-center gap-3 text-(--mx-fg-2) hover:text-(--mx-fg)">
                  <Phone className="size-4 text-(--mx-cyan)" aria-hidden="true" />
                  <span className="sr-only">{labels.phone}: </span>
                  {contact.phone}
                </a>
              ) : null}
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center gap-3 break-all text-(--mx-fg-2) hover:text-(--mx-fg)">
                  <Mail className="size-4 text-(--mx-cyan)" aria-hidden="true" />
                  <span className="sr-only">{labels.email}: </span>
                  {contact.email}
                </a>
              ) : null}
            </div>
          </div>

          <Link href={contactHref} className="mx-btn mx-btn-primary mx-btn-block mt-10 sm:w-auto">
            {labels.visit}
            <ArrowRight className="mx-btn-icon" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </dialog>
  );
}
