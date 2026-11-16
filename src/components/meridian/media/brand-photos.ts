import type { StaticImageData } from 'next/image';
import amphitheatreNight from '@/assets/meridian/photos/amphitheatre-night.jpg';
import biologyLab from '@/assets/meridian/photos/biology-lab.jpg';
import biologyLabWorkshop from '@/assets/meridian/photos/biology-lab-workshop.jpg';
import centreFacade from '@/assets/meridian/photos/centre-facade.jpg';
import chemistryLab from '@/assets/meridian/photos/chemistry-lab.jpg';
import electronicsLab from '@/assets/meridian/photos/electronics-lab.jpg';
import lectureHall from '@/assets/meridian/photos/lecture-hall.jpg';
import library from '@/assets/meridian/photos/library.jpg';
import mathematicsLab from '@/assets/meridian/photos/mathematics-lab.jpg';
import physicsLab from '@/assets/meridian/photos/physics-lab.jpg';
import scienceMuseum from '@/assets/meridian/photos/science-museum.jpg';
import skyWatch from '@/assets/meridian/photos/sky-watch.jpg';
import solarEclipse from '@/assets/meridian/photos/solar-eclipse.jpg';
import telescopeSession from '@/assets/meridian/photos/telescope-session.jpg';
import telescopes from '@/assets/meridian/photos/telescopes.jpg';

/**
 * Curated institutional photographs (from the center's own media library,
 * storage/media/legacy) used for the fixed, non-CMS parts of the design.
 * Captions were verified against the original WordPress media metadata.
 * CMS-driven sections (events, blog, gallery, notices) never use these.
 */
export const BRAND_PHOTOS = {
  amphitheatreNight,
  biologyLab,
  biologyLabWorkshop,
  centreFacade,
  chemistryLab,
  electronicsLab,
  lectureHall,
  library,
  mathematicsLab,
  physicsLab,
  scienceMuseum,
  skyWatch,
  solarEclipse,
  telescopeSession,
  telescopes,
} satisfies Record<string, StaticImageData>;
