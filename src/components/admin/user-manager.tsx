'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import {
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminActionState } from '@/lib/admin-payload';
import { createUserAction, updateUserAction, resetUserPasswordAction } from '@/server/actions/admin-users';

const initialState: AdminActionState = { status: 'idle' };

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  mustChangePassword: boolean;
  lastLoginAt: string;
  sessionCount: number;
  roles: string[];
  sections: Array<{ sectionId: string; canPublish: boolean; name: string }>;
}

export interface UserManagerProps {
  users: AdminUserRow[];
  sections: Array<{ value: string; label: string }>;
  currentUserId: string;
}

interface UserFormValues {
  name: string;
  email: string;
  roles: string[];
  status: 'ACTIVE' | 'DISABLED';
  selected: AdminUserRow['sections'];
  passwordOption: 'generate' | 'manual';
  temporaryPassword: string;
  confirmTemporaryPassword: string;
}

interface PasswordStrengthResult {
  valid: boolean;
  score: number;
  message?: string;
}

const validatePasswordStrength = (password: string): PasswordStrengthResult => {
    if (password.length < 12) {
      return { valid: false, score: 0, message: 'Password must be at least 12 characters long.' };
    }
    const categories = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
    if (categories < 3) {
      return {
        valid: false,
        score: 1,
        message: 'Password must contain at least three of: lowercase, uppercase, numbers, symbols.',
      };
    }
    if (/^(password|123456|qwerty|admin|welcome)/i.test(password)) {
      return { valid: false, score: 1, message: 'Password is too easy to guess.' };
    }
    return { valid: true, score: 4 };
  };

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', hint: 'Full administrative control of the CMS.' },
  { value: 'EVENTS_MANAGER', label: 'Events Manager', hint: 'Events and registrations.' },
  { value: 'SECTION_EDITOR', label: 'Section Editor', hint: 'Creates and publishes content for their sections.' },
  { value: 'CONTENT_CONTRIBUTOR', label: 'Contributor', hint: 'Drafts content; cannot publish.' },
] as const;

function statusBadge(status: string): string {
  return status === 'ACTIVE'
    ? 'border-emerald-600/25 bg-emerald-500/10 text-emerald-800'
    : 'border-line bg-warm-ivory text-ink-muted';
}

export default function UserManager({ users, sections, currentUserId }: UserManagerProps) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userState] = useActionState(createUserAction, initialState);
  const [updateState] = useActionState(updateUserAction, initialState);
  const [resetState, resetAction, resetPending] = useActionState(resetUserPasswordAction, initialState);

  useEffect(() => {
    // Keep the page after creating a user so the issued temporary password can
    // be copied. It is shown only once and is never stored in browser storage.
    if (userState.status === 'success' && userState.temporaryPassword) return;
    if (userState.status === 'success' || updateState.status === 'success' || resetState.status === 'success') {
      const timer = window.setTimeout(() => window.location.reload(), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [userState.status, updateState.status, resetState.status]);

  const copyTemporaryPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      // Clipboard access may be blocked; the password remains visible in the field.
    }
  };



  const [showCreatedDialog, setShowCreatedDialog] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
    roles: string[];
    sections: string[];
    temporaryPassword: string;
  } | null>(null);

    useEffect(() => {
    if (userState.status !== 'success') return;

    const { user, temporaryPassword } = userState;

    if (!user || !temporaryPassword) return;

    setCreatedUser({
      name: user.name,
      email: user.email,
      roles: user.roles,
      sections: user.sections.map((section) => section.sectionId),
      temporaryPassword,
    });

    setShowCreatedDialog(true);
  }, [userState, updateState.status, resetState.status]);

  const handleDialogClose = () => {
    setShowCreatedDialog(false);
    setCreatedUser(null);
    window.location.reload();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  const editing = editingId && editingId !== '__new__' ? users.find((user) => user.id === editingId) ?? null : null;
  const isNew = editingId === '__new__';
  const isEditing = isNew || editing !== null;

  return (
    <div className="space-y-6">
      {isEditing ? (
        <UserForm
          user={editing}
          sections={sections}
          action={isNew ? createUserAction : updateUserAction}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      {!isEditing ? (
        <section className="admin-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div className="flex flex-1 items-center gap-3">
              <h2 className="font-display text-lg font-semibold">Team members</h2>
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
                  placeholder="Search peopleâ€¦"
                  className="admin-input !w-52 !py-1.5 !pl-9 max-sm:!w-full"
                />
              </label>
              <button type="button" onClick={() => setEditingId('__new__')} className="admin-btn admin-btn-primary whitespace-nowrap">
                <Plus className="size-4" aria-hidden="true" />
                Add member
              </button>
            </div>
          </div>

          {userState.status === 'error' && userState.message ? (
            <p role="alert" className="mx-6 mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
              {userState.message}
            </p>
          ) : null}
          {resetState.status === 'error' && resetState.message ? (
            <p role="alert" className="mx-6 mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
              {resetState.message}
            </p>
          ) : null}
            <ul className="divide-y divide-line">
              {filtered.map((user) => (
                <li key={user.id} className="grid gap-2 px-4 py-3.5 hover:bg-warm-ivory/40 sm:grid-cols-12 sm:items-center">
                  <div className="sm:col-span-8 min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                      <span className="truncate">{user.name}</span>
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusBadge(user.status))}>
                        {user.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                      </span>
                      {user.roles.includes('SUPER_ADMIN') ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brass">
                          <ShieldCheck className="size-3" aria-hidden="true" />
                          Super Admin
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                      <span className="truncate">{user.email}</span>
                      <span className="font-semibold">{user.roles.filter((role) => role !== 'SUPER_ADMIN').map((role) => ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role).join(' Â· ') || 'â€”'}</span>
                      <span>{user.sections.length} section{user.sections.length === 1 ? '' : 's'}</span>
                      {user.mustChangePassword ? <span className="text-danger font-semibold">Password change pending</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 sm:col-span-4">
                    {user.id !== currentUserId ? (
                      <form
                        action={resetAction}
                        onSubmit={(event) => {
                          if (!window.confirm(`Reset ${user.name}'s password and revoke their sessions?`)) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={user.id} />
                        <button type="submit" disabled={resetPending} className="admin-btn admin-btn-ghost !py-1.5 !text-xs">
                          <KeyRound className="size-3.5" aria-hidden="true" />
                          Reset
                        </button>
                      </form>
                    ) : (
                      <button type="button" disabled className="admin-btn admin-btn-ghost !py-1.5 !text-xs" title="Use the account page to change your own password.">
                        <KeyRound className="size-3.5" aria-hidden="true" />
                        Reset
                      </button>
                    )}
                    <button type="button" onClick={() => setEditingId(user.id)} className="admin-btn admin-btn-ghost !py-1.5 !text-xs">
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>

        </section>
      ) : null}
    </div>
  );

if (showCreatedDialog) {
  if (!createdUser) return null;

  const user = createdUser;
    const user = {
  ...createdUser,
  roles: createdUser.roles ?? [],
  sections: createdUser.sections ?? [],
  temporaryPassword: createdUser.temporaryPassword ?? '',
};
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={handleDialogClose} aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-line bg-paper p-6 shadow-soft">
          <div className="flex items-start gap-3 mb-4">
            <ShieldCheck className="size-5 text-emerald-600 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg font-semibold">Account created</h2>
              <p className="text-sm text-ink-muted">
                Share these credentials with the new team member securely.
              </p>
            </div>
          </div>

          <dl className="space-y-3 text-sm mb-6">
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-ink-muted">Name</dt>
              <dd className="font-semibold">{user.name}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-ink-muted">Login email</dt>
              <dd className="font-semibold break-all">{user.email}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-ink-muted">Role</dt>
              <dd className="font-semibold">{user.roles.join(', ')}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-ink-muted">Assigned sections</dt>
              <dd className="font-semibold">{user.sections.length > 0 ? user.sections.join(', ') : 'None (Super Admin)'}</dd>
            </div>
          </dl>

          <div className="relative mb-6">
            <label className="mb-1.5 block text-sm font-semibold text-ink">
              Temporary password
            </label>
            <input
              type="text"
              value={user.temporaryPassword}
              readOnly
              className="h-11 w-full rounded-xl border border-line bg-white px-3.5 pr-10 text-sm font-mono text-ink"
            />
            <button
              type="button"
              onClick={() => copyTemporaryPassword(user.temporaryPassword)}
              className="absolute inset-y-0 right-3 flex items-center px-3 text-ink-muted hover:text-ink"
              aria-label="Copy temporary password"
            >
              <Copy className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => copyTemporaryPassword(user.temporaryPassword)}
              className="admin-btn admin-btn-ghost flex-1"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copy password
            </button>
            <button
              type="button"
              onClick={handleDialogClose}
              className="admin-btn admin-btn-primary flex-1"
            >
              Close and return to user list
            </button>
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            This is the only time the temporary password will be shown. After the new team member signs
            in, they will be required to change it immediately.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function UserForm({
  user,
  sections,
  action,
  onClose,
}: {
  user: AdminUserRow | null;
  sections: Array<{ value: string; label: string }>;
  action: (previous: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [temporaryPasswordError, setTemporaryPasswordError] = useState<string | null>(null);
  const [values, setValues] = useState<UserFormValues>(() =>
    user
      ? {
          name: user.name,
          email: user.email,
          roles: user.roles,
          status: user.status,
          selected: user.sections,
          passwordOption: 'generate',
          temporaryPassword: '',
        }
      : {
          name: '',
          email: '',
          roles: ['SECTION_EDITOR'],
          status: 'ACTIVE',
          selected: [],
          passwordOption: 'generate',
          temporaryPassword: '',
          confirmTemporaryPassword: '',
        },
  );

  useEffect(() => {
    if (user) {
      setValues({
        name: user.name,
        email: user.email,
        roles: user.roles,
        status: user.status,
        selected: user.sections,
        passwordOption: 'generate',
        temporaryPassword: '',
        confirmTemporaryPassword: '',
      });
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = !user;

  const toggleRole = (role: string) =>
    setValues((previous) => ({
      ...previous,
      roles: previous.roles.includes(role) ? previous.roles.filter((item) => item !== role) : [...previous.roles, role],
    }));

  const toggleSection = (sectionId: string) =>
    setValues((previous) => {
      const exists = previous.selected.some((item) => item.sectionId === sectionId);
      return exists
        ? { ...previous, selected: previous.selected.filter((item) => item.sectionId !== sectionId) }
        : { ...previous, selected: [...previous.selected, { sectionId, canPublish: false, name: sections.find((section) => section.value === sectionId)?.label ?? '' }] };
    });

  const togglePublish = (sectionId: string) =>
    setValues((previous) => ({
      ...previous,
      selected: previous.selected.map((item) =>
        item.sectionId === sectionId ? { ...item, canPublish: !item.canPublish } : item,
      ),
    }));


  return (
    <section className="admin-card" aria-label={user ? 'Edit member' : 'Add member'}>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!user && values.passwordOption === 'manual') {
            const strength = validatePasswordStrength(values.temporaryPassword);
            if (!strength.valid) {
              setTemporaryPasswordError(strength.message ?? 'Invalid password.');
              return;
            }
            if (values.temporaryPassword !== values.confirmTemporaryPassword) {
              setTemporaryPasswordError('Passwords do not match.');
              return;
            }
            setTemporaryPasswordError(null);
          }
          const form = event.currentTarget;
          const payloadElement = form.querySelector<HTMLInputElement>('input[name="payload"]');
          if (payloadElement) {
            payloadElement.value = JSON.stringify({
              name: values.name,
              email: startEdit ? values.email : undefined,
              roles: values.roles,
              status: values.status,
              sections: values.selected.map((item) => ({ sectionId: item.sectionId, canPublish: item.canPublish })),
              ...(!user
                ? {
                    passwordOption: values.passwordOption,
                    temporaryPassword: values.temporaryPassword,
                  }
                : {}),
            });
          }
        }}
      >
        <input type="hidden" name="payload" />
        <input type="hidden" name="id" value={user?.id ?? ''} />
        {!startEdit ? <input type="hidden" name="email" value={values.email} /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-semibold">{user ? `Edit member Â· ${user.name}` : 'Add team member'}</h2>
          <button type="button" onClick={onClose} className="admin-btn admin-btn-ghost !py-1.5 !text-xs">
            <X className="size-3.5" aria-hidden="true" />
            Cancel
          </button>
        </div>

        {state.status === 'error' && state.message ? (
          <p role="alert" className="mx-6 mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        ) : null}

        <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
          <div>
            <label className="admin-label">Name *</label>
            <input
              type="text"
              value={values.name}
              onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
              required
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Email {startEdit ? '' : '*'}</label>
            <input
              type="email"
              value={values.email}
              onChange={(event) => setValues((previous) => ({ ...previous, email: event.target.value }))}
              required
              disabled={Boolean(user)}
              className="admin-input disabled:opacity-50"
              placeholder={user ? user.email : 'name@ovsrcsc.org'}
            />
          </div>

          {!user ? (
            <fieldset className="sm:col-span-2">
              <legend className="admin-label mb-2">Temporary password *</legend>
              <div className="grid gap-3 sm:grid-cols-2 items-end">
                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="passwordOption"
                      checked={values.passwordOption === 'generate'}
                      onChange={() =>
                        setValues((previous) => ({
                          ...previous,
                          passwordOption: 'generate' as const,
                          temporaryPassword: '',
                          confirmTemporaryPassword: '',
                        }))
                      }
                      className="form-radio"
                    />
                    <span className="text-sm text-ink">
                      Generate automatically
                    </span>
                  </label>
                  <p className="text-xs text-ink-muted">
                    A secure temporary password will be created and shown only once after the
                    account is added.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="passwordOption"
                      checked={values.passwordOption === 'manual'}
                      onChange={() =>
                        setValues((previous) => ({
                          ...previous,
                          passwordOption: 'manual' as const,
                        }))
                      }
                      className="form-radio"
                    />
                    <span className="text-sm text-ink">
                      Enter manually
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showManualPassword ? 'text' : 'password'}
                      value={values.temporaryPassword}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          temporaryPassword: event.target.value,
                        }))
                      }
                      required={values.passwordOption === 'manual'}
                      placeholder="Enter temporary password"
                      className="h-11 w-full rounded-xl border border-line bg-white px-3.5 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      aria-label="Toggle temporary password visibility"
                      className="absolute inset-y-0 right-3 flex items-center px-3 text-ink-muted hover:text-ink"
                      onClick={() => setShowManualPassword((previous) => !previous)}
                    >
                      {showManualPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {values.passwordOption === 'manual' && values.temporaryPassword ? (
                    <div className="space-y-1">
                      {temporaryPasswordError ? (
                        <p className="text-xs text-danger">{temporaryPasswordError}</p>
                      ) : (
                        <p className="text-xs text-ink-muted">
                          Must meet the standard password strength requirements.
                        </p>
                      )}
                    </div>
                  ) : null}
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={values.confirmTemporaryPassword}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          confirmTemporaryPassword: event.target.value,
                        }))
                      }
                      required={values.passwordOption === 'manual'}
                      placeholder="Confirm temporary password"
                      className="h-11 w-full rounded-xl border border-line bg-white px-3.5 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      aria-label="Toggle confirm password visibility"
                      className="absolute inset-y-0 right-3 flex items-center px-3 text-ink-muted hover:text-ink"
                      onClick={() => setShowConfirmPassword((previous) => !previous)}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {values.passwordOption === 'manual' &&
                    values.temporaryPassword !== values.confirmTemporaryPassword &&
                    values.confirmTemporaryPassword.length > 0 ? (
                    <p className="text-xs text-danger">Passwords do not match.</p>
                  ) : null}
                </div>
              </div>
            </fieldset>
          ) : null}

          <fieldset className="sm:col-span-2">
            <legend className="admin-label mb-2">Roles *</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm transition-colors',
                    values.roles.includes(role.value) ? 'border-brass bg-brass/5' : 'border-line hover:border-stone',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={values.roles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    className="mt-0.5 size-4 rounded"
                  />
                  <span>
                    <span className="block font-semibold text-ink">{role.label}</span>
                    <span className="block text-[11px] text-ink-muted">{role.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="sm:col-span-2">
            <legend className="admin-label mb-2">Section access</legend>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const owned = values.selected.some((item) => item.sectionId === section.value);
                const canPublish = values.selected.some((item) => item.sectionId === section.value && item.canPublish);
                return (
                  <span
                    key={section.value}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs',
                      owned ? 'border-ink bg-ink text-paper' : 'border-line text-ink-soft',
                    )}
                  >
                    <button type="button" onClick={() => toggleSection(section.value)} className="font-semibold">
                      {owned ? 'âœ“ ' : '+ '}
                      {section.label}
                    </button>
                    {owned ? (
                      <button
                        type="button"
                        onClick={() => togglePublish(section.value)}
                        className={cn(
                          'rounded-full px-1.5 text-[10px] font-bold uppercase tracking-wider',
                          canPublish ? 'bg-brass text-paper' : 'bg-paper/20 text-paper/70',
                        )}
                        title="Toggle publish rights"
                      >
                        Publish
                      </button>
                    ) : null}
                  </span>
                );
              })}
            </div>
          </fieldset>

          { user ? (
            <fieldset className="sm:col-span-2">
              <legend className="admin-label mb-2">Account status</legend>
              <label className="flex items-center gap-2.5 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={values.status === 'ACTIVE'}
                  onChange={(event) => setValues((previous) => ({ ...previous, status: event.target.checked ? 'ACTIVE' : 'DISABLED' }))}
                  className="size-4 rounded"
                />
                Account active (unchecking disables sign-in)
              </label>
            </fieldset>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-line px-6 py-4">
          <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {user ? 'Save member' : 'Add member'}
          </button>
          <button type="button" onClick={onClose} className="admin-btn admin-btn-ghost">
            Cancel
          </button>
          <p className="text-[11px] text-ink-muted">New members receive a temporary password â€” share it securely.</p>
        </div>
      </form>
    </section>
  );
}
