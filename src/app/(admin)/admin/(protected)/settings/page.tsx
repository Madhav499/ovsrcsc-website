import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth/actor';
import { getSiteSettings } from '@/server/services/settings';
import SettingsForm from '@/components/admin/settings-form';

export default async function AdminSettingsPage() {
  const actor = await getActor();
  if (!actor) redirect('/admin/login');
  const settings = await getSiteSettings();

  const plain = {
    contact: {
      address: settings.contact.address,
      phone: settings.contact.phone,
      email: settings.contact.email,
      generalEmail: settings.contact.generalEmail,
      mapUrl: settings.contact.mapUrl,
    },
    socials: {
      facebook: settings.socials.facebook,
      twitter: settings.socials.twitter,
      youtube: settings.socials.youtube,
      instagram: settings.socials.instagram,
    },
    external: {
      upcomingEvents: settings.external.upcomingEvents,
      gujcost: settings.external.gujcost,
      dst: settings.external.dst,
    },
    seo: {
      organisationName: settings.seo.organisationName,
      defaultDescription: settings.seo.defaultDescription,
    },
  } as const;

  const view = plain as unknown as Record<'contact' | 'socials' | 'external' | 'seo', Record<string, string>>;
  return <SettingsForm settings={view} />;
}
