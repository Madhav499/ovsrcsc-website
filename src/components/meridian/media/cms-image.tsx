import Image from 'next/image';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

interface CmsImageProps {
  storageKey: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * CMS media image served through the existing `/media/[...key]` route.
 * Always fills its positioned parent, so callers control the aspect ratio
 * (prevents layout shift regardless of the stored dimensions).
 */
export function CmsImage({ storageKey, alt, sizes, className, priority = false }: CmsImageProps) {
  return (
    <Image
      src={mediaUrl(storageKey)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  );
}
