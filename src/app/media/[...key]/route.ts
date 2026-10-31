import { db } from '@/lib/db';
import { getActor } from '@/server/auth/actor';
import { hasPermission } from '@/lib/permissions';
import { readStoredFile } from '@/server/media/storage';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ key: string[] }>;
}

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}

export async function GET(request: Request, context: RouteContext) {
  const { key: segments } = await context.params;
  const storageKey = segments.join('/');
  const asset = await db.mediaAsset.findUnique({ where: { storageKey } });
  if (!asset) return notFound();

  const isPublic = asset.isPublic && !asset.archivedAt;
  if (!isPublic) {
    const actor = await getActor();
    if (!actor || !hasPermission(actor, 'media.view')) {
      return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    }
  }

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(storageKey);
  } catch {
    return notFound();
  }

  const download = new URL(request.url).searchParams.get('download') === '1';
  const isImage = asset.kind === 'IMAGE';
  const disposition = download || !isImage ? 'attachment' : 'inline';
  const safeName = encodeURIComponent(asset.originalName);
  const headers = new Headers({
    'Content-Type': asset.mimeType,
    'Content-Length': String(buffer.length),
    'Content-Disposition': `${disposition}; filename*=UTF-8''${safeName}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  });

  return new Response(new Uint8Array(buffer), { status: 200, headers });
}
