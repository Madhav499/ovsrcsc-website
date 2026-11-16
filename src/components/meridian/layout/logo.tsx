import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/meridian/ovsrcsc-logo.png';
import { cn } from '@/lib/utils';

interface LogoProps {
  href: string;
  name: string;
  familiarName: string;
  alt: string;
  homeLabel: string;
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * Official OVSRCSC Rajkot logo (original artwork, outer background removed)
 * paired with the institution's short name and its familiar Gujarati name.
 */
export function Logo({ href, name, familiarName, alt, homeLabel, size = 'sm', className }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={homeLabel}
      className={cn('group flex min-w-0 items-center gap-3', className)}
    >
      <Image
        src={logo}
        alt={alt}
        priority={size === 'sm'}
        sizes={size === 'sm' ? '40px' : '64px'}
        className={cn(
          'w-auto shrink-0 drop-shadow-[0_2px_6px_rgb(16_28_44/0.25)] transition-transform duration-500 group-hover:-rotate-2',
          size === 'sm' ? 'h-11 lg:h-12' : 'h-20',
        )}
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            'truncate font-semibold tracking-[-0.01em]',
            size === 'sm' ? 'text-[0.85rem] min-[380px]:text-[0.95rem] lg:text-base' : 'text-lg',
          )}
          style={{ fontFamily: 'var(--mx-font-display)' }}
        >
          {name}
        </span>
        <span className="truncate text-[0.72rem] font-medium text-(--mx-fg-3) min-[380px]:text-[0.78rem]">{familiarName}</span>
      </span>
    </Link>
  );
}
