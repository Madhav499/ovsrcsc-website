'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import {
  Check,
  FileText,
  HardDrive,
  ImagePlus,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { mediaUrl, isImageKey, formatFileSize } from '@/lib/media';
import { uploadMediaAction, updateMediaAction, archiveMediaAction, type MediaFormState } from '@/server/actions/media';

export interface MediaLibraryItem {
  id: string;
  storageKey: string;
  title: string;
  originalName: string;
  altText: string;
  caption: string;
  isPublic: boolean;
  kind: 'IMAGE' | 'DOCUMENT';
  sizeBytes: number;
  createdAt: string;
}

const initialState: MediaFormState = { status: 'idle' };

export default function MediaLibrary({ items, canManage }: { items: MediaLibraryItem[]; canManage: boolean }) {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'ALL' | 'IMAGE' | 'DOCUMENT'>('ALL');
  const [editing, setEditing] = useState<MediaLibraryItem | null>(null);

  const [uploadState, uploadAction, uploadPending] = useActionState(uploadMediaAction, initialState);
  const [editState, editAction, editPending] = useActionState(updateMediaAction, initialState);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveMediaAction, initialState);

  const needsReload =
    uploadState.status === 'success' || editState.status === 'success' || archiveState.status === 'success';

  useEffect(() => {
    if (!needsReload) return;
    const timer = window.setTimeout(() => window.location.reload(), 600);
    return () => window.clearTimeout(timer);
  }, [needsReload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (kindFilter === 'ALL' ? true : item.kind === kindFilter) &&
        (!q ||
          item.title.toLowerCase().includes(q) ||
          item.originalName.toLowerCase().includes(q) ||
          item.altText.toLowerCase().includes(q)),
    );
  }, [items, query, kindFilter]);

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <h2 className="font-display text-lg font-semibold">Upload new media</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Images and documents only. Describe the picture in the alt text so it is accessible everywhere.
        </p>
        <form action={uploadAction} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="admin-label">File *</label>
              <input
                name="file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif,.pdf"
                required
                className="admin-input"
              />
            </div>
            <div>
              <label className="admin-label">Title *</label>
              <input name="title" className="admin-input" placeholder="Exhibition opening night" required />
            </div>
            <div>
              <label className="admin-label">Alt text</label>
              <input name="altText" className="admin-input" placeholder="Visitors gathered around the exhibit" />
            </div>
            <div>
              <label className="admin-label">Caption</label>
              <input name="caption" className="admin-input" placeholder="Optional caption shown in galleries" />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-ink-soft">
              <input name="isPublic" type="checkbox" defaultChecked className="size-4 rounded" />
              Visible to visitors
            </label>
          </div>
          {uploadState.status === 'error' && uploadState.message ? (
            <p role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
              {uploadState.message}
            </p>
          ) : null}
          <div className="mt-4">
            <button type="submit" disabled={uploadPending} className="admin-btn admin-btn-primary">
              {uploadPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-4" aria-hidden="true" />
              )}
              Upload
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <div className="flex flex-1 items-center gap-3">
            <h2 className="font-display text-lg font-semibold">Media library</h2>
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
                placeholder="Search media…"
                className="admin-input !w-52 !py-1.5 !pl-9 max-sm:!w-full"
              />
            </label>
            <select
              className="admin-input !w-36 !py-1.5"
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)}
              aria-label="Filter by type"
            >
              <option value="ALL">All types</option>
              <option value="IMAGE">Images</option>
              <option value="DOCUMENT">Documents</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <HardDrive className="mx-auto size-8 text-stone" aria-hidden="true" />
            <p className="mt-3 text-sm text-ink-muted">No media found — upload the first asset above.</p>
          </div>
        ) : (
          <ul className="grid gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {filtered.map((item) => {
              const href = mediaUrl(item.storageKey);
              const isImg = isImageKey(item.storageKey);
              return (
                <li key={item.id} className="group overflow-hidden rounded-2xl border border-line bg-paper">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-warm-ivory">
                    {isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={href}
                        alt={item.altText || item.title}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-2 text-ink-muted">
                        <FileText className="size-7" aria-hidden="true" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{item.kind}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-xs font-semibold text-ink" title={item.title}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-ink-muted">
                      {formatFileSize(item.sizeBytes)} · {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        className="admin-btn admin-btn-ghost !gap-1 !py-1 !text-[11px]"
                      >
                        <Pencil className="size-3" aria-hidden="true" />
                        Details
                      </button>
                      {canManage ? (
                        <form
                          action={archiveAction}
                          onSubmit={(event) => {
                            if (!window.confirm(`Removed media is hidden from the site. Remove “${item.title}”?`)) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" disabled={archivePending} className="admin-btn admin-btn-ghost !gap-1 !py-1 !text-[11px] !text-danger">
                            {archivePending ? (
                              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 className="size-3" aria-hidden="true" />
                            )}
                            Remove
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing ? (
        <section className="admin-card" aria-label="Edit media details">
          <h2 className="font-display text-lg font-semibold">Details · {editing.title}</h2>
          {editState.status === 'error' && editState.message ? (
            <p role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
              {editState.message}
            </p>
          ) : null}
          <form action={editAction} className="mt-4">
            <input type="hidden" name="id" value={editing.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label">Title *</label>
                <input name="title" defaultValue={editing.title} className="admin-input" required />
              </div>
              <div>
                <label className="admin-label">Alt text</label>
                <input name="altText" defaultValue={editing.altText} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label">Caption</label>
                <input name="caption" defaultValue={editing.caption} className="admin-input" />
              </div>
              <label className="flex items-center gap-2.5 text-sm text-ink-soft">
                <input name="isPublic" type="checkbox" defaultChecked={editing.isPublic} className="size-4 rounded" />
                Visible to visitors
              </label>
              <p className="self-end text-[11px] text-ink-muted">
                File path:{' '}
                <code className="rounded bg-warm-ivory px-1.5 py-0.5">{mediaUrl(editing.storageKey)}</code>
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2.5">
              <button type="submit" disabled={editPending} className="admin-btn admin-btn-primary">
                {editPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                Save details
              </button>
              <button type="button" onClick={() => setEditing(null)} className="admin-btn admin-btn-ghost">
                Close
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
