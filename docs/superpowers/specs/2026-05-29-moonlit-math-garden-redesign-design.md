# Moonlit Math Garden — Full-App Redesign

**Date:** 2026-05-29
**Status:** Design — awaiting user review before planning
**Scope:** Entire app (hub, shared shell, all 10 games, end screen)
**App:** `helena/math` — Svelte 5 PWA, deployed to Vercel, integrated with `profile-schema`

---

## 1. Goal & quality bar

Redesign the Helena math app top-to-bottom into a single, cohesive, **bioluminescent twilight garden** that an 8–11-year-old finds genuinely delightful and that meets an **A++ studio visual bar** — not "clean," but *rendered*, with a consistent lighting model, layered depth, hand-crafted illustration, and one signature moment executed to perfection.

The redesign must simultaneously **fix the root cause** of the current "awful" look: a light theme fighting leftover dark assets, a fragile variable-span bento grid, and copy/icons that lie about gameplay.

### Success criteria
- The hub and every game read as **one continuous world**; no screen breaks the twilight aesthetic.
- The fragile bento grid is gone — modes are equal-aspect pods on a fluid SVG path; **no empty-hero-next-to-cramped-tile** artifacts at any width.
- Clears the **A++ rubric** (§14) at desktop / tablet-portrait / mobile, verified on real pixels by an independent critique agent before the world is rolled across all 10 games.
- Fully accessible (WCAG AA), responsive, offline-capable, and intrinsic-motivation-only.
- All audited **logic bugs** (§10) are fixed, not papered over.

### Non-goals
- No change to the `profile-schema` JSON contract (recommender fallback lives in app code).
- No leaderboards, XP, ranks, avatar shop, timers-by-default, or any extrinsic-reward loop.
- No new math content or new game mechanics — we re-skin and fix the 10 existing games.

## 2. Decisions locked (from brainstorming)

| Decision | Choice |
| --- | --- |
| Scope | Entire app, top to bottom |
| Direction | **Moonlit Math Garden** (cohesive glowing twilight world) |
| Theme | **Dark** is the single source of truth |
| Motivation | **Intrinsic-first** — mastery-as-light, personal-best, forgiving streak. No XP/ranks. |
| Journey ordering | Fully open — every pod tappable, ordering is a soft suggestion, never a gate |
| Smart Pick coverage | App-side recommender covering all 10; **no schema change** |
| Art source | **Hand-crafted SVG in-code** (all 10 plants × 5 growth stages) |
| Critique loop | **Independent design-critique agent** grades screenshots each round |
| Learner | Helena, ~8–11 (grades 3–6) |
| Devices | Responsive: touch-safe (48px targets) + pointer/desktop |

## 3. Diagnosis (what's broken today)

- **Theme war.** `theme.css` defines a light "Apple bento" palette while `GardenPlot.svelte`, `GridModal.svelte`, and many game inputs still use dark fills, neon strokes, and white sparkles. On white, the garden renders as ~10 floating brown soil ovals. Copy ("light up the garden") was written for a dark theme that no longer exists.
- **Fragile grid.** `HubScreen.svelte` hardcodes 2×2 "hero" and 2×1 "wide" tiles with `grid-auto-flow: dense`, so an unstarted Times Tables card becomes a giant empty box beside cramped tiles. Tile size signals nothing.
- **Three competing visual systems** (garden / bento / neon mascot) with no shared lighting, color, or motion language.
- **Copy/icon lies.** Place Value shows apples (it's a gem counter), Division shows a frog/pond (it's a 4-step bracket), PEMDAS shows a tree (it's a collapsing expression), "geometry-angles" is coordinate plotting.
- **Logic bugs** under the surface (see §10).

## 4. Art direction & craft standard (the A++ bar, written down)

This section is the measurable definition of "studio-grade." Implementation is reviewed against it.

**Lighting model.** One moonlight key from upper-left; each plant emits its own bioluminescent fill light. Every shadow, halo, gradient, and rim-light obeys this. Pots receive ambient occlusion; the garden path catches a soft rim-light. Consistency here is what makes the scene read as rendered rather than assembled.

**Color.** Defined in **OKLCH** for perceptually smooth ramps (no muddy mid-tones). Sky is a 3-stop indigo→midnight-teal gradient. **Glow is layered** — a tight bright core shadow + a wide soft halo + an SVG Gaussian blur — never a single flat `box-shadow`. No pure `#000` or `#fff` anywhere.

**Depth.** Four parallax layers: (1) far star-field + hills, (2) mid curving path, (3) plant beds, (4) foreground grass with drifting fireflies/spores. Subtle pointer/scroll parallax. This removes the flat-dashboard feel.

**Illustration grammar.** All 10 plants share visual DNA: identical stem weight, a common pot silhouette, the same 5-stage growth logic, hand-tuned bézier curves. They must read as one designed set. Growth stages (seed → seedling → sprout → bud → bloom) are a real SVG/CSS keyframe system mapped from `mastery`, not swapped emoji.

**Type.** Lexend (self-hosted), modular scale (1.25 ratio), **tabular-lining numerals** for all math so digits never jitter, optical letter-spacing per size, line-height ≥ 1.5, bold (never italic/underline) for emphasis.

**Motion choreography.** Spring easing (not linear), staggered entrances, noise-driven firefly drift, 60fps GPU-only transforms (`transform`/`opacity`). The **signature moment is the bloom**: watering → bed lights → end-screen camera-pull. It receives disproportionate polish — it is the screenshot that sells the app. All motion is keyframe-based so `prefers-reduced-motion` and an in-app "calm mode" both disable it.

**Texture & finish.** Subtle film grain + vignette to avoid flat CSS; designed glowing focus rings; designed empty and loading states; a consistent radius rhythm; pixel-aligned geometry.

## 5. Design system / theme tokens

Commit fully to dark. Rework `theme.css` so dark is intended truth; purge leftover light/neon values.

- **Background:** indigo→midnight-teal 3-stop gradient (OKLCH). Surfaces are dark-glass panels with one hairline border + layered glow, not heavy `blur(30px)`.
- **Action color:** lantern-amber (single primary).
- **Plant-glow accents:** moonflower cyan-white, firefly gold, blossom magenta — these give `--neon-cyan/purple/pink` honest, consistent meaning. Delete misnamed tokens (`--neon-cyan: #34c759` green) and all hardcodes (`#00e676`, `#00e5ff`, `#ff007f`, `oklch(28%…)` soil, etc.).
- **State colors:** `--color-correct` (green), `--color-retry` (amber, replaces every red-X). Never color-alone — always glyph + label + motion.
- **Type:** `--font-display` → Lexend (self-hosted woff2, precached by workbox); remove unused Fredoka/SF-Pro-only stack.
- **`--touch`:** 44 → **48px**; audit every target.
- **Unify brand color** across `index.html` `theme-color`, PWA manifest, and CSS bg (ends the current dark-`1c1a3a` / sea-green-`2e8b57` / light-`f4f5f7` split).
- **Contrast:** ink/text ≥ 7:1 on background; all state colors ≥ 4.5:1.

## 6. Hub — one fluid SVG meadow

Vertically-stacked twilight scene, not a grid.

- **Sky band (~22vh):** Astrid the firefly on a hanging lantern + one short Smart Pick speech bubble + a large primary **"Tonight's Plant"** button (play in <15s, no reading required). Three honest glow-meters: **Garden Glow** ring (avg mastery), **Bloomed Beds** count (modes ≥ 0.85), **Watering Streak** candles (lit nights; honestly labeled sessions, with a "dewdrop" freeze token so a missed day doesn't snuff it).
- **Garden band:** one continuous SVG meadow; **10 equal-aspect plant pods** along a gently curving path. Clustered into three groves by ground-glow halos + one low garden-marker sign each — **clustering by proximity/tint, never by resizing tiles**. Groves: **Number Patch**, **Shape & Space Grove**, **Big-Kid Greenhouse** (final names map to the 3 existing categories).
- **Interaction:** tap any pod → launch its game. Secondary tap / long-press on a bloomed Times Tables plant → "seed packet" 12×12 fact heat-map overlay (re-skinned to the dark world). Dimmed/unrecommended beds still glow faintly and stay directly tappable — no mode hidden behind the recommender.
- **ProfileBanner** collapses to a "gardener's badge" that opens a settings sheet (import / re-export / view activity / stale badge / forget) — out of Helena's main eyeline, fully preserved for the parent contract.
- **Responsive:** fluid SVG `viewBox`. Wide → path curves widely, meters horizontal under Astrid. Tablet portrait → path re-curves into a taller serpentine (2–3 visual rows of equal pods). <600px → single vertical scroll of equal pods under grove headers. No mid-width overflow because pods never span.

## 7. Game shell — the world never breaks

Identical twilight frame around all 10 games (zero re-learning):

- Top-left: 48px round **"back to garden" leaf** button.
- Top-center: honest game title + a thumbnail of *that plant* (so Helena always knows which bed she's watering).
- Top-right: Astrid the firefly, small, reacting via existing poses (thinking/happy/wow/sad/sleeping, driven by `onCorrect`/`onIncorrect` + the inactivity sleep timer).
- A **"watering can" progress strip**: 10 droplets for 10-question games, **5 larger droplets** for 5-question games — honest length, reads `total` from the `onFinished` contract.
- One centered "garden table" play surface (single dark-glass panel) with **one consistent input treatment**: pale-glowing inputs on dark, ≥48px targets, pointer-events + full keyboard activation.
- **Correct** = droplet fills + soft chord + corner plant pulses + check glyph (multimodal, never color-only). **Wrong** = droplet ripples + Astrid one-line scaffold hint; never a bare red X.
- Overflow menu: sound toggle, **calm mode** (dampens non-essential motion independent of OS), hide-timer. Speed Add's sub-3s bonus stays a silent shimmer — no countdown shown.

## 8. End screen — camera pulls back to the garden

- The bed just watered is shown center, **visibly more lit** than before; earned droplets fly into it (brief, **skippable**).
- Score as a filled glow-ring out of the **real total** (5 or 10). **Tier logic is ratio-based** (`score/total`): ≥0.9 "your brightest night yet," ≥0.7 "this bed is glowing brighter," else "good practice — let's tend it again." This lets 5-question games legitimately reach the top tier.
- Personal-best framing only ("Your brightest night yet for this plant") — no peer comparison.
- Two equal buttons: **Water Again** (replay) / **Tend Another** (back to garden). Quiet third link: "Next: tend [recommended]" feeding the next Smart Pick.
- A brief **bloom celebration** plays **only** when a real mastery threshold is crossed. `prefers-reduced-motion`/calm-mode collapse the camera-pull and bloom to instant state changes.

## 9. Progress & motivation (intrinsic-first)

Mastery *is* light. One recurring primitive (the glow/ring) at three scales: small per pod, medium in the Smart Pick hero, large on the end screen — all read `module_overrides.math.mastery` (0..1).

- **Growth:** five stages mapped from mastery; ≥0.85 = bloomed, emits a grove-lighting halo. Hub **Garden Glow** ring = average mastery.
- **Times-tables ring must move smoothly** (see §10.5) — partial-credit fill, not a 0/11 step function.
- **Fluency layer:** the untapped `fluent_facts` (≤3s answers) becomes a **firefly sparkle** above a plant — separates *speed* from *accuracy* without adding pressure.
- **Streak:** candle flames, honestly labeled, forgiving dewdrop freeze token; detail expands to a 7-session sparkline from `scores` history.
- **No XP, ranks, leaderboards, or timers by default.** Mastery is earned by demonstrated competence (existing mastered-at-5 / EWMA / 0.85 gate), never time-on-task.

## 10. The 10 modes — renaming, plant grammar, and in-scope fixes

### 10.0 Honest renaming (titles + icons must match the mechanic)

| Today (misleading) | New name | Plant motif | Why |
| --- | --- | --- | --- |
| Place Value Orchard 🍎 | **Place Value** | glowing gem-pods you fill | It's a +/- gem counter, not falling apples |
| Division Stones 🐸 | **Long Division** | stepping-stone vine (4 stones = 4 steps) | It's a 4-step bracket, no frog/pond |
| PEMDAS Trees | **Order of Operations** | pruning vine, trimmed node by node | It's a collapsing expression, no tree |
| Garden Star Maps (`geometry-angles`) | **Coordinate Plot** | constellation-flower | It's (x,y) plotting, not angles |
| Times Tables | Times Tables | flagship moonflower | (kept) |
| Speed Add | Speed Add | fast-twinkle firefly bloom | (kept) |
| Number Sort | Number Sort | sorting-bins blossom | (kept) |
| Fraction Garden | Fraction Garden | petal pie-flower | (kept) |
| Multiplication Grid | Multiplication Grid | lattice/area-grid vine | (kept) |
| Decimal Shading | Decimal Shading | 10×10 grid-bed | (kept) |

> `id` values stay stable for data continuity; only display titles/icons/copy change.

### In-scope logic & interaction fixes (verified against source by the stress-test agent)

These are committed scope, not an appendix — the redesign exposes them, so the redesign fixes them.

1. **Streak broken for 5-question games.** `recordGameResult` (`src/lib/profile.svelte.ts:326`) gates streak on `score >= 7` (absolute), so long-division / coordinate-plot / order-of-operations (all `onFinished(score, 5)`) can never build a streak. **Fix:** ratio threshold `score/total >= 0.7`, matching the new end-tier logic. Length-agnostic.
2. **Coordinate Plot draws the answer, not the child's work.** `GeometryConstellation.svelte:201` connects `currentQuestion.points` (the target). **Fix:** draw lines through `userPoints`.
3. **Decimal Shading is mouse-only (broken on iPad).** `DecimalGridZoom.svelte:215-216` uses `onmousedown`/`onmouseenter`. **Fix:** pointer events + `touch-action: none` + pointer capture.
4. **Number Sort has no keyboard path.** Tiles (`NumberSort.svelte:169-171`) have `onclick` but no `role`/`tabindex`/`onkeydown`. **Fix:** add keyboard activation + focus ring.
5. **Times-tables ring jumps in chunks.** Mastery = `masteredCount/11` (a table counts only at ≥5 facts), so the ring is frozen for dozens of correct answers then leaps — inconsistent with every other game's EWMA ring. **Fix:** partial-credit display fill `Σ min(facts[t],5)/5 over the 11 tables` so the ring moves smoothly. Document the semantics (display fill vs. mastered-count gate).
6. **Smart Pick only covers 3 of 10 modes.** `MODE_AFFINITY.math` + `MATH_ORDER` rotate over only times-tables/speed-add/number-sort, so `recommendedMathMode()` almost never returns null — a null-gated fallback never fires. **Fix:** an app-side recommender that **always runs**: take `recommendedMathMode()` as one candidate, compute lowest-mastery-in-path-order across all 10, and deterministically merge (honor the schema pick only when its mastery is also lowest-tier, else use the path fallback). **Telemetry:** `recordLaunch()` buckets followed/overrode by comparing launched vs. recommended (read by the parent dashboard). Decide and document whether "recommended" for telemetry is the schema value or the app value so `followRate`/`last_override_streak` don't silently diverge. No `profile-schema` change.
7. **Touch / fonts / motion hygiene.** `--touch` → 48px app-wide; self-host Lexend woff2 (workbox-precached, `font-src 'self'`); ensure every new animation (bloom, ring tween, shake, firefly drift, sparkline) is `@keyframes`-based so the existing reduced-motion rule disables it, plus explicit guards for any JS-driven transform.

### 10.6 Telemetry decision

`recordLaunch` callers pass `profileStore.smartPick` as `recommended`, so `followed`/`overrode`/`last_override_streak` mean "followed the app's Smart Pick" across all 10 modes. Field shapes unchanged; `profile-schema` contract untouched; only the semantic of "recommended" widens from 3 → 10 modes.

The app-side `pickSmartMode` function (`src/lib/recommender.ts`) is the single source of truth for the Smart Pick: it takes `recommendedMathMode()` (the schema's 3-mode candidate) and the per-mode `mastery` map, honors the schema pick only when its mastery is in the lowest-tier, and otherwise returns the lowest-mastery mode in `MATH_MODES` order (deterministic tie-breaking). The `profileStore.smartPick` getter wires this into the store with no store coupling in the pure function itself.

## 11. Constraints preserved

- Svelte 5 runes + the existing `profileStore` singleton and `module_overrides.math.*` fields.
- `profile-schema` JSON contract unchanged; URL `#profile=` import + scrub + re-export preserved.
- PWA / offline (workbox), Vercel deploy, `localStorage` persistence.
- All parent-facing telemetry (`scores`, `mastery`, `streak`, `recordLaunch` buckets) stays readable by the learner-profile dashboard.

## 12. Build sequencing (vertical slice first)

Foundation-first so every later step inherits the world. Each phase ends at a reviewable state.

1. **Foundation:** rework `theme.css` tokens (OKLCH, dark truth, lantern-amber, plant accents, 48px, Lexend self-hosted), unify brand color, set up the layered-glow + grain/vignette + parallax primitives and the reduced-motion/calm-mode plumbing. Land the **data-layer fixes** (streak ratio, times-tables partial-credit fill, app-side recommender + telemetry decision).
2. **Vertical slice:** hub (full SVG meadow + sky band + 3 meters) **and one complete game** (Times Tables — the flagship moonflower) end-to-end through the new game shell + end screen + bloom moment. **Run the A++ critique loop here** until it clears the rubric at all three breakpoints — before scaling.
3. **Roll the world:** re-skin the remaining 9 games into the shell one at a time, applying the per-game interaction fixes (Coordinate Plot draw bug, Decimal Shading touch, Number Sort keyboard, etc.) and renames/plant motifs.
4. **End-state polish:** celebrations, empty/loading states, seed-packet heat map, ProfileBanner sheet, final accessibility + PWA-offline pass.

## 13. Verification loop (definition of A++ done)

Studio quality is achieved by iterating on real pixels, not by spec alone.

- Build → run the app → capture screenshots at **desktop / tablet-portrait / mobile** (Claude Preview / DevTools).
- An **independent design-critique agent** grades each round against the §4 standard and §14 rubric and named benchmarks (Monument Valley, DragonBox, Linear, Active Theory), returning specific "this isn't studio yet because X → do Y" fixes.
- Iterate until the rubric clears, then present to the user. The world is **not** rolled across all 10 games until the vertical slice clears the bar.

## 14. A++ rubric (pass/fail per round)

- [ ] **One light source** — every shadow/halo/gradient obeys the moonlight key + plant fill; nothing flat-lit.
- [ ] **Layered glow** — no single flat `box-shadow`; core + halo + blur present on glowing elements.
- [ ] **Depth** — ≥3 parallax layers visibly readable; foreground particles drift.
- [ ] **Illustration cohesion** — the 10 plants read as one set; growth stages are smooth, not swapped icons.
- [ ] **Type rhythm** — modular scale honored; math uses tabular numerals; no digit jitter.
- [ ] **Motion** — spring easing, staggered entrance, 60fps; the bloom moment is delightful and skippable.
- [ ] **Color** — OKLCH ramps, no pure black/white, no muddy mid-tones; AA contrast verified.
- [ ] **Finish** — grain/vignette present; focus rings designed; empty/loading states designed; pixel-aligned.
- [ ] **Responsive** — no overflow/gaps at any width; touch targets ≥48px; thumb-reachable controls.
- [ ] **"Screenshot test"** — a frame of the hub and a frame of the bloom each look like a studio product shot.

## 15. Risks & open items

- **Illustration/motion cost** is the single biggest effort (10 plants × 5 stages + the bloom). Mitigated by shared grammar + vertical-slice-first so we prove the pipeline on one plant.
- **Dark + contrast discipline** across every game input — enforced by the AA checklist + per-game review.
- **Recommender/telemetry coupling** — must be tested so the app-side pick never corrupts `followRate`/`last_override_streak`.
- **Repeated-play fatigue** on the camera-pull — must be aggressively skippable + reduced-motion-aware.
- Deeper logic correctness beyond the listed bugs may surface during per-game work; handle as found.

---

*Next step after user review: invoke the `writing-plans` skill to turn this spec into a sequenced implementation plan (foundation → vertical slice + critique loop → roll-out → polish).*
