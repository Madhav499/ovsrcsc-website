# Next Session Handoff

Updated: 2026-11-17 · Branch: `redesign/heritage-journal` (from `main` @ `1219456`)

## State

The public website has been redesigned to the approved **Heritage Science × Illustrated Journal ×
Contemporary Discovery** identity. Design system: `design-system/ovsrcsc-meridian/MASTER.md`.

Verified on a clean production build (`npm run build`, three consecutive clean builds pass):
typecheck ✅ · ESLint 0 errors (1 pre-existing admin warning) · Vitest ✅ · 49 browser regression
checks ✅ · axe-core WCAG 2 A/AA: 0 violations on 16 pages across en/gu/hi.

Nothing has been pushed or deployed.

## Backend / protected areas

No changes to `src/app/(admin)/**`, `src/components/admin/**`, `src/server/**`, `prisma/**`,
`src/middleware.ts` or migrations. Two shared files changed:

- `src/lib/fonts.ts` (admin fonts) — same families and CSS variables, now self-hosted.
  Reason: build-time Google Fonts requests failed 2 of 3 clean production builds.
- `src/lib/navigation.ts` — public nav only (mega-menu data). Removed the link to
  `/about/eminent-visitors`, which has no CMS page and returned 404.

## Open items (genuine dependencies)

1. **Multilingual CMS translation workflow (brief Part 10) — not implemented.** The current schema
   has no provenance, source-version or stale-status fields, and no Google Cloud Translation
   credentials exist in any environment. Implementing it needs a Prisma migration on production
   data and new admin UI, which is outside this public-site task's safe scope. Proposed design:
   - Add to `PageTranslation`, `BlogTranslation`, `EventTranslation`, `NoticeTranslation`,
     `AlbumTranslation`: `origin` enum (`MANUAL` | `MACHINE` | `MACHINE_REVIEWED`),
     `sourceHash` (hash of the English fields it was made from), `translatedAt`, `reviewedById`.
   - Stale = `sourceHash` ≠ current hash of the English translation.
   - Server-only job (`src/server/services/translation.ts`) calls Google Cloud Translation v3 with a
     service-account key in `GOOGLE_TRANSLATE_*` env vars; it only fills missing locales or
     refreshes rows whose `origin = MACHINE`; never overwrites `MANUAL`; failures keep the last
     good row and never block publishing. Machine rows stay `DRAFT` until reviewed.
   - Admin: a per-locale badge (manual / machine / stale) and a "review & publish" action.
2. **Content:** all CMS pages exist only in English (gu/hi fall back with a notice). No events or
   notices are published locally, so those layouts were verified with empty states only.
3. **Data quality:** some migrated CMS text contains mojibake (e.g. "Childrenâ€™s"). It is repaired
   at render time (`src/lib/meridian/text.ts`, unit-tested); fix it at source in the CMS.
4. **Opening hours** are not published anywhere; the Visit page asks visitors to call ahead.
   If the center publishes hours, add them to site settings and the Visit essentials block.
5. **Performance:** no Lighthouse/field measurement was run. Three.js is code-split (not in first
   load JS); the telescope GLB (411 KB) loads only on capable desktops near the exhibit.
6. Admin screens behind login were not visually re-checked (login page and auth redirect verified).

## Do not

- Never use custom classes/tokens from `globals.css` in public code (admin shares that file).
- Never put formulas in uppercase labels (π → Π, g → G).
- Do not reset/drop the DB or overwrite `.env`.
