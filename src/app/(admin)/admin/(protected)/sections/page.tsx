import { getActor } from '@/server/auth/actor';
import { isSuperAdmin } from '@/lib/permissions';
import { db } from '@/lib/db';

export default async function AdminSectionsPage() {
  const actor = await getActor();
  if (!actor) return null;
  if (!isSuperAdmin(actor)) return null;

  const sections = await db.section.findMany({
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    include: {
      _count: {
        select: {
          pages: true,
          notices: true,
          events: true,
          blogPosts: true,
          albums: true,
          resources: true,
          enquiries: true,
        },
      },
    },
  });

  return (
    <section className="admin-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 className="font-display text-lg font-semibold">Website sections</h2>
        <p className="text-xs text-ink-muted">
          Reference data for the CMS teams. New sections must be added by an administrator.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wider text-ink-muted">
              <th className="px-6 py-3 font-semibold">Key</th>
              <th className="px-3 py-3 font-semibold">Name (En)</th>
              <th className="px-3 py-3 font-semibold">Name (Gu)</th>
              <th className="px-3 py-3 font-semibold">Pages</th>
              <th className="px-3 py-3 font-semibold">Notices</th>
              <th className="px-3 py-3 font-semibold">Events</th>
              <th className="px-3 py-3 font-semibold">Journal</th>
              <th className="px-3 py-3 font-semibold">Albums</th>
              <th className="px-3 py-3 font-semibold">Links</th>
              <th className="px-3 py-3 font-semibold">Enquiries</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.id} className="border-b border-line/60 last:border-0">
                <td className="px-6 py-2.5 font-mono text-xs text-ink-soft">{section.key}</td>
                <td className="px-3 py-2.5 font-semibold text-ink">{section.nameEn}</td>
                <td className="px-3 py-2.5 text-ink-soft">{section.nameGu}</td>
                <td className="px-3 py-2.5 text-ink-muted">{section._count.pages}</td>
                <td className="px-3 py-2.5 text-ink-muted">{section._count.notices}</td>
                <td className="px-3 py-2.5 text-ink-muted">{section._count.events}</td>
                <td className="px-3 py-2.5 text-ink-muted">{section._count.blogPosts}</td>
                <td className="px-3 py-2.5 text-ink-muted">{section._count.albums}</td>
                <td className="px-3 py-2.5 text-ink-muted">{section._count.resources}</td>
                <td className="px-3 py-2.5 text-ink-muted">{section._count.enquiries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
