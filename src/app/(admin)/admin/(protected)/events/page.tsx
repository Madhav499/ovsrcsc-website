import { getActor } from '@/server/auth/actor';
import { listEventsForAdmin } from '@/server/services/events';
import { listSections } from '@/server/services/users';
import { toInstitutionLocalInput } from '@/lib/dates';
import { hasPermission } from '@/lib/permissions';
import CollectionEditor, {
  type CollectionRow,
  type Labels,
} from '@/components/admin/collection-editor';
import { saveEventAction, archiveEventAction } from '@/server/actions/admin-events';

const labels: Labels = {
  singular: 'event',
  plural: 'Events',
  create: 'New event',
  edit: 'Edit event',
  save: 'Save event',
  cancel: 'Cancel',
  searchPlaceholder: 'Search events…',
  empty: 'No events yet. Publish your first programme on the calendar.',
  archive: 'Archive',
  translations: 'Translations',
  localeEn: 'English',
  localeGu: 'ગુજરાતી',
  localeHi: 'हिन्दी',
};

export default async function AdminEventsPage() {
  const actor = await getActor();
  if (!actor) return null;
  const canModerate = hasPermission(actor, 'event.publish');

  const [events, sections] = await Promise.all([listEventsForAdmin(actor), listSections()]);
  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.nameEn }));

  const rows: CollectionRow[] = events.map((event) => {
    const titleTranslation = event.translations.find((item) => item.locale === 'EN') ?? event.translations[0];
    const translations: Record<string, Record<string, string>> = {};
    for (const translation of event.translations) {
      translations[translation.locale.toLowerCase()] = {
        title: translation.title ?? '',
        description: translation.description ?? '',
        location: translation.location ?? '',
      };
    }
    return {
      id: event.id,
      expectedUpdatedAt: event.updatedAt.toISOString(),
      searchIndex: titleTranslation?.title ?? event.slug,
      values: {
        sectionId: event.sectionId,
        section: event.section?.nameEn ?? '—',
        status: event.status,
        startAt: toInstitutionLocalInput(event.startAt),
        endAt: event.endAt ? toInstitutionLocalInput(event.endAt) : '',
        allDay: event.allDay,
        location: event.location ?? '',
        registrationEnabled: event.registrationEnabled,
        registrationDeadline: event.registrationDeadline ? toInstitutionLocalInput(event.registrationDeadline) : '',
        capacity: event.capacity ?? '',
        coverKey: event.coverKey ?? '',
        publish: event.status === 'PUBLISHED',
        wasPublished: event.status === 'PUBLISHED',
      },
      translations,
    };
  });

  const fields = [
    { kind: 'select' as const, name: 'sectionId', label: 'Programme section', optionsFrom: 'sections' as const, required: true },
    { kind: 'datetime' as const, name: 'startAt', label: 'Starts', required: true },
    { kind: 'datetime' as const, name: 'endAt', label: 'Ends' },
    { kind: 'checkbox' as const, name: 'allDay', label: 'All-day event (no visible time)' },
    { kind: 'text' as const, name: 'location', label: 'Venue', placeholder: 'Science Centre auditorium' },
    { kind: 'text' as const, name: 'coverKey', label: 'Cover image', hint: 'Type a media path, e.g. /media/events/cover.jpg', placeholder: '/media/legacy/…' },
    { kind: 'checkbox' as const, name: 'registrationEnabled', label: 'Accept online registrations' },
    { kind: 'datetime' as const, name: 'registrationDeadline', label: 'Registration deadline' },
    { kind: 'number' as const, name: 'capacity', label: 'Capacity', min: 0, hint: 'Optional — leave empty for unlimited seating.' },
    {
      kind: 'checkbox' as const,
      name: 'publish',
      label: canModerate ? 'Published on the public site' : 'Publish request (requires publish rights)',
    },
  ];
  const defaults = {
    allDay: false,
    registrationEnabled: false,
    location: '',
    registrationDeadline: '',
    capacity: '',
    coverKey: '',
    publish: false,
    wasPublished: false,
  };
  const translationFields = [
    { kind: 'text' as const, name: 'title', label: 'Title', required: true },
    { kind: 'richtext' as const, name: 'description', label: 'Description' },
  ];

  return (
    <CollectionEditor
      rows={rows}
      columns={[
        { key: 'section', label: 'Section' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'startAt', label: 'Starts', type: 'datetime' },
        { key: 'registrationEnabled', label: 'Registrations', type: 'badges' },
      ]}
      fields={fields}
      defaults={defaults}
      sectionOptions={sectionOptions}
      translationFields={translationFields}
      create={saveEventAction}
      update={saveEventAction}
      archive={canModerate ? archiveEventAction : undefined}
      labels={labels}
      locale="en"
    />
  );
}
