import Link from 'next/link';
import { ExternalLink, LogOut, ShieldAlert } from 'lucide-react';
import type { Actor } from '@/server/auth/actor';
import { hasPermission, isSuperAdmin, ROLE_LABELS } from '@/lib/permissions';
import { AdminLogo } from './admin-logo';
import { logoutAction } from '@/server/actions/auth';
import { AdminNav, type AdminNavItem } from './admin-nav';
import { AdminMobileNav } from './admin-mobile-nav';

interface AdminShellProps {
  actor: Actor;
  children: React.ReactNode;
}

function buildNav(actor: Actor): AdminNavItem[] {
  const items: AdminNavItem[] = [{ href: '/admin', label: 'Dashboard', icon: 'dashboard' }];
  // if (hasPermission(actor, 'page.view')) items.push({ href: '/admin/pages', label: 'Pages', icon: 'pages' });
  if (hasPermission(actor, 'notice.view')) items.push({ href: '/admin/notices', label: 'Notices', icon: 'notices' });
  if (hasPermission(actor, 'event.view')) items.push({ href: '/admin/events', label: 'Events', icon: 'events' });
  if (hasPermission(actor, 'registration.view')) {
    items.push({ href: '/admin/registrations', label: 'Registrations', icon: 'registrations' });
  }
  if (hasPermission(actor, 'announcement.manage')) {
    items.push({ href: '/admin/announcements', label: 'Popup announcement', icon: 'announcements' });
  }
  if (hasPermission(actor, 'enquiry.view')) items.push({ href: '/admin/enquiries', label: 'Enquiries', icon: 'enquiries' });
  if (hasPermission(actor, 'gallery.view')) items.push({ href: '/admin/gallery', label: 'Photo gallery', icon: 'gallery' });
  if (hasPermission(actor, 'blog.view')) items.push({ href: '/admin/blog', label: 'Activity blog', icon: 'blog' });
  if (hasPermission(actor, 'resource.view')) items.push({ href: '/admin/resources', label: 'Downloads', icon: 'resources' });
  if (hasPermission(actor, 'media.view')) items.push({ href: '/admin/media', label: 'Media library', icon: 'media' });
  if (isSuperAdmin(actor)) {
    items.push({ href: '/admin/users', label: 'Users & roles', icon: 'users' });
    items.push({ href: '/admin/sections', label: 'Sections', icon: 'sections' });
    items.push({ href: '/admin/settings', label: 'Site settings', icon: 'settings' });
    items.push({ href: '/admin/translations', label: 'Translations', icon: 'translations' });
    items.push({ href: '/admin/audit', label: 'Audit log', icon: 'audit' });
  }
  items.push({ href: '/admin/account', label: 'My account', icon: 'account' });
  return items;
}

export function AdminShell({ actor, children }: AdminShellProps) {
  const nav = buildNav(actor);
  const roleLabel = actor.roles.map((role) => ROLE_LABELS[role]).join(', ');

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden bg-ink px-4 py-6 text-paper lg:flex lg:flex-col">
        <div className="mb-8 px-2">
          <AdminLogo light compact />
        </div>
        <AdminNav items={nav} />
        <div className="mt-auto pt-6">
          <Link
            href="/en"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-paper/70 hover:bg-paper/5 hover:text-paper"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            View website
          </Link>
          <div className="mt-4 border-t border-paper/10 pt-4">
            <p className="px-3 text-sm font-semibold">{actor.name}</p>
            <p className="px-3 text-[11px] leading-snug text-paper/70">{roleLabel}</p>
            <form action={logoutAction} className="mt-3 px-3">
              <button
                type="submit"
                className="flex items-center gap-2 text-xs font-semibold text-paper/70 hover:text-saffron"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <AdminMobileNav items={nav} name={actor.name} roleLabel={roleLabel} />

        {actor.mustChangePassword ? (
          <div className="border-b border-saffron/30 bg-saffron-light px-5 py-3">
            <p className="mx-auto flex max-w-6xl items-start gap-2 text-xs font-semibold text-ink-soft">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-saffron-dark" aria-hidden="true" />
              <span>
                Your account is using a temporary password. Please{' '}
                <Link href="/admin/account" className="underline decoration-saffron-dark">
                  change your password
                </Link>{' '}
                now.
              </span>
            </p>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
