'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Plus, X, Inbox, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichTextEditor } from './rich-text-editor';
import type { AdminActionState } from '@/lib/admin-payload';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'datetime'
  | 'richtext';

export interface CollectionField {
  kind: FieldKind;
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  optionsFrom?: 'sections';
}

export interface CollectionColumn {
  key: string;
  label: string;
  type?: 'text' | 'status' | 'datetime' | 'badges';
}

export type TranslationValue = Record<string, string>;

export interface CollectionRow {
  id: string;
  expectedUpdatedAt?: string;
  searchIndex?: string;
  values: Record<string, unknown>;
  translations?: Record<string, TranslationValue>;
}

type ActionState = AdminActionState;

export interface Labels {
  singular: string;
  plural: string;
  create: string;
  edit: string;
  save: string;
  archive?: string;
  cancel: string;
  searchPlaceholder: string;
  empty: string;
  translations: string;
  localeEn: string;
  localeGu: string;
  localeHi: string;
}

interface CollectionEditorProps {
  rows: CollectionRow[];
  columns: CollectionColumn[];
  fields: CollectionField[];
  defaults: Record<string, unknown>;
  sectionOptions?: Array<{ value: string; label: string }>;
  translationFields?: CollectionField[];
  translationDefaults?: Record<string, string>;
  create: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  update: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  archive?: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  labels: Labels;
  locale: string;
}

function statusTone(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'IN_REVIEW':
      return 'warn';
    case 'DRAFT':
      return 'neutral';
    default:
      return 'muted';
  }
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        tone === 'success' && 'border-emerald-600/25 bg-emerald-500/10 text-emerald-800',
        tone === 'warn' && 'border-amber-600/25 bg-amber-500/10 text-amber-800',
        tone === 'neutral' && 'border-line bg-saffron-light text-saffron-dark',
        tone === 'muted' && 'border-line bg-warm-ivory text-ink-muted',
      )}
    >
      {tone === 'success' ? <Check className="size-2.5" aria-hidden="true" /> : null}
      {tone === 'neutral' ? <Pencil className="size-2.5" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function formatCell(value: unknown, type: CollectionColumn['type']): string {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'datetime') {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  }
  if (type === 'status') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export default function CollectionEditor({
  rows,
  columns,
  fields,
  defaults,
  sectionOptions,
  translationFields,
  translationDefaults = {},
  create,
  update,
  archive,
  labels,
  locale,
}: CollectionEditorProps) {
  const [liveRows, setLiveRows] = useState<CollectionRow[]>(rows);
  useEffect(() => setLiveRows(rows), [rows]);

  const [query, setQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  const [translations, setTranslations] = useState<Record<string, TranslationValue>>({});
  const [activeLocale, setActiveLocale] = useState<'en' | 'gu' | 'hi'>(locale as 'en' | 'gu' | 'hi');
  const [createState, createFormAction, createPending] = useActionState(create, { status: 'idle' } as AdminActionState);
  const [updateState, updateFormAction, updatePending] = useActionState(update, { status: 'idle' } as AdminActionState);
  const [archiveState, archiveFormAction] = useActionState(
    archive ?? (async (previous: AdminActionState, formData: FormData) => { void formData; return previous; }),
    { status: 'idle' } as AdminActionState,
  );

  const openNew = () => {
    setEditingIndex('__new__');
    setValues({ ...defaults });
    setTranslations(translationFields ? { [locale]: { ...translationDefaults } } : {});
    setActiveLocale(locale as 'en' | 'gu' | 'hi');
  };

  const openRow = (row: CollectionRow) => {
    setEditingIndex(row.id);
    setValues({ ...row.values });
    const nextTranslations: Record<string, TranslationValue> = {};
    if (translationFields) {
      for (const [key, value] of Object.entries(row.translations ?? {})) {
        nextTranslations[key] = { ...value };
      }
      if (!nextTranslations[locale]) nextTranslations[locale] = { ...translationDefaults };
    }
    setTranslations(nextTranslations);
    setActiveLocale(locale as 'en' | 'gu' | 'hi');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const closeEditor = () => setEditingIndex(null);

  useEffect(() => {
    if (createState.status === 'success' || updateState.status === 'success') {
      setEditingIndex(null);
      window.setTimeout(() => window.location.reload(), 350);
    }
  }, [createState.status, updateState.status]);

  useEffect(() => {
    if (archiveState.status === 'success') {
      setEditingIndex(null);
      window.setTimeout(() => window.location.reload(), 350);
    }
  }, [archiveState.status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return liveRows;
    return liveRows.filter(
      (row) =>
        (row.searchIndex ?? '').toLowerCase().includes(q) ||
        JSON.stringify(row.values).toLowerCase().includes(q),
    );
  }, [liveRows, query]);

  const editingRow = editingIndex && editingIndex !== '__new__' ? liveRows.find((row) => row.id === editingIndex) : null;
  const isEditing = editingIndex !== null;

  const setField = (name: string, value: unknown) =>
    setValues((previous) => ({ ...previous, [name]: value }));

  const submitPayload = () => {
    const payload: Record<string, unknown> = { ...values };
    if (translationFields) {
      payload.translations = Object.entries(translations).map(([valueLocale, value]) => ({
        locale: valueLocale,
        ...value,
      }));
    }
    return payload;
  };

  const renderField = (field: CollectionField, scope: 'main' | 'translation', translationState?: TranslationValue) => {
    if (scope === 'translation') {
      const current = translationState?.[field.name];
      const setTranslation = (value: unknown) => {
        setTranslations((previous) => ({
          ...previous,
          [activeLocale]: { ...previous[activeLocale], [field.name]: value as string },
        }));
      };
      if (field.kind === 'richtext') {
        return (
          <RichTextEditor
            key={`${activeLocale}-${field.name}`}
            value={(current as string) ?? ''}
            onChange={(html) => setTranslation(html)}
            placeholder={field.placeholder}
          />
        );
      }
      if (field.kind === 'textarea') {
        return (
          <textarea
            key={`t-${activeLocale}-${field.name}`}
            rows={field.rows ?? 2}
            value={(current as string) ?? ''}
            onChange={(event) => setTranslation(event.target.value)}
            className="admin-input"
            aria-label={field.label}
          />
        );
      }
      return (
        <input
          key={`t-${activeLocale}-${field.name}`}
          type="text"
          value={(current as string) ?? ''}
          onChange={(event) => setTranslation(event.target.value)}
          className="admin-input"
          aria-label={field.label}
        />
      );
    }

    if (field.kind === 'richtext') {
      return (
        <RichTextEditor
          key={`f-${field.name}`}
          value={(values[field.name] as string) ?? ''}
          onChange={(html) => setField(field.name, html)}
          placeholder={field.placeholder}
        />
      );
    }
    if (field.kind === 'textarea') {
      return (
        <textarea
          key={`f-${field.name}`}
          rows={field.rows ?? 3}
          value={(values[field.name] as string) ?? ''}
          onChange={(event) => setField(field.name, event.target.value)}
          placeholder={field.placeholder}
          className="admin-input"
        />
      );
    }
    if (field.kind === 'select') {
      const options = (field.optionsFrom === 'sections' ? sectionOptions : undefined) ?? field.options ?? [];
      return (
        <select
          key={`f-${field.name}`}
          value={(values[field.name] as string) ?? ''}
          onChange={(event) => setField(field.name, event.target.value)}
          className="admin-input"
          required={field.required}
        >
          <option value="" disabled={field.required}>
            Choose…
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    if (field.kind === 'checkbox') {
      return (
        <label className="flex items-center gap-2.5 text-sm text-ink-soft">
          <input
            key={`f-${field.name}`}
            type="checkbox"
            checked={Boolean(values[field.name])}
            onChange={(event) => setField(field.name, event.target.checked)}
            className="size-4 rounded"
          />
          {field.label}
        </label>
      );
    }
    return (
      <input
        key={`f-${field.name}`}
        type={field.kind === 'number' ? 'number' : field.kind === 'datetime' ? 'datetime-local' : 'text'}
        min={field.min}
        max={field.max}
        value={(values[field.name] as string | number | undefined) ?? ''}
        onChange={(event) =>
          setField(field.name, field.kind === 'number' ? Number(event.target.value) : event.target.value)
        }
        placeholder={field.placeholder}
        className="admin-input"
      />
    );
  };

  const actionState = editingIndex === '__new__' ? createState : updateState;
  const pending = editingIndex === '__new__' ? createPending : updatePending;

  return (
    <section className="admin-card">
      {isEditing ? (
        <form
          aria-label={labels.edit}
          action={editingIndex === '__new__' ? createFormAction : updateFormAction}
          onSubmit={(event) => {
            const form = event.currentTarget;
            const input = form.querySelector<HTMLInputElement>('input[name="payload"]');
            if (input) input.value = JSON.stringify(submitPayload());
          }}
        >
          <input type="hidden" name="payload" />
          <input type="hidden" name="id" value={editingIndex === '__new__' ? '' : editingIndex} />
          {editingRow?.expectedUpdatedAt ? (
            <input type="hidden" name="expectedUpdatedAt" value={editingRow.expectedUpdatedAt} />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 className="font-display text-lg font-semibold">
              {editingIndex === '__new__' ? labels.create : `${labels.edit} · ${editingRow?.searchIndex ?? labels.singular}`}
            </h2>
            <button type="button" onClick={closeEditor} className="admin-btn admin-btn-ghost !py-1.5 !text-xs">
              <X className="size-3.5" aria-hidden="true" />
              {labels.cancel}
            </button>
          </div>

          {actionState.status === 'error' && actionState.message ? (
            <p role="alert" className="mx-6 mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
              {actionState.message}
            </p>
          ) : null}

          <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.name}
                className={cn(
                  field.kind === 'checkbox' || field.kind === 'richtext' || field.kind === 'textarea'
                    ? 'sm:col-span-2'
                    : 'sm:col-span-1',
                )}
              >
                {field.kind !== 'checkbox' ? (
                  <label className="admin-label">
                    {field.label}
                    {field.required ? <span className="text-danger"> *</span> : null}
                  </label>
                ) : null}
                {renderField(field, 'main')}
                {field.hint ? <p className="mt-1.5 text-xs text-ink-muted">{field.hint}</p> : null}
              </div>
            ))}
          </div>

          {translationFields ? (
            <div className="border-t border-line px-6 py-5">
              <p className="admin-label mb-3">{labels.translations}</p>
              <div className="mb-4 inline-flex rounded-full border border-line bg-warm-ivory p-0.5">
                {(['en', 'gu', 'hi'] as const).map((tabLocale) => (
                  <button
                    key={tabLocale}
                    type="button"
                    onClick={() => setActiveLocale(tabLocale)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-bold transition-colors',
                      activeLocale === tabLocale ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink',
                    )}
                  >
                    {tabLocale === 'en' ? labels.localeEn : tabLocale === 'gu' ? labels.localeGu : labels.localeHi}
                  </button>
                ))}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {translationFields.map((field) => (
                  <div
                    key={field.name}
                    className={cn(
                      field.kind === 'richtext' || field.kind === 'textarea' ? 'sm:col-span-2' : 'sm:col-span-1',
                    )}
                  >
                    <label className="admin-label">
                      {field.label}
                      {field.required ? <span className="text-danger"> *</span> : null}
                    </label>
                    {renderField(field, 'translation', translations[activeLocale])}
                    {field.hint ? <p className="mt-1.5 text-xs text-ink-muted">{field.hint}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2.5 border-t border-line px-6 py-4">
            <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
              {labels.save}
            </button>
            <button type="button" onClick={closeEditor} className="admin-btn admin-btn-ghost">
              {labels.cancel}
            </button>
            {archive && editingRow ? (
              <button
                type="submit"
                formAction={archiveFormAction}
                className="admin-btn admin-btn-danger ml-auto"
              >
                <Archive className="size-4" aria-hidden="true" />
                {labels.archive}
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div className="flex flex-1 items-center gap-3">
              <h2 className="font-display text-lg font-semibold">{labels.plural}</h2>
              <span className="rounded-full bg-warm-ivory px-2.5 py-0.5 text-[11px] font-bold text-ink-muted">
                {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={labels.searchPlaceholder}
                className="admin-input !w-52 !py-1.5 max-sm:!w-full"
                aria-label={labels.searchPlaceholder}
              />
              <button type="button" onClick={openNew} className="admin-btn admin-btn-primary whitespace-nowrap">
                <Plus className="size-4" aria-hidden="true" />
                {labels.create}
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Inbox className="mx-auto size-8 text-stone" aria-hidden="true" />
              <p className="mt-3 text-sm text-ink-muted">{labels.empty}</p>
              <button type="button" onClick={openNew} className="admin-btn admin-btn-outline mt-4">
                <Plus className="size-3.5" aria-hidden="true" />
                {labels.create}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((row) => (
                <li key={row.id} className="grid gap-2 px-4 py-3.5 hover:bg-warm-ivory/40 sm:grid-cols-12 sm:items-center">
                  <div className="sm:col-span-8 min-w-0">
                    <p className="truncate text-sm font-semibold text-ink" title={row.searchIndex}>
                      {row.searchIndex || row.id}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                      {columns.map((column) => {
                        const value = row.values[column.key];
                        if (column.type === 'status') {
                          return (
                            <StatusBadge
                              key={column.key}
                              label={formatCell(value, undefined)}
                              tone={statusTone(String(value))}
                            />
                          );
                        }
                        if (value === undefined || value === null || value === '') return null;
                        return (
                          <span key={column.key} className={cn('whitespace-nowrap', column.type === 'badges' && 'font-semibold')}>
                            {formatCell(value, column.type)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 sm:col-span-4">
                    <button type="button" onClick={() => openRow(row)} className="admin-btn admin-btn-ghost !py-1.5 !text-xs">
                      <Pencil className="size-3.5" aria-hidden="true" />
                      {labels.edit}
                    </button>
                  </div>
                 </li>
               ))}
             </ul>
           )}
         </>
       )}
     </section>
   );
}
