'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BellRing,
  BookOpenText,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderOpen,
  Gauge,
  Images,
  Inbox,
  Layers,
  Link2,
  ListChecks,
  Settings,
  Users,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminNavIcon =
  | 'dashboard'
  | 'pages'
  | 'notices'
  | 'events'
  | 'registrations'
  | 'announcements'
  | 'enquiries'
  | 'gallery'
  | 'blog'
  | 'resources'
  | 'media'
  | 'users'
  | 'sections'
  | 'settings'
  | 'audit'
  | 'account';

const ICONS: Record<AdminNavIcon, LucideIcon> = {
  dashboard: Gauge,
  pages: FileText,
  notices: ClipboardList,
  events: CalendarDays,
  registrations: ListChecks,
  announcements: BellRing,
  enquiries: Inbox,
  gallery: Images,
  blog: BookOpenText,
  resources: Link2,
  media: FolderOpen,
  users: Users,
  sections: Layers,
  settings: Settings,
  audit: ClipboardList,
  account: UserRound,
};

export interface AdminNavItem {
  href: string;
  label: string;
  icon: AdminNavIcon;
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="space-y-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
              active
                ? 'bg-paper/10 text-paper'
                : 'text-paper/60 hover:bg-paper/5 hover:text-paper'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
