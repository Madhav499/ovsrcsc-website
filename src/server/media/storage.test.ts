import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const blob = vi.hoisted(() => ({
  put: vi.fn(async () => ({})),
  get: vi.fn(async () => ({ statusCode: 200, stream: new Response(Buffer.from('stored-bytes')).body })),
  del: vi.fn(async () => undefined),
}));
vi.mock('@vercel/blob', () => blob);

const ENV_KEYS = ['MEDIA_STORAGE', 'BLOB_READ_WRITE_TOKEN', 'VERCEL', 'MEDIA_ALLOW_EPHEMERAL', 'MEDIA_ROOT'] as const;
const saved: Record<string, string | undefined> = {};

async function png(): Promise<File> {
  const buffer = await sharp({ create: { width: 32, height: 20, channels: 3, background: '#263746' } }).png().toBuffer();
  return new File([new Uint8Array(buffer)], 'frame.png', { type: 'image/png' });
}

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  vi.clearAllMocks();
});
afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('storage driver selection', () => {
  it('defaults to local, uses blob when a token exists, honours MEDIA_STORAGE', async () => {
    const { storageDriver } = await import('./storage');
    expect(storageDriver()).toBe('local');
    process.env.BLOB_READ_WRITE_TOKEN = 'token';
    expect(storageDriver()).toBe('blob');
    process.env.MEDIA_STORAGE = 'local';
    expect(storageDriver()).toBe('local');
  });
});

describe('local driver', () => {
  it('writes, reads and removes a converted image under MEDIA_ROOT', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'ovsrcsc-media-'));
    process.env.MEDIA_ROOT = root;
    try {
      const { storeImage, readStoredFile, removeStoredFile, fileExists } = await import('./storage');
      const stored = await storeImage(await png());
      expect(stored.key).toMatch(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/);
      expect(stored.mimeType).toBe('image/webp');
      expect((await readStoredFile(stored.key)).length).toBe(stored.sizeBytes);
      await removeStoredFile(stored.key);
      expect(await fileExists(stored.key)).toBe(false);
      expect(blob.put).not.toHaveBeenCalled();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses uploads on Vercel without persistent storage instead of losing them', async () => {
    process.env.VERCEL = '1';
    const { storeImage } = await import('./storage');
    await expect(storeImage(await png())).rejects.toThrow(/persistent media storage/);
  });
});

describe('blob driver', () => {
  it('stores privately under the same key scheme and reads/deletes by key', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'token';
    process.env.VERCEL = '1';
    const { storeImage, readStoredFile, removeStoredFile } = await import('./storage');
    const stored = await storeImage(await png());
    expect(blob.put).toHaveBeenCalledWith(stored.key, expect.any(Buffer), expect.objectContaining({ access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'image/webp' }));
    expect((await readStoredFile(stored.key)).toString()).toBe('stored-bytes');
    expect(blob.get).toHaveBeenCalledWith(stored.key, { access: 'private' });
    await removeStoredFile(stored.key);
    expect(blob.del).toHaveBeenCalledWith(stored.key);
  });

  it('rejects path-traversal keys before touching storage', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'token';
    const { readStoredFile, removeStoredFile } = await import('./storage');
    await expect(readStoredFile('../etc/passwd')).rejects.toThrow(/Invalid media reference/);
    await expect(removeStoredFile('/abs/key')).rejects.toThrow(/Invalid media reference/);
    expect(blob.get).not.toHaveBeenCalled();
    expect(blob.del).not.toHaveBeenCalled();
  });
});
