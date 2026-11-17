/**
 * Generate the Gujarati and Hindi interface dictionaries (src/i18n/gu.ts,
 * hi.ts) from English (src/i18n/en.ts) with Google Cloud Translation.
 *
 *   npm run i18n:translate              # dry run: lists what would change
 *   npm run i18n:translate -- --apply   # translate and write the files
 *   npm run i18n:translate -- --apply --force   # ignore the cache
 *
 * - Only new or changed English strings are sent (src/i18n/machine-cache.json
 *   records the English hash each translation was made from).
 * - The first run backs up the hand-written dictionaries to
 *   src/i18n/legacy/*.manual.json before replacing them.
 * - Codes, all-caps identifiers and strings without letters are copied as-is;
 *   URLs, emails, phone numbers and {placeholders} are protected.
 * - If a batch fails, the existing translation for those keys is kept.
 *
 * Needs GOOGLE_TRANSLATE_CREDENTIALS_JSON or GOOGLE_TRANSLATE_API_KEY.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { en } from '../src/i18n/en';
import { gu } from '../src/i18n/gu';
import { hi } from '../src/i18n/hi';
import { translateHtml, translationConfig } from '../src/server/translation/google-core';
import { prepareSegment, restoreSegment } from '../src/server/translation/protect';

const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');
const dir = path.resolve('src/i18n');
const cacheFile = path.join(dir, 'machine-cache.json');
type Cache = Record<string, { hash: string; gu?: string; hi?: string }>;

const hash = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 16);
/** Identifiers and codes ("OVSRCSC · RAJKOT", "ISO 400", "→") stay as written. */
const copyAsIs = (value: string) => !/[a-z]/.test(value) || /^[A-Z0-9 ·.,:/&()+\-–—▸→]+$/.test(value);

function serialise(name: string, dict: Record<string, string>): string {
  const lines = Object.keys(en).map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(dict[key] ?? (en as Record<string, string>)[key])},`);
  return `// Generated from en.ts by scripts/translate-ui.ts (Google Cloud Translation).\n// Edit the English source, then run \`npm run i18n:translate -- --apply\`.\nimport type { Dictionary } from './en';\n\nexport const ${name}: Dictionary = {\n${lines.join('\n')}\n};\n`;
}

async function main() {
  const source = en as Record<string, string>;
  const cache: Cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
  const current = { gu: { ...(gu as Record<string, string>) }, hi: { ...(hi as Record<string, string>) } };
  const pending = Object.keys(source).filter((key) => force || cache[key]?.hash !== hash(source[key]) || !cache[key]?.gu || !cache[key]?.hi);
  console.log(`${Object.keys(source).length} strings · ${pending.length} new or changed`);
  if (!apply) {
    pending.slice(0, 40).forEach((key) => console.log(`  ${key}`));
    if (pending.length > 40) console.log(`  … ${pending.length - 40} more`);
    console.log('Dry run. Re-run with --apply to translate and write gu.ts / hi.ts.');
    return;
  }
  translationConfig(); // throws a clear message when credentials are missing

  const legacyDir = path.join(dir, 'legacy');
  for (const [name, dict] of Object.entries(current)) {
    const backup = path.join(legacyDir, `${name}.manual.json`);
    if (!existsSync(backup)) {
      mkdirSync(legacyDir, { recursive: true });
      writeFileSync(backup, `${JSON.stringify(dict, null, 2)}\n`);
      console.log(`backed up hand-written ${name}.ts → ${path.relative(process.cwd(), backup)}`);
    }
  }

  let failures = 0;
  for (const locale of ['gu', 'hi'] as const) {
    const keys = pending.filter((key) => !copyAsIs(source[key]));
    for (const key of pending.filter((k) => copyAsIs(source[k]))) current[locale][key] = source[key];
    for (let i = 0; i < keys.length; i += 100) {
      const batch = keys.slice(i, i + 100);
      try {
        const { texts } = await translateHtml(batch.map((key) => prepareSegment(source[key], 'text')), locale);
        batch.forEach((key, j) => {
          current[locale][key] = restoreSegment(texts[j], 'text');
        });
      } catch (error) {
        failures += batch.length;
        console.error(`${locale}: ${batch.length} strings kept unchanged — ${error instanceof Error ? error.message : 'failed'}`);
        batch.forEach((key) => delete cache[key]);
        continue;
      }
      batch.forEach((key) => {
        cache[key] = { ...cache[key], hash: hash(source[key]), [locale]: current[locale][key] };
      });
    }
    for (const key of pending.filter((k) => copyAsIs(source[k]))) cache[key] = { ...cache[key], hash: hash(source[key]), [locale]: source[key] };
  }

  writeFileSync(path.join(dir, 'gu.ts'), serialise('gu', current.gu));
  writeFileSync(path.join(dir, 'hi.ts'), serialise('hi', current.hi));
  writeFileSync(cacheFile, `${JSON.stringify(cache, null, 2)}\n`);
  console.log(`Wrote gu.ts and hi.ts${failures ? ` (${failures} strings kept from the previous version)` : ''}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
