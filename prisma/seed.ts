import { PrismaClient } from '@prisma/client';
import { DEFAULT_SITE_SETTINGS } from '../src/lib/site-settings';

try {
  process.loadEnvFile('.env');
} catch {
  // Environment variables may already be provided by the shell.
}

const prisma = new PrismaClient();

const SECTIONS = [
  { key: 'home', name: 'Home', sortOrder: 0 },
  { key: 'about', name: 'About', sortOrder: 10 },
  { key: 'infrastructure', name: 'Infrastructure', sortOrder: 20 },
  { key: 'activities', name: 'Activities', sortOrder: 30 },
  { key: 'projects', name: 'Programmes', sortOrder: 40 },
  { key: 'events', name: 'Events', sortOrder: 50 },
  { key: 'notices', name: 'Notices', sortOrder: 60 },
  { key: 'gallery', name: 'Photo gallery', sortOrder: 70 },
  { key: 'blog', name: 'Activity blog', sortOrder: 80 },
  { key: 'publications', name: 'Publications', sortOrder: 90 },
  { key: 'downloads', name: 'Downloads', sortOrder: 100 },
  { key: 'contact', name: 'Contact', sortOrder: 110 },
] as const;

async function main() {
  for (const section of SECTIONS) {
    await prisma.section.upsert({
      where: { key: section.key },
      create: {
        key: section.key,
        nameEn: section.name,
        nameGu: section.name,
        nameHi: section.name,
        sortOrder: section.sortOrder,
      },
      update: { sortOrder: section.sortOrder },
    });
  }

  const settings: Array<[string, unknown]> = [
    ['contact', DEFAULT_SITE_SETTINGS.contact],
    ['socials', DEFAULT_SITE_SETTINGS.socials],
    ['external', DEFAULT_SITE_SETTINGS.external],
    ['seo', DEFAULT_SITE_SETTINGS.seo],
  ];
  for (const [key, value] of settings) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: value as object },
      update: {},
    });
  }

  console.log(`Seeded ${SECTIONS.length} sections and default site settings.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
