/**
 * Copy existing media files from local storage (MEDIA_ROOT) to Vercel Blob,
 * keeping every storage key unchanged so database records and /media URLs
 * continue to work.
 *
 *   npx tsx scripts/migrate-media-to-blob.ts            # dry run (default)
 *   npx tsx scripts/migrate-media-to-blob.ts --apply    # upload
 *
 * Requires DATABASE_URL and BLOB_READ_WRITE_TOKEN. Never deletes or
 * overwrites: files already in Blob are skipped, local files are left as they
 * are, and database records are not modified.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { get, put } from '@vercel/blob';

const apply = process.argv.includes('--apply');
const root = path.resolve(process.env.MEDIA_ROOT ?? './storage/media');

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set. Create a Blob store in Vercel and pull its environment variables first.');
  }
  const db = new PrismaClient();
  const assets = await db.mediaAsset.findMany({ select: { storageKey: true, mimeType: true }, orderBy: { createdAt: 'asc' } });
  let uploaded = 0;
  let present = 0;
  let missing = 0;
  for (const asset of assets) {
    const file = path.resolve(root, asset.storageKey);
    if (!file.startsWith(root + path.sep)) {
      console.warn(`skip (unsafe key): ${asset.storageKey}`);
      continue;
    }
    const existing = await get(asset.storageKey, { access: 'private' }).catch(() => null);
    if (existing) {
      present += 1;
      continue;
    }
    let data: Buffer;
    try {
      data = await fs.readFile(file);
    } catch {
      missing += 1;
      console.warn(`missing locally: ${asset.storageKey}`);
      continue;
    }
    if (apply) {
      await put(asset.storageKey, data, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: asset.mimeType });
    }
    uploaded += 1;
    console.log(`${apply ? 'uploaded' : 'would upload'}: ${asset.storageKey} (${data.length} bytes)`);
  }
  console.log(`\n${assets.length} records · ${uploaded} ${apply ? 'uploaded' : 'to upload'} · ${present} already in Blob · ${missing} missing locally`);
  if (!apply) console.log('Dry run only. Re-run with --apply to upload.');
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
