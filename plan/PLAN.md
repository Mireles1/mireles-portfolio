# Oscar Mireles — Portfolio Site (Noomo Labs–inspired)

**Goal:** Rebuild the interactive experience of labs.noomoagency.com as closely as possible, but as Oscar Mireles' personal portfolio — original copy, own 3D models, own branding.

**Status:** 🟢 v1 built & verified in headless Chrome — updated 2026-07-20
**Run it:** `npm run dev` → http://localhost:5173/ (build: `npm run build`)

---

## Reference analysis (labs.noomoagency.com)

Extracted from live HTML on 2026-07-20:

- **Stack (theirs):** Nuxt (Vue) SPA, WebGL canvas, Swiper, sound design
- **Fonts (theirs):** Druk Medium (display, ultra-condensed caps), IBM Plex Mono (UI/mono)
- **Pages:** Home (`/`), Work (`/work`), Contact (`/contact`), external link to main agency site
- **Home page anatomy:**
  - `home-preloader` — "Immerse me in" + `[ start ]` circle button, `Loading` label, progress bar + `0%` counter, bottom volume waves + "we use sound effects" note
  - Fullscreen WebGL scene — **jellyfish** model, mouse-reactive, ambient float
  - `scene-texts` — 3 bottom rotating texts + left text + right text (storytelling copy)
  - `left-bar` — decorative crosses + values `AR / 3D / AI / XR`
  - `right-bar` — scroll progress `0%`
  - `social-links-global` — volume toggle (waves on/off) + AR-mode jellyfish icon
  - `selected-menu` / `options-menu` — "customize me" panel: 2 color palettes (36 swatches each), 2 sliders (value `100`, value `0.04`), pattern items, restart button
  - `home-footer` — h4 "Let's innovate together", `[ send message ]` circle CTA, socials, © line, dotted points decoration
- **Header:** logo left; right menu `[Work] [Noomo Agency] [Contact]` with bracket hover style; `menu-switch` burger with `[ ]` elements; mobile menu with links + socials
- **Transition component:** fullscreen overlay with centered logo + `dots` grid, used between routes
- **Work page anatomy:** `works-hero` — h1 "Noomo experiences", `blur-parent` with `points` (dot matrix) + h2 tagline; project grid (client-rendered); same footer
- **Signature styling:** black background, white type, giant condensed uppercase display font, mono labels, square brackets `[ ]` around interactive elements, dot-matrix decorations, circled CTAs

## Our stack

- **Vite** (multi-page: `index.html`, `work.html`, `contact.html`) — vanilla JS
- **Three.js** — GLB loading, custom lighting, mouse parallax, float animation
- **GSAP** — preloader, scene text rotation, transitions, hover micro-interactions
- **Fonts:** Anton (free Druk stand-in) + IBM Plex Mono (same as original, OFL license)
- Page-transition overlay replays on navigation → feels like the SPA original

## Content mapping (Oscar's version)

| Noomo | Ours |
|---|---|
| Noomo Labs logo | "OM." wordmark / "OSCAR MIRELES" |
| Jellyfish scene | `blue_jellyfish.glb` (already have) |
| AR / 3D / AI / XR bar | SEO / AI / ECON / WEB3 |
| Nav: Work / Noomo Agency / Contact | Work / Resume / Contact |
| "Let's innovate together" | "Let's build together" |
| hello@noomoagency.com | omireles011@gmail.com |
| Work: agency projects | Mintcoin.fun, Vast.ai GPU Analyzer, AI Compute Cluster, AvvenireNFT, Trajektory SEO, Econometrics Research |

Extra models available: `crystal_shard.glb`, `evanescent_plasma.glb` → Work-page / Contact-page scenes.

## Milestones

- [x] M1 Scaffold + fonts + global styles
- [x] M2 Header/nav + transition overlay + footer
- [x] M3 Preloader
- [x] M4 Jellyfish Three.js scene (load, lights, bloom, float, mouse parallax, particles)
- [x] M5 Customize panel wired to material (36 colors + glow/speed sliders + wireframe pattern + restart)
- [x] M6 HUD: scene texts, left bar, scroll progress, sound toggle
- [x] M7 Work page + project grid (6 projects, evanescent_plasma backdrop)
- [x] M8 Contact page (crystal_shard backdrop)
- [x] M9a Rotating glass text-ring carousel on home (Noomo-style cylinders, scroll/drag spin, click → project page)
- [x] M9b Per-project detail pages (`project.html?id=slug`, prev/next nav, placeholder case-study copy)
- [ ] M9c Polish pass (mobile QA, tune ring brightness/size on real devices)
- [ ] M10 Real assets swapped in + case-study copy written (see ASSETS.md)

## How the ring effect works (for reference)

ONE ring per project (6 rings stacked vertically, GAP 2.3, first ring at
y=0.5 so it's fully readable at load). Each ring is TWO meshes sharing an
open-ended `CylinderGeometry`: a `FrontSide` mesh with the sharp text texture
(title repeated twice around the circumference + `[ NN ] tags · year` meta
line) and a `BackSide` mesh with a canvas-blurred dimmer copy — the frosted
mirrored ghost on the far wall, like Noomo. Rings alternate spin direction,
start with their title phase-centered toward the camera, and idle-spin with
scroll/drag velocity + damping. Scrolling lifts the whole stack
(`(p/0.85)·GAP·5 − 1.2p`, the −1.2p compensating the camera's descent) so each
ring passes through the same on-screen reading zone; ring i is centered at
~17%·i scroll, last ring by 85% (footer takes the rest). Whole ring = one
project — raycast hit → `userData.project` → detail page.

## File map

- `index.html` / `work.html` / `contact.html` / `project.html` — pages
- `src/css/main.css` — all styling
- `src/js/scene.js` — reusable Three.js scene (GLB + bloom + parallax + customize API)
- `src/js/rings.js` — rotating glass text cylinders (carousel + click select)
- `src/js/projects-data.js` — single source of truth for all projects (edit case-study text here)
- `src/js/home.js` — preloader, HUD, customize panel, scroll choreography, rings wiring
- `src/js/work.js` / `src/js/project.js` — work grid / detail page renderer
- `src/js/header.js` — nav, mobile menu, transition overlay, volume toggle
- `src/js/audio.js` — ambient loop + UI clicks (session-persistent on/off)
- `public/` — models, fonts, audio, work images, favicon

## Decisions log

- 2026-07-20: Multi-page Vite instead of Nuxt SPA — identical UX via transition overlay, far simpler to maintain.
- 2026-07-20: Anton replaces Druk (Druk is a paid commercial font). If Oscar buys/obtains a Druk license later, it's a one-line CSS swap.
- 2026-07-20: All copy is original (about Oscar) — layout/motion mirrors the reference, text/assets do not.
