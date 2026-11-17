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

## Colour

| Token | Hex | Use |
|---|---|---|
| `--mx-midnight` | #101C2C | Dark surfaces, ink |
| `--mx-navy` | #172B43 | Secondary dark surface |
| `--mx-ivory` | #F6F3EC | Primary light surface |
| `--mx-white` | #FFFFFF | Raised light surface |
| `--mx-cyan` | #52D5E8 | Accent on dark only |
| `--mx-teal` / `--mx-teal-ink` | #24A6A0 / #14706B | Decoration / accent text on light (≥4.5:1) |
| `--mx-amber` / `--mx-amber-ink` | #E9A94B / #8A5A12 | Primary CTA, highlights / amber text on light |
| `--mx-slate` | #718096 | Decorative only (not body text) |

Cyan / teal / amber echo the blue, green and orange orbits of the official atom logo.
Surfaces (`mx-surface-ivory|white|dark|navy`) redefine semantic vars (`--mx-fg`, `--mx-fg-2`,
`--mx-fg-3`, `--mx-line`, `--mx-accent`, `--mx-focus`) so components adapt automatically.
Rhythm alternates dark and light sections; never all-dark.

## Typography

- Display: **Sora** (300–700) · Body: **Manrope** · Editorial accent: **Newsreader** italic
- Scripts: **Noto Sans Gujarati**, **Noto Sans Devanagari** (fallbacks in every stack)
- Classes: `mx-display`, `mx-h1…h4`, `mx-lede` (serif), `mx-eyebrow`, `mx-mono-label`, `mx-numeric`, `mx-serif-accent`
- Gujarati/Hindi (`:lang(gu|hi)`): no negative tracking, line-height 1.28–1.4 on headings, 1.8 body,
  no uppercase/wide tracking on labels, serif-accent becomes a colour accent (no faux italics).

## Motifs & composition

- **Atom** (three tilted orbits — the logo's mark), **rings**, **meridian** (globe lines) SVG motifs
- **Specimen plate**: images in `mx-plate` with `mx-ticks` instrument corner marks; figure captions "Fig. 01"
- Numbered editorial eyebrows (`01 — Who we are`), hairline rules, ledger-style lists
- Restrained radii (4–22px); pill buttons and chips only

## Motion

- Framer Motion (`Reveal`, `Stagger`, `Parallax`, `CountUp`) under `MotionConfig reducedMotion="user"`
- Above-the-fold entrance is CSS-only (`mx-enter`) — no JS dependency for first paint
- 3D: `AtomStage` → server-rendered SVG atom; WebGL atom lazy-loads on capable desktops,
  cross-fades in, pauses off-screen, DPR ≤ 1.75; SVG kept for mobile, save-data, low-power,
  no-WebGL and reduced motion. GSAP intentionally unused.

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

## Accessibility checklist (applied)

Skip link · visible focus (`--mx-focus`) · 44px targets · labelled icon buttons · native `<dialog>`
for menu/search/lightbox/announcement (focus trap + Escape) · aria-current for nav/filters ·
inline field errors with `aria-invalid`/`aria-describedby` · `lang` per locale · reduced motion.
