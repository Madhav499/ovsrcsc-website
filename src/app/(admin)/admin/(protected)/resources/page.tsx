import { getActor } from '@/server/auth/actor';
import { listResourcesForAdmin } from '@/server/services/resources';
import { listSections } from '@/server/services/users';
import CollectionEditor, {
  type CollectionRow,
  type Labels,
} from '@/components/admin/collection-editor';
import { saveResourceAction, archiveResourceAction } from '@/server/actions/admin-resources';

const labels: Labels = {
  singular: 'resource link',
  plural: 'Resource links',
  create: 'Add link',
  edit: 'Edit link',
  save: 'Save link',
  cancel: 'Cancel',
  searchPlaceholder: 'Search links…',
  empty: 'No resource links yet. Add the first downloadable or partner link.',
  archive: 'Remove',
  translations: 'Translations',
  localeEn: 'English',
  localeGu: 'ગુજરાતી',
  localeHi: 'हिन्दी',
};

export default async function AdminResourcesPage() {
  const actor = await getActor();
  if (!actor) return null;

  const [resources, sections] = await Promise.all([listResourcesForAdmin(actor), listSections()]);
  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.nameEn }));

  const rows: CollectionRow[] = resources.map((resource) => ({
    id: resource.id,
    searchIndex: resource.title,
    values: {
      title: resource.title,
      url: resource.url,
      description: resource.description ?? '',
      category: resource.category ?? '',
      sectionId: resource.sectionId,
      section: resource.section?.nameEn ?? '—',
      isExternal: resource.isExternal,
      isPublished: resource.isPublished,
      sortOrder: resource.sortOrder,
    },
  }));

  const fields = [
    { kind: 'text' as const, name: 'title', label: 'Title', required: true, placeholder: 'Astronomy observation checklist (PDF)' },
    { kind: 'text' as const, name: 'url', label: 'URL', required: true, placeholder: 'https://… or /media/…' },
    { kind: 'select' as const, name: 'sectionId', label: 'Programme section', optionsFrom: 'sections' as const, required: true },
    { kind: 'text' as const, name: 'category', label: 'Category', placeholder: 'Chemistry, Astronomy, Volunteer…' },
    { kind: 'textarea' as const, name: 'description', label: 'Description', rows: 2 },
    { kind: 'checkbox' as const, name: 'isPublished', label: 'Visible on the Downloads page' },
  ];
  const defaults = {
    isExternal: true,
    isPublished: true,
    sortOrder: 0,
    category: '',
    description: '',
  };

  return (
    <CollectionEditor
      rows={rows}
      columns={[
        { key: 'section', label: 'Section' },
        { key: 'category', label: 'Category', type: 'badges' },
        { key: 'isPublished', label: 'Visible', type: 'badges' },
        { key: 'url', label: 'Link' },
      ]}
      fields={fields}
      defaults={defaults}
      sectionOptions={sectionOptions}
      create={saveResourceAction}
      update={saveResourceAction}
      archive={archiveResourceAction}
      labels={labels}
      locale="en"
    />
  );
}
