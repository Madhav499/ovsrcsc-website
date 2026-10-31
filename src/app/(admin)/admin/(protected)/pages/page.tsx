import { getActor } from '@/server/auth/actor';
import { listPagesForAdmin } from '@/server/services/pages';
import { listSections } from '@/server/services/users';
import { hasPermission } from '@/lib/permissions';
import CollectionEditor, {
  type CollectionRow,
  type Labels,
} from '@/components/admin/collection-editor';
import { savePageAction, archivePageAction } from '@/server/actions/admin-pages';

const labels: Labels = {
  singular: 'page',
  plural: 'Pages',
  create: 'New page',
  edit: 'Edit page',
  save: 'Save page',
  cancel: 'Cancel',
  searchPlaceholder: 'Search pages…',
  empty: 'No pages yet. Create the first editorial page.',
  archive: 'Archive',
  translations: 'Translations',
  localeEn: 'English',
  localeGu: 'ગુજરાતી',
  localeHi: 'हिन्दी',
};

export default async function AdminPagesPage() {
  const actor = await getActor();
  if (!actor) return null;
  const canModerate = hasPermission(actor, 'page.publish');

  const [pages, sections] = await Promise.all([listPagesForAdmin(actor), listSections()]);
  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.nameEn }));

  const rows: CollectionRow[] = pages.map((page) => {
    const english = page.translations.find((item) => item.locale === 'EN') ?? page.translations[0];
    const translations: Record<string, Record<string, string>> = {};
    for (const translation of page.translations) {
      translations[translation.locale.toLowerCase()] = {
        title: translation.title ?? '',
        summary: translation.summary ?? '',
        bodyHtml: translation.bodyHtml ?? '',
        seoTitle: translation.seoTitle ?? '',
        seoDescription: translation.seoDescription ?? '',
      };
    }
    return {
      id: page.id,
      expectedUpdatedAt: page.updatedAt.toISOString(),
      searchIndex: `/${page.path} — ${english?.title ?? ''}`,
      values: {
        path: page.path,
        sectionId: page.sectionId,
        section: page.section?.nameEn ?? '—',
        status: page.status,
        featured: page.featured,
        sortOrder: page.sortOrder,
        coverKey: page.coverKey ?? '',
        publish: page.status === 'PUBLISHED',
        wasPublished: page.status === 'PUBLISHED',
      },
      translations,
    };
  });

  const fields = [
    { kind: 'text' as const, name: 'path', label: 'Page address', placeholder: 'about-us/our-story', hint: 'Lowercase words separated by dashes. Example: about-us/history' },
    { kind: 'select' as const, name: 'sectionId', label: 'Programme section', optionsFrom: 'sections' as const, required: true },
    { kind: 'text' as const, name: 'coverKey', label: 'Cover image', hint: 'Optional media path, e.g. /media/pages/hero.jpg' },
    { kind: 'checkbox' as const, name: 'featured', label: 'Feature on the homepage' },
    { kind: 'number' as const, name: 'sortOrder', label: 'Menu order', min: 0 },
    {
      kind: 'checkbox' as const,
      name: 'publish',
      label: canModerate ? 'Published on the public site' : 'Publish request (requires publish rights)',
    },
  ];
  const defaults = {
    featured: false,
    sortOrder: 0,
    coverKey: '',
    publish: false,
    wasPublished: false,
  };
  const translationFields = [
    { kind: 'text' as const, name: 'title', label: 'Title', required: true },
    { kind: 'textarea' as const, name: 'summary', label: 'Summary', rows: 2, hint: 'Shown in listings and search results.' },
    { kind: 'richtext' as const, name: 'bodyHtml', label: 'Body' },
    { kind: 'text' as const, name: 'seoTitle', label: 'SEO title' },
    { kind: 'textarea' as const, name: 'seoDescription', label: 'SEO description', rows: 2 },
  ];

  return (
    <CollectionEditor
      rows={rows}
      columns={[
        { key: 'path', label: 'Address', type: 'badges' },
        { key: 'section', label: 'Section' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'featured', label: 'Featured', type: 'badges' },
      ]}
      fields={fields}
      defaults={defaults}
      sectionOptions={sectionOptions}
      translationFields={translationFields}
      create={savePageAction}
      update={savePageAction}
      archive={canModerate ? archivePageAction : undefined}
      labels={labels}
      locale="en"
    />
  );
}
