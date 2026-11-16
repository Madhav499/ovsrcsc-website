import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { Stagger, StaggerItem } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';

export interface GalleryHighlight {
  id: string;
  storageKey: string;
  alt: string;
  caption: string | null;
  albumSlug: string;
}

/* Editorial mosaic: varied spans so the grid reads like a photo essay. */
const SPANS = [
  'col-span-2 row-span-2',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
];

export function HomeGallery({
  locale,
  dict,
  items,
}: {
  locale: LocaleCode;
  dict: Dictionary;
  items: GalleryHighlight[];
}) {
  if (!items.length) return null;
  const shown = items.slice(0, SPANS.length);
  return (
    <section aria-labelledby="home-gallery-title" className="mx-surface-ivory mx-section">
      <div className="mx-container">
        <SectionHeading
          id="home-gallery-title"
          index="07"
          eyebrow={dict['home.gallery.eyebrow']}
          title={dict['home.gallery.title']}
          align="split"
          intro={<p>{dict['home.gallery.intro']}</p>}
          action={
            <Link href={`/${locale}/gallery`} className="mx-btn mx-btn-ink">
              {dict['home.gallery.cta']}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </Link>
          }
        />
        <Stagger
          as="ul"
          className="mt-14 grid auto-rows-[9.5rem] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[12rem] md:grid-cols-4 lg:auto-rows-[14rem] lg:gap-4"
        >
          {shown.map((item, index) => (
            <StaggerItem as="li" key={item.id} className={cn('min-w-0', SPANS[index])}>
              <Link
                href={`/${locale}/gallery/${item.albumSlug}`}
                className="group mx-plate mx-zoom relative block size-full"
              >
                <CmsImage
                  storageKey={item.storageKey}
                  alt={item.alt}
                  sizes={index === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                />
                {item.caption ? (
                  <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgb(16_28_44/0.85))] p-3 pt-10 text-[0.8125rem] font-medium text-(--mx-ivory) opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {item.caption}
                  </span>
                ) : null}
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
