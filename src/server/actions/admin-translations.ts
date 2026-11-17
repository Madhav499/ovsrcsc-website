'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { assertPermission, requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { listTranslatableEntities, translateEntity, type TranslatableType, type TranslateResult } from '@/server/translation/service';

const TYPES: readonly TranslatableType[] = ['Page', 'BlogPost', 'Notice', 'Event', 'Announcement', 'GalleryAlbum'];

export interface TranslationActionState {
  status: 'idle' | 'success' | 'error';
  message?: string;
}

function summarise(results: TranslateResult[]): TranslationActionState {
  const count = (outcome: TranslateResult['outcome']) => results.filter((result) => result.outcome === outcome).length;
  const notConfigured = results.find((result) => result.outcome === 'not-configured');
  if (notConfigured) return { status: 'error', message: notConfigured.message };
  const failed = results.filter((result) => result.outcome === 'failed');
  if (failed.length) {
    return { status: 'error', message: `${count('translated')} translated, ${failed.length} failed: ${failed[0].message} The previous translations are still shown.` };
  }
  return { status: 'success', message: `${count('translated')} translated, ${count('unchanged')} already up to date.` };
}

/** Regenerate gu/hi for one item from its current English text. */
export async function regenerateTranslationAction(_: TranslationActionState, formData: FormData): Promise<TranslationActionState> {
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    assertPermission(actor, 'admin.settings');
    const type = String(formData.get('entityType') ?? '') as TranslatableType;
    const id = String(formData.get('entityId') ?? '');
    if (!TYPES.includes(type) || !id) return { status: 'error', message: 'Unknown item.' };
    const results = await translateEntity(type, id, { force: true });
    await writeAuditLog({ actorId: actor.id, action: 'translation.regenerate', entityType: type, entityId: id, summary: `Regenerated translations for ${type} ${id}` });
    revalidatePath('/admin/translations');
    revalidatePath('/', 'layout');
    return summarise(results);
  } catch (error) {
    return { status: 'error', message: isAppError(error) ? error.message : 'Could not regenerate the translation.' };
  }
}

/** Bring every item up to date (new, stale and failed only; unchanged items are skipped). */
export async function translateAllAction(_: TranslationActionState, formData: FormData): Promise<TranslationActionState> {
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    assertPermission(actor, 'admin.settings');
    const force = formData.get('force') === '1';
    const results: TranslateResult[] = [];
    for (const entity of await listTranslatableEntities()) {
      results.push(...(await translateEntity(entity.type, entity.id, { force })));
      if (results.some((result) => result.outcome === 'not-configured')) break;
    }
    await writeAuditLog({ actorId: actor.id, action: 'translation.backfill', entityType: 'TranslationState', entityId: 'all', summary: `Ran automatic translation for all content${force ? ' (forced)' : ''}` });
    revalidatePath('/admin/translations');
    revalidatePath('/', 'layout');
    return summarise(results);
  } catch (error) {
    return { status: 'error', message: isAppError(error) ? error.message : 'Could not run the translation.' };
  }
}
