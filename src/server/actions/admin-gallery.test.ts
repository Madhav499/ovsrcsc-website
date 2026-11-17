import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError, ForbiddenError } from '@/lib/errors';

// Server-only modules are replaced so the action's own guards are what is tested.
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const auth = vi.hoisted(() => ({ actor: null as null | { id: string; roles: string[]; sections: [] }, sameOrigin: true }));
vi.mock('@/server/auth/csrf', () => ({
  assertSameOrigin: vi.fn(async () => {
    if (!auth.sameOrigin) throw new ForbiddenError('This request could not be verified.');
  }),
}));
vi.mock('@/server/auth/actor', async () => {
  const { hasPermission } = await import('@/lib/permissions');
  return {
    requireActor: vi.fn(async () => {
      if (!auth.actor) throw new AuthenticationError();
      return auth.actor;
    }),
    assertPermission: (actor: Parameters<typeof hasPermission>[0], permission: Parameters<typeof hasPermission>[1]) => {
      if (!hasPermission(actor, permission)) throw new ForbiddenError('You do not have permission to perform this action.');
    },
  };
});
const media = vi.hoisted(() => ({ uploadMedia: vi.fn(async (_actor: unknown, input: { file: File }) => ({ id: `m-${input.file.name}`, storageKey: `2026/11/${input.file.name}.webp`, title: input.file.name })) }));
vi.mock('@/server/services/media', () => media);
vi.mock('@/server/services/gallery', () => ({}));
vi.mock('@/server/services/audit', () => ({ writeAuditLog: vi.fn() }));

const { uploadAlbumPhotosAction } = await import('./admin-gallery');

function form(...files: File[]) {
  const data = new FormData();
  for (const file of files) data.append('files', file);
  return data;
}
const jpg = (name: string) => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], name, { type: 'image/jpeg' });
const user = (roles: string[]) => ({ id: 'u1', roles, sections: [] as [] });

beforeEach(() => {
  auth.actor = null;
  auth.sameOrigin = true;
  media.uploadMedia.mockClear();
});

describe('uploadAlbumPhotosAction permissions (server-enforced)', () => {
  it('rejects an anonymous visitor calling the action directly', async () => {
    const result = await uploadAlbumPhotosAction(form(jpg('a.jpg')));
    expect(result.status).toBe('error');
    expect(media.uploadMedia).not.toHaveBeenCalled();
  });

  it('rejects a cross-site request even from a signed-in editor', async () => {
    auth.actor = user(['SUPER_ADMIN']);
    auth.sameOrigin = false;
    const result = await uploadAlbumPhotosAction(form(jpg('a.jpg')));
    expect(result).toMatchObject({ status: 'error', message: 'This request could not be verified.' });
    expect(media.uploadMedia).not.toHaveBeenCalled();
  });

  it('rejects a role without gallery management (Events Manager)', async () => {
    auth.actor = user(['EVENTS_MANAGER']);
    const result = await uploadAlbumPhotosAction(form(jpg('a.jpg')));
    expect(result.status).toBe('error');
    expect(media.uploadMedia).not.toHaveBeenCalled();
  });

  it('lets a Content Contributor upload several photographs', async () => {
    auth.actor = user(['CONTENT_CONTRIBUTOR']);
    const result = await uploadAlbumPhotosAction(form(jpg('a.jpg'), jpg('b.jpg')));
    expect(result.status).toBe('success');
    expect(result.media.map((item) => item.id)).toEqual(['m-a.jpg', 'm-b.jpg']);
    expect(media.uploadMedia).toHaveBeenCalledTimes(2);
  });
});

describe('uploadAlbumPhotosAction validation', () => {
  beforeEach(() => {
    auth.actor = user(['SUPER_ADMIN']);
  });

  it('requires at least one file', async () => {
    expect(await uploadAlbumPhotosAction(form())).toMatchObject({ status: 'error', message: 'Choose at least one photograph.' });
  });

  it('refuses non-image files before storing anything', async () => {
    const pdf = new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' });
    const result = await uploadAlbumPhotosAction(form(jpg('a.jpg'), pdf));
    expect(result.status).toBe('error');
    expect(result.message).toContain('notes.pdf');
    expect(media.uploadMedia).not.toHaveBeenCalled();
  });

  it('caps a single upload at 20 files', async () => {
    const files = Array.from({ length: 21 }, (_, i) => jpg(`p${i}.jpg`));
    expect((await uploadAlbumPhotosAction(form(...files))).status).toBe('error');
    expect(media.uploadMedia).not.toHaveBeenCalled();
  });

  it('reports partial failures without hiding the successful uploads', async () => {
    const { ValidationError } = await import('@/lib/errors');
    media.uploadMedia.mockImplementationOnce(async () => {
      throw new ValidationError('The file is larger than the upload limit.');
    });
    const result = await uploadAlbumPhotosAction(form(jpg('big.jpg'), jpg('ok.jpg')));
    expect(result.status).toBe('success');
    expect(result.media).toHaveLength(1);
    expect(result.message).toContain('big.jpg: The file is larger than the upload limit.');
  });
});
