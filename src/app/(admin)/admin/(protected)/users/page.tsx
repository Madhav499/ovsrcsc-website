import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/actor';
import { isSuperAdmin } from '@/lib/permissions';
import { listUsersForAdmin, listSections } from '@/server/services/users';
import UserManager, { type AdminUserRow } from '@/components/admin/user-manager';

export default async function AdminUsersPage() {
  const actor = await getActor();
  if (!actor) redirect('/admin/login');
  if (!isSuperAdmin(actor)) return null;

  const [users, sections] = await Promise.all([listUsersForAdmin(actor), listSections()]);
  const rows: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : '',
    sessionCount: user._count.sessions,
    roles: user.roles.map((role) => role.role),
    sections: user.sections.map((section) => ({
      sectionId: section.sectionId,
      canPublish: section.canPublish,
      name: section.section.nameEn,
    })),
  }));
  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.nameEn }));

  return <UserManager users={rows} sections={sectionOptions} currentUserId={actor.id} />;
}
