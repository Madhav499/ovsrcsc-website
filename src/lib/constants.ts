export const LOCALES = ['en', 'gu', 'hi'] as const;
export type LocaleCode = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const LOCALE_LABELS: Record<LocaleCode, { native: string; english: string; htmlLang: string }> = {
  en: { native: 'English', english: 'English', htmlLang: 'en-IN' },
  gu: { native: 'ગુજરાતી', english: 'Gujarati', htmlLang: 'gu-IN' },
  hi: { native: 'हिन्दी', english: 'Hindi', htmlLang: 'hi-IN' },
};

export const INSTITUTION_TIME_ZONE = 'Asia/Kolkata';
export const INSTITUTION_UTC_OFFSET_MINUTES = 330;

export const INSTITUTION = {
  name: 'Shri O. V. Sheth Regional Community Science Center',
  shortName: 'OVSRCSC Rajkot',
  gujaratiName: 'શ્રી ઓ. વી. શેઠ પ્રાદેશિક સામુદાયિક વિજ્ઞાન કેન્દ્ર, રાજકોટ',
  hindiName: 'श्री ओ. वी. शेठ क्षेत्रीय सामुदायिक विज्ञान केंद्र, राजकोट',
  established: 1997,
  address: 'Nehru Udhyan, Race Course, Rajkot 360001, Gujarat, India',
  phone: '+91 0281 2449940',
  email: 'mail@rcscrajkot.org',
  generalEmail: 'lokvigyankendrarajkot@gmail.com',
  website: 'https://sciencecenterrajkot.org',
  socials: {
    facebook: 'https://www.facebook.com/OVSRCSCRajkot-2239812482748715',
    twitter: 'https://twitter.com/ovsrcsc',
    youtube: 'https://www.youtube.com/c/RcscrajkotOrg',
    instagram: 'http://instagram.com/ovsrcsc_rajkot',
  },
  parent: 'Saurashtra Education Foundation (SEF)',
  partners: ['Gujarat Council on Science and Technology (GUJCOST)', 'Rajkot Municipal Corporation'],
} as const;

export const ADMIN_SESSION_COOKIE = 'ovsrcsc_admin_session';
export const LOCALE_COOKIE = 'ovsrcsc_locale';
export const SESSION_DURATION_HOURS = 12;
export const SESSION_IDLE_REFRESH_MINUTES = 10;

export const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_UPLOAD_MB ?? 8) * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = Number(process.env.MAX_DOCUMENT_UPLOAD_MB ?? 20) * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
] as const;

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;
export const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'] as const;
