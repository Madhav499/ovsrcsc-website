'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { mediaUrl } from '@/lib/media';
import { isSafeLinkHref } from '@/lib/utils';
import { OrbitMotif } from '@/components/meridian/visualizations/orbit-motif';

export interface SiteAnnouncement {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  imageKey: string | null;
}

interface AnnouncementDialogProps {
  announcement: SiteAnnouncement;
  labels: { close: string; label: string; link: string; newTab: string };
}

/**
 * CMS announcement popup (managed in the admin). Shown once per browser
 * session per announcement; dismissal is remembered in sessionStorage.
 */
export function AnnouncementDialog({ announcement, labels }: AnnouncementDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const storageKey = `ovsrcsc-announcement-dismissed:${announcement.id}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(storageKey) === '1';
    } catch {
      dismissed = false;
    }
    if (dismissed || dialog.open) return;
    const timer = window.setTimeout(() => {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute('open', '');
      }
      closeRef.current?.focus();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const remember = () => {
    try {
      window.sessionStorage.setItem(storageKey, '1');
    } catch {
      // Storage may be unavailable (private mode); the dialog simply reappears next visit.
    }
  };

  const close = () => {
    remember();
    dialogRef.current?.close();
  };

  const link = announcement.linkUrl && isSafeLinkHref(announcement.linkUrl) ? announcement.linkUrl : null;
  const external = Boolean(link?.startsWith('http'));

  return (
    <dialog
      ref={dialogRef}
      onClose={remember}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="mx-announcement-title"
      aria-describedby="mx-announcement-message"
      className="mx-dialog mx-surface-white m-auto max-h-[92dvh] w-[min(94vw,40rem)] max-w-none overflow-y-auto rounded-(--mx-radius-lg) p-0 shadow-[0_40px_120px_-30px_rgb(16_28_44/0.7)]"
    >
      <div className="relative">
        {announcement.imageKey ? (
          <div className="relative aspect-[16/9] w-full bg-(--mx-navy)">
            <Image
              src={mediaUrl(announcement.imageKey)}
              alt=""
              fill
              sizes="(max-width: 640px) 94vw, 40rem"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="mx-surface-dark relative h-36 overflow-hidden">
            <div aria-hidden="true" className="mx-atmosphere absolute inset-0" />
            <OrbitMotif className="absolute -right-10 -top-20 w-72 text-(--mx-ivory) opacity-80" />
          </div>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-(--mx-ivory) text-(--mx-midnight) shadow-md transition-transform duration-300 hover:rotate-90"
          aria-label={labels.close}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-6 sm:p-9">
        <p className="mx-eyebrow">{labels.label}</p>
        <h2 id="mx-announcement-title" className="mx-h3 mt-3">
          {announcement.title}
        </h2>
        <p id="mx-announcement-message" className="mt-4 whitespace-pre-line text-(--mx-fg-2)">
          {announcement.message}
        </p>
        {link ? (
          <a
            href={link}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="mx-btn mx-btn-ink mt-7"
          >
            {announcement.linkLabel || labels.link}
            {external ? (
              <>
                <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                <span className="sr-only">({labels.newTab})</span>
              </>
            ) : (
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            )}
          </a>
        ) : null}
      </div>
    </dialog>
  );
}
