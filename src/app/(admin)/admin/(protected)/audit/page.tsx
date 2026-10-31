import { getActor } from '@/server/auth/actor';
import { isSuperAdmin } from '@/lib/permissions';
import { db } from '@/lib/db';
import { formatDateTime } from '@/lib/dates';
import type { LocaleCode } from '@/lib/constants';

export default async function AdminAuditPage() {
  const actor = await getActor();
  if (!actor) return null;
  if (!isSuperAdmin(actor)) return null;

  const [logs, users] = await Promise.all([
    db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    db.user.findMany({ select: { id: true, name: true, email: true } }),
  ]);
  const nameById = new Map(users.map((user) => [user.id, `${user.name} (${user.email})`]));

  return (
    <section className="admin-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 className="font-display text-lg font-semibold">Audit trail</h2>
        <p className="text-xs text-ink-muted">Latest 200 actions performed in the CMS.</p>
      </div>
      {logs.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-ink-muted">No actions logged yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wider text-ink-muted">
              <th className="px-6 py-3 font-semibold">When</th>
              <th className="px-3 py-3 font-semibold">Actor</th>
              <th className="px-3 py-3 font-semibold">Action</th>
              <th className="px-3 py-3 font-semibold">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-line/60 last:border-0">
                <td className="px-6 py-2.5 whitespace-nowrap text-[11px] text-ink-muted">
                  {formatDateTime(log.createdAt, 'en' as LocaleCode, { timeStyle: 'short' })}
                </td>
                <td className="px-3 py-2.5 text-xs text-ink-soft">
                  {log.actorId ? nameById.get(log.actorId) ?? log.actorId : 'System'}
                </td>
                <td className="px-3 py-2.5">
                  <span className="rounded-full bg-warm-ivory px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    {log.action}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-ink">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
