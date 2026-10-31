import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { sanitizeRichHtml, excerptFromHtml } from '../src/lib/sanitize';

try {
  process.loadEnvFile('.env');
} catch {
  // Environment variables may already be provided by the shell.
}

const prisma = new PrismaClient();

interface WordPressPage {
  id: number;
  date: string;
  modified: string;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
}

interface WordPressPost extends WordPressPage {
  categories: number[];
}

interface MediaMapEntry {
  id: number;
  storageKey: string;
  originalName: string;
  title: string;
  altText: string;
  caption: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  sourceUrl: string;
  kind: 'IMAGE' | 'DOCUMENT';
}

interface PageDefinition {
  sourceId: number;
  path: string;
  title: string;
  section: string;
  parentPath?: string;
  featured?: boolean;
  system?: boolean;
  coverMediaId?: number;
  sortOrder?: number;
  summary?: string;
  body?: string;
}

const NOISE_PATTERNS = [
  /lorem ipsum/i,
  /click edit button/i,
  /^about simple$/i,
  /^default value$/i,
  /purchases & refunds/i,
  /why won't my payment go through/i,
  /how do i get a refund/i,
  /how do i redeem a coupon/i,
  /^0 visitors annually/i,
  /^\[siteorigin_widget/i,
];

function decodeText(html: string): string {
  const $ = cheerio.load(`<div>${html}</div>`, null, false);
  return $('div').first().text().replace(/\s+/g, ' ').trim();
}

function cleanText(input: string): string {
  return input
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\\(["'])/g, '$1')
    .replace(/\uFFFD/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNoise(text: string): boolean {
  if (text.length < 2) return true;
  return NOISE_PATTERNS.some((pattern) => pattern.test(text));
}

function extractBody(html: string): string {
  const $ = cheerio.load(`<div id="migration-root">${html}</div>`, null, false);
  const root = $('#migration-root');
  root
    .find(
      'script,style,noscript,form,input,select,textarea,button,svg,iframe,img,figure,video,audio,.sow-slider,.sow-slide-nav,.sow-slider-pagination,.elementor-widget-image',
    )
    .remove();

  const blocks: string[] = [];
  const seen = new Set<string>();

  function pushBlock(htmlBlock: string, plain: string) {
    const normalized = cleanText(plain).toLowerCase();
    if (!normalized || seen.has(normalized) || isNoise(normalized)) return;
    seen.add(normalized);
    blocks.push(htmlBlock);
  }

  function textWithBreaks(element: cheerio.Cheerio<any>): string {
    return cleanText(element.text());
  }

  function walk(element: cheerio.Cheerio<any>) {
    element.children().each((_, node) => {
      if (node.type !== 'tag') return;
      const tag = node.tagName.toLowerCase();
      const current = $(node);
      if (/^h[1-6]$/.test(tag)) {
        const text = textWithBreaks(current);
        if (!text || isNoise(text)) return;
        const heading = tag === 'h1' || tag === 'h2' ? 'h2' : tag === 'h3' ? 'h3' : 'h4';
        pushBlock(`<${heading}>${escapeHtml(text)}</${heading}>`, text);
        return;
      }
      if (tag === 'p') {
        const text = textWithBreaks(current);
        if (!text || isNoise(text)) return;
        pushBlock(`<p>${escapeHtml(text)}</p>`, text);
        return;
      }
      if (tag === 'blockquote') {
        const text = textWithBreaks(current);
        if (!text || isNoise(text)) return;
        pushBlock(`<blockquote><p>${escapeHtml(text)}</p></blockquote>`, text);
        return;
      }
      if (tag === 'ul' || tag === 'ol') {
        const items: string[] = [];
        current.children('li').each((__, li) => {
          const text = textWithBreaks($(li));
          if (text && !isNoise(text)) items.push(text);
        });
        if (items.length > 0) {
          const listHtml = `<${tag}>${items
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join('')}</${tag}>`;
          pushBlock(listHtml, items.join(' '));
        }
        return;
      }
      if (tag === 'table') {
        const rows: string[] = [];
        current.find('tr').each((__, tr) => {
          const cells = $(tr)
            .find('th,td')
            .map((___, cell) => cleanText($(cell).text()))
            .get()
            .filter(Boolean);
          if (cells.length > 0) rows.push(cells.join(' â€” '));
        });
        if (rows.length > 0) {
          const text = rows.join(' ');
          pushBlock(
            `<ul>${rows.map((row) => `<li>${escapeHtml(row)}</li>`).join('')}</ul>`,
            text,
          );
        }
        return;
      }
      walk(current);
    });
  }

  walk(root);
  return blocks.join('\n');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ABOUT_BODY = `
<h2>Science for everyone</h2>
<p>Shri O. V. Sheth Regional Community Science Center (OVSRCSC) has been working in the field of science popularisation since 1997. It was awarded a National Award for Best Effort in Science and Technology Communication in 2008 by NCSTC, Government of India.</p>
<p>The centre offers a hands-on way to experience the science ideas that have changed our lives. Its work includes learning and teaching science through experiments, puzzles, games and hands-on activities; popularising science among children and the community; explaining the science behind miracles and superstition; and motivating students towards higher studies and research.</p>
<h2>Our mission</h2>
<blockquote><p>Expansion of scientific temper for holistic and sustainable development of society.</p></blockquote>
<h2>Our story</h2>
<p>The parent NGO, Saurashtra Education Foundation (SEF), began its science mission in 1979. The centre moved into its present building in 1997 and was recognised as a Regional Centre the same year by Gujarat Council on Science and Technology (GUJCOST).</p>
<p>OVSRCSC was established by SEF and Rajkot Municipal Corporation and is managed and run by SEF.</p>
<h2>What we offer</h2>
<ul>
<li>Aryabhatt Science Museum with more than 50 working exhibits</li>
<li>Five laboratories for Biology, Chemistry, Electronics, Mathematics and Physics</li>
<li>A science and mathematics library with over 6,000 books and 50 periodicals</li>
<li>A 200-seat auditorium with multimedia facilities</li>
<li>An open-air theatre, exhibition gallery, sky-watching tower and mechanical workshop</li>
</ul>
<p>Read more <a href="/en/about/sef">about SEF</a> and <a href="/en/about/rcsc">the centre's history</a>.</p>
`;

const SEF_BODY = `
<h2>Our parent organisation</h2>
<p>Saurashtra Education Foundation (SEF) is a voluntary, non-political and not-for-profit service organisation. It came into being on Gandhi Jayanti in 1977 at the initiative of Late Shri Amritlal Yagnik, an educationist who inspired a group of Saurashtrians living in Mumbai to work for education in their native region.</p>
<p>The Saurashtra region comprises the seven districts of Amreli, Bhavnagar, Jamnagar, Junagadh, Porbandar, Rajkot and Surendranagar.</p>
<h2>SEF's mission</h2>
<blockquote><p>To improve and raise the educational standard of students in Saurashtra, with a view to economic, social and cultural development.</p></blockquote>
<p>SEF established OVSRCSC with Rajkot Municipal Corporation. The centre is managed and run by SEF.</p>
<h2>Registration</h2>
<ul>
<li>Bombay Public Trust Act: GUJ/245 Rajkot, dated 10 January 1978</li>
<li>Societies Registration Act: F-199 Rajkot, dated 10 January 1978</li>
<li>Foreign Contribution Regulation Act: 083780225</li>
<li>Income Tax Act: approved under section 80G</li>
</ul>
`;

const RCSC_BODY = `
<h2>A centre born from a science movement</h2>
<p>In 1979, a group in Rajkot began working to develop scientific temper. Their early programme, "Prayog", took science to the public to challenge belief in miracles and superstition. The work grew into hands-on science learning for students and teachers.</p>
<p>Prayog was inaugurated on Gandhi Jayanti in 1982 by Dr. H. N. Sethna, then chairman of the Atomic Energy Commission of India, and began on a part-time basis at Balbhavan, Rajkot.</p>
<h2>The present centre</h2>
<p>Land at Race Course was made available by Bharat Sevak Samaj for a small science centre, planned with a donation from Late Shri Jamnadas O. Sheth in memory of his father, Late Shri Odhavji Velji Sheth. Rajkot Municipal Corporation joined the project and an MOU was signed in July 1991.</p>
<p>The present Shri O. V. Sheth Community Science Centre began its activities in May 1997. It was recognised as a Regional Centre by GUJCOST in the same year.</p>
<h2>Infrastructure and collections</h2>
<ul>
<li>Aryabhatt Science Museum with more than 50 working exhibits</li>
<li>Five well-equipped laboratories for Electronics, Mathematics, Chemistry, Physics and Biology</li>
<li>Late Shri Narottam Shah library with over 6,000 books and about 50 periodicals</li>
<li>A 200-seat auditorium with multimedia facilities and a 500-seat open-air auditorium</li>
<li>An exhibition gallery, sky-watching tower, theory hall and administrative office</li>
<li>A mechanical workshop that produces mathematics models and museum exhibits</li>
</ul>
<p>The centre also produces mathematics teaching and learning aids, sold on a no-profit, no-loss basis.</p>
`;

const ACTIVITIES_PARENT_BODY = `
<p>OVSRCSC's activities are designed to make science hands-on, accessible and part of everyday life â€” for school students, teachers and the wider community.</p>
<p>Explore the centre's regular activities and the programmes SEF has conducted over the decades.</p>
`;

const RCSC_ACTIVITIES_BODY = `
<h2>Regular projects</h2>
<ul>
<li>Vigyan Safar</li>
<li>Vigyan Darshan</li>
<li>Sunday Science School for students</li>
<li>Aryabhatt Science Museum</li>
<li>Shri Narottam Shah Library</li>
<li>GUJCOST Science Clubs</li>
<li>Electronics Club</li>
<li>Vacation Workshops</li>
<li>Vigyan Jagrut</li>
<li>Big Bang Astronomy Club</li>
<li>Sunday Physics School</li>
</ul>
<h2>Other activities</h2>
<ul>
<li>Food adulteration detection workshops</li>
<li>Superstition eradication workshops</li>
<li>Celebration of various science days</li>
<li>Science unit development and enrichment workshops</li>
<li>Environmental awareness programmes</li>
<li>Popular lectures and science film shows</li>
<li>National-level science competitive examinations</li>
<li>Career guidance seminars</li>
<li>Workshop on Intel STDF, now known as IRIS</li>
<li>Women's programmes</li>
<li>Different science competitions</li>
<li>Natural Resource Development Centre</li>
</ul>
`;

const SEF_ACTIVITIES_BODY = `
<h2>Institute of Language Teaching, Jamnagar</h2>
<p>In 1960, Gujarat state reduced the importance of English language education, leaving many students unable to speak or write English confidently. Under the leadership of Dr. Dushyant Pandya, SEF worked to improve the situation and established the Institute of Language Teaching at Jamnagar in 1981. Due to a lack of support from the university and government, the institute was later handed over to another institution.</p>
<h2>Other activities, 1977â€“1997</h2>
<p>Besides the work of Prayog and the centre, SEF's activities included:</p>
<ul>
<li>Film shows (19)</li>
<li>Lectures (29)</li>
<li>A new leadership model with lecture-cum-film programmes at five places</li>
<li>English improvement classes at Rajkot, Bhavnagar and Jamnagar</li>
<li>Book fairs at five places</li>
<li>A tribute to young poets who died at an early age, by Late Shri Ajit Sheth, at six places</li>
<li>Two cultural programmes for fundraising by Shri Shahabuddin Rathod and Shri Pankaj Udhas</li>
<li>Publication of "Sahuna Upayogunu" and distribution of "Mangal Mate Jungle"</li>
<li>Exhibitions of agricultural implements and vocational guidance in 34 villages</li>
<li>Physics displays and live demonstrations at five places</li>
<li>Andhshradha Nivaran lectures and demonstrations at nine places</li>
<li>Mobile Science Van programmes: "You and your Environment" at five places, "Man Must Measure" at 17 places, and "Perception" at 14 places</li>
<li>Bhagini Vikas literacy classes at 21 centres</li>
<li>"Gamtu Grandhalaya" reading programmes at 46 places</li>
<li>Support for organic farming, agriculture publications, innovation and children's activities</li>
<li>Fellowships to students for Mathematics and Geography</li>
<li>TV/DVD support to three Lokshalas</li>
<li>Support to the "Dakshina" project of Ravi Krupa Trust</li>
<li>Solar cookers at five places</li>
<li>The Sadbhav Vocational Training Centre at Rajkot, offering mobile repair, auto repair and turner courses</li>
</ul>
`;

const NCSC_BODY = `
<p>The National Children's Science Congress is organised by OVSRCSC for Rajkot district as part of its GUJCOST programmes. Students and teams selected at the district level go on to the state-level event.</p>
<p>For current dates and participation details, please <a href="/en/contact">contact the centre</a>.</p>
`;

const RURAL_IT_BODY = `
<p>The Rural IT Quiz is organised by OVSRCSC for Rajkot district as part of its GUJCOST programmes. Students and teams selected at the district level go on to the state-level event.</p>
<p>For current dates and participation details, please <a href="/en/contact">contact the centre</a>.</p>
`;

const PROJECTS_PARENT_BODY = `
<p>OVSRCSC runs year-round and seasonal programmes for students, teachers and the community â€” from one-day school visits to the Sunday Science School and the Big Bang Astronomy Club.</p>
<p>Choose a programme below to learn more.</p>
`;

const FUTURE_PLANS_BODY = `
<p>These are the future plans published by OVSRCSC on its previous website.</p>
<h2>Eco Garden</h2>
<p>A garden giving visitors, teachers and students an opportunity to get closer to nature and carry out ecological studies, with areas for healing plants, fruit trees, citrus, culinary plants, economic crops, leaf litter, a tree house, succulents and vegetables.</p>
<h2>Children Science Park</h2>
<p>A park with exhibits that combine fun and play to explain basic science principles, including a life-science corner where children can observe and handle animals.</p>
<h2>Modernisation of the Aryabhatt Science Museum, laboratories and library</h2>
<p>Upgrading facilities that have been in use for more than ten years, expanding the science and technology collection, and organising a centralised educational CD library for schools.</p>
<h2>Earthquake science awareness</h2>
<p>Propagating disaster preparedness and safe construction techniques for earthquake-prone Saurashtra.</p>
<h2>Sanitation and health hygiene</h2>
<p>Low-cost sanitation and school sanitation programmes, including total sanitation campaigns for primary students.</p>
<h2>Public display board</h2>
<p>A public display of temperature, rainfall and wind velocity.</p>
<h2>Space science</h2>
<p>Expanding the space science section of the Aryabhatt Science Museum with more models, film shows and exhibitions.</p>
<h2>Environment education</h2>
<p>Science, eco and nature clubs to educate students about global warming, climate change and the environment.</p>
<h2>Natural Resource Development Centre</h2>
<p>Work on water conservation and rainwater harvesting, and information for farmers on organic farming, watershed management, soil testing and crop patterns.</p>
<h2>Shri Vikram Sarabhai Science and Technology Research Centre for Young Scientists</h2>
<p>Supporting minor research projects and bringing laboratory research to the knowledge of people who can put it into practice.</p>
<h2>Popularisation of science through dramas, skits, songs and folk songs</h2>
<p>Using performance to communicate science, especially with primary students, on subjects such as superstition, health, hygiene and sanitation.</p>
<h2>Laboratory for on-the-spot testing kits</h2>
<p>Developing kits that allow women to test everyday items such as milk, ghee, food products and spices.</p>
<h2>Scholarship and fellowship for higher studies</h2>
<p>A data bank to guide bright students who need support to pursue higher studies and research.</p>
<h2>Science kit for primary students</h2>
<p>Developing an all-purpose hands-on science kit so that students can continue experiments after training.</p>
<h2>Schools for sports and women in the 21st century</h2>
<p>Topics identified for further study.</p>
<h2>Science education guidance cell</h2>
<p>Guidance for young people to choose the right career direction in science.</p>
<h2>Science and technology for rural areas</h2>
<p>Extending useful technology to rural communities.</p>
`;

const PUBLICATION_BODY = `
<p>OVSRCSC publishes science newsletters and books in Gujarati and English.</p>
<h2>Newsletters</h2>
<ul>
<li>Khagol Patrika â€” an astronomy e-newsletter in Gujarati, published fortnightly on the 1st and 16th of each month</li>
<li>Prakruti Path â€” an environment e-newsletter in Gujarati, published fortnightly on the 5th and 20th of each month</li>
<li>Rasayanam â€” a chemistry e-newsletter in Gujarati, published fortnightly on the 10th and 25th of each month</li>
</ul>
<h2>Books and publications</h2>
<ul>
<li>Suryamandal ni Zankhi â€” Dr. J. J. Rawal</li>
<li>Dr. Vikram Sarabhai Parichay Pustika â€” Dr. R. J. Bhayani</li>
<li>Dr. A. P. J. Abdul Kalam, Bharat na Swapna Drashta â€” Dr. R. J. Bhayani</li>
<li>Rasoda Prayogpothi</li>
<li>Paryavaran Sashaktikaran Samput (set of 6 books)</li>
<li>Sajiv Kheti (set of 12 books)</li>
<li>Quotations of Scientists</li>
</ul>
`;

const TESTIMONIAL_BODY = `
<p class="lead">A report on the International Year of Physics 2005 celebrations at Rajkot, organised with local IAPT life members and the Regional Community Science Centre.</p>
<p>The year-long programme was inaugurated on 12 January 2005 by Prof. P. C. Vaidya, a pioneer in relativity in India. Prof. A. V. Narlikar presided, and Prof. M. K. Mehta, former Director of the Nuclear Physics Department at BARC, addressed the gathering.</p>
<p>Over the year, the centre hosted popular lectures, film shows, elocution competitions, workshops and a district-level National Science Seminar. Speakers included Prof. R. M. Sharma, Prof. Anjan Joshipura, Prof. H. P. Joshi, Prof. Mihir Joshi, Dr. Parantap Pathak, Shri Rajiv Vartak, Prof. R. V. Upadhyay and Prof. U. C. Joshi.</p>
<p>The programme continued into January 2006 with a seminar for teachers and research fellows, featuring Prof. Anil Gupta of IIM Ahmedabad, Dr. Dilip Ahalpara of IPR Gandhinagar and Prof. H. H. Joshi of Saurashtra University.</p>
`;

const PAGE_DEFINITIONS: PageDefinition[] = [
  { sourceId: 6025, path: 'about', title: 'About OVSRCSC', section: 'about', system: true, sortOrder: 10, coverMediaId: 6278, body: ABOUT_BODY, summary: 'A regional community science centre working for science popularisation in Rajkot since 1997.' },
  { sourceId: 8, path: 'about/sef', title: 'About SEF', section: 'about', parentPath: 'about', sortOrder: 11, body: SEF_BODY, summary: 'Saurashtra Education Foundation, the parent organisation of OVSRCSC.' },
  { sourceId: 50, path: 'about/rcsc', title: 'Our history', section: 'about', parentPath: 'about', sortOrder: 12, coverMediaId: 189, body: RCSC_BODY, summary: 'How a science movement in Rajkot became a regional community science centre.' },
  { sourceId: 36, path: 'about/mission', title: 'Our mission', section: 'about', parentPath: 'about', sortOrder: 13 },
  { sourceId: 38, path: 'about/links', title: 'Links', section: 'about', parentPath: 'about', sortOrder: 14 },
  { sourceId: 6252, path: 'infrastructure', title: 'Infrastructure', section: 'infrastructure', system: true, sortOrder: 20, coverMediaId: 6266, summary: 'Laboratories, museum, library, auditorium and other facilities at OVSRCSC.' },
  { sourceId: 11, path: 'activities', title: 'Activities', section: 'activities', system: true, sortOrder: 30, coverMediaId: 6313, body: ACTIVITIES_PARENT_BODY, summary: 'Hands-on science activities for students, teachers and the community.' },
  { sourceId: 57, path: 'activities/rcsc', title: "Centre activities", section: 'activities', parentPath: 'activities', sortOrder: 31, coverMediaId: 6307, body: RCSC_ACTIVITIES_BODY, summary: 'Regular projects and activities run by OVSRCSC.' },
  { sourceId: 61, path: 'activities/sef', title: 'SEF activities', section: 'activities', parentPath: 'activities', sortOrder: 32, coverMediaId: 6366, body: SEF_ACTIVITIES_BODY, summary: 'SEF science and education programmes from 1977 to 1997.' },
  { sourceId: 6450, path: 'activities/ncsc', title: 'National Childrenâ€™s Science Congress', section: 'activities', parentPath: 'activities', sortOrder: 33, coverMediaId: 6745, body: NCSC_BODY, summary: 'The National Childrenâ€™s Science Congress for Rajkot district.' },
  { sourceId: 6471, path: 'activities/rural-it-quiz', title: 'Rural IT Quiz', section: 'activities', parentPath: 'activities', sortOrder: 34, body: RURAL_IT_BODY, summary: 'The Rural IT Quiz for Rajkot district.' },
  { sourceId: 6333, path: 'projects', title: 'Programmes', section: 'projects', system: true, sortOrder: 40, coverMediaId: 6374, body: PROJECTS_PARENT_BODY, summary: 'Regular and seasonal science programmes at OVSRCSC.' },
  { sourceId: 6362, path: 'projects/vacation-workshops', title: 'Vacation Workshops', section: 'projects', parentPath: 'projects', featured: true, sortOrder: 41, coverMediaId: 6365 },
  { sourceId: 6372, path: 'projects/vigyan-safar', title: 'Vigyan Safar', section: 'projects', parentPath: 'projects', featured: true, sortOrder: 42, coverMediaId: 6374 },
  { sourceId: 6379, path: 'projects/vigyan-darshan', title: 'Vigyan Darshan: Rural Outreach', section: 'projects', parentPath: 'projects', sortOrder: 43, coverMediaId: 6382 },
  { sourceId: 6387, path: 'projects/sunday-science-school', title: 'Sunday Science School', section: 'projects', parentPath: 'projects', featured: true, sortOrder: 44, coverMediaId: 6389 },
  { sourceId: 6335, path: 'projects/big-bang-astronomy-club', title: 'Big Bang Astronomy Club', section: 'projects', parentPath: 'projects', featured: true, sortOrder: 45, coverMediaId: 6346 },
  { sourceId: 6411, path: 'projects/gujcost-programs', title: 'GUJCOST Programmes', section: 'projects', parentPath: 'projects', sortOrder: 46, coverMediaId: 6414 },
  { sourceId: 6394, path: 'projects/popular-lectures-in-health', title: 'Popular Lectures in Health', section: 'projects', parentPath: 'projects', sortOrder: 47, coverMediaId: 6397 },
  { sourceId: 6402, path: 'projects/popular-lecture-in-science-and-technology', title: 'Popular Lectures in Science and Technology', section: 'projects', parentPath: 'projects', sortOrder: 48, coverMediaId: 6405 },
  { sourceId: 63, path: 'future-plans', title: 'Future Plans', section: 'projects', sortOrder: 49, body: FUTURE_PLANS_BODY, summary: 'Plans published by OVSRCSC for future facilities, programmes and outreach.' },
  { sourceId: 6233, path: 'publications', title: 'Our Publications', section: 'publications', system: true, sortOrder: 50, coverMediaId: 6239, body: PUBLICATION_BODY, summary: 'Newsletters and books published by OVSRCSC.' },
  { sourceId: 66, path: 'testimonials', title: 'International Year of Physics 2005', section: 'about', sortOrder: 60, body: TESTIMONIAL_BODY, summary: 'A report on the International Year of Physics celebrations at Rajkot in 2005.' },
];

function normalizeBasename(value: string): string {
  return value
    .toLowerCase()
    .replace(/-\d+x\d+(?=\.[a-z0-9]+$)/, '')
    .replace(/[^a-z0-9.]+/g, '-');
}

function mediaForId(id: number | undefined, map: MediaMapEntry[]): string | null {
  if (!id) return null;
  return map.find((entry) => entry.id === id)?.storageKey ?? null;
}

function mediaForUrl(url: string, map: MediaMapEntry[]): MediaMapEntry | null {
  try {
    const base = normalizeBasename(decodeURIComponent(new URL(url).pathname.split('/').pop() ?? ''));
    return (
      map.find((entry) => normalizeBasename(entry.originalName) === base) ??
      map.find((entry) => normalizeBasename(entry.sourceUrl.split('/').pop() ?? '') === base) ??
      null
    );
  } catch {
    return null;
  }
}

async function main() {
  const pages = JSON.parse(
    await fs.readFile('data/source/wp-pages.json', 'utf8').then((text) => text.replace(/^\uFEFF/, '')),
  ) as WordPressPage[];
  const posts = JSON.parse(
    await fs.readFile('data/source/wp-posts.json', 'utf8').then((text) => text.replace(/^\uFEFF/, '')),
  ) as WordPressPost[];
  const mediaMap = JSON.parse(
    await fs.readFile('data/source/media-map.json', 'utf8').then((text) => text.replace(/^\uFEFF/, '')),
  ) as MediaMapEntry[];

  const admin = await prisma.user.findFirst({
    where: { roles: { some: { role: 'SUPER_ADMIN' } }, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin) {
    throw new Error('Create the first Super Admin with npm run admin:create before migrating content.');
  }

  const sections = await prisma.section.findMany();
  const sectionByKey = new Map(sections.map((section) => [section.key, section]));
  const requiredSections = new Set(PAGE_DEFINITIONS.map((definition) => definition.section));
  for (const key of requiredSections) {
    if (!sectionByKey.has(key)) throw new Error(`Missing section "${key}". Run npm run db:seed first.`);
  }

  for (const media of mediaMap) {
    await prisma.mediaAsset.upsert({
      where: { storageKey: media.storageKey },
      create: {
        storageKey: media.storageKey,
        originalName: media.originalName,
        mimeType: media.mimeType,
        sizeBytes: media.sizeBytes,
        width: media.width,
        height: media.height,
        kind: media.kind === 'DOCUMENT' ? 'DOCUMENT' : 'IMAGE',
        title: media.title,
        altText: media.altText,
        caption: media.caption,
        isPublic: true,
        createdById: admin.id,
      },
      update: {
        title: media.title,
        altText: media.altText,
        caption: media.caption,
        isPublic: true,
      },
    });
  }

  const pageById = new Map(pages.map((page) => [page.id, page]));
  let pagesMigrated = 0;

  for (const definition of PAGE_DEFINITIONS) {
    const source = pageById.get(definition.sourceId);
    if (!source) throw new Error(`Source page ${definition.sourceId} was not found.`);
    const section = sectionByKey.get(definition.section);
    if (!section) throw new Error(`Section ${definition.section} was not found.`);
    const body = sanitizeRichHtml(
      definition.body ?? extractBody(source.content.rendered),
      { allowTables: true },
    );
    const title = cleanText(definition.title || decodeText(source.title.rendered));
    const summary =
      definition.summary || (body ? excerptFromHtml(body, 240) : null) || null;
    const publishedAt = new Date(source.date);

    const page = await prisma.page.upsert({
      where: { path: definition.path },
      create: {
        path: definition.path,
        sectionId: section.id,
        parentPath: definition.parentPath ?? null,
        status: 'PUBLISHED',
        isSystem: Boolean(definition.system),
        featured: Boolean(definition.featured),
        sortOrder: definition.sortOrder ?? 0,
        coverKey: mediaForId(definition.coverMediaId, mediaMap),
        publishedAt,
        createdById: admin.id,
        updatedById: admin.id,
      },
      update: {
        sectionId: section.id,
        parentPath: definition.parentPath ?? null,
        status: 'PUBLISHED',
        isSystem: Boolean(definition.system),
        featured: Boolean(definition.featured),
        sortOrder: definition.sortOrder ?? 0,
        coverKey: mediaForId(definition.coverMediaId, mediaMap),
        publishedAt,
        updatedById: admin.id,
      },
    });

    const existingTranslation = await prisma.pageTranslation.findUnique({
      where: { pageId_locale: { pageId: page.id, locale: 'EN' } },
    });
    await prisma.pageTranslation.upsert({
      where: { pageId_locale: { pageId: page.id, locale: 'EN' } },
      create: {
        pageId: page.id,
        locale: 'EN',
        title,
        summary,
        bodyHtml: body,
        seoTitle: null,
        seoDescription: summary,
        status: 'PUBLISHED',
      },
      update: {
        title,
        summary,
        bodyHtml: body,
        seoDescription: summary,
        status: 'PUBLISHED',
      },
    });

    if (!existingTranslation) {
      await prisma.pageRevision.create({
        data: {
          pageId: page.id,
          locale: 'EN',
          title,
          summary,
          bodyHtml: body,
          status: 'PUBLISHED',
          note: `Migrated from the previous website (source page ${source.id})`,
          editedById: admin.id,
        },
      });
    }
    pagesMigrated += 1;
  }

  const categoryFile = await fs
    .readFile('data/source/wp-categories.json', 'utf8')
    .then((text) => text.replace(/^\uFEFF/, ''))
    .catch(() => '[]');
  const categories = JSON.parse(categoryFile) as Array<{ id: number; name: string }>;
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const blogSection = sectionByKey.get('blog');

  let postsMigrated = 0;
  for (const post of posts) {
    const body = sanitizeRichHtml(extractBody(post.content.rendered), { allowTables: true });
    const textLength = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
    const imageMatch = post.content.rendered.match(/wp-image-(\d+)/);
    const firstImage = [...post.content.rendered.matchAll(/<img[^>]+src="([^"]+)"/g)]
      .map((match) => match[1])
      .find((url) => url.includes('/wp-content/uploads/'));
    const cover =
      mediaForId(imageMatch ? Number(imageMatch[1]) : undefined, mediaMap) ??
      (firstImage ? mediaForUrl(firstImage, mediaMap)?.storageKey ?? null : null);
    const title = cleanText(decodeText(post.title.rendered));
    const summary = textLength > 0 ? excerptFromHtml(body, 220) : null;
    const publishedAt = new Date(post.date);
    const category = post.categories
      .map((id) => categoryNames.get(id))
      .find((name) => name && name.toLowerCase() !== 'uncategorized');

    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        slug: post.slug,
        sectionId: blogSection!.id,
        status: textLength > 0 || cover ? 'PUBLISHED' : 'DRAFT',
        publishedAt,
        category: category ?? null,
        coverKey: cover,
        createdById: admin.id,
      },
      update: {
        sectionId: blogSection!.id,
        status: textLength > 0 || cover ? 'PUBLISHED' : 'DRAFT',
        publishedAt,
        category: category ?? null,
        coverKey: cover,
      },
    });
    const blog = await prisma.blogPost.findUniqueOrThrow({ where: { slug: post.slug } });
    await prisma.blogTranslation.upsert({
      where: { postId_locale: { postId: blog.id, locale: 'EN' } },
      create: { postId: blog.id, locale: 'EN', title, summary, bodyHtml: body },
      update: { title, summary, bodyHtml: body },
    });
    postsMigrated += 1;
  }

  const galleryPage = pageById.get(6305);
  let galleryItems = 0;
  if (galleryPage) {
    const $ = cheerio.load(`<div id="gallery-root">${galleryPage.content.rendered}</div>`, null, false);
    const imageUrls = $('#gallery-root img')
      .map((_, element) => $(element).attr('src'))
      .get()
      .filter((url): url is string => Boolean(url && url.includes('/wp-content/uploads/')));
    const captions = $('#gallery-root figcaption')
      .map((_, element) => cleanText($(element).text()))
      .get();
    const items = imageUrls
      .map((url, index) => {
        const media = mediaForUrl(url, mediaMap);
        return media ? { media, caption: captions[index] || media.title } : null;
      })
      .filter((item): item is { media: MediaMapEntry; caption: string } => item !== null);

    if (items.length > 0) {
      const gallerySection = sectionByKey.get('gallery');
      if (!gallerySection) throw new Error('Missing gallery section.');
      const album = await prisma.galleryAlbum.upsert({
        where: { slug: 'photo-highlights' },
        create: {
          slug: 'photo-highlights',
          sectionId: gallerySection.id,
          status: 'PUBLISHED',
          coverKey: items[0].media.storageKey,
          sortOrder: 10,
        },
        update: {
          sectionId: gallerySection.id,
          status: 'PUBLISHED',
          coverKey: items[0].media.storageKey,
          sortOrder: 10,
        },
      });
      await prisma.albumTranslation.upsert({
        where: { albumId_locale: { albumId: album.id, locale: 'EN' } },
        create: {
          albumId: album.id,
          locale: 'EN',
          title: 'Photo highlights',
          description:
            'A selection of activities, lectures, sky-watching events and celebrations at OVSRCSC.',
        },
        update: {
          title: 'Photo highlights',
          description:
            'A selection of activities, lectures, sky-watching events and celebrations at OVSRCSC.',
        },
      });
      await prisma.galleryItem.deleteMany({ where: { albumId: album.id } });
      let order = 0;
      for (const item of items) {
        const mediaRow = await prisma.mediaAsset.findUnique({
          where: { storageKey: item.media.storageKey },
          select: { id: true },
        });
        if (!mediaRow) continue;
        await prisma.galleryItem.create({
          data: {
            albumId: album.id,
            mediaId: mediaRow.id,
            caption: item.caption,
            altText: item.caption || item.media.altText,
            sortOrder: order,
          },
        });
        order += 1;
      }
      galleryItems = order;
    }
  }

  const downloadsSection = sectionByKey.get('downloads');
  let resources = 0;
  if (downloadsSection) {
    const annualReports = [
      { mediaId: 6430, title: 'Annual Report 2018â€“19' },
      { mediaId: 6438, title: 'Annual Report 2019â€“20' },
    ];
    for (const report of annualReports) {
      const media = mediaMap.find((entry) => entry.id === report.mediaId);
      if (!media) continue;
      const url = `/media/${media.storageKey}`;
      const existing = await prisma.resourceLink.findFirst({
        where: { sectionId: downloadsSection.id, url },
      });
      if (!existing) {
        await prisma.resourceLink.create({
          data: {
            sectionId: downloadsSection.id,
            title: report.title,
            description: 'Annual report published by OVSRCSC.',
            url,
            category: 'Annual reports',
            isExternal: false,
            isPublished: true,
            sortOrder: resources,
          },
        });
      }
      resources += 1;
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'content.migrate',
      entityType: 'Migration',
      summary: `Migrated ${pagesMigrated} pages, ${postsMigrated} posts, ${mediaMap.length} media assets and ${galleryItems} gallery items`,
      metadata: { pages: pagesMigrated, posts: postsMigrated, media: mediaMap.length, galleryItems },
    },
  });

  await fs.writeFile(
    'data/source/migration-report.json',
    `${JSON.stringify(
      {
        migratedAt: new Date().toISOString(),
        pages: pagesMigrated,
        posts: postsMigrated,
        mediaAssets: mediaMap.length,
        galleryItems,
        resources,
        notices: 0,
        events: 0,
        notes: [
          'All migrated content is English. Gujarati and Hindi fall back to English with a visible notice.',
          'Personal names from the old team, trustee and managing-committee lists were not published pending verification.',
          'The old events archive and notices were not available through the site API at migration time.',
          'Five 2017â€“18 annual-report PDFs were preserved in the media library but not published as downloads because their individual titles could not be verified.',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(
    `Migration complete: ${pagesMigrated} pages, ${postsMigrated} posts, ${mediaMap.length} media assets, ${galleryItems} gallery items, ${resources} resource links.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
