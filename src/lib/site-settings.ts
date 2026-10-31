import { INSTITUTION } from './constants';

export interface SiteSettings {
  contact: {
    address: string;
    phone: string;
    email: string;
    generalEmail: string;
    mapUrl: string;
  };
  socials: {
    facebook: string;
    twitter: string;
    youtube: string;
    instagram: string;
  };
  external: {
    upcomingEvents: string;
    gujcost: string;
    dst: string;
  };
  seo: {
    defaultDescription: string;
    organisationName: string;
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contact: {
    address: INSTITUTION.address,
    phone: INSTITUTION.phone,
    email: INSTITUTION.email,
    generalEmail: INSTITUTION.generalEmail,
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Shri+O.+V.+Sheth+Regional+Community+Science+Center+Rajkot',
  },
  socials: {
    facebook: INSTITUTION.socials.facebook,
    twitter: INSTITUTION.socials.twitter,
    youtube: INSTITUTION.socials.youtube,
    instagram: INSTITUTION.socials.instagram,
  },
  external: {
    upcomingEvents: 'https://upcomingatovsrcsc.blogspot.com/',
    gujcost: 'https://gujcost.gujarat.gov.in/',
    dst: 'https://dst.gov.in/',
  },
  seo: {
    defaultDescription:
      'Shri O. V. Sheth Regional Community Science Center, Rajkot — a regional community science center working for science popularisation since 1997.',
    organisationName: INSTITUTION.name,
  },
};
