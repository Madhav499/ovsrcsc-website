import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { SiteSettings } from '@/lib/site-settings';
import { isSafeHttpUrl } from '@/lib/utils';

/** Large, welcoming contact entries driven by admin-managed site settings. */
export function ContactDetails({ dict, settings }: { dict: Dictionary; settings: SiteSettings }) {
  const mapUrl = settings.contact.mapUrl && isSafeHttpUrl(settings.contact.mapUrl) ? settings.contact.mapUrl : null;
  const emails = [settings.contact.email, settings.contact.generalEmail].filter(
    (email, index, list) => email && list.indexOf(email) === index,
  );

  return (
    <div className="grid divide-y divide-(--mx-line) border-y border-(--mx-line)">
      {settings.contact.address ? (
        <div className="grid gap-3 py-7 sm:grid-cols-[3rem_minmax(0,1fr)]">
          <MapPin className="size-6 text-(--mx-accent)" aria-hidden="true" />
          <div>
            <h3 className="mx-mono-label">{dict['contact.addressLabel']}</h3>
            <p className="mx-h4 mt-2 !font-normal">{settings.contact.address}</p>
            <p className="mt-2 text-[0.9375rem] text-(--mx-fg-2)">{dict['contact.mapText']}</p>
            {mapUrl ? (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mx-link mt-4">
                {dict['mx.contact.directions']}
                <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                <span className="sr-only">({dict['a11y.newTab']})</span>
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      {settings.contact.phone ? (
        <div className="grid gap-3 py-7 sm:grid-cols-[3rem_minmax(0,1fr)]">
          <Phone className="size-6 text-(--mx-accent)" aria-hidden="true" />
          <div>
            <h3 className="mx-mono-label">{dict['mx.contact.callUs']}</h3>
            <a
              href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`}
              className="mx-h4 mt-2 inline-block !font-normal hover:text-(--mx-accent)"
            >
              {settings.contact.phone}
            </a>
          </div>
        </div>
      ) : null}
      {emails.length ? (
        <div className="grid gap-3 py-7 sm:grid-cols-[3rem_minmax(0,1fr)]">
          <Mail className="size-6 text-(--mx-accent)" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="mx-mono-label">{dict['mx.contact.writeTo']}</h3>
            <ul className="mt-2 grid gap-1">
              {emails.map((email) => (
                <li key={email}>
                  <a href={`mailto:${email}`} className="mx-h4 inline-block break-all !font-normal hover:text-(--mx-accent)">
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
