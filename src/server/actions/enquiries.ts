'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { createEnquiry } from '@/server/services/enquiries';
import { writeAuditLog } from '@/server/services/audit';

export interface EnquiryFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const _initialState: EnquiryFormState = { status: 'idle' };

function parseEnquiryFormData(formData: FormData) {
  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const phone = (formData.get('phone') as string | null)?.trim() ?? '';
  const subject = (formData.get('subject') as string | null)?.trim() ?? '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';
  const locale = ['en', 'gu', 'hi'].includes(formData.get('locale') as string)
    ? (formData.get('locale') as 'en' | 'gu' | 'hi')
    : ('en' as 'en' | 'gu' | 'hi');
  const consent = formData.get('consent') === 'on';
  const ipHash = formData.get('ipHash') as string | null;

  return {
    name,
    email,
    phone,
    subject,
    message,
    locale,
    consent,
    ipHash,
  };
}

export async function createEnquiryAction(
  _previous: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseEnquiryFormData(formData);
  try {
    const enquiry = await createEnquiry(actor, parsed);
    await writeAuditLog({
      actorId: actor.id,
      action: 'enquiry.create',
      entityType: 'Enquiry',
      entityId: enquiry.id,
      summary: `Created enquiry ${enquiry.id}`,
    });
    revalidatePath('/enquiries/thank-you');
    return { status: 'success', message: 'Your enquiry has been submitted successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[createEnquiryAction]', error);
    return { status: 'error', message: 'Failed to submit enquiry. Please try again.' };
  }
}