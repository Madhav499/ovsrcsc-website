import { promises as fs } from 'node:fs';
import path from 'node:path';

try {
  process.loadEnvFile('.env');
} catch {
  // Environment variables may already be provided by the shell.
}

interface WordPressMedia {
  id: number;
  slug: string;
  link: string;
  source_url: string;
  mime_type: string;
  media_details: { width?: number; height?: number };
  alt_text: string;
  title: { rendered: string };
  caption: { rendered: string };
}

interface MediaMapEntry {
  id: number;
  storageKey: string;
  originalName: string;
  title: string;
  altText: string;
  caption: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  sourceUrl: string;
  kind: 'IMAGE' | 'DOCUMENT';
}

const MEDIA_ROOT = path.resolve(process.env.MEDIA_ROOT ?? './storage/media');
const MAP_PATH = path.resolve('data/source/media-map.json');
const SOURCE_HOST = 'https://www.sciencecenterrajkot.org';

function textFromHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeName(value: string, fallback: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return cleaned || fallback;
}

async function download(url: string, target: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0) throw new Error('empty response');
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, bytes, { flag: 'wx' });
      return bytes;
    } catch (error) {
      lastError = error;
      await fs.rm(target, { force: true });
      await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    }
  }
  throw lastError;
}

async function main() {
  const media = JSON.parse(
    await fs.readFile('data/source/wp-media.json', 'utf8').then((text) => text.replace(/^\uFEFF/, '')),
  ) as WordPressMedia[];

  const supported = media.filter(
    (item) =>
      item.mime_type.startsWith('image/') || item.mime_type === 'application/pdf',
  );
  const existingMap = await fs
    .readFile(MAP_PATH, 'utf8')
    .then((text) => JSON.parse(text) as MediaMapEntry[])
    .catch(() => []);
  const map = new Map(existingMap.map((entry) => [entry.id, entry]));

  let downloaded = 0;
  for (const item of supported) {
    const extension = path.extname(new URL(item.source_url).pathname).toLowerCase() || '.bin';
    const storageKey = `legacy/${item.id}-${safeName(item.slug, 'media')}${extension}`;
    const target = path.join(MEDIA_ROOT, storageKey);
    const existing = await fs.stat(target).catch(() => null);
    let sizeBytes = existing?.size ?? 0;
    if (!existing) {
      const url = item.source_url.startsWith('https://sciencecenterrajkot.org')
        ? item.source_url.replace('https://sciencecenterrajkot.org', SOURCE_HOST)
        : item.source_url;
      const bytes = await download(url, target);
      sizeBytes = bytes.length;
      downloaded += 1;
      process.stdout.write(`Downloaded ${item.id} (${Math.round(bytes.length / 1024)} KB)\n`);
    }

    const title = textFromHtml(item.title.rendered) || item.slug;
    const caption = textFromHtml(item.caption.rendered);
    map.set(item.id, {
      id: item.id,
      storageKey,
      originalName: path.basename(new URL(item.source_url).pathname),
      title,
      altText: textFromHtml(item.alt_text) || title,
      caption: caption || null,
      mimeType: item.mime_type,
      sizeBytes,
      width: item.media_details.width ?? null,
      height: item.media_details.height ?? null,
      sourceUrl: item.source_url,
      kind: item.mime_type === 'application/pdf' ? 'DOCUMENT' : 'IMAGE',
    });
  }

  const entries = [...map.values()].sort((a, b) => a.id - b.id);
  await fs.writeFile(MAP_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  console.log(
    `Media map written with ${entries.length} assets (${downloaded} downloaded, ${entries.length - downloaded} already present).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
