# Next Session Handoff

Updated: 2026-11-17 · Branch: `redesign/meridian-public`

## State

The complete public-site MERIDIAN redesign is implemented on `redesign/meridian-public`
(uncommitted on top of WIP checkpoint `5b10bdf`). Admin, backend, auth, Prisma, middleware and
config are untouched (0 diff lines vs tag `meridian-admin-baseline` = `62d93f5`).
`src/app/globals.css` has been restored byte-for-byte to the baseline, so the admin looks exactly as
committed. Typecheck ✅ · lint ✅ (0 errors; 1 pre-existing admin warning) · `next build` ✅.

Design system: `design-system/ovsrcsc-meridian/MASTER.md`.

## Architecture

- Public stylesheet `src/styles/meridian/meridian.css` (scoped `body[data-site='meridian']`), public
  fonts `src/lib/meridian-fonts.ts`, components `src/components/meridian/**`, helpers `src/lib/meridian/site.ts`.
- Legacy `src/components/site/**` and `src/components/ui/**` were removed (public-only, unreferenced).
- New: `src/app/sitemap.ts`, `src/app/robots.ts`, `search/loading.tsx`, brand assets `src/assets/meridian/**`.
- i18n: new `mx.*` keys in en/gu/hi (no existing keys renamed/removed).

## Do not

- Never use custom classes/tokens from `globals.css` in public code (admin shares that file).
- Do not reset/drop the DB or overwrite `.env`.

## Open items

1. The local `ovsrcsc` DB contains no CMS pages/posts/events/albums (only 12 sections, 1 user,
   1 test notice), so CMS-populated layouts were verified structurally, not with real content.
   Load content (see final report) and review About/Programmes/Blog/Gallery populated.
2. Admin screens behind login need a signed-in visual check (login page verified).
3. `/admin/change-password` throws when visited without a session (pre-existing admin behaviour).
