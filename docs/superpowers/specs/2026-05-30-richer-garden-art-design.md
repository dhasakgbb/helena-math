# Richer Garden Art — Design

**Date:** 2026-05-30
**Status:** Design — approved (build & ship)
**App:** `helena/math` — Svelte 5 PWA, offline, hand-crafted SVG, day/night themed
**Builds on:** the merged Moonlit Math Garden (Plans 1–3) + Astrid Help + the recent `feat: add day/night dynamic theme` commit.

---

## 1. Goal

Close the gap between the shipped hub and the painterly reference mockups (rich dark night garden) **without** changing medium: stay hand-crafted SVG. Make the scene read as a **full, inhabited, glowing night garden** — terracotta pots, lush plants, a grassy glowing mound, scattered mushrooms, a winding lit path, denser atmosphere — and re-art-direct the new **day** theme from its current flat pale-blue into a warm **dawn/dusk** golden hour. Night is the hero (the brand is "Moonlit"); day is its equally-pretty warm sibling.

### Success criteria
- The night hub reads "close to the mockups" — a populated garden scene, not plants floating on an empty dark field — verified against the four reference images by an independent critique agent at desktop/tablet/mobile.
- Pots are warm terracotta; plants are visibly lusher (fuller foliage, richer bloom heads); the ground is a textured glowing mound with mushrooms and a clear path.
- Day theme is a warm, legible golden-hour dawn/dusk (not flat pale-blue), sharing the scene-token seam with night.
- No regressions: WCAG AA contrast (pod labels + panel text legible in BOTH themes), responsive at all 3 breakpoints with the **pod no-overlap invariant** intact, reduced-motion + calm-mode safe, offline, 14 tests still green.

### Non-goals (YAGNI)
- No raster/painted image assets (stay SVG, animatable, recolorable, tiny, offline).
- No literal vegetable plants (carrots/radishes) — keep the 4 abstract glowing-flower species (one designed set); mockup veggies are aspirational flavor.
- No game-internal art changes (the 10 game surfaces already match the world; mockups don't show richer game internals).
- No new mechanics, no schema/profile changes, no panel/meter/layout restructure (those already match the mockups).
- Do NOT fork the `astrid-mascot` package SVG — enhance only the in-app wrapper around it.

## 2. Where the work lives

| File | Responsibility | Change |
| --- | --- | --- |
| `src/components/Plant.svelte` | pot + stem + 5 growth stages + bloom heads | terracotta pot; lusher foliage + richer bloom heads (keep 4 species, 5-stage logic, per-grove glow, keyframe motion) |
| `src/components/GardenScene.svelte` | the SVG scene (sky/moon/hills/path/beds/grass/fireflies) + pod overlay | grassy glowing mound floor, scattered mushrooms, richer winding path, denser fireflies/spores, fog band; all new colors via `--gs-*` tokens |
| `src/styles/theme.css` | base (night) + `.theme-day` `--gs-*` tokens | add tokens for new elements (grass, mushroom glow, ground-glow, fog); re-art `.theme-day` into warm dawn/dusk |
| `src/screens/GameScreen.svelte` mascot snippet (or a small `AstridGlow` wrapper) | Astrid presentation | richer lantern glow + warm halo + soft dimensional shadow around the existing Mascot (wrapper only) |
| `src/screens/EndScreen.svelte` | watered-bed bloom | inherits the richer `Plant`; verify the bed reads well (no separate art task) |

All new scene colors flow through `--gs-*` custom properties so **day and night are the same SVG with two token sets** (the seam already exists from the day/night commit).

## 3. The scene upgrade (`GardenScene.svelte`)

The scene is a `viewBox="0 0 1200 700"` SVG with 4 parallax layers + an HTML pod overlay. Upgrade each layer; keep the layer/parallax/overlay architecture and the pod layout math (no-overlap invariant).

- **Garden floor (new, foreground band).** Replace the flat dark field with a layered **grassy mound**: a rounded foreground hill with a top **ground-glow rim** (bioluminescent at night, golden at day), denser hand-tuned **grass blades** (varied height/lean, rim-lit tips via a `--gs-grass`/`--gs-grass-tip` token), and a soft **AO contact shadow** under each pod (reuse/upgrade the existing mound-shadow ellipses).
- **Glowing mushrooms (new).** Scatter ~5–8 small mushrooms across the floor between pods (a hand-tuned toadstool: stem + domed cap with a soft cap-glow + spots). Color via `--gs-mushroom` / `--gs-mushroom-glow`. Place them off the pod hit-targets so they never block taps. Gentle keyframe pulse (reduced-motion safe).
- **Winding lit path.** Upgrade the existing thin serpentine stroke into a clearer **soft-glow trail** (a wider, lower-opacity glow stroke under a brighter core stroke; optionally faint stepping-stone dots) threading the three groves. Tokened (`--gs-path1/2`).
- **Atmosphere & depth.** More drifting **fireflies/spores** (bump count + size variance, noise-driven drift), a soft low **fog band** above the floor (`--gs-fog`), and keep the layered distant hills (`--gs-hill1/2/3`). Night: moon + denser stars; Day: warm low sun + no stars (`--gs-star: transparent`).
- All motion via `@keyframes` under `@media (prefers-reduced-motion: no-preference)`; the in-app calm mode + reduced-motion both freeze it. Parallax via the existing `--px/--py` + `.parallax-layer` (already reduced-motion-neutralized).

## 4. Pots & plants (`Plant.svelte`)

Keep: the `species` (4 variants) + `stage` (0–4) + `glow` props, the 5-stage growth logic, per-grove glow, the bloom-head species switch, sparkles, and keyframe motion. Upgrade the art:

- **Terracotta pot.** Replace the grey cylinder with a warm clay pot: terracotta vertical gradient body, a lighter raised **top rim**, a dark **soil** ellipse, an **upper-left rim highlight** (obey the moonlight key), and a grounded shadow. Slightly chunkier proportions. (Pot tone can take a subtle day/night lighting token but stays terracotta in both.)
- **Lusher foliage.** Add more leaves per stage and a small **base leaf cluster**, fuller silhouettes, so even sprout/bud stages read as a real plant, not a wire. Keep one consistent stem weight and the shared growth grammar.
- **Richer bloom heads.** Per species, add detail at stage 4: layered/overlapping petals, a brighter glowing **core**, and a small **side-bud or second bloom** so a mastered plant reads lush. Keep each species visually distinct (moonflower = round, starbloom = pointed star, bellflower = drooping bells, gembud = faceted crystal) and clearly different from each other at pod size.
- **Bigger in-scene size.** Pods render the plant a touch larger so the garden reads full, not sparse (respect the pod hit-target + no-overlap invariant — adjust pod box/size together if needed).
- No pure `#000`/`#fff`; OKLCH; layered glow (core + halo), not flat shadows.

## 5. Astrid polish (wrapper only)

Astrid renders from the `astrid-mascot` package via `{@html svgFor(pose)}`. Do **not** edit the package SVG. Enhance the **in-app wrapper** (in the hub sky band / GameScreen mascot snippet): a warmer multi-layer **lantern glow**, a soft **halo** behind her, and a subtle grounded shadow — so she reads more dimensional and lit, matching the mockups' polished firefly. Keep all poses + the lantern element.

## 6. Day theme → golden-hour dawn/dusk (`theme.css` `.theme-day`)

Re-art the `:root.theme-day` block (currently flat pale-blue + green) into a warm **dawn/dusk**:
- Sky: peach→amber→soft-lavender 3-stop (warm, low-sun), not pale daylight blue.
- `--gs-moon-core` → a low warm **sun** disc with a golden halo; `--gs-star: transparent`.
- Hills/grass/path/mushrooms: golden-green / warm tokens so the same scene SVG reads as a sunlit-at-golden-hour garden.
- Panels/text: keep `color-scheme: light` with **dark text** — but verify AA contrast on the warmer panels (the current pale-blue passes; the warm palette must too). Lantern-amber primary harmonizes with the warm sky.
Night `--gs-*` stay the moonlit values. Both themes get values for every NEW token added in §3 (grass, mushroom, fog, ground-glow).

## 7. Accessibility, responsiveness, performance

- **Contrast (both themes):** pod-name labels and all panel text ≥ AA on their backgrounds. The richer floor must not reduce label legibility (labels sit on dark/translucent chips or get a subtle text-shadow if needed). Day palette re-checked for AA.
- **Responsive:** the richer scene reflows at wide (≥1100) / tablet (600–1100) / narrow (<600, grouped column) exactly as today; the **pod no-overlap invariant** (dx/dy spacing) is preserved — added scene art is decorative/behind the pods and must not push or overlap them. Mushrooms/grass scale with the viewBox slice.
- **Motion:** every new animation is `@keyframes`-based and gated by `@media (prefers-reduced-motion: no-preference)`; the calm-mode class also freezes it.
- **Performance/offline:** SVG only, no new network assets; keep element counts reasonable (mushrooms/fireflies/grass are bounded small arrays) for 60fps on a tablet.

## 8. Verification

- **A++ / mockup-match gate:** an independent design-critique agent drives the live app, forces **both** themes (`document.documentElement.classList` toggle of `theme-day`/`theme-night`) and a seeded bloomed profile, screenshots hub + end-screen at desktop/tablet/mobile, and grades **against the four reference mockups**: pots terracotta, plants lush, ground/mushrooms/path present, atmosphere dense, day = warm golden-hour, both legible. Iterate to "close to target."
- **Regression:** `npm test` (14) green, `npm run check` 0/0, `npm run build` succeeds; pod no-overlap re-verified; no dead tokens introduced.

## 9. Build sequencing

1. **Tokens + day re-art:** add the new `--gs-*` tokens (grass/mushroom/fog/ground-glow) to base (night) + `.theme-day`, and re-art `.theme-day` into warm dawn/dusk. (Cheap, unblocks the scene.)
2. **Terracotta pot + lusher plants** in `Plant.svelte` (vertical slice for richness; gate the plant look first).
3. **Scene floor + mushrooms + path + atmosphere** in `GardenScene.svelte`.
4. **Astrid wrapper glow.**
5. **A++/mockup gate** across both themes + 3 breakpoints; iterate; final verification.

## 10. Risks
- **SVG craft volume** (pots + 4 lusher species + floor + mushrooms) — the bulk; mitigated by slice-first (pot+plant before whole scene) and the critique gate.
- **Day-theme contrast** — warm light palettes can drop text contrast; explicit AA check.
- **Scene art crowding the pods** — decorative art must stay behind/around pods without breaking the no-overlap invariant or blocking taps (mushrooms placed off hit-targets).
- **Label legibility on a busier floor** — may need a subtle chip/shadow behind pod names.
