# Trajektory Experience Site — Handoff Brief

> Copy this file into the new project folder and give it to Claude as the starting
> prompt/context. It contains the concept, the spec, and hard-won lessons from
> building Oscar's portfolio (the Noomo-inspired jellyfish site) on this machine.

## Who / what

- **Oscar Mireles** (omireles011@gmail.com, Chicago) — SEO & AEO intern at **Trajektory**.
- Goal: an interactive "experience site" for Trajektory, in the spirit of award-site
  WebGL experiences (reference vibe: labs.noomoagency.com), but with an original
  concept: **a night sky of clickable constellation stars**.
- ⚠️ Ask Oscar up front: is this an official Trajektory project or a concept pitch?
  Get brand assets from him (logo SVG, brand colors, fonts, copy, what the company
  does in their own words) — do NOT scrape Trajektory's site for assets or copy
  their competitors. Use placeholders + an ASSETS.md fetch list (workflow below).

## Concept — "Constellations"

A fullscreen 3D night sky. Content lives in **constellations**: named clusters of
stars connected by faint lines. Each star is clickable and opens a piece of content.

Suggested constellation mapping (confirm with Oscar):
- One constellation per **service/offering** (e.g. SEO, AEO, analytics, content) —
  each star in it = a case study, metric, or capability
- Or: one constellation per **case study**, stars = results/metrics within it
- A standout star (brightest, pulsing) = primary CTA ("work with us" / contact)

## Experience spec

1. **Preloader** — brand wordmark, progress %, "sound on" note, enter button
   (audio needs a user gesture — see gotchas).
2. **Sky scene** — Three.js: deep-blue/black gradient background, thousands of tiny
   background stars (Points), subtle nebula haze (large soft sprites or shader),
   slow parallax on mouse move; optional shooting star every ~20s.
3. **Constellations** — each is a Group: star meshes (glowing sprites/billboards,
   bloom via UnrealBloomPass) + connecting lines (LineSegments, low opacity, drawn
   in with an animation when the constellation first enters focus).
4. **Navigation** — scroll (or drag) pans/rotates the camera from constellation to
   constellation along a path; a HUD index (mono font list or mini-map) lets you
   jump. Current constellation name displayed big (condensed display type).
5. **Star interaction** — hover: star brightens, label appears (mono, bracketed
   `[ like this ]`), cursor pointer; click: camera pushes toward the star, then a
   content panel/page opens (title, copy, image, metric). Raycaster on Points needs
   `raycaster.params.Points.threshold` tuned, or use invisible larger hit-spheres.
6. **HUD** — sound on/off toggle (persist in sessionStorage), scroll/progress
   indicator, header with brand + a couple of links, footer with CTA.
7. **Sound** — ambient space/pad loop + soft click/hover blips. Free sources:
   Pixabay sound effects, Mixkit, Freesound (CC0 filter). Load mp3s from
   /audio/, fade in/out via requestAnimationFrame or GSAP (clamp volume 0..1!).
8. **Motion** — GSAP for camera tweens, panel reveals, preloader exit. Ease
   `power4.inOut` for big moves. Everything damped/lerped, nothing snaps.

## Stack (proven on this machine)

- **Vite** (multi-page if needed: index + detail pages), vanilla JS — no framework
- **Three.js** (^0.177): EffectComposer + RenderPass + UnrealBloomPass for glow
- **GSAP** (^3.12)
- Fonts self-hosted woff2. Display: Anton (free Druk-alike) or ask Oscar for
  Trajektory's brand font. UI/mono: IBM Plex Mono (OFL). Download via Google Fonts
  CSS API with a Chrome UA header, keep only the `latin` subset files.
- Deploy: Netlify (`netlify.toml` with build=`npm run build`, publish=`dist`, long
  Cache-Control headers for /models, /fonts). Drag-drop `dist` to
  app.netlify.com/drop for instant deploys, or connect a GitHub repo.

## Workflow that worked well (repeat it)

1. **Plan folder first**: `plan/PLAN.md` (status, milestones, decisions log, file
   map — update as you go) + `plan/ASSETS.md` (✅ have / 🟨 placeholder, ask Oscar
   to fetch / ❌ missing). Oscar likes: build with placeholders, then hand him a
   short fetch list (audio, images, brand files, copy).
2. **Verify visually, frame by frame** — this machine has no chromium-cli. Use:
   `npm i -D puppeteer-core`, launch with
   `executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'`,
   `headless: 'new'`, args `['--use-gl=angle','--enable-webgl','--no-sandbox']`.
   Screenshot at multiple scroll positions AND after interactions (click enter,
   hover a star), collect `pageerror`/console errors, then READ the screenshots.
   This caught every real bug in the last build.
3. Iterate: screenshot → fix → screenshot. Simulated clicks confirm raycast
   targets (log `page.url()` after click-navigation).

## Machine gotchas (Windows 11, Node 24, PowerShell 5.1)

- **ESM scripts must live in the project root** to resolve node_modules — running
  a .mjs from a temp/scratch dir throws ERR_MODULE_NOT_FOUND.
- **Python writes files as cp1252 by default** → em-dashes/Unicode corrupt SVGs/
  JSON. Always `open(..., encoding='utf-8')` (or `io.open`). A broken byte makes
  browsers silently reject an SVG `<img>`.
- **Clamp Audio.volume to [0,1]** when fading — overshooting throws IndexSizeError.
- **Audio autoplay** requires a user gesture — start it in the preloader's enter-
  button click handler.
- Copy the **Draco decoder** from `node_modules/three/examples/jsm/libs/draco/gltf`
  to `public/draco/` and `setDecoderPath('/draco/')` in case GLBs are compressed.
- Compress any GLB > a few MB (gltf-transform draco/meshopt) before launch.
- Dev server: `npm run dev` → http://localhost:5173/. PowerShell 5.1 has no `&&` —
  chain with `;` or use bash.

## Reference patterns from the portfolio build (reusable code ideas)

- `scene.js` — a ModelScene class: renderer + ACES tone mapping + bloom composer,
  pointer-parallax camera, `setScroll(p)` for scroll-driven camera drift.
- `audio.js` — singleton AudioManager: ambient loop + click blip, mp3-with-wav-
  fallback via `error` event, sessionStorage on/off, RAF volume fade.
- `header.js` — `navigateTo(href)`: fullscreen overlay slides up (GSAP), sets a
  sessionStorage flag, next page plays the overlay out → SPA-feel transitions
  between static pages. `bindNavLinks(scope)` re-callable for dynamic links.
- Bracket-style UI: `[ label ]` links where brackets spread on hover; circled
  CTAs (`[ start ]`, `[ send message ]`) — mono font, letter-spaced uppercase.
- Text-on-cylinder trick (if ever useful): CanvasTexture on open-ended
  CylinderGeometry, sharp FrontSide mesh + blurred BackSide mesh for frosted
  glass depth; raycast → `userData` for click mapping.

## Milestones (suggested)

- M1 Scaffold (Vite + Three + GSAP), fonts, plan folder
- M2 Starfield + nebula background with parallax
- M3 Constellation data model (JSON: name, stars[x,y,z,label,content]) + rendering
  (stars + lines + labels)
- M4 Camera journey: scroll/drag between constellations + HUD index
- M5 Star hover/click → content panel (placeholder copy/images)
- M6 Preloader + audio + transitions
- M7 Verify pass (puppeteer screenshots at every stage), mobile QA
- M8 Real Trajektory content/brand swap-in, compress assets, Netlify deploy

## Open questions for Oscar (ask before building far)

1. Official Trajektory project or personal concept pitch?
2. Brand assets: logo, colors, fonts, tone of voice?
3. What are the constellations? (services? case studies? metrics?) Rough list of
   6–10 stars' worth of content per constellation.
4. Domain/subdomain plan? (affects OG tags)
5. Any hard requirements: lead-gen form? analytics (GA4)? accessibility bar?
