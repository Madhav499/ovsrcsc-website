import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// A tiny in-memory stand-in for the two tables the BlogPost path touches.
type Row = { postId: string; locale: string; title: string; summary: string | null; bodyHtml: string };
type State = Record<string, unknown> & { id: string; entityType: string; entityId: string; locale: string; status: string; sourceHash: string | null; latestHash: string | null; attempts: number; lastError: string | null };
const store = vi.hoisted(() => ({ blog: [] as Row[], states: [] as State[] }));
vi.mock('@/lib/db', () => {
  const apply = (state: State, data: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      state[key] = value && typeof value === 'object' && 'increment' in value ? (state[key] as number) + (value as { increment: number }).increment : value;
    }
    return state;
  };
  return {
    db: {
      blogPost: {
        findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id, translations: store.blog.filter((row) => row.postId === where.id).map((row) => ({ ...row })) }),
      },
      blogTranslation: {
        upsert: async ({ where, create, update }: { where: { postId_locale: { postId: string; locale: string } }; create: Row; update: Partial<Row> }) => {
          const row = store.blog.find((r) => r.postId === where.postId_locale.postId && r.locale === where.postId_locale.locale);
          if (row) Object.assign(row, update);
          else store.blog.push({ ...create });
        },
      },
      translationState: {
        findUnique: async ({ where }: { where: { entityType_entityId_locale: { entityType: string; entityId: string; locale: string } } }) => {
          const key = where.entityType_entityId_locale;
          return store.states.find((s) => s.entityType === key.entityType && s.entityId === key.entityId && s.locale === key.locale) ?? null;
        },
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const state = apply({ id: `s${store.states.length}`, status: 'PENDING', sourceHash: null, latestHash: null, attempts: 0, lastError: null } as State, data);
          store.states.push(state);
          return state;
        },
        update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => apply(store.states.find((s) => s.id === where.id)!, data),
      },
    },
  };
});

const google = vi.hoisted(() => ({ configured: true, fail: false, calls: 0 }));
vi.mock('./google', async (original) => {
  const actual = await original<typeof import('./google')>();
  return {
    ...actual,
    isTranslationConfigured: () => google.configured,
    translationConfig: () => {
      if (!google.configured) throw new actual.TranslationConfigError('Automatic translation is not configured. Add GOOGLE_TRANSLATE_API_KEY.');
      return { provider: 'google-v2', apiKey: 'x' };
    },
    translateHtml: async (segments: string[], target: string) => {
      google.calls += 1;
      if (google.fail) throw new actual.TranslationProviderError('Google translation is unavailable (HTTP 503).', 503, true);
      return { provider: 'google-v2', texts: segments.map((s) => `[${target}] ${s}`) };
    },
  };
});

const { translateEntity } = await import('./service');
const row = (locale: string) => store.blog.find((r) => r.locale === locale);
const state = (locale: string) => store.states.find((s) => s.locale === locale)!;

beforeEach(() => {
  store.blog = [{ postId: 'p1', locale: 'EN', title: 'Star party', summary: 'Mail info@ovsrcsc.org', bodyHtml: '<p>Telescopes</p>' }];
  store.states = [];
  Object.assign(google, { configured: true, fail: false, calls: 0 });
});

describe('translateEntity', () => {
  it('creates gu and hi from English without touching the English row', async () => {
    const results = await translateEntity('BlogPost', 'p1');
    expect(results.map((r) => r.outcome)).toEqual(['translated', 'translated']);
    expect(row('GU')?.title).toBe('[gu] Star party');
    expect(row('HI')?.bodyHtml).toBe('[hi] <p>Telescopes</p>');
    expect(row('GU')?.summary).toBe('[gu] Mail info@ovsrcsc.org');
    expect(row('EN')).toMatchObject({ title: 'Star party', bodyHtml: '<p>Telescopes</p>' });
    expect(state('GU')).toMatchObject({ status: 'DONE', provider: 'google-v2', attempts: 1, lastError: null });
  });

  it('skips unchanged English, and marks stale then retranslates when English changes', async () => {
    await translateEntity('BlogPost', 'p1');
    google.calls = 0;
    expect((await translateEntity('BlogPost', 'p1')).map((r) => r.outcome)).toEqual(['unchanged', 'unchanged']);
    expect(google.calls).toBe(0);
    row('EN')!.title = 'Star party 2026';
    await translateEntity('BlogPost', 'p1');
    expect(row('GU')?.title).toBe('[gu] Star party 2026');
    expect(state('GU').sourceHash).toBe(state('GU').latestHash);
  });

  it('keeps the last good translation and records a safe error when the provider fails', async () => {
    await translateEntity('BlogPost', 'p1');
    row('EN')!.title = 'Changed';
    google.fail = true;
    const results = await translateEntity('BlogPost', 'p1');
    expect(results[0]).toMatchObject({ outcome: 'failed', message: 'Google translation is unavailable (HTTP 503).' });
    expect(row('GU')?.title).toBe('[gu] Star party');
    expect(state('GU')).toMatchObject({ status: 'FAILED', attempts: 2 });
    expect(state('GU').sourceHash).not.toBe(state('GU').latestHash);
  });

  it('backs up a hand-written translation before replacing it', async () => {
    store.blog.push({ postId: 'p1', locale: 'GU', title: 'હાથે લખેલું', summary: null, bodyHtml: '' });
    await translateEntity('BlogPost', 'p1');
    expect((state('GU').legacyBackup as Row).title).toBe('હાથે લખેલું');
    expect(row('GU')?.title).toBe('[gu] Star party');
  });

  it('without credentials: nothing is written, the reason is recorded', async () => {
    google.configured = false;
    const results = await translateEntity('BlogPost', 'p1');
    expect(results[0].outcome).toBe('not-configured');
    expect(row('GU')).toBeUndefined();
    expect(state('GU')).toMatchObject({ status: 'PENDING', lastError: expect.stringContaining('not configured') });
    expect(google.calls).toBe(0);
  });

  it('regenerate (force) runs even when English is unchanged', async () => {
    await translateEntity('BlogPost', 'p1');
    google.calls = 0;
    await translateEntity('BlogPost', 'p1', { force: true });
    expect(google.calls).toBe(2);
  });
});
