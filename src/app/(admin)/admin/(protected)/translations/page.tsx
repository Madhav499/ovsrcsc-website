import { notFound } from 'next/navigation';
import { getActor } from '@/server/auth/actor';
import { hasPermission } from '@/lib/permissions';
import { db } from '@/lib/db';
import { repairText } from '@/lib/meridian/text';
import { isTranslationConfigured, translationConfig } from '@/server/translation/google';
import { TranslationsPanel, type TranslationRow } from '@/components/admin/translations-panel';

const TYPE_LABEL: Record<string, string> = {
  Page: 'Page',
  BlogPost: 'Blog post',
  Notice: 'Notice',
  Event: 'Event',
  Announcement: 'Announcement',
  GalleryAlbum: 'Photo album',
};

async function englishTitles() {
  const pick = <T extends { locale: string; title: string }>(rows: T[]) => repairText(rows.find((row) => row.locale === 'EN')?.title ?? '') || '(untitled)';
  const [pages, posts, notices, events, announcements, albums] = await Promise.all([
    db.page.findMany({ select: { id: true, translations: { select: { locale: true, title: true } } } }),
    db.blogPost.findMany({ select: { id: true, translations: { select: { locale: true, title: true } } } }),
    db.notice.findMany({ select: { id: true, translations: { select: { locale: true, title: true } } } }),
    db.event.findMany({ select: { id: true, translations: { select: { locale: true, title: true } } } }),
    db.announcement.findMany({ select: { id: true, translations: { select: { locale: true, title: true } } } }),
    db.galleryAlbum.findMany({ select: { id: true, translations: { select: { locale: true, title: true } } } }),
  ]);
  const rows: Array<{ type: string; id: string; title: string }> = [];
  for (const [type, list] of [['Page', pages], ['BlogPost', posts], ['Notice', notices], ['Event', events], ['Announcement', announcements], ['GalleryAlbum', albums]] as const) {
    for (const item of list) rows.push({ type, id: item.id, title: pick(item.translations) });
  }
  return rows;
}

/** Automatic translation status (super-admin / settings only). */
export default async function AdminTranslationsPage() {
  const actor = await getActor();
  if (!actor || !hasPermission(actor, 'admin.settings')) notFound();

  const [entities, states] = await Promise.all([englishTitles(), db.translationState.findMany()]);
  const byKey = new Map(states.map((state) => [`${state.entityType}:${state.entityId}:${state.locale}`, state]));
  const rows: TranslationRow[] = entities.map((entity) => ({
    type: entity.type,
    typeLabel: TYPE_LABEL[entity.type] ?? entity.type,
    id: entity.id,
    title: entity.title,
    locales: (['GU', 'HI'] as const).map((locale) => {
      const state = byKey.get(`${entity.type}:${entity.id}:${locale}`);
      return {
        locale,
        status: state?.status ?? 'MISSING',
        provider: state?.provider ?? null,
        translatedAt: state?.translatedAt?.toISOString() ?? null,
        attempts: state?.attempts ?? 0,
        lastError: state?.lastError ?? null,
        stale: Boolean(state?.sourceHash && state.latestHash && state.sourceHash !== state.latestHash),
        hasLegacyBackup: state?.legacyBackup != null,
      };
    }),
  }));

  let configMessage: string | null = null;
  let provider: string | null = null;
  try {
    provider = translationConfig().provider;
  } catch (error) {
    configMessage = error instanceof Error ? error.message : 'Automatic translation is not configured.';
  }

  return <TranslationsPanel rows={rows} configured={isTranslationConfigured()} provider={provider} configMessage={configMessage} />;
}
