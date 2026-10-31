import { getActor } from '@/server/auth/actor';
import { listNoticesForAdmin } from '@/server/services/notices';
import { listSections } from '@/server/services/users';
import { toInstitutionLocalInput } from '@/lib/dates';
import { hasPermission } from '@/lib/permissions';
import CollectionEditor, {
  type CollectionRow,
  type Labels,
} from '@/components/admin/collection-editor';
import { saveNoticeAction, archiveNoticeAction } from '@/server/actions/admin-notices';

const labels: Labels = {
  singular: 'notice',
  plural: 'Notices',
  create: 'New notice',
  edit: 'Edit notice',
  save: 'Save notice',
  cancel: 'Cancel',
  searchPlaceholder: 'Search notices…',
  empty: 'No notices yet. Post your first announcement to the notice board.',
  archive: 'Archive',
  translations: 'Translations',
  localeEn: 'English',
  localeGu: 'ગુજરાતી',
  localeHi: 'हिन्दी',
};

export default async function AdminNoticesPage() {
  const actor = await getActor();
  if (!actor) return null;
  const canModerate = hasPermission(actor, 'notice.publish');

  const [notices, sections] = await Promise.all([listNoticesForAdmin(actor), listSections()]);
  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.nameEn }));

  const rows: CollectionRow[] = notices.map((notice) => {
    const titleTranslation = notice.translations.find((item) => item.locale === 'EN') ?? notice.translations[0];
    const translations: Record<string, Record<string, string>> = {};
    for (const translation of notice.translations) {
      translations[translation.locale.toLowerCase()] = {
        title: translation.title ?? '',
        bodyHtml: translation.bodyHtml ?? '',
        linkUrl: translation.linkUrl ?? '',
        linkLabel: translation.linkLabel ?? '',
      };
    }
    return {
      id: notice.id,
      expectedUpdatedAt: notice.updatedAt.toISOString(),
      searchIndex: titleTranslation?.title ?? notice.slug,
      values: {
        sectionId: notice.sectionId,
        section: notice.section?.nameEn ?? '—',
        status: notice.status,
        isPinned: notice.isPinned,
        publishAt: notice.publishAt ? toInstitutionLocalInput(notice.publishAt) : '',
        expireAt: notice.expireAt ? toInstitutionLocalInput(notice.expireAt) : '',
        publish: notice.status === 'PUBLISHED',
        wasPublished: notice.status === 'PUBLISHED',
        attachmentIds: [] as string[],
      },
      translations,
    };
  });

  const fields = [
    { kind: 'select' as const, name: 'sectionId', label: 'Programme section', optionsFrom: 'sections' as const, required: true },
    { kind: 'datetime' as const, name: 'publishAt', label: 'Show from', hint: 'Leave empty for immediately.' },
    { kind: 'datetime' as const, name: 'expireAt', label: 'Show until', hint: 'Leave empty for no end date.' },
    { kind: 'checkbox' as const, name: 'isPinned', label: 'Pin to the top of the notice board' },
    {
      kind: 'checkbox' as const,
      name: 'publish',
      label: canModerate ? 'Published on the public site' : 'Publish request (requires publish rights)',
    },
  ];
  const defaults = {
    isPinned: false,
    publish: false,
    wasPublished: false,
    publishAt: '',
    expireAt: '',
    attachmentIds: [] as string[],
  };
  const translationFields = [
    { kind: 'text' as const, name: 'title', label: 'Title', required: true },
    { kind: 'richtext' as const, name: 'bodyHtml', label: 'Body' },
    { kind: 'text' as const, name: 'linkUrl', label: 'Button link', placeholder: '/en/events or https://…' },
    { kind: 'text' as const, name: 'linkLabel', label: 'Button label', placeholder: 'View details' },
  ];

  return (
    <CollectionEditor
      rows={rows}
      columns={[
        { key: 'section', label: 'Section' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'isPinned', label: 'Pinned', type: 'badges' },
        { key: 'publishAt', label: 'Show from', type: 'datetime' },
        { key: 'expireAt', label: 'Show until', type: 'datetime' },
      ]}
      fields={fields}
      defaults={defaults}
      sectionOptions={sectionOptions}
      translationFields={translationFields}
      create={saveNoticeAction}
      update={saveNoticeAction}
      archive={canModerate ? archiveNoticeAction : undefined}
      labels={labels}
      locale="en"
    />
  );
}
