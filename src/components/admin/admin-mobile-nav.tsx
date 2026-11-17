'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { logoutAction } from '@/server/actions/auth';
import { AdminLogo } from './admin-logo';
import { AdminNav, type AdminNavItem } from './admin-nav';

interface Props {
  /** Already filtered on the server by the actor's permissions. */
  items: AdminNavItem[];
  name: string;
  roleLabel: string;
}

function currentLabel(items: AdminNavItem[], pathname: string): string {
  const match = items
    .filter((item) => (item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? 'Admin';
}

/**
 * Admin navigation below the desktop breakpoint: a top bar naming the current
 * section, and a modal drawer (native <dialog>: focus is contained, Escape
 * closes, the page behind is inert and does not scroll).
 */
export function AdminMobileNav({ items, name, roleLabel }: Props) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  // Navigating closes the drawer.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-[#f3f4f1]/95 backdrop-blur lg:hidden">
      <div className="flex min-h-14 items-center gap-3 px-4 sm:px-6">
        <button
          ref={trigger}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="-ml-1 grid size-11 place-items-center rounded-xl border border-line bg-paper text-ink"
        >
          <Menu className="size-5" aria-hidden="true" />
          <span className="sr-only">Open admin menu</span>
        </button>
        <p className="min-w-0 flex-1 truncate font-display text-base font-semibold text-ink">{currentLabel(items, pathname)}</p>
        <AdminLogo compact />
      </div>

      <dialog
        ref={dialog}
        aria-label="Admin menu"
        className="admin-drawer"
        onClose={() => {
          document.documentElement.style.overflow = '';
          setOpen(false);
          trigger.current?.focus();
        }}
        onClick={(event) => {
          // A click on the backdrop (the dialog box itself, outside the panel) closes it.
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="flex h-full flex-col bg-ink px-4 pb-5 pt-4 text-paper">
          <div className="mb-5 flex items-center justify-between gap-3 px-1">
            <AdminLogo light compact />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-11 place-items-center rounded-xl text-paper/70 hover:bg-paper/10 hover:text-paper"
            >
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Close admin menu</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <AdminNav items={items} touch />
          </div>
          <div className="mt-4 border-t border-paper/10 pt-4">
            <Link
              href="/en"
              target="_blank"
              className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-paper/60 hover:bg-paper/5 hover:text-paper"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              View website
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
            <p className="mt-3 px-3 text-sm font-semibold">{name}</p>
            <p className="px-3 text-xs leading-snug text-paper/55">{roleLabel}</p>
            <form action={logoutAction} className="mt-2">
              <button type="submit" className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-paper/70 hover:bg-paper/5 hover:text-saffron">
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </header>
  );
}
