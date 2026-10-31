'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { mediaUrl } from '@/lib/media';

export interface SiteAnnouncement {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  imageKey: string | null;
}

interface AnnouncementModalProps {
  announcement: SiteAnnouncement;
  labels: {
    close: string;
    label: string;
    link: string;
  };
}

export function AnnouncementModal({ announcement, labels }: AnnouncementModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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
    try {
      dialog.showModal();
    } catch {
      dialog.setAttribute('open', '');
    }
  }, [storageKey]);

  const rememberDismissal = () => {
    try {
      window.sessionStorage.setItem(storageKey, '1');
    } catch {
      return;
    }
  };

  const close = () => {
    rememberDismissal();
    dialogRef.current?.close();
  };

  const external = announcement.linkUrl?.startsWith('http');

  return (
    <dialog
      ref={dialogRef}
      onClose={rememberDismissal}
      aria-labelledby="announcement-title"
      className="m-auto w-[min(94vw,36rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-line bg-paper p-0 text-ink shadow-soft backdrop:bg-ink/75 backdrop:backdrop-blur-sm"
    >
      <div className="relative">
        {announcement.imageKey ? (
          <div className="relative aspect-[16/9] w-full bg-sky">
            <Image
              src={mediaUrl(announcement.imageKey)}
              alt={announcement.title}
              fill
              sizes="(max-width: 640px) 94vw, 36rem"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="relative overflow-hidden bg-ink px-6 pb-8 pt-7 text-paper">
            <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full border border-paper/15" />
            <div className="pointer-events-none absolute -right-6 -top-10 size-40 rounded-full border border-paper/15" />
            <div className="pointer-events-none absolute right-7 top-7 size-2.5 rounded-full bg-brass" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brass">
              {labels.label}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-paper/90 text-ink shadow-sm transition-colors hover:bg-paper"
          aria-label={labels.close}
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="p-6 sm:p-8">
          <h2 id="announcement-title" className="font-display text-2xl font-semibold leading-tight">
            {announcement.title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {announcement.message}
          </p>
          {announcement.linkUrl ? (
            <a
              href={announcement.linkUrl}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="btn btn-primary mt-6 w-full sm:w-auto"
            >
              {announcement.linkLabel || labels.link}
              {external ? <ArrowUpRight className="size-4" aria-hidden="true" /> : null}
            </a>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
