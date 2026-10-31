import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileText,
  Inbox,
  ListChecks,
  Plus,
} from 'lucide-react';
import { db } from '@/lib/db';
import { formatDateTime } from '@/lib/dates';
import { allowedSectionIds, hasPermission, isSuperAdmin } from '@/lib/permissions';
import { requireActor } from '@/server/auth/actor';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  const actor = await requireActor();
  const sectionIds = allowedSectionIds(actor);
  const sectionFilter = sectionIds === 'all' ? {} : { sectionId: { in: sectionIds } };

  const [publishedPages, upcomingEvents, newEnquiries, newRegistrations, auditLogs, nextEvents] =
    await Promise.all([
      hasPermission(actor, 'page.view')
        ? db.page.count({ where: { status: 'PUBLISHED', ...sectionFilter } })
        : 0,
      hasPermission(actor, 'event.view')
        ? db.event.count({ where: { status: 'PUBLISHED', startAt: { gte: new Date() }, ...sectionFilter } })
        : 0,
      hasPermission(actor, 'enquiry.view')
        ? db.enquiry.count({ where: { status: 'NEW' } })
        : 0,
      hasPermission(actor, 'registration.view')
        ? db.eventRegistration.count({ where: { status: 'NEW' } })
        : 0,
      isSuperAdmin(actor)
        ? db.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 8,
            include: { actor: { select: { name: true } } },
          })
        : [],
      hasPermission(actor, 'event.view')
        ? db.event.findMany({
            where: { status: 'PUBLISHED', startAt: { gte: new Date() }, ...sectionFilter },
            orderBy: { startAt: 'asc' },
            take: 4,
            include: { translations: { where: { locale: 'EN' }, take: 1 } },
          })
        : [],
    ]);

  const stats = [
    { label: 'Published pages', value: publishedPages, href: '/admin/pages', icon: FileText, show: hasPermission(actor, 'page.view') },
    { label: 'Upcoming events', value: upcomingEvents, href: '/admin/events', icon: CalendarDays, show: hasPermission(actor, 'event.view') },
    { label: 'New enquiries', value: newEnquiries, href: '/admin/enquiries', icon: Inbox, show: hasPermission(actor, 'enquiry.view') },
    { label: 'New registrations', value: newRegistrations, href: '/admin/registrations', icon: ListChecks, show: hasPermission(actor, 'registration.view') },
  ].filter((stat) => stat.show);

  const quickActions = [
    { label: 'Create a page', href: '/admin/pages', show: hasPermission(actor, 'page.create') },
    { label: 'Add a notice', href: '/admin/notices', show: hasPermission(actor, 'notice.manage') },
    { label: 'Add an event', href: '/admin/events', show: hasPermission(actor, 'event.manage') },
    { label: 'Upload media', href: '/admin/media', show: hasPermission(actor, 'media.upload') },
  ].filter((action) => action.show);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Welcome, {actor.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Here is what is happening across the website.
          </p>
        </div>
        {quickActions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {quickActions.slice(0, 2).map((action) => (
              <Link key={action.href} href={action.href} className="btn btn-primary !px-4 !py-2 !text-xs">
                <Plus className="size-3.5" aria-hidden="true" />
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <section aria-label="Website overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-2xl border border-line bg-paper p-5 transition-shadow hover:shadow-card"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-sky text-teal-dark">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <p className="mt-4 font-display text-3xl font-semibold tabular-nums">{stat.value}</p>
              <p className="mt-0.5 flex items-center justify-between text-xs font-semibold text-ink-muted">
                {stat.label}
                <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </p>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="rounded-2xl border border-line bg-paper p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Next events</h2>
            {hasPermission(actor, 'event.view') ? (
              <Link href="/admin/events" className="text-xs font-bold text-teal-dark hover:underline">
                View all
              </Link>
            ) : null}
          </div>
          {nextEvents.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-line p-6 text-center">
              <CalendarDays className="mx-auto size-7 text-ink-muted/50" aria-hidden="true" />
              <p className="mt-2 text-sm text-ink-muted">No upcoming published events.</p>
              {hasPermission(actor, 'event.manage') ? (
                <Link href="/admin/events" className="btn btn-outline mt-4 !py-2 !text-xs">
                  Add an event
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {nextEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href="/admin/events"
                    className="flex items-start gap-4 py-3.5 hover:text-teal-dark"
                  >
                    <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-sky py-1.5 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-teal-dark">
                        {event.startAt.toLocaleString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })}
                      </span>
                      <span className="font-display text-lg font-semibold leading-none">
                        {event.startAt.toLocaleString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {event.translations[0]?.title ?? event.slug}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {formatDateTime(event.startAt, 'en')}
                        {event.location ? ` · ${event.location}` : ''}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {newEnquiries + newRegistrations > 0 ? (
            <section className="rounded-2xl border border-saffron/35 bg-saffron-light/60 p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <ClipboardList className="size-4.5 text-saffron-dark" aria-hidden="true" />
                Needs attention
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                {newEnquiries} new {newEnquiries === 1 ? 'enquiry' : 'enquiries'} and {newRegistrations} new{' '}
                {newRegistrations === 1 ? 'registration' : 'registrations'} are waiting for review.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {hasPermission(actor, 'enquiry.view') ? (
                  <Link href="/admin/enquiries" className="btn btn-outline !bg-paper !py-2 !text-xs">
                    Review enquiries
                  </Link>
                ) : null}
                {hasPermission(actor, 'registration.view') ? (
                  <Link href="/admin/registrations" className="btn btn-outline !bg-paper !py-2 !text-xs">
                    Review registrations
                  </Link>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-line bg-paper p-6">
              <h2 className="font-display text-lg font-semibold">All caught up</h2>
              <p className="mt-2 text-sm text-ink-muted">
                There are no new enquiries or event registrations waiting for review.
              </p>
            </section>
          )}

          {quickActions.length > 2 ? (
            <section className="rounded-2xl border border-line bg-paper p-6">
              <h2 className="font-display text-lg font-semibold">Quick actions</h2>
              <ul className="mt-3 space-y-1">
                {quickActions.slice(2).map((action) => (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm font-semibold text-ink-soft hover:bg-sky/60 hover:text-teal-dark"
                    >
                      {action.label}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {isSuperAdmin(actor) ? (
            <section className="rounded-2xl border border-line bg-paper p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">Recent activity</h2>
                <Link href="/admin/audit" className="text-xs font-bold text-teal-dark hover:underline">
                  Audit log
                </Link>
              </div>
              {auditLogs.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">No activity recorded yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {auditLogs.map((entry) => (
                    <li key={entry.id} className="text-xs">
                      <p className="font-semibold text-ink-soft">{entry.summary}</p>
                      <p className="mt-0.5 text-ink-muted">
                        {entry.actor?.name ?? 'System'} · {formatDateTime(entry.createdAt, 'en')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
