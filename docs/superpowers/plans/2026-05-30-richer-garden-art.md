# Richer Garden Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the hub garden's hand-crafted SVG to read like the painterly reference mockups — terracotta pots, lush plants, a grassy glowing mound with mushrooms and a winding lit path, denser atmosphere, a polished Astrid — and re-art the day theme into a warm dawn/dusk.

**Architecture:** Pure SVG/CSS, no raster. All new scene colors flow through `--gs-*` custom properties so night (base `:root`) and day (`:root.theme-day`) are one SVG with two token sets. Pots + plants live in `Plant.svelte`; the scene (floor/mushrooms/path/atmosphere) in `GardenScene.svelte`; day/night tokens in `theme.css`; Astrid polish is a wrapper-only glow. No game-internal, layout, mechanic, or schema changes — purely an art-richness pass.

**Tech Stack:** Svelte 5, hand-authored SVG/CSS, OKLCH color, Vitest (regression only), Vite + vite-plugin-pwa.

**Spec:** `docs/superpowers/specs/2026-05-30-richer-garden-art-design.md`

**Note on testing:** This is a visual art pass — not unit-testable. Per-task verification = `npm run check` (0/0) + `npm run build` + a dead-token grep + a visual self-check; correctness gates are the existing 14 Vitest tests (must stay green — no logic touched) and the independent **mockup-match critique gate** (Task 9). Pixel fidelity is judged at the gate against the four reference mockups, both themes, three breakpoints.

---

## File Structure

| File | Responsibility | Task(s) |
| --- | --- | --- |
| `src/styles/theme.css` | new `--gs-*` tokens (night+day); re-art `.theme-day` → dawn/dusk | 1 |
| `src/components/Plant.svelte` | terracotta pot; lusher foliage + richer bloom heads | 2, 3 |
| `src/components/GardenScene.svelte` | grassy mound floor, mushrooms, winding path, atmosphere | 5, 6, 7 |
| `src/screens/HubScreen.svelte` + `src/screens/GameScreen.svelte` | Astrid wrapper glow (sky-band + mascot snippet) | 8 |

---

## Phase A — Tokens + day re-art

### Task 1: New scene tokens + dawn/dusk day theme

**Files:** Modify `src/styles/theme.css`.

Context: base `:root` (night) already has `--gs-moon-outer/inner/fade/core`, `--gs-star`, `--gs-hill1/2/3`, `--gs-path1/2`, `--gs-mound-shadow`. `:root.theme-day` overrides them (currently flat pale-blue). We add tokens for the NEW scene elements (grass, mushroom, fog, ground-glow) to BOTH, and re-art `.theme-day` into warm dawn/dusk. `App.svelte` toggles `theme-day`/`theme-night` by clock — unchanged.

- [ ] **Step 1: Add new tokens to base `:root` (night values).** In the night `:root` block, after the existing `--gs-mound-shadow` line, add:

```css
  --gs-grass: oklch(40% 0.09 150);
  --gs-grass-tip: oklch(72% 0.14 155);
  --gs-ground-glow: oklch(70% 0.12 160 / 0.22);
  --gs-fog: oklch(62% 0.04 250 / 0.12);
  --gs-mushroom-stem: oklch(78% 0.03 90);
  --gs-mushroom-cap: oklch(55% 0.10 20);
  --gs-mushroom-glow: oklch(85% 0.12 200);
  --gs-pot-lit: oklch(64% 0.12 45);
  --gs-pot-shade: oklch(44% 0.11 40);
```

- [ ] **Step 2: Re-art `.theme-day` into warm dawn/dusk.** Replace the `:root.theme-day` sky + scene tokens (keep `color-scheme: light`, dark text, the panel/glow/state token lines) with a warm golden-hour palette:

```css
  /* Day sky → warm dawn/dusk (golden hour) */
  --sky-radial: oklch(92% 0.10 75 / 0.85);
  --sky-top: oklch(70% 0.11 35);    /* rosy upper sky */
  --sky-mid: oklch(82% 0.10 60);    /* peach */
  --sky-bot: oklch(92% 0.08 90);    /* golden horizon */
  --color-bg: var(--sky-top);
```
And the day `--gs-*` set (replace the existing day `--gs-*` lines):
```css
  --gs-moon-outer: oklch(96% 0.12 80 / 0.85);
  --gs-moon-inner: oklch(92% 0.16 75 / 0.7);
  --gs-moon-fade: oklch(92% 0.16 75 / 0);
  --gs-moon-core: oklch(90% 0.15 78);   /* low warm sun */
  --gs-star: transparent;
  --gs-hill1: oklch(74% 0.13 120);
  --gs-hill2: oklch(66% 0.14 125);
  --gs-hill3: oklch(58% 0.13 130);
  --gs-path1: oklch(86% 0.07 85 / 0.8);
  --gs-path2: oklch(90% 0.06 90 / 0.5);
  --gs-mound-shadow: oklch(35% 0.06 60 / 0.18);
  --gs-grass: oklch(70% 0.15 128);
  --gs-grass-tip: oklch(86% 0.16 118);
  --gs-ground-glow: oklch(90% 0.10 95 / 0.3);
  --gs-fog: oklch(95% 0.06 85 / 0.16);
  --gs-mushroom-stem: oklch(90% 0.03 85);
  --gs-mushroom-cap: oklch(64% 0.13 30);
  --gs-mushroom-glow: oklch(88% 0.10 70 / 0.5);
  --gs-pot-lit: oklch(66% 0.13 45);
  --gs-pot-shade: oklch(50% 0.12 40);
```

- [ ] **Step 3: Verify build/types + AA contrast.** Run `npm run check && npm run build` (0 errors). Then confirm day-theme text contrast: panel text is `--color-text` (`oklch(20% …)`) on `--color-panel` (`oklch(100% 0.02 240 / 0.75)`) — still AA. Note in your report the computed contrast of `--color-text` on the lightest sky stop `--sky-bot` (`oklch(92% 0.08 90)`) ≥ 4.5:1 (it is — L20 on L92).

- [ ] **Step 4: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(garden): scene tokens for grass/mushroom/fog + warm dawn-dusk day theme"
```

---

## Phase B — Pots + plants

### Task 2: Terracotta pot

**Files:** Modify `src/components/Plant.svelte` (the `#plant-pot` gradient in `<defs>` ~line 49, and the `<g class="pot">` block ~lines 75–133).

Context: the pot is a tapered trapezoid body using `url(#plant-pot)` with cool grey/blue strokes + a cool specular. Make it warm terracotta, lit upper-left, keeping the same silhouette/structure.

- [ ] **Step 1: Warm the `#plant-pot` gradient.** Replace its two stops with terracotta, driven by the new tokens so day/night light it slightly differently:

```svelte
    <linearGradient id="plant-pot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="var(--gs-pot-lit, oklch(64% 0.12 45))" />
      <stop offset="100%" stop-color="var(--gs-pot-shade, oklch(44% 0.11 40))" />
    </linearGradient>
```

- [ ] **Step 2: Warm the pot strokes + specular + soil.** In the `<g class="pot">` block: change the body `stroke` from `oklch(52% 0.05 270)` → `oklch(40% 0.08 40)`; the upper-left wall highlight stroke `oklch(82% 0.04 260)` → `oklch(86% 0.06 60)`; the rim stroke `oklch(58% 0.05 268)` → `oklch(48% 0.07 45)`; the rim specular `oklch(88% 0.03 255)` → `oklch(90% 0.05 65)`; keep the soil mound warm (`oklch(30% 0.04 60)` is already warm — leave or deepen to `oklch(32% 0.05 55)`). Keep the contact shadow + AO (they read on any ground). Keep all geometry.

- [ ] **Step 3: Verify** `npm run check && npm run build` → 0/0. Grep no dead tokens: `grep -nE "\-\-neon-|\-\-success|\-\-danger|#fff|#ff007f|rgba\(255, ?255, ?255" src/components/Plant.svelte` → empty.

- [ ] **Step 4: Visual self-check + commit.** Run `npm run dev`; render a `<Plant stage={0} />` and a `<Plant stage={4} species="moonflower" />`; confirm a warm clay pot lit upper-left, terracotta not grey. Then:

```bash
git add src/components/Plant.svelte
git commit -m "feat(garden): terracotta clay pot"
```

### Task 3: Lusher foliage + richer bloom heads

**Files:** Modify `src/components/Plant.svelte` (the stage blocks 1–4 and the species bloom-head switch).

Context: stages currently render a thin stem + sparse leaves; stage 4 has 4 species heads. Make plants read lush while keeping the 4-species DNA, 5-stage logic, per-grove `--glow-c`, and keyframe motion.

- [ ] **Step 1: Fuller foliage across stages 1–4.** For each growth stage, add to the existing markup: a small **base leaf cluster** (2 short leaves fanning from the soil line, `fill="url(#plant-leaf)"`) and at least one extra mid-stem leaf, so even sprout/bud read as a real plant. Keep the single consistent stem weight and the existing stem paths; only ADD foliage (don't remove the current leaves). Use the existing `#plant-leaf` gradient.

- [ ] **Step 2: Richer bloom heads (stage 4), per species.** In each species branch of the stage-4 head, add detail while keeping it distinct: a brighter layered core (keep `url(#plant-bloom)`), one or two **overlapping outer petals/facets**, and a small **side-bud** on a short offshoot stem (a tiny closed bud in `var(--glow-c)`). Keep: moonflower = round daisy, starbloom = pointed star, bellflower = drooping bells, gembud = faceted crystal — each must stay clearly different at ~100px and at the 88px pod size. Keep the halo (`#plant-halo`) + sparkles.

- [ ] **Step 3: Verify** `npm run check && npm run build` → 0/0; grep no dead tokens (as Task 2).

- [ ] **Step 4: Visual self-check + commit.** `npm run dev`; render all 4 species at stage 4 and a couple at stages 2–3; confirm lusher silhouettes, richer blooms, 4 species still distinct, per-grove glow intact. Then:

```bash
git add src/components/Plant.svelte
git commit -m "feat(garden): lusher foliage + richer per-species bloom heads"
```

### Task 4: Plant-richness gate

**Files:** none (verification on Tasks 2–3).

- [ ] **Step 1:** `npm run build` + start dev; seed a bloomed profile; view the hub at desktop in BOTH themes (toggle `document.documentElement.classList` `theme-day`/`theme-night`).
- [ ] **Step 2:** Dispatch the independent design-critique agent: do the pots read terracotta + plants read lush + 4 species distinct, in both themes, matching the mockup plants? Apply fixes, re-grade until PASS. Commit each round: `git add -A && git commit -m "polish(garden): plant-richness fixes"`.

---

## Phase C — Scene

### Task 5: Garden floor — grassy glowing mound

**Files:** Modify `src/components/GardenScene.svelte` (LAYER 3 "plant beds" ~lines 245–258 and LAYER 4 foreground grass ~lines 260–285).

- [ ] **Step 1: Ground-glow mound.** In LAYER 3, add a soft **ground-glow** band along the top edge of the foreground mound using `--gs-ground-glow` (a wide low-opacity gradient/blurred shape) so the floor reads bioluminescent at night / sunlit at day. Keep the existing `--gs-hill3` mound + the 4 per-bed `--gs-mound-shadow` AO ellipses (these are the pot contact shadows — keep them under the pod x-positions).
- [ ] **Step 2: Denser, rim-lit grass.** In LAYER 4, replace the single-stroke grass loop: render ~70 blades (varied height + lean via the index) with the body in `var(--gs-grass)` and a brighter **tip** highlight in `var(--gs-grass-tip)` on the upper third (a second short stroke or a 2-stop gradient). Keep them in the foreground band, below the pods, not over the pod hit-targets.
- [ ] **Step 3: Verify** `npm run check && npm run build` → 0/0. Grep no dead tokens in GardenScene (same pattern as Task 2).
- [ ] **Step 4: Commit** `git add src/components/GardenScene.svelte && git commit -m "feat(garden): grassy glowing mound floor + rim-lit blades"`

### Task 6: Glowing mushrooms

**Files:** Modify `src/components/GardenScene.svelte` (add a mushroom group in LAYER 3 or a dedicated near-foreground layer).

- [ ] **Step 1: Mushroom motif.** Define a small reusable mushroom shape (inline `{#each}` over a hand-placed positions array, NOT over the pod positions): a short curved stem (`--gs-mushroom-stem`), a domed cap (`--gs-mushroom-cap`) with 2–3 light spots, and a soft cap **glow** (`--gs-mushroom-glow`, layered: blurred halo + tighter core). Place ~6–8 at fixed `{x,y}` percentages in the gaps BETWEEN pods/groves and along the path — explicitly off the pod hit-target rectangles so they never block taps.
- [ ] **Step 2: Gentle pulse.** Add a slow cap-glow pulse via `@keyframes` under `@media (prefers-reduced-motion: no-preference)` (staggered by index), so reduced-motion/calm-mode freeze it.
- [ ] **Step 3: Verify** `npm run check && npm run build` → 0/0; confirm (by reasoning over the positions array vs pod layout) mushrooms don't overlap pod hit-targets at wide/tablet.
- [ ] **Step 4: Commit** `git add src/components/GardenScene.svelte && git commit -m "feat(garden): scattered glowing mushrooms"`

### Task 7: Winding lit path + denser atmosphere

**Files:** Modify `src/components/GardenScene.svelte` (LAYER 2 path ~lines 230–242; LAYER 1 atmosphere; FIREFLIES array ~lines 162–167).

- [ ] **Step 1: Glow trail path.** Upgrade the single serpentine stroke into a layered trail: a wide low-opacity glow stroke (`--gs-path1`, blur via filter or large stroke + low opacity) UNDER a brighter narrower core stroke (`--gs-path2`), so it reads as a lit garden path threading the groves. Keep the existing path `d=`.
- [ ] **Step 2: Atmosphere.** Add a soft low **fog band** (a wide horizontal gradient rect in `--gs-fog`) above the foreground floor for depth. Bump the **fireflies**: increase the `FIREFLIES` array from 14 to ~22 with more size/position variance; ensure they use `--glow-firefly` (night) and remain subtle in day.
- [ ] **Step 3: Verify** `npm run check && npm run build` → 0/0; grep no dead tokens.
- [ ] **Step 4: Commit** `git add src/components/GardenScene.svelte && git commit -m "feat(garden): glowing winding path + fog + denser fireflies"`

---

## Phase D — Astrid polish

### Task 8: Astrid wrapper glow

**Files:** Modify `src/screens/HubScreen.svelte` (the sky-band lantern wrapper around `<Mascot>`) and `src/screens/GameScreen.svelte` (the `{#snippet mascot()}` `.mascot-wrapper`). Do NOT edit the `astrid-mascot` package or `Mascot.svelte` internals.

- [ ] **Step 1:** Around the existing `<Mascot>` in both places, enhance the wrapper CSS: a multi-layer warm **lantern glow** (layered `box-shadow`/`filter: drop-shadow` core + halo using `--glow-firefly`), a soft **halo** behind her (a radial-gradient pseudo-element), and a subtle grounded shadow. Keep the lantern cord/element and all poses. Motion (gentle glow breathe) via `@keyframes` under `@media (prefers-reduced-motion: no-preference)`.
- [ ] **Step 2: Verify** `npm run check && npm run build` → 0/0; grep no dead tokens in both files.
- [ ] **Step 3: Commit** `git add src/screens/HubScreen.svelte src/screens/GameScreen.svelte && git commit -m "feat(garden): warmer dimensional Astrid lantern glow"`

---

## Phase E — Final gate

### Task 9: Mockup-match A++ gate + verification

- [ ] **Step 1:** `npm run build` + start dev (note: dev may run on :5174 if :5173 is taken — check logs and navigate the preview there). Seed a bloomed profile.
- [ ] **Step 2:** Capture hub + end-screen at desktop / tablet / mobile, in BOTH themes (force `document.documentElement.classList.add('theme-night')` / `'theme-day'`).
- [ ] **Step 3:** Dispatch the independent design-critique agent WITH the four reference mockups described, grading: terracotta pots ✓, lush plants ✓, grassy mound + mushrooms + lit path ✓, dense atmosphere ✓, day = warm golden-hour ✓, both themes legible (AA) ✓, mobile/tablet no overlap + pod no-overlap invariant intact ✓, motion reduced-motion-safe ✓. Returns "close to target?" + specific fixes.
- [ ] **Step 4:** Apply fixes, re-grade until PASS. Commit each round: `git add -A && git commit -m "polish(garden): mockup-match round N"`.
- [ ] **Step 5:** Full verification: `npm test` (14 pass) && `npm run check` (0/0) && `npm run build`. Confirm no dead tokens app-wide: `grep -rnE "var\(--neon-|var\(--success|var\(--danger|var\(--glass-blur" src/` → none.
- [ ] **Step 6:** Present screenshots + scorecard to the user.

---

## Self-review notes

- **Spec coverage:** tokens + day re-art (§6) → Task 1; terracotta pot (§4) → Task 2; lusher plants/blooms (§4) → Task 3 + gate 4; floor/grass (§3) → Task 5; mushrooms (§3) → Task 6; path + atmosphere (§3) → Task 7; Astrid wrapper (§5) → Task 8; A++/mockup gate + a11y/responsive/motion verification (§7–§8) → Task 9.
- **No "similar to Task N":** each task gives concrete token values / the exact gradient + stroke changes / specific structural art direction + its own verify+commit.
- **Type/name consistency:** the new tokens (`--gs-grass`, `--gs-grass-tip`, `--gs-ground-glow`, `--gs-fog`, `--gs-mushroom-stem/cap/glow`, `--gs-pot-lit/shade`) are defined once in Task 1 (both themes) and consumed by Plant (Task 2) and GardenScene (Tasks 5–7). The day/night seam is the existing `App.svelte` `theme-day`/`theme-night` class toggle — unchanged.
- **No logic/regressions:** no game logic, scoring, profile, layout, or mechanic changes; the 14 Vitest tests must stay green (art-only). The pod no-overlap invariant and pod hit-targets are explicitly preserved (decorative art sits behind/around pods; mushrooms placed off hit-targets).
