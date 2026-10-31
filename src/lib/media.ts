export function mediaUrl(key: string | null | undefined): string {
  if (!key) return '';
  const base = (process.env.MEDIA_PUBLIC_BASE_URL ?? '/media').replace(/\/$/, '');
  const encoded = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${base}/${encoded}`;
}

export function isImageKey(key: string | null | undefined): boolean {
  if (!key) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(key);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
