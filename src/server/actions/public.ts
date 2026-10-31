'use server';

import { z } from 'zod';
import { getDictionary, normalizeLocale } from '@/i18n';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requestPrivacyHash } from '@/server/auth/request-context';
import { createEnquiry } from '@/server/services/enquiries';
import { registerForEvent } from '@/server/services/events';

export interface PublicFormState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().min(3).max(220),
  message: z.string().trim().min(10).max(5000),
  type: z.enum(['GENERAL', 'PROGRAMME', 'EVENT', 'VOLUNTEER', 'FEEDBACK']),
  consent: z.literal('on'),
  sectionId: z.string().trim().optional(),
  eventId: z.string().trim().optional(),
});

const registrationSchema = z.object({
  eventId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  participants: z.coerce.number().int().min(1).max(10),
  notes: z.string().trim().max(2000).optional().default(''),
  consent: z.literal('on'),
});

const ENQUIRY_FIELD_MESSAGES: Record<string, keyof ReturnType<typeof getDictionary>> = {
  name: 'forms.validation.name',
  email: 'forms.validation.email',
  phone: 'forms.validation.phone',
  subject: 'forms.validation.subject',
  message: 'forms.validation.message',
  consent: 'forms.validation.consent',
};

function localizedFieldErrors(
  issues: z.ZodIssue[],
  dict: ReturnType<typeof getDictionary>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'form');
    const key = ENQUIRY_FIELD_MESSAGES[field];
    errors[field] = key ? dict[key] : dict['forms.validation.generic'];
  }
  return errors;
}

function isBotSubmission(formData: FormData): boolean {
  const honeypot = formData.get('website');
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) return true;
  const startedAt = Number(formData.get('formStartedAt'));
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 1200) {
    return true;
  }
  return false;
}

export async function submitEnquiryAction(
  _previous: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  await assertSameOrigin();
  const locale = normalizeLocale(String(formData.get('locale') ?? 'en'));
  const dict = getDictionary(locale);

  if (isBotSubmission(formData)) {
    return { status: 'success', message: dict['contact.successBody'] };
  }

  const parsed = enquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    subject: formData.get('subject'),
    message: formData.get('message'),
    type: formData.get('type') ?? 'GENERAL',
    consent: formData.get('consent'),
    sectionId: formData.get('sectionId') || undefined,
    eventId: formData.get('eventId') || undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: dict['contact.formError'],
      fieldErrors: localizedFieldErrors(parsed.error.issues, dict),
    };
  }

  try {
    const _ipHash = await requestPrivacyHash();
    await createEnquiry(
      undefined,
      {
        type: parsed.data.type,
        sectionId: parsed.data.sectionId || null,
        eventId: parsed.data.eventId || null,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
        locale,
        consent: true,
      }
    );
    return { status: 'success', message: dict['contact.successBody'] };
  } catch (error) {
    if (isAppError(error) && error.code === 'RATE_LIMITED') {
      return { status: 'error', message: dict['forms.validation.rateLimited'] };
    }
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    console.error('[enquiry-submit]', error);
    return { status: 'error', message: dict['common.error'] };
  }
}

export async function registerForEventAction(
  _previous: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  await assertSameOrigin();
  const locale = normalizeLocale(String(formData.get('locale') ?? 'en'));
  const dict = getDictionary(locale);

  if (isBotSubmission(formData)) {
    return { status: 'success', message: dict['events.registeredBody'] };
  }

  const parsed = registrationSchema.safeParse({
    eventId: formData.get('eventId'),
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    participants: formData.get('participants') ?? 1,
    notes: formData.get('notes') ?? '',
    consent: formData.get('consent'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? 'form');
      if (field === 'participants') fieldErrors[field] = dict['forms.validation.participants'];
      else if (field === 'consent') fieldErrors[field] = dict['forms.validation.consent'];
      else if (field === 'name') fieldErrors[field] = dict['forms.validation.name'];
      else if (field === 'email') fieldErrors[field] = dict['forms.validation.email'];
      else if (field === 'phone') fieldErrors[field] = dict['forms.validation.phone'];
      else fieldErrors[field] = dict['forms.validation.generic'];
    }
    return {
      status: 'error',
      message: dict['forms.validation.generic'],
      fieldErrors,
    };
  }

  try {
    const ipHash = await requestPrivacyHash();
    await registerForEvent(parsed.data.eventId, {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      participants: parsed.data.participants,
      notes: parsed.data.notes ?? undefined,
      locale,
      ipHash: ipHash as string | undefined,
    });
    return { status: 'success', message: dict['events.registeredBody'] };
  } catch (error) {
    if (isAppError(error) && error.code === 'RATE_LIMITED') {
      return { status: 'error', message: dict['forms.validation.rateLimited'] };
    }
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    console.error('[event-registration]', error);
    return { status: 'error', message: dict['common.error'] };
  }
}
