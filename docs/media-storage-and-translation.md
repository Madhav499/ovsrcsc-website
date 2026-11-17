# Media storage and automatic translation — operations

## Photographs and other media

### Where files are stored

`src/server/media/storage.ts` has two backends. Both use the same storage keys (for example `2026/11/<uuid>.webp`), and visitors always load files through `/media/<key>`, which checks that a file is public and not archived.

| Driver | Selected when | Persistent on Vercel? |
| --- | --- | --- |
| `local` | default | **No.** On Vercel, uploads are refused with a clear message. |
| `blob` (Vercel Blob, private) | `BLOB_READ_WRITE_TOKEN` is set, or `MEDIA_STORAGE=blob` | Yes |

Production status at the time of writing: no Blob store is connected, and production has no media records. The existing photographs exist only in the local database and `storage/media`.

### Making production persistent (one-time setup)

1. In the Vercel project, go to **Storage → Create → Blob** and connect the store to the project. This adds `BLOB_READ_WRITE_TOKEN`.
2. Locally, pull the variables (`vercel env pull .env.local`) or set `BLOB_READ_WRITE_TOKEN` in your environment.
3. Copy the existing files, keeping their keys:
   - Dry run: `npm run media:migrate-to-blob`
   - Upload: `npm run media:migrate-to-blob -- --apply`

   The script never deletes or overwrites anything. Files already in Blob are skipped, and database records are not changed.
4. The database rows (MediaAsset, albums and so on) must also exist in the production database. Moving them is a separate, deliberate content migration and is not done by this script.
5. Redeploy.

### Managing photographs (admin → Photo gallery)

| Task | How |
| --- | --- |
| Add | Use **Upload photographs** (up to 20 per upload; JPG, PNG, WebP or GIF; size limit `MAX_IMAGE_UPLOAD_MB`), or add from the media library. Changes go live when the album is saved. |
| Edit | Each photograph has its own caption and alt text. |
| Reorder | Use ↑ / ↓. The public order follows the album. |
| Replace | Uploads a new file into the same position and keeps the caption and alt text. The old file is left untouched for anything else that uses it. |
| Remove | Asks for confirmation, then takes the photograph out of this album only. The file stays in the media library. |
| Unpublish | Untick **Published** to hide the whole album without deleting anything. |
| Delete a file permanently | Archive it in **Media library**. This is refused while any album, page, event or other content still uses the file. |

Who can do this: Super Admin, Section Editor and Content Contributor (`gallery.manage`, plus `media.upload` for uploads), limited to the sections they are assigned. Publishing needs publish rights in that section. Every rule is enforced in the server actions, not only in the interface, and every upload, save and archive is written to the audit log.

## Automatic translation (English → Gujarati, Hindi)

- English is the only source. After every English save of a page, blog post, notice, event, announcement or photo album, including photo captions and alt text, Gujarati and Hindi are generated with Google Cloud Translation. This runs after the response is sent, so publishing never waits for translation and never fails because of it.
- `TranslationState` stores, for each item and language:
  - status (`PENDING`, `DONE`, `STALE`, `FAILED` or `LEGACY`);
  - a hash of the English source;
  - provider, number of attempts, the last error, and when it was translated.
- If the English changes, the previous translation stays on the site until the new one is ready. If Google fails, the last good translation is kept and a safe error message is recorded. The English row is never written.
- Hand-written translations found before the first machine run are copied to `legacyBackup` before they are replaced.
- URLs, email addresses, phone numbers, inline code and `{placeholders}` are never translated. Contact and enquiry messages are not translated at all.
- **Admin → Translations** (Super Admin) shows the status of every item and provides **Regenerate** and **Translate everything that needs it**.

### Credentials (server only — never `NEXT_PUBLIC_`)

Set one of these in the Vercel project's environment variables:

- `GOOGLE_TRANSLATE_CREDENTIALS_JSON`: a service-account key, as raw JSON or base64. The account needs the role *Cloud Translation API User*, and Cloud Translation API v3 is used. The project comes from the key, or from `GOOGLE_TRANSLATE_PROJECT_ID` if set.
- `GOOGLE_TRANSLATE_API_KEY`: an API key restricted to the Cloud Translation API. API v2 is used, and the key is sent in a header, never in the URL.

Without credentials, nothing is translated. English is shown with the existing notice, and the admin page explains what is missing.

### Interface text (menus, buttons, labels)

`src/i18n/gu.ts` and `hi.ts` are generated from `en.ts`:

- Dry run: `npm run i18n:translate`
- Translate and write the files: `npm run i18n:translate -- --apply`

Only new or changed strings are sent (`src/i18n/machine-cache.json`). The first run backs up the hand-written files to `src/i18n/legacy/`. Review the result before committing.

### What has been verified

- Unit tests cover the client: v2 and v3 requests, JWT signing, retries and back-off, non-retryable errors, batching, the `NEXT_PUBLIC_` guard, protected tokens, and the stale, failure, legacy and not-configured rules.
- The full in-app pipeline was tested locally against a stub of the Google v2 API (the endpoint override works only outside production). That covered the after-save hook, regenerate, and gu/hi pages and captions, with emails and URLs preserved.
- **Not yet verified:** a live call to Google, because no credentials were available.
