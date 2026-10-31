'use server';

import 'server-only';
import { db } from '@/lib/db';
import { ValidationError } from '@/lib/errors';
import { writeAuditLog } from './audit';
import type { Actor } from '@/server/auth/actor';

export interface EnquiryInput {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  locale?: 'en' | 'gu' | 'hi';
  consent: boolean;
  type?: 'GENERAL' | 'PROGRAMME' | 'EVENT' | 'VOLUNTEER' | 'FEEDBACK';
  sectionId?: string | null;
  eventId?: string | null;
  ipHash?: string | null;
}

function validateEmail(email: string): void {
  if (!email.includes('@')) {
    throw new ValidationError('Please provide a valid email address.', { email });
  }
}

export async function createEnquiry(actor: Actor | undefined, input: EnquiryInput) {
  validateEmail(input.email);

  if (!input.consent) {
    throw new ValidationError('Please provide consent.', { consent: 'Consent is required.' });
  }

  const ipHash = actor?.id ?? 'system';

  const enquiry = await db.enquiry.create({
    data: {
      name: input.name.trim().slice(0, 200),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      subject: input.subject.trim().slice(0, 200),
      message: input.message.trim().slice(0, 5000),
      locale: input.locale ?
      (input.locale === 'en' ? 'EN' : input.locale === 'gu' ? 'GU' : 'HI')
      : 'EN',
      status: 'NEW',
      consent: input.consent,
      ipHash,
    },
    include: { section: { select: { key: true, nameEn: true } } },
  });

  await writeAuditLog({
    actorId: actor?.id ?? 'system',
    action: 'enquiry.create',
    entityType: 'Enquiry',
    entityId: enquiry.id,
    summary: `Created enquiry ${enquiry.id}`,
  });

  return enquiry;
}
