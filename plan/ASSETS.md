# Asset checklist

Things the site needs. ✅ = have, 🟨 = placeholder in place (Oscar: please fetch/replace), ❌ = not started.

## 3D models
- ✅ `blue_jellyfish.glb` — home hero (3.4 MB)
- ✅ `crystal_shard.glb` — contact page accent (248 KB)
- ✅ `evanescent_plasma.glb` — work page accent (18.7 MB — consider compressing, see notes)

## Audio
- ✅ `public/audio/ambient.mp3` — "Middle of the Ocean" meditation ambient (Pixabay), 2:44 loop. Added 2026-07-20.
- 🟨 `public/audio/click.mp3` — short soft UI click/blip (still using generated wav placeholder; grab a "UI click" from Pixabay when convenient).
- The generated `ambient.wav` / `click.wav` remain as automatic fallbacks — safe to delete `ambient.wav` once happy with the mp3.

## Fonts
- ✅ Anton (Druk stand-in) — self-hosted
- ✅ IBM Plex Mono — self-hosted
- Optional upgrade: license "Druk Medium" from Commercial Type for the exact original look.

## Work page media (🟨 gradient placeholders in place)
Each project card wants a preview image or short loop video (16:9 or 4:5):
- 🟨 Mintcoin.fun — screenshot/screen recording of the token generator UI
- 🟨 Vast.ai GPU Marketplace Analyzer — chart/notebook screenshot
- 🟨 AI Compute Cluster & Mining Rig — photo of the rig (this will look great)
- 🟨 AvvenireNFT — brand art / collection art
- 🟨 Trajektory SEO — impressions growth chart (anonymize numbers if needed)
- 🟨 Econometrics Research — Stata output / chart

## Misc
- 🟨 Favicon — currently a generated "OM" placeholder
- 🟨 OpenGraph image (`public/og.jpg`) — 1200×630 screenshot of the finished hero
- 🟨 Resume PDF at `public/resume.pdf` — drop in `Oscar_Mireles_Resume_Updated (1).pdf` (renamed)

## Notes
- `evanescent_plasma.glb` is 18.7 MB — heavy for web. When we wire it in, run it through gltf-transform (draco/meshopt) or I can do it if you install `@gltf-transform/cli`.
