import { redirect } from 'next/navigation';
import { getActor, assertPasswordChanged } from '@/server/auth/actor';
import { AdminShell } from '@/components/admin/admin-shell';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect('/admin/login');
  if (actor.mustChangePassword) redirect('/admin/change-password');
  assertPasswordChanged(actor);
  return <AdminShell actor={actor}>{children}</AdminShell>;
}
