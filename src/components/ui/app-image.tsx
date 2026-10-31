import Image from 'next/image';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

interface AppImageProps {
  storageKey: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
}

export function AppImage({
  storageKey,
  alt,
  width,
  height,
  className,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  fill = false,
}: AppImageProps) {
  const src = mediaUrl(storageKey);
  if (fill || !width || !height) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  );
}
