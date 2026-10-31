import { getActor } from '@/server/auth/actor';
import { listBlogPostsForAdmin } from '@/server/services/blog';
import { listSections } from '@/server/services/users';
import { hasPermission } from '@/lib/permissions';
import { toInstitutionLocalInput } from '@/lib/dates';
import CollectionEditor, {
  type CollectionRow,
  type Labels,
} from '@/components/admin/collection-editor';
import { saveBlogPostAction, archiveBlogPostAction } from '@/server/actions/admin-blog';

const labels: Labels = {
  singular: 'blog post',
  plural: 'Journal',
  create: 'New post',
  edit: 'Edit post',
  save: 'Save post',
  cancel: 'Cancel',
  searchPlaceholder: 'Search posts…',
  empty: 'No journal entries yet. Write the first story from the science floor.',
  archive: 'Archive',
  translations: 'Translations',
  localeEn: 'English',
  localeGu: 'ગુજરાતી',
  localeHi: 'हिन्दी',
};

export default async function AdminBlogPage() {
  const actor = await getActor();
  if (!actor) return null;
  const canModerate = hasPermission(actor, 'blog.publish');

  const [posts, sections] = await Promise.all([listBlogPostsForAdmin(actor), listSections()]);
  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.nameEn }));

  const rows: CollectionRow[] = posts.map((post) => {
    const translations: Record<string, Record<string, string>> = {};
    for (const translation of post.translations) {
      translations[translation.locale.toLowerCase()] = {
        title: translation.title ?? '',
        summary: translation.summary ?? '',
        bodyHtml: translation.bodyHtml ?? '',
      };
    }
    return {
      id: post.id,
      expectedUpdatedAt: post.updatedAt.toISOString(),
      searchIndex: post.translations.find((item) => item.locale === 'EN')?.title ?? post.slug,
      values: {
        sectionId: post.sectionId,
        section: '—',
        status: post.status,
        slug: post.slug,
        category: post.category ?? '',
        coverKey: post.coverKey ?? '',
        publishedAt: post.publishedAt ? toInstitutionLocalInput(post.publishedAt) : '',
        publish: post.status === 'PUBLISHED',
        wasPublished: post.status === 'PUBLISHED',
      },
      translations,
    };
  });

  const fields = [
    { kind: 'select' as const, name: 'sectionId', label: 'Programme section', optionsFrom: 'sections' as const, required: true },
    { kind: 'text' as const, name: 'slug', label: 'Web address', hint: 'Optional — built from the English title if left empty.' },
    { kind: 'text' as const, name: 'coverKey', label: 'Cover image', hint: 'Media path, e.g. /media/blog/cover.jpg' },
    { kind: 'text' as const, name: 'category', label: 'Category tag', placeholder: 'Lecture series' },
    { kind: 'datetime' as const, name: 'publishedAt', label: 'Publication date', hint: 'When publishing — defaults to now.' },
    {
      kind: 'checkbox' as const,
      name: 'publish',
      label: canModerate ? 'Published on the public site' : 'Publish request (requires publish rights)',
    },
  ];
  const defaults = {
    category: '',
    coverKey: '',
    publishedAt: '',
    publish: false,
    wasPublished: false,
  };
  const translationFields = [
    { kind: 'text' as const, name: 'title', label: 'Title', required: true },
    { kind: 'textarea' as const, name: 'summary', label: 'Summary', rows: 2 },
    { kind: 'richtext' as const, name: 'bodyHtml', label: 'Story' },
  ];

  const enrichedRows = rows.map((row, index) => ({
    ...row,
    values: {
      ...row.values,
      section: sectionOptions.find((option) => option.value === rows[index].values.sectionId)?.label ?? '—',
    },
  }));

  return (
    <CollectionEditor
      rows={enrichedRows}
      columns={[
        { key: 'section', label: 'Section' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'category', label: 'Category', type: 'badges' },
        { key: 'publishedAt', label: 'Published', type: 'datetime' },
      ]}
      fields={fields}
      defaults={defaults}
      sectionOptions={sectionOptions}
      translationFields={translationFields}
      create={saveBlogPostAction}
      update={saveBlogPostAction}
      archive={canModerate ? archiveBlogPostAction : undefined}
      labels={labels}
      locale="en"
    />
  );
}
