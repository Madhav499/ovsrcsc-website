import { getActor } from '@/server/auth/actor';
import { listSections } from '@/server/services/users';
import { db } from '@/lib/db';
import { toInstitutionLocalInput } from '@/lib/dates';
import { hasPermission } from '@/lib/permissions';
import CollectionEditor, {
  type CollectionRow,
  type Labels,
} from '@/components/admin/collection-editor';
import { saveAnnouncementAction, archiveAnnouncementAction } from '@/server/actions/admin-announcements';

const labels: Labels = {
  singular: 'announcement',
  plural: 'Announcements',
  create: 'New announcement',
  edit: 'Edit announcement',
  save: 'Save announcement',
  cancel: 'Cancel',
  searchPlaceholder: 'Search announcements…',
  empty: 'No announcements yet. Publish the first site-wide banner.',
  archive: 'Archive',
  translations: 'Translations',
  localeEn: 'English',
  localeGu: 'ગુજરાતી',
  localeHi: 'हिन्दी',
};

export default async function AdminAnnouncementsPage() {
  const actor = await getActor();
  if (!actor) return null;
  const canModerate = hasPermission(actor, 'announcement.manage');

  const [announcements, sections] = await Promise.all([
    db.announcement.findMany({
      include: { translations: { orderBy: { locale: 'asc' } } },
      orderBy: [{ startAt: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    }),
    listSections(),
  ]);
  const sectionNameById = new Map(sections.map((section) => [section.id, section.nameEn]));
  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.nameEn }));
  const translationsByAnnouncement = new Map<string, Record<string, Record<string, string>>>();
  for (const announcement of announcements) {
    const map: Record<string, Record<string, string>> = {};
    for (const translation of announcement.translations) {
      map[translation.locale.toLowerCase()] = {
        title: translation.title ?? '',
        message: translation.message ?? '',
        linkLabel: translation.linkLabel ?? '',
      };
    }
    translationsByAnnouncement.set(announcement.id, map);
  }

  const rows: CollectionRow[] = announcements.map((announcement) => {
    const englishTitle = translationsByAnnouncement.get(announcement.id)?.en?.title ?? 'Announcement';
    return {
      id: announcement.id,
      expectedUpdatedAt: announcement.updatedAt.toISOString(),
      searchIndex: englishTitle,
      values: {
        sectionId: announcement.sectionId ?? '',
        section: announcement.sectionId ? (sectionNameById.get(announcement.sectionId) ?? '—') : 'Site-wide',
        status: announcement.status,
        enabled: announcement.enabled,
        startAt: toInstitutionLocalInput(announcement.startAt),
        endAt: toInstitutionLocalInput(announcement.endAt),
        linkUrl: announcement.linkUrl ?? '',
        imageKey: announcement.imageKey ?? '',
        publish: announcement.status === 'PUBLISHED' && announcement.enabled,
        wasPublished: announcement.status === 'PUBLISHED' && announcement.enabled,
      },
      translations: translationsByAnnouncement.get(announcement.id) ?? {},
    };
  });

  const fields = [
    {
      kind: 'select' as const,
      name: 'sectionId',
      label: 'Programme section',
      optionsFrom: 'sections' as const,
      hint: 'Empty = site-wide banner (Super Admin only).',
    },
    { kind: 'datetime' as const, name: 'startAt', label: 'Show from' },
    { kind: 'datetime' as const, name: 'endAt', label: 'Show until' },
    { kind: 'text' as const, name: 'linkUrl', label: 'Details link', placeholder: '/en/notices or https://…' },
    { kind: 'checkbox' as const, name: 'enabled', label: 'Active (respecting the dates above)' },
    { kind: 'checkbox' as const, name: 'publish', label: 'Published banner' },
  ];
  const defaults = {
    enabled: true,
    publish: false,
    wasPublished: false,
    sectionId: '',
    startAt: '',
    endAt: '',
    linkUrl: '',
    imageKey: '',
  };
  const translationFields = [
    { kind: 'text' as const, name: 'title', label: 'Title', required: true },
    { kind: 'richtext' as const, name: 'message', label: 'Message' },
    { kind: 'text' as const, name: 'linkLabel', label: 'Button label', hint: 'Uses the shared “View details” link below.' },
  ];

  return (
    <CollectionEditor
      rows={rows}
      columns={[
        { key: 'section', label: 'Section' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'enabled', label: 'Active', type: 'badges' },
        { key: 'startAt', label: 'Show from', type: 'datetime' },
      ]}
      fields={fields}
      defaults={defaults}
      sectionOptions={sectionOptions}
      translationFields={translationFields}
      create={saveAnnouncementAction}
      update={saveAnnouncementAction}
      archive={canModerate ? archiveAnnouncementAction : undefined}
      labels={labels}
      locale="en"
    />
  );
}
