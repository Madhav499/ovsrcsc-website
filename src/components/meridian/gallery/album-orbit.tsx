import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CmsImage } from '@/components/meridian/media/cms-image';

export interface OrbitAlbum {
  id: string;
  slug: string;
  title: string;
  coverKey: string | null;
}

const RING_RADII = [47, 34];

/**
 * Orbital album instrument (carried over from the previous gallery and
 * restyled). Albums travel on counter-rotating rings around the center.
 * It is a visual flourish: keyboard and screen-reader users navigate with
 * the album index below, so the orbit's links are removed from tab order.
 */
export function AlbumOrbit({
  albums,
  locale,
  centre,
  note,
}: {
  albums: OrbitAlbum[];
  locale: string;
  centre: string;
  note: string;
}) {
  const shown = albums.slice(0, 12);
  const split = shown.length > 5 ? Math.ceil(shown.length * 0.6) : shown.length;
  const rings = [shown.slice(0, split), shown.slice(split)].filter((ring) => ring.length);

  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[34rem]">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgb(82_213_232/0.14),transparent_62%)]" />
      <div className="absolute inset-[3%] rounded-full border border-dashed border-(--mx-line-strong)" />
      {rings.map((ring, ringIndex) => {
        const radius = RING_RADII[ringIndex] ?? 30;
        const duration = 110 + ringIndex * 40;
        const reverse = ringIndex % 2 === 1;
        return (
          <div
            key={ringIndex}
            className="mx-orbit-spin absolute left-1/2 top-1/2 rounded-full border border-(--mx-line-strong)"
            style={{
              width: `${radius * 2}%`,
              height: `${radius * 2}%`,
              marginLeft: `-${radius}%`,
              marginTop: `-${radius}%`,
              animationDuration: `${duration}s`,
              animationDirection: reverse ? 'reverse' : 'normal',
            }}
          >
            {ring.map((album, index) => {
              const angle = ((index + (ringIndex ? 0.5 : 0)) / ring.length) * Math.PI * 2;
              return (
                <div
                  key={album.id}
                  className="absolute"
                  style={{
                    left: `${50 + Math.cos(angle) * 50}%`,
                    top: `${50 + Math.sin(angle) * 50}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="mx-orbit-spin"
                    style={{ animationDuration: `${duration}s`, animationDirection: reverse ? 'normal' : 'reverse' }}
                  >
                    <Link
                      href={`/${locale}/gallery/${album.slug}`}
                      tabIndex={-1}
                      className={cn(
                        'relative block overflow-hidden rounded-full border-2 border-(--mx-midnight) bg-(--mx-navy) shadow-[0_0_0_1px_rgb(246_243_236/0.25)] transition-transform duration-500 hover:scale-110',
                        ringIndex === 0 ? 'size-12 sm:size-16' : 'size-10 sm:size-12',
                      )}
                      title={album.title}
                    >
                      {album.coverKey ? <CmsImage storageKey={album.coverKey} alt="" sizes="64px" /> : null}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      <div className="absolute left-1/2 top-1/2 grid size-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-(--mx-line-strong) bg-(--mx-midnight)/85 p-4 text-center backdrop-blur-sm">
        <div>
          <span className="mx-auto block h-px w-8 bg-(--mx-amber)" />
          <p className="mt-3 text-[0.95rem] font-semibold leading-snug" style={{ fontFamily: 'var(--mx-font-display)' }}>
            {centre}
          </p>
          <p className="mx-mono-label mt-1.5">{note}</p>
        </div>
      </div>
    </div>
  );
}
