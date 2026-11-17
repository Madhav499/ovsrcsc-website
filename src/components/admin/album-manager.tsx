'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Trash2,
  Upload,
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
import { saveAlbumAction, archiveAlbumAction, uploadAlbumPhotosAction } from '@/server/actions/admin-gallery';

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
  // Library grows as photos are uploaded here, without a page reload.
  const [library, setLibrary] = useState(media);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);

  const keyFor = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of library) map.set(item.id, item.storageKey);
    for (const item of editing?.items ?? []) if (!map.has(item.mediaId)) map.set(item.mediaId, item.storageKey);
    return map;
  }, [library, editing]);

  /** Upload through the validated server action; returns the new media records. */
  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return [];
    const data = new FormData();
    for (const file of Array.from(files)) data.append('files', file);
    setUploading(true);
    setUploadNote(null);
    try {
      const result = await uploadAlbumPhotosAction(data);
      setUploadNote({ tone: result.status === 'success' ? 'ok' : 'error', text: result.message });
      if (result.media.length) setLibrary((previous) => [...result.media, ...previous]);
      return result.media;
    } catch {
      setUploadNote({ tone: 'error', text: 'Upload failed. Check your connection and try again.' });
      return [];
    } finally {
      setUploading(false);
    }
  };
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
    return library.filter((item) => isImageKey(item.storageKey) && (!q || item.title.toLowerCase().includes(q) || item.storageKey.toLowerCase().includes(q)));
  }, [library, pickerQuery]);

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

  const move = (mediaId: string, delta: -1 | 1) => {
    setSelected((previous) => {
      const index = previous.findIndex((item) => item.mediaId === mediaId);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateEntry = (mediaId: string, patch: Partial<{ caption: string; alt: string }>) =>
    setSelected((previous) => previous.map((entry) => (entry.mediaId === mediaId ? { ...entry, ...patch } : entry)));

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
                    {library
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
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="admin-label mb-0">In this album · {selected.length} photograph{selected.length === 1 ? '' : 's'}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Shown on the public gallery in this order. Changes go live when you save the album.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={uploadInput}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={async (event) => {
                      const added = await upload(event.target.files);
                      event.target.value = '';
                      if (added.length) {
                        setSelected((previous) => [
                          ...previous,
                          ...added.filter((item) => !previous.some((entry) => entry.mediaId === item.id)).map((item) => ({ mediaId: item.id, caption: '', alt: '' })),
                        ]);
                      }
                    }}
                  />
                  <input
                    ref={replaceInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={async (event) => {
                      const target = replaceTarget.current;
                      const [fresh] = await upload(event.target.files);
                      event.target.value = '';
                      replaceTarget.current = null;
                      if (!target || !fresh) return;
                      // Swap the file, keep this photo's place, caption and alt text.
                      setSelected((previous) =>
                        previous.some((entry) => entry.mediaId === fresh.id)
                          ? previous
                          : previous.map((entry) => (entry.mediaId === target ? { ...entry, mediaId: fresh.id } : entry)),
                      );
                    }}
                  />
                  <button type="button" disabled={uploading} onClick={() => uploadInput.current?.click()} className="admin-btn admin-btn-primary whitespace-nowrap">
                    {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                    Upload photographs
                  </button>
                </div>
              </div>

              <p className="mb-3 text-[11px] text-ink-muted">JPG, PNG, WebP or GIF · up to 20 at a time · each file within the site’s upload size limit.</p>
              {uploadNote ? (
                <p
                  role={uploadNote.tone === 'error' ? 'alert' : 'status'}
                  className={cn(
                    'mb-3 rounded-xl border px-4 py-2.5 text-sm',
                    uploadNote.tone === 'error' ? 'border-danger/25 bg-danger/5 text-danger' : 'border-emerald-600/25 bg-emerald-500/10 text-emerald-800',
                  )}
                >
                  {uploadNote.text}
                </p>
              ) : null}

              {selected.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
                  No photographs yet. Upload new ones or add them from the library below.
                </p>
              ) : (
                <ol className="divide-y divide-line rounded-xl border border-line">
                  {selected.map((entry, position) => {
                    const key = keyFor.get(entry.mediaId) ?? '';
                    return (
                      <li key={entry.mediaId} className="flex flex-wrap items-start gap-3 p-3 sm:flex-nowrap">
                        <span className="w-6 pt-1 text-right font-mono text-xs text-ink-muted">{String(position + 1).padStart(2, '0')}</span>
                        <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-warm-ivory">
                          {key ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(key)} alt="" className="size-full object-cover" loading="lazy" />
                          ) : null}
                        </div>
                        <div className="grid min-w-0 flex-1 gap-1.5">
                          <label className="sr-only" htmlFor={`caption-${entry.mediaId}`}>
                            Caption for photograph {position + 1}
                          </label>
                          <input
                            id={`caption-${entry.mediaId}`}
                            type="text"
                            value={entry.caption}
                            maxLength={400}
                            onChange={(event) => updateEntry(entry.mediaId, { caption: event.target.value })}
                            placeholder="Caption (optional)"
                            className="admin-input !py-1.5 !text-xs"
                          />
                          <label className="sr-only" htmlFor={`alt-${entry.mediaId}`}>
                            Alt text for photograph {position + 1}
                          </label>
                          <input
                            id={`alt-${entry.mediaId}`}
                            type="text"
                            value={entry.alt}
                            maxLength={300}
                            onChange={(event) => updateEntry(entry.mediaId, { alt: event.target.value })}
                            placeholder="Alt text — what the photograph shows"
                            className="admin-input !py-1.5 !text-xs"
                          />
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1">
                          <button type="button" onClick={() => move(entry.mediaId, -1)} disabled={position === 0} aria-label={`Move photograph ${position + 1} up`} className="admin-btn admin-btn-ghost !p-1.5 disabled:opacity-30">
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => move(entry.mediaId, 1)} disabled={position === selected.length - 1} aria-label={`Move photograph ${position + 1} down`} className="admin-btn admin-btn-ghost !p-1.5 disabled:opacity-30">
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => {
                              replaceTarget.current = entry.mediaId;
                              replaceInput.current?.click();
                            }}
                            className="admin-btn admin-btn-ghost !py-1 !text-[11px]"
                          >
                            <RefreshCw className="size-3.5" aria-hidden="true" />
                            Replace
                          </button>
                          {confirmRemove === entry.mediaId ? (
                            <span className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger/5 px-2 py-1 text-[11px] text-danger">
                              Remove from album?
                              <button
                                type="button"
                                onClick={() => {
                                  setSelected((previous) => previous.filter((item) => item.mediaId !== entry.mediaId));
                                  setConfirmRemove(null);
                                }}
                                className="font-bold underline"
                              >
                                Yes
                              </button>
                              <button type="button" onClick={() => setConfirmRemove(null)} className="underline">
                                No
                              </button>
                            </span>
                          ) : (
                            <button type="button" onClick={() => setConfirmRemove(entry.mediaId)} className="admin-btn admin-btn-ghost !py-1 !text-[11px] text-danger">
                              <Trash2 className="size-3.5" aria-hidden="true" />
                              Remove
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <p className="mt-2 text-[11px] text-ink-muted">
                Remove and Replace only change this album: the original file stays in the media library, so another album or page that uses it is unaffected. To delete a file permanently, archive it in Media (it is refused while anything still uses it).
              </p>
            </div>

            <div className="border-t border-line px-6 py-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="admin-label mb-0">Add from the media library</p>
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="search"
                    value={pickerQuery}
                    onChange={(event) => setPickerQuery(event.target.value)}
                    placeholder="Search media…"
                    aria-label="Search the media library"
                    className="admin-input !w-52 !py-1.5 !pl-9"
                  />
                </label>
              </div>
              <div className="grid max-h-[28rem] gap-3 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6">
                {mediaMatches.map((item) => {
                  const chosen = selectedMap.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleMedia(item.id)}
                      aria-pressed={chosen}
                      aria-label={chosen ? `Remove ${item.title} from album` : `Add ${item.title} to album`}
                      className={cn('group relative overflow-hidden rounded-xl border bg-paper text-left', chosen ? 'border-brass ring-1 ring-brass/40' : 'border-line hover:border-stone')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(item.storageKey)} alt="" className="aspect-[4/3] w-full bg-warm-ivory object-cover" loading="lazy" />
                      <span className={cn('absolute right-2 top-2 rounded-full border p-1.5', chosen ? 'border-brass bg-brass text-paper' : 'border-line bg-paper/85 text-ink')}>
                        {chosen ? <Check className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
                      </span>
                      <span className="block truncate p-2 text-[10px] text-ink-muted">{item.title}</span>
                    </button>
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
                <button type="submit" form="album-archive-form" disabled={archivePending} className="admin-btn admin-btn-danger ml-auto">
                  <Archive className="size-4" aria-hidden="true" />
                  Archive album
                </button>
              ) : null}
            </div>
          </form>
          {editing && editing.status !== 'ARCHIVED' ? (
            <form
              id="album-archive-form"
              action={archiveAction}
              hidden
              onSubmit={(event) => {
                if (!window.confirm(`Archive “${editing.searchIndex}”? Visitors will no longer see it. Its photographs stay in the media library.`)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={editing.id} />
              <input type="hidden" name="slug" value={editing.slug} />
            </form>
          ) : null}
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
