'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  Check,
  Images,
  Loader2,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mediaUrl, isImageKey } from '@/lib/media';
import type { AdminActionState } from '@/lib/admin-payload';
import { RichTextEditor } from './rich-text-editor';
import { saveAlbumAction, archiveAlbumAction } from '@/server/actions/admin-gallery';

const initialState: AdminActionState = { status: 'idle' };

export interface AlbumShell {
  id: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'IN_REVIEW' | 'ARCHIVED';
  sectionId: string;
  eventDate: string;
  coverKey: string;
  sortOrder: number;
  expectedUpdatedAt: string;
  searchIndex: string;
  translations: Partial<Record<'en' | 'gu' | 'hi', { title: string; description: string }>>;
  items: Array<{ mediaId: string; caption: string; altText: string; storageKey: string }>;
}

export interface AlbumManagerProps {
  albums: AlbumShell[];
  sections: Array<{ value: string; label: string }>;
  media: Array<{ id: string; storageKey: string; title: string }>;
}

type TabLocale = 'en' | 'gu' | 'hi';

function statusClass(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'border-emerald-600/25 bg-emerald-500/10 text-emerald-800';
    case 'IN_REVIEW':
      return 'border-amber-600/25 bg-amber-500/10 text-amber-800';
    case 'DRAFT':
      return 'border-line bg-saffron-light text-saffron-dark';
    default:
      return 'border-line bg-warm-ivory text-ink-muted';
  }
}

function dateInput(value: string): string {
  return value ? value.slice(0, 16) : '';
}

export default function AlbumManager({ albums, sections, media }: AlbumManagerProps) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<TabLocale>('en');

  const [saveState, saveAction, savePending] = useActionState(saveAlbumAction, initialState);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveAlbumAction, initialState);

  useEffect(() => {
    if (saveState.status === 'success' || archiveState.status === 'success') {
      const timer = window.setTimeout(() => window.location.reload(), 500);
      return () => window.clearTimeout(timer);
    }
  }, [saveState.status, archiveState.status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter((album) => album.searchIndex.toLowerCase().includes(q) || album.slug.toLowerCase().includes(q));
  }, [albums, query]);

  const editing = editingId && editingId !== '__new__' ? albums.find((album) => album.id === editingId) ?? null : null;
  const isNew = editingId === '__new__';
  const isEditing = isNew || editing !== null;

  const [values, setValues] = useState(() =>
    editing
      ? {
          slug: editing.slug,
          sectionId: editing.sectionId,
          eventDate: dateInput(editing.eventDate),
          coverKey: editing.coverKey,
          publish: editing.status === 'PUBLISHED',
          wasPublished: editing.status === 'PUBLISHED',
        }
      : { slug: '', sectionId: '', eventDate: '', coverKey: '', publish: false, wasPublished: false },
  );
  const [translations, setTranslations] = useState<Record<TabLocale, { title: string; description: string }>>(
    () => ({
      en: editing?.translations.en ?? { title: '', description: '' },
      gu: editing?.translations.gu ?? { title: '', description: '' },
      hi: editing?.translations.hi ?? { title: '', description: '' },
    }),
  );
  const [selected, setSelected] = useState<Array<{ mediaId: string; caption: string; alt: string }>>(
    () => editing?.items.map((item) => ({ mediaId: item.mediaId, caption: item.caption, alt: item.altText })) ?? [],
  );
  const [pickerQuery, setPickerQuery] = useState('');
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setValues({
      slug: editing.slug,
      sectionId: editing.sectionId,
      eventDate: dateInput(editing.eventDate),
      coverKey: editing.coverKey,
      publish: editing.status === 'PUBLISHED',
      wasPublished: editing.status === 'PUBLISHED',
    });
    setTranslations({
      en: editing.translations.en ?? { title: '', description: '' },
      gu: editing.translations.gu ?? { title: '', description: '' },
      hi: editing.translations.hi ?? { title: '', description: '' },
    });
    setSelected(editing.items.map((item) => ({ mediaId: item.mediaId, caption: item.caption, alt: item.altText })));
    setActiveLocale('en');
  }, [editing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isNew) {
      setValues({ slug: '', sectionId: '', eventDate: '', coverKey: '', publish: false, wasPublished: false });
      setTranslations({ en: { title: '', description: '' }, gu: { title: '', description: '' }, hi: { title: '', description: '' } });
      setSelected([]);
      setActiveLocale('en');
    }
  }, [isNew]);

  const mediaMatches = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return media.filter((item) => !q || item.title.toLowerCase().includes(q) || item.storageKey.toLowerCase().includes(q));
  }, [media, pickerQuery]);

  const set = (name: string, value: unknown) => setValues((previous) => ({ ...previous, [name]: value }));
  const setLang = (name: 'title' | 'description', value: string) =>
    setTranslations((previous) => ({ ...previous, [activeLocale]: { ...previous[activeLocale], [name]: value } }));

  const toggleMedia = (mediaId: string) => {
    setSelected((previous) =>
      previous.find((item) => item.mediaId === mediaId)
        ? previous.filter((item) => item.mediaId !== mediaId)
        : [...previous, { mediaId, caption: '', alt: '' }],
    );
  };

  const selectedMap = useMemo(
    () => new Map(selected.map((entry) => [entry.mediaId, entry])),
    [selected],
  );

  const moveUp = (mediaId: string) => {
    setSelected((previous) => {
      const index = previous.findIndex((item) => item.mediaId === mediaId);
      if (index <= 0) return previous;
      const next = [...previous];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {isEditing ? (
        <section className="admin-card" aria-label={editing ? 'Edit album' : 'New album'}>
          <form
            action={saveAction}
            onSubmit={(event) => {
              const form = event.currentTarget;
              const input = form.querySelector<HTMLInputElement>('input[name="payload"]');
              if (input) {
                input.value = JSON.stringify({
                  ...values,
                  itemIds: selected.map((entry) => entry.mediaId),
                  captions: selected.map((entry) => ({ mediaId: entry.mediaId, caption: entry.caption, altText: entry.alt })),
                  translations: (['en', 'gu', 'hi'] as const).map((key) => ({
                    locale: key,
                    title: translations[key].title,
                    description: translations[key].description,
                  })),
                });
              }
            }}
          >
            <input type="hidden" name="payload" />
            <input type="hidden" name="id" value={editing?.id ?? ''} />
            {editing?.expectedUpdatedAt ? <input type="hidden" name="expectedUpdatedAt" value={editing.expectedUpdatedAt} /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <h2 className="font-display text-lg font-semibold">
                {editing ? `Edit album · ${editing.searchIndex}` : 'New photo album'}
              </h2>
              <button type="button" onClick={() => setEditingId(null)} className="admin-btn admin-btn-ghost !py-1.5 !text-xs">
                <X className="size-3.5" aria-hidden="true" />
                Cancel
              </button>
            </div>

            {saveState.status === 'error' && saveState.message ? (
              <p role="alert" className="mx-6 mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
                {saveState.message}
              </p>
            ) : null}

            <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
              <div>
                <label className="admin-label">Programme section *</label>
                <select required value={values.sectionId} onChange={(event) => set('sectionId', event.target.value)} className="admin-input">
                  <option value="">Choose…</option>
                  {sections.map((section) => (
                    <option key={section.value} value={section.value}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Web address</label>
                <input
                  type="text"
                  placeholder="Auto-built from the English title"
                  value={values.slug}
                  onChange={(event) => set('slug', event.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Event / capture date</label>
                <input
                  type="datetime-local"
                  value={values.eventDate}
                  onChange={(event) => set('eventDate', event.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Album cover</label>
                <div className="flex items-stretch gap-2">
                  <input
                    type="text"
                    value={values.coverKey}
                    onChange={(event) => set('coverKey', event.target.value)}
                    placeholder="/media/…"
                    className="admin-input"
                  />
                  <button type="button" onClick={() => setCoverPickerOpen((open) => !open)} className="admin-btn admin-btn-outline whitespace-nowrap">
                    <Images className="size-3.5" aria-hidden="true" />
                    Pick
                  </button>
                </div>
              </div>
              {coverPickerOpen ? (
                <div className="sm:col-span-2 rounded-2xl border border-line bg-warm-ivory/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Pick the cover image</p>
                    <button type="button" onClick={() => setCoverPickerOpen(false)} className="admin-btn admin-btn-ghost !py-1 !text-xs">
                      Close
                    </button>
                  </div>
                  <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-6">
                    {media
                      .filter((item) => isImageKey(item.storageKey))
                      .slice(0, 60)
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            set('coverKey', item.storageKey);
                            setCoverPickerOpen(false);
                          }}
                          className={cn(
                            'overflow-hidden rounded-lg border-2 transition-colors',
                            values.coverKey === item.storageKey ? 'border-brass' : 'border-transparent hover:border-stone',
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={mediaUrl(item.storageKey)} alt={item.title} className="aspect-video size-full object-cover" loading="lazy" />
                        </button>
                      ))}
                  </div>
                </div>
              ) : null}
              <label className="flex items-center gap-2.5 text-sm text-ink-soft">
                <input type="checkbox" checked={values.publish} onChange={(event) => set('publish', event.target.checked)} className="size-4 rounded" />
                Published on the public gallery
              </label>
            </div>

            <div className="border-t border-line px-6 py-5">
              <p className="admin-label mb-3">Translations</p>
              <div className="mb-4 inline-flex rounded-full border border-line bg-warm-ivory p-0.5">
                {(['en', 'gu', 'hi'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveLocale(key)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-bold transition-colors',
                      activeLocale === key ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink',
                    )}
                  >
                    {key === 'en' ? 'English' : key === 'gu' ? 'ગુજરાતી' : 'हिन्दी'}
                  </button>
                ))}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="admin-label">Title</label>
                  <input
                    type="text"
                    value={translations[activeLocale].title}
                    onChange={(event) => setLang('title', event.target.value)}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="admin-label">Intro text</label>
                  <RichTextEditor
                    key={`desc-${activeLocale}`}
                    value={translations[activeLocale].description}
                    onChange={(html) => setLang('description', html)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-line px-6 py-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="admin-label mb-0">Album images · {selected.length} selected (order = click order)</p>
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="search"
                    value={pickerQuery}
                    onChange={(event) => setPickerQuery(event.target.value)}
                    placeholder="Search media…"
                    className="admin-input !w-52 !py-1.5 !pl-9"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {mediaMatches.map((item) => {
                  const chosen = selectedMap.get(item.id);
                  const position = chosen ? selected.findIndex((entry) => entry.mediaId === item.id) : -1;
                  return (
                    <div key={item.id} className={cn('overflow-hidden rounded-xl border bg-paper', chosen ? 'border-brass ring-1 ring-brass/40' : 'border-line')}>
                      <div className="relative aspect-[4/3] w-full bg-warm-ivory">
                        {isImageKey(item.storageKey) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl(item.storageKey)} alt={item.title} className="size-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex size-full flex-col items-center justify-center text-ink-muted">
                            <CalendarDays className="size-6" aria-hidden="true" />
                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">Document</span>
                          </div>
                        )}
                        {chosen ? (
                          <span className="absolute left-2 top-2 rounded-full bg-brass px-2 py-0.5 text-[10px] font-bold text-paper">
                            {position + 1}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => toggleMedia(item.id)}
                          aria-label={chosen ? `Remove ${item.title} from album` : `Add ${item.title} to album`}
                          className={cn(
                            'absolute right-2 top-2 rounded-full border p-1.5 backdrop-blur',
                            chosen ? 'border-brass bg-brass text-paper' : 'border-line bg-paper/80 text-ink',
                          )}
                        >
                          {chosen ? <Check className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
                        </button>
                      </div>
                      <div className="space-y-1.5 p-2">
                        <p className="truncate text-[10px] text-ink-muted" title={item.title}>
                          {item.title}
                        </p>
                        {chosen ? (
                          <>
                            <input
                              type="text"
                              value={chosen.caption}
                              onChange={(event) => {
                                const next = event.target.value;
                                setSelected((previous) =>
                                  previous.map((entry) => (entry.mediaId === item.id ? { ...entry, caption: next } : entry)),
                                );
                              }}
                              placeholder="Caption"
                              className="admin-input !py-1 !text-[11px]"
                            />
                            <input
                              type="text"
                              value={chosen.alt}
                              onChange={(event) => {
                                const next = event.target.value;
                                setSelected((previous) =>
                                  previous.map((entry) => (entry.mediaId === item.id ? { ...entry, alt: next } : entry)),
                                );
                              }}
                              placeholder="Alt text"
                              className="admin-input !py-1 !text-[11px]"
                            />
                            {selected.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => moveUp(item.id)}
                                disabled={position === 0}
                                className="admin-btn admin-btn-ghost !py-1 !text-[10px] disabled:opacity-30"
                              >
                                ↑ Move up
                              </button>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 border-t border-line px-6 py-4">
              <button type="submit" disabled={savePending} className="admin-btn admin-btn-primary">
                {savePending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                {editing ? 'Save album' : 'Create album'}
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="admin-btn admin-btn-ghost">
                Cancel
              </button>
              {editing && editing.status !== 'ARCHIVED' ? (
                <form
                  action={archiveAction}
                  onSubmit={(event) => {
                    if (!window.confirm(`Archive “${editing.searchIndex}”? Visitors will no longer see it.`)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={editing.id} />
                  <input type="hidden" name="slug" value={editing.slug} />
                  <button type="submit" disabled={archivePending} className="admin-btn admin-btn-danger ml-auto">
                    <Archive className="size-4" aria-hidden="true" />
                    Archive
                  </button>
                </form>
              ) : null}
            </div>
          </form>
        </section>
      ) : (
        <section className="admin-card" aria-label="Photo albums">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div className="flex flex-1 items-center gap-3">
              <h2 className="font-display text-lg font-semibold">Photo albums</h2>
              <span className="rounded-full bg-warm-ivory px-2.5 py-0.5 text-[11px] font-bold text-ink-muted">
                {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search albums…"
                  className="admin-input !w-52 !py-1.5 !pl-9 max-sm:!w-full"
                />
              </label>
              <button type="button" onClick={() => setEditingId('__new__')} className="admin-btn admin-btn-primary whitespace-nowrap">
                <Plus className="size-4" aria-hidden="true" />
                New album
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Images className="mx-auto size-8 text-stone" aria-hidden="true" />
              <p className="mt-3 text-sm text-ink-muted">No albums yet. Curate the first exhibition gallery.</p>
              <button type="button" onClick={() => setEditingId('__new__')} className="admin-btn admin-btn-outline mt-4">
                <Plus className="size-3.5" aria-hidden="true" />
                New album
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((album) => (
                <li key={album.id} className="flex flex-wrap items-center gap-4 px-4 py-3.5 hover:bg-warm-ivory/40">
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-line bg-warm-ivory">
                    {album.coverKey && isImageKey(album.coverKey) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(album.coverKey)} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-stone">
                        <Images className="size-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{album.searchIndex}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                      <span className="inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <span className={cn(statusClass(album.status), 'rounded-full px-2 py-0.5')}>{album.status}</span>
                      </span>
                      <span>/{album.slug}</span>
                      <span>{album.items.length} images</span>
                      {album.eventDate ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3" aria-hidden="true" />
                          {album.eventDate.slice(0, 10)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button type="button" onClick={() => setEditingId(album.id)} className="admin-btn admin-btn-ghost !py-1.5 !text-xs">
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
