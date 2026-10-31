import { getActor } from '@/server/auth/actor';
import { hasPermission, isSuperAdmin } from '@/lib/permissions';
import { db } from '@/lib/db';
import { toInstitutionLocalInput } from '@/lib/dates';
import RegistrationBoard, { type RegistrationRow } from '@/components/admin/registration-board';

export default async function AdminRegistrationsPage() {
  const actor = await getActor();
  if (!actor) return null;
  if (!(hasPermission(actor, 'registration.manage') || isSuperAdmin(actor))) return null;

  const registrations = await db.eventRegistration.findMany({
    include: { event: { select: { startAt: true, translations: true } } },
    orderBy: { createdAt: 'desc' },
    take: 400,
  });

  const rows: RegistrationRow[] = registrations.map((registration) => ({
    id: registration.id,
    eventTitle:
      registration.event?.translations.find((t) => t.locale === 'EN')?.title ?? registration.event?.translations[0]?.title ?? 'Event removed',
    eventStartAt: registration.event ? toInstitutionLocalInput(registration.event.startAt) : '',
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    participants: registration.participants,
    notes: registration.notes ?? '',
    locale: registration.locale.toLowerCase(),
    status: registration.status,
    createdAt: registration.createdAt.toISOString(),
  }));

  return <RegistrationBoard registrations={rows} />;
}
