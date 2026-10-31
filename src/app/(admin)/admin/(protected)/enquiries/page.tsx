import { getActor } from '@/server/auth/actor';
import { hasPermission, isSuperAdmin } from '@/lib/permissions';
import { db } from '@/lib/db';
import EnquiryBoard, { type EnquiryRow } from '@/components/admin/enquiry-board';

export default async function AdminEnquiriesPage() {
  const actor = await getActor();
  if (!actor) return null;
  const canView = hasPermission(actor, 'enquiry.manage') || isSuperAdmin(actor);
  if (!canView) return null;
  void canView;

  const enquiries = await db.enquiry.findMany({
    include: { section: { select: { nameEn: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

  const rows: EnquiryRow[] = enquiries.map((enquiry) => ({
    id: enquiry.id,
    type: enquiry.type,
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone ?? '',
    subject: enquiry.subject,
    message: enquiry.message,
    locale: enquiry.locale.toLowerCase(),
    status: enquiry.status,
    section: enquiry.section?.nameEn ?? '',
    createdAt: enquiry.createdAt.toISOString(),
  }));

  return <EnquiryBoard enquiries={rows} />;
}
