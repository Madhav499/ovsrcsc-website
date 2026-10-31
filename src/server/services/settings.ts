import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/db';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from '@/lib/site-settings';
import { assertPermission, assertSuperAdmin, type Actor } from '@/server/auth/actor';
import { writeAuditLog } from './audit';

const siteSettingsSchema = z.object({
  contact: z.object({
    address: z.string().trim().min(5).max(300),
    phone: z.string().trim().min(5).max(80),
    email: z.string().trim().email().max(200),
    generalEmail: z.string().trim().email().max(200),
    mapUrl: z.string().trim().url().max(1000),
  }),
  socials: z.object({
    facebook: z.string().trim().url().max(500).or(z.literal('')),
    twitter: z.string().trim().url().max(500).or(z.literal('')),
    youtube: z.string().trim().url().max(500).or(z.literal('')),
    instagram: z.string().trim().url().max(500).or(z.literal('')),
  }),
  external: z.object({
    upcomingEvents: z.string().trim().url().max(1000),
    gujcost: z.string().trim().url().max(1000),
    dst: z.string().trim().url().max(1000),
  }),
  seo: z.object({
    defaultDescription: z.string().trim().min(30).max(400),
    organisationName: z.string().trim().min(3).max(200),
  }),
});

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await db.siteSetting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const stored = (key: string) => map.get(key) as Record<string, unknown> | undefined;

  const contact = stored('contact');
  const socials = stored('socials');
  const external = stored('external');
  const seo = stored('seo');

  return {
    contact: { ...DEFAULT_SITE_SETTINGS.contact, ...(contact ?? {}) } as SiteSettings['contact'],
    socials: { ...DEFAULT_SITE_SETTINGS.socials, ...(socials ?? {}) } as SiteSettings['socials'],
    external: { ...DEFAULT_SITE_SETTINGS.external, ...(external ?? {}) } as SiteSettings['external'],
    seo: { ...DEFAULT_SITE_SETTINGS.seo, ...(seo ?? {}) } as SiteSettings['seo'],
  };
}

export async function updateSiteSettings(actor: Actor, input: unknown): Promise<SiteSettings> {
  assertSuperAdmin(actor);
  assertPermission(actor, 'admin.settings');
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] = issue.message;
    }
    throw new ValidationError('Please check the settings fields.', fieldErrors);
  }

  const data = parsed.data;
  await db.$transaction([
    db.siteSetting.upsert({
      where: { key: 'contact' },
      create: { key: 'contact', value: data.contact },
      update: { value: data.contact },
    }),
    db.siteSetting.upsert({
      where: { key: 'socials' },
      create: { key: 'socials', value: data.socials },
      update: { value: data.socials },
    }),
    db.siteSetting.upsert({
      where: { key: 'external' },
      create: { key: 'external', value: data.external },
      update: { value: data.external },
    }),
    db.siteSetting.upsert({
      where: { key: 'seo' },
      create: { key: 'seo', value: data.seo },
      update: { value: data.seo },
    }),
  ]);

  await writeAuditLog({
    actorId: actor.id,
    action: 'settings.update',
    entityType: 'SiteSetting',
    summary: 'Updated site-wide contact and external link settings',
  });

  return getSiteSettings();
}

export async function getSectionByKey(key: string) {
  const section = await db.section.findUnique({ where: { key } });
  if (!section) throw new NotFoundError('Website section not found.');
  return section;
}
