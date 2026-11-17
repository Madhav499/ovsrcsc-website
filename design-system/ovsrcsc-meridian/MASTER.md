# MERIDIAN — Public Design System (Master)

> Internal codename. "MERIDIAN" is never shown on the public website.
> Public identity: **Shri O. V. Sheth Regional Community Science Center (OVSRCSC Rajkot)**,
> a Saurashtra Education Foundation institution; familiar name **Lok Vigyan Kendra, Rajkot**
> (the institution's own Gujarati name: શ્રી ઓ. વી. શેઠ પ્રાદેશિક લોક વિજ્ઞાન કેન્દ્ર).

Foundation generated with UI/UX Pro Max (`museum exhibition editorial`, variance 7, motion 5,
density 3). The generator's palette (zinc/pink) and type pairing (Outfit/Work Sans; a monospace
body in an earlier query) were rejected: unsuitable for Gujarati/Hindi reading and off-brand.
Kept from it: spacious Swiss grid, accessibility checklist, editorial serif-accent idea.

## Where it lives

| Concern | File |
|---|---|
| Tokens, surfaces, components | `src/styles/meridian/meridian.css` (imported only by the public layout) |
| Fonts | `src/lib/meridian-fonts.ts` |
| Components | `src/components/meridian/**` |
| Brand assets | `src/assets/meridian/**` (official logo, curated institutional photos) |

**Isolation rule:** every rule is scoped under `body[data-site='meridian']` and placed in the
Tailwind cascade layers (`base`, `components`) so utilities still win. Public code must not use any
custom class or theme token from `src/app/globals.css` (shared with the admin). Use `mx-*` classes,
`--mx-*` variables (Tailwind v4 syntax: `bg-(--mx-navy)`, `text-(--mx-fg-2)`), and Tailwind core
utilities only.

## Identity — Heritage Science × Illustrated Journal × Contemporary Discovery

Approved direction (Nov 2026). The site reads like a museum journal: warm paper surfaces,
serif headlines, instrument-style mono annotations, computed scientific figures, and a few
immersive moments (atom, laboratory walk, telescope, experiments). Never all-dark; no
decoration without a reason.

## Colour (approved palette — `src/styles/meridian/meridian.css`)

| Token | Hex | Role |
|---|---|---|
| `--mx-ivory` | #FAF8F2 | Primary reading surface |
| `--mx-stone` | #F0E9DC | Warm editorial variation (heroes, registers) |
| `--mx-green` | #344C43 | Institution: primary CTA on light, `mx-surface-green` |
| `--mx-charcoal` | #202B29 | Ink, immersive chapters (`mx-surface-dark`) |
| `--mx-brass` | #B18A58 | Marks only: rules, diagram emphasis, CTA on dark |
| `--mx-sage` | #82958A | Secondary lines and depth |

Brass and Sage are below 4.5:1 on light surfaces, so text uses `--mx-brass-ink` (#7A5B32, 5.9:1)
and `--mx-sage-ink` (#4E6157, 6.2:1); on dark, `--mx-brass-light` (7.3:1). Surfaces
(`mx-surface-ivory|stone|white|dark|green`) set semantic variables (`--mx-fg*`, `--mx-line*`,
`--mx-accent`, `--mx-mark`, `--mx-cta-*`). The primary button reads `--mx-cta-*` from the nearest
surface (green on light, brass on dark). Legacy names (`--mx-cyan`, `--mx-amber`, `--mx-midnight`…)
are aliases onto this palette — use the new names in new code. `.mx-grain` adds an inline SVG
paper-noise layer (no image request).

## Typography (self-hosted — `src/lib/meridian-fonts.ts`, files in `src/assets/fonts`, SIL OFL)

- Display: **Instrument Serif** (one weight: hierarchy by size and italic; `font-synthesis: none`)
- Body: **Manrope** (variable) · Instrument voice: **IBM Plex Mono** (`mx-mono-label`, `mx-eyebrow`,
  `mx-annot`, `mx-folio`, `mx-readout`)
- Gujarati/Hindi: display → **Noto Serif Gujarati / Devanagari**; body → **Noto Sans** (script-only
  subsets, not preloaded). Glyph coverage verified against every character used in gu.ts / hi.ts.
- Greek/maths symbols (θ π √) are not in the Latin subsets and fall back to system fonts.
- Never put a formula inside an uppercase label (CSS turns π into Π and g into G).
- The admin's `src/lib/fonts.ts` (Sora/Manrope/Noto, same CSS variables as before) is also
  self-hosted: build-time Google Fonts requests intermittently failed whole production builds.

## Journal system

- `mx-eyebrow` + `mx-eyebrow-index` (folio number with a brass rule), `mx-folio` running header,
  `mx-figcap` ("Fig. 03 — caption"), `mx-annot` (mono label with leader line), `mx-scale` (ruler),
  `mx-ledger` (ruled lists), `mx-plate` + `mx-ticks` (specimen plate), `mx-prose-journal`, `mx-dropcap` (en only).
- Figures (`components/meridian/journal/`): `ScienceFigure name=…` → pendulum, ph, cell, pythagoras,
  gate, refraction, lens, kepler, newtonian, wave, magnet. Geometry is computed from the physics
  (Snell's law, thin-lens equation, Kepler's equation, dipole lines r = k·sin²θ). Each figure has
  role="img", a title and a caption. `DrawOnView` draws `.mx-draw` paths on first view; the server
  HTML always contains the finished figure.
- `JournalThread`: homepage gutter line drawn by scroll (a damped pendulum trace), large screens only.

## Page templates (`components/meridian/templates/`)

The CMS catch-all dispatches by path: `about` → AboutPage · `infrastructure` → LabsPage (laboratory
walk with photo hotspots on visibly identifiable items and a principle figure per lab, facilities
register, pendulum) · `projects`, `activities` → DiscoveryPage (featured spread, asymmetric mosaic,
index; no invented categories) · `projects/big-bang-astronomy-club` → EditorialPage + AstronomyExhibit ·
everything else → EditorialPage. Standalone routes: Visit (new), Gallery (adaptive editorial archive,
contact-sheet toggle, lightbox with full-resolution link), Events (twelve-month ruler in Asia/Kolkata),
Journal (featured story + table of contents; reading progress on articles), Contact.

## 3D

- Atom (R3F, procedural): brass and silver materials, no glow.
- Dobsonian reflector: Blender source `assets-src/3d/dobsonian-telescope.blend` (scene
  `OVSRCSC_Dobsonian`, helper text block `dob_helpers.py`); GLB in `src/assets/meridian/models/`,
  bundled via `new URL(…, import.meta.url)` because the locale middleware does not pass `.glb` files.
  Node names drive the viewer (`Rocker`, `OTA`, `OTA_axis`, part prefixes). It loads only on capable
  desktops near the viewport, or on request; a Blender-rendered poster is shown otherwise.

## Motion

- Framer Motion (`Reveal` up/fade/mask, `Stagger`, `Parallax`, `ScrollLinked`, `CountUp`) under
  `MotionConfig reducedMotion="user"`; with reduced motion, CSS forces `[data-mx-reveal]` content visible.
- Mega-menu: clip-path drop · lightbox: 600 ms scale-fade · page transitions: CSS entrances only.
- GSAP is installed but intentionally unused (one animation library).

## Scroll story (homepage)

The homepage is one continuous narrative, not stacked sections. Components live in
`src/components/meridian/story/`. Rhythm, in reading order:

| Beat | Section | Interaction |
|---|---|---|
| Cinematic | Hero | Atom transforms with scroll (orbits fan open, tilt, quicken); drag to rotate; Nucleus / Electrons / Three orbits hotspots with explanations |
| Reading | Intro | Masked photo reveals, parallax |
| Information | At a glance | Count-up figures; milestone timeline whose rail is drawn by scroll |
| Pinned photography | Five laboratories | Plate pinned (CSS sticky) while chapters scroll; wipe transition per lab |
| Experiment | Pendulum | Length, angle, gravity (Earth/Moon/Mars/Jupiter), mass; drag-and-release bob; full θ'' = −(g/L)·sin θ simulation |
| Photography | Spaces for discovery, events | Reveals |
| Experiment | Zero Shadow Day | Noon-Sun simulator for Rajkot 22.30° N (Cooper declination; matches the center's 3 June 2022 photo) |
| Lighting transition | Dusk band | Sun sinks and stars appear with scroll (noon → night) |
| Horizontal story | Big Bang Astronomy Club | Desktop: row pinned and translated 1:1 by vertical scroll; phones: native swipe row |
| Reading | Stories, gallery, notices, visit | Reveals; facade zooms into place |

Rules:

- **Never intercept scrolling.** Pinning is `position: sticky`; horizontal travel equals the
  section's extra height. No wheel/touch handlers, no scroll snapping on the page.
- **Motion values, not state.** Scroll-linked visuals use `useScroll`/`useTransform`
  (`ScrollLinked`), the WebGL atom reads refs in `useFrame`, the pendulum writes its SVG
  through a ref. React state changes only on discrete events (active lab, control input).
- **Reduced motion:** `ScrollLinked` rests at its readable state (`rest="start"` for exits),
  no WebGL, no auto-swinging pendulum, native row instead of pinned horizontal travel.
- **Every drag has an alternative:** atom rotate buttons and arrow keys; pendulum angle slider.
- **Mobile is designed, not shrunk:** SVG atom, stacked lab chapters with their own photos,
  swipe row with snap and gutter, 44px controls, `touch-action: none` only on the pendulum bob.
- **Facts only:** captions and figures come from the center's own pages and media library;
  experiment copy states general science, never claims about specific equipment.
- No interactive campus map: there is no verified floor plan to draw from.
- No opening hours are published anywhere, so the Visit page asks visitors to call ahead.

## Accessibility checklist (applied)

Skip link · visible focus (`--mx-focus`) · 44px targets · labelled icon buttons · native `<dialog>`
for menu/search/lightbox/announcement (focus trap + Escape) · aria-current for nav/filters ·
inline field errors with `aria-invalid`/`aria-describedby` · `lang` per locale · reduced motion.
