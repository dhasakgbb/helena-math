# Moonlit Math Garden — Plan 1: Foundation & Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the data layer + theme foundation and ship one complete, A++-graded vertical slice (redesigned hub + the Times Tables game flow end-to-end in the new twilight world), gated by an independent design-critique loop before the world is rolled across the other 9 games.

**Architecture:** Dark-truth `theme.css` (OKLCH tokens, layered glow, self-hosted Lexend) underneath a hand-crafted SVG garden. A reusable `<Plant>` SVG component (species × 5 growth stages) and a fluid `<GardenScene>` meadow replace the broken bento grid and the stranded dark `GardenPlot`. Data-layer fixes (ratio streak, smooth times-tables ring, all-10 app-side Smart Pick) land first with real Vitest coverage; visual fidelity is verified by screenshots graded against a written rubric.

**Tech Stack:** Svelte 5 (runes), TypeScript, Vite + vite-plugin-pwa (workbox), Vitest + jsdom, `profile-schema` (unchanged), hand-authored SVG/CSS.

**Spec:** `docs/superpowers/specs/2026-05-29-moonlit-math-garden-redesign-design.md`

**Out of scope for this plan (deferred to Plan 2/3):** re-skinning the other 9 games, their interaction fixes (Coordinate Plot draw bug, Decimal Shading touch, Number Sort keyboard — except where shared shell already covers them), final empty/loading states, full PWA-offline audit.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/lib/profile.svelte.ts` | Data store; add ratio streak, `timesTablesRingFill`, `smartPick` | Modify |
| `src/lib/profile.svelte.test.ts` | Unit tests for the data-layer fixes | Modify |
| `src/lib/recommender.ts` | Pure app-side all-10 Smart Pick logic (testable, no store coupling) | Create |
| `src/lib/recommender.test.ts` | Unit tests for recommender | Create |
| `src/styles/theme.css` | Dark OKLCH tokens, glow scale, 48px touch, Lexend | Modify |
| `src/styles/app.css` | Glass/button/layout utilities re-skinned dark | Modify |
| `src/styles/garden.css` | Shared visual primitives: layered glow, grain, vignette, parallax, calm-mode | Create |
| `public/fonts/lexend-*.woff2` | Self-hosted Lexend (precached by workbox) | Create |
| `index.html` | Unify theme-color, drop Google Fonts, self-host Lexend | Modify |
| `vite.config.ts` | Unify manifest brand color | Modify |
| `src/components/Plant.svelte` | One plant: species + stage(0–4) + glow → hand-crafted SVG | Create |
| `src/components/GardenScene.svelte` | Fluid SVG meadow: sky/path/beds/foreground parallax + 10 pod slots | Create |
| `src/components/GlowMeters.svelte` | Garden Glow ring, Bloomed Beds, Watering Streak candles | Create |
| `src/components/GardenerBadge.svelte` | Collapsed ProfileBanner → settings sheet | Create |
| `src/components/GameShell.svelte` | Shared twilight frame: back-leaf, title+plant, Astrid, watering-can strip | Create |
| `src/screens/HubScreen.svelte` | Compose sky band + GardenScene; wire smartPick/mastery | Rewrite |
| `src/screens/GameScreen.svelte` | Use GameShell around the active game | Modify |
| `src/screens/EndScreen.svelte` | Camera-pull + bloom + ratio tiers + personal-best | Rewrite |
| `src/games/TimesTables.svelte` | Re-skin into shell; firefly fluency sparkle | Modify |
| `src/components/GridModal.svelte` | "Seed packet" dark glowing 12×12 heat map | Modify |

---

## Phase A — Data layer & tokens (TDD)

### Task 1: Ratio-based practice streak

**Files:**
- Modify: `src/lib/profile.svelte.ts:324-330`
- Test: `src/lib/profile.svelte.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe('profileStore', …)` in `src/lib/profile.svelte.test.ts`:

```ts
it('builds streak on a ratio, so 5-question games count', () => {
  profileStore.importFromText(JSON.stringify(mockProfileJSON));
  // 4/5 = 0.8 >= 0.7 -> streak should increment (old code required score>=7 and failed here)
  profileStore.recordGameResult('long-division', 4, 5, 4);
  expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(1);
  // 3/5 = 0.6 < 0.7 -> streak resets
  profileStore.recordGameResult('long-division', 3, 5, 4);
  expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(0);
  // 7/10 = 0.7 -> still counts for 10-question games
  profileStore.recordGameResult('speed-add', 7, 10, 4);
  expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/profile.svelte.test.ts`
Expected: FAIL — first assertion gets `streak === 0` (old `score >= 7` rejects 4).

- [ ] **Step 3: Implement the ratio fix**

In `src/lib/profile.svelte.ts`, replace lines 324-330:

```ts
    // 3. Update Streak: consecutive games scoring >= 70% (length-agnostic, matches end-screen tiers)
    let streak = typeof mathOverrides.streak === 'number' ? mathOverrides.streak : 0;
    if (total > 0 && score / total >= 0.7) {
      streak += 1;
    } else {
      streak = 0;
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/profile.svelte.test.ts`
Expected: PASS (new test + the existing `records game results and handles practice streaks` still passes — 8/10 and 9/10 both ≥0.7).

- [ ] **Step 5: Commit**

```bash
git add src/lib/profile.svelte.ts src/lib/profile.svelte.test.ts
git commit -m "fix(math): streak counts on score ratio so 5-question games qualify"
```

### Task 2: Smooth Times Tables ring fill

The stored `mastery['times-tables']` (`masteredCount/11`) stays as the gate (GridModal, Bloomed Beds). Add a separate **display** value for the smooth ring.

**Files:**
- Modify: `src/lib/profile.svelte.ts` (add getter on the class, before `exportWithTelemetry`)
- Test: `src/lib/profile.svelte.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('exposes a smooth times-tables ring fill via partial fact credit', () => {
  profileStore.importFromText(JSON.stringify(mockProfileJSON));
  // gate mastery stays 0 until a table hits 5 facts, but ring fill should already move
  profileStore.recordTimesTableFact(7, 2); // table 7 -> 1, table 2 -> 1
  // fill = (min(1,5)+min(1,5)) / (11*5) = 2/55 ≈ 0.036
  expect(profileStore.timesTablesRingFill).toBeCloseTo(2 / 55, 3);
  // gate mastery is still 0 (no table at 5 yet)
  expect((profileStore.profile?.module_overrides?.math as any)?.mastery?.['times-tables']).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/profile.svelte.test.ts`
Expected: FAIL — `profileStore.timesTablesRingFill` is `undefined`.

- [ ] **Step 3: Implement the getter**

Add this getter to the `ProfileStore` class in `src/lib/profile.svelte.ts` (e.g. after the `recommendedMathMode` getter, ~line 144):

```ts
  /** Smooth 0..1 fill for the times-tables ring: partial credit toward 5 facts per table (11 tables). */
  get timesTablesRingFill(): number {
    const facts = ((this.profile?.module_overrides?.math as any)?.times_tables_facts) || {};
    let sum = 0;
    for (let f = 2; f <= 12; f++) {
      sum += Math.min(facts[f] || 0, 5);
    }
    return sum / (11 * 5);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/profile.svelte.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/profile.svelte.ts src/lib/profile.svelte.test.ts
git commit -m "feat(math): smooth times-tables ring fill (partial fact credit)"
```

### Task 3: All-10 app-side Smart Pick recommender

`recommendedMathMode()` only ever returns one of 3 modes. Add a pure recommender that always returns a sensible pick across all 10, preferring the schema pick when it is itself low-mastery, else the lowest-mastery mode in `MATH_MODES` order.

**Files:**
- Create: `src/lib/recommender.ts`
- Create: `src/lib/recommender.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/recommender.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pickSmartMode } from './recommender';
import { MATH_MODES } from './profile.svelte';

describe('pickSmartMode', () => {
  it('returns the schema pick when it is among the lowest-mastery modes', () => {
    const mastery: Record<string, number> = { 'number-sort': 0, 'times-tables': 0.9 };
    expect(pickSmartMode('number-sort', mastery)).toBe('number-sort');
  });

  it('falls back to the lowest-mastery mode when the schema pick is already strong', () => {
    const mastery: Record<string, number> = {};
    for (const m of MATH_MODES) mastery[m] = 0.9;
    mastery['long-division'] = 0.1; // a mode the schema recommender never suggests
    expect(pickSmartMode('times-tables', mastery)).toBe('long-division');
  });

  it('is deterministic: ties resolve in MATH_MODES order', () => {
    const mastery: Record<string, number> = {}; // all undefined -> treated as 0
    expect(pickSmartMode(null, mastery)).toBe(MATH_MODES[0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/recommender.test.ts`
Expected: FAIL — `./recommender` not found.

- [ ] **Step 3: Implement the recommender**

Create `src/lib/recommender.ts`:

```ts
import { MATH_MODES, type MathMode } from './profile.svelte';

/**
 * App-side Smart Pick covering all 10 modes (the schema recommender only covers 3).
 * Honors the schema pick when it is itself in the lowest-mastery tier; otherwise
 * returns the lowest-mastery mode, ties broken by MATH_MODES order (deterministic).
 */
export function pickSmartMode(
  schemaPick: string | null,
  mastery: Record<string, number>
): MathMode {
  const fill = (m: string) => (typeof mastery[m] === 'number' ? mastery[m] : 0);
  let lowest: MathMode = MATH_MODES[0];
  for (const m of MATH_MODES) {
    if (fill(m) < fill(lowest)) lowest = m;
  }
  if (schemaPick && (MATH_MODES as readonly string[]).includes(schemaPick)) {
    if (fill(schemaPick) <= fill(lowest)) return schemaPick as MathMode;
  }
  return lowest;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/recommender.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the store getter that surfaces it**

Add to `ProfileStore` in `src/lib/profile.svelte.ts` (after `recommendedMathMode`), and import at top:

```ts
// top of file, add to existing local imports:
import { pickSmartMode } from './recommender';
```

```ts
  /** All-10 Smart Pick used by the UI AND by recordLaunch telemetry (single source of truth). */
  get smartPick(): MathMode {
    const mastery = ((this.profile?.module_overrides?.math as any)?.mastery) || {};
    return pickSmartMode(this.recommendedMathMode, mastery);
  }
```

> **Telemetry decision (documented):** `recordLaunch` callers pass `profileStore.smartPick` as `recommended`, so `followed`/`overrode`/`last_override_streak` now mean "followed the app's Smart Pick" across all 10 modes. Field shapes are unchanged — the `profile-schema` contract is untouched; only the semantic of "recommended" widens from 3→10 modes. Note this in the spec's §10.6.

- [ ] **Step 6: Run full test suite**

Run: `npm test`
Expected: PASS (all suites).

- [ ] **Step 7: Commit**

```bash
git add src/lib/recommender.ts src/lib/recommender.test.ts src/lib/profile.svelte.ts
git commit -m "feat(math): all-10 app-side Smart Pick recommender + store getter"
```

### Task 4: Dark OKLCH theme tokens

**Files:**
- Modify: `src/styles/theme.css`

- [ ] **Step 1: Replace the `:root` token block**

Rewrite `:root` in `src/styles/theme.css` (lines 1-49) to the dark twilight system. Delete the misnamed `--neon-cyan: #34c759` and the light bento tokens. Set:

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Lexend', var(--font-sans);

  /* Twilight canvas (OKLCH) */
  --sky-top: oklch(28% 0.07 280);     /* deep indigo */
  --sky-mid: oklch(33% 0.08 250);
  --sky-bot: oklch(38% 0.06 200);     /* midnight teal */
  --color-bg: var(--sky-top);
  --color-panel: oklch(30% 0.05 275 / 0.55);
  --color-border: oklch(85% 0.02 280 / 0.12);

  color-scheme: dark;
  --color-text: oklch(95% 0.02 280);
  --color-text-muted: oklch(78% 0.03 280);

  /* Single action color: lantern amber */
  --color-primary: oklch(82% 0.15 75);
  --color-primary-strong: oklch(72% 0.17 70);

  /* Plant-glow accents (honest names) */
  --glow-moonflower: oklch(92% 0.10 200);  /* cyan-white */
  --glow-firefly: oklch(88% 0.15 95);      /* gold */
  --glow-blossom: oklch(75% 0.18 350);     /* magenta */

  /* State colors */
  --color-correct: oklch(80% 0.16 150);
  --color-retry: oklch(82% 0.15 75);       /* amber, replaces every red-X */

  /* Layered glow scale: core + halo (compose, never a single flat shadow) */
  --glow-sm: 0 0 4px var(--glow-c, var(--color-primary)), 0 0 14px -2px var(--glow-c, var(--color-primary));
  --glow-md: 0 0 6px var(--glow-c, var(--color-primary)), 0 0 28px -4px var(--glow-c, var(--color-primary));
  --glow-lg: 0 0 10px var(--glow-c, var(--color-primary)), 0 0 48px -6px var(--glow-c, var(--color-primary));

  --r-sm: 12px; --r-md: 20px; --r-lg: 32px; --r-xl: 40px;
  --touch: 48px;
}
```

- [ ] **Step 2: Verify build & types**

Run: `npm run check && npm run build`
Expected: build succeeds; no token-not-found errors. (Some components still reference old tokens — those are re-skinned in later tasks; build does not fail on unknown CSS vars.)

- [ ] **Step 3: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(theme): dark twilight OKLCH tokens, lantern-amber, 48px touch"
```

### Task 5: Self-host Lexend + unify brand color

**Files:**
- Create: `public/fonts/lexend-400.woff2`, `public/fonts/lexend-600.woff2`, `public/fonts/lexend-700.woff2`
- Modify: `index.html`, `vite.config.ts`, `src/styles/theme.css`

- [ ] **Step 1: Add the Lexend woff2 files**

Download Lexend weights 400/600/700 as woff2 into `public/fonts/` (the existing workbox `globPatterns` already precaches `**/*.woff2`). Run:

```bash
mkdir -p public/fonts
curl -L -o public/fonts/lexend-400.woff2 "https://fonts.gstatic.com/s/lexend/v19/wlptgwvFAVdoq2_F94zlCfv0bz1WCzsW_LBte6KuGEo.woff2"
curl -L -o public/fonts/lexend-600.woff2 "https://fonts.gstatic.com/s/lexend/v19/wlptgwvFAVdoq2_F94zlCfv0bz1WC-cT_LBte6KuGEo.woff2"
curl -L -o public/fonts/lexend-700.woff2 "https://fonts.gstatic.com/s/lexend/v19/wlptgwvFAVdoq2_F94zlCfv0bz1WC9MQ_LBte6KuGEo.woff2"
```
Expected: three non-empty woff2 files. (If a URL drifts, fetch the current woff2 URLs from `https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700`.)

- [ ] **Step 2: Add `@font-face` and remove Google Fonts**

At the top of `src/styles/theme.css` add:

```css
@font-face { font-family: 'Lexend'; font-weight: 400; font-display: swap; src: url('/fonts/lexend-400.woff2') format('woff2'); }
@font-face { font-family: 'Lexend'; font-weight: 600; font-display: swap; src: url('/fonts/lexend-600.woff2') format('woff2'); }
@font-face { font-family: 'Lexend'; font-weight: 700; font-display: swap; src: url('/fonts/lexend-700.woff2') format('woff2'); }
```

In `index.html` delete the three Google Fonts `<link>` lines (preconnect + the `css2?family=Fredoka…` stylesheet) and set the theme color:

```html
    <meta name="theme-color" content="#241b3a" />
```

- [ ] **Step 3: Unify the manifest brand color**

In `vite.config.ts` set both `theme_color` and `background_color` in the `manifest` to `"#241b3a"` (matching `index.html` and `--sky-top`).

- [ ] **Step 4: Verify build & offline precache**

Run: `npm run build`
Expected: build succeeds; `dist/` contains `fonts/lexend-*.woff2` and the generated service-worker precache manifest lists them.

- [ ] **Step 5: Commit**

```bash
git add public/fonts index.html vite.config.ts src/styles/theme.css
git commit -m "feat(theme): self-host Lexend, drop Google Fonts, unify brand color #241b3a"
```

### Task 6: Shared visual primitives (glow, grain, vignette, parallax, calm-mode)

**Files:**
- Create: `src/styles/garden.css`
- Modify: `src/main.ts` (import it), `src/styles/theme.css` (extend reduced-motion guard)

- [ ] **Step 1: Create `src/styles/garden.css`**

```css
/* Foreground grain + vignette so the scene isn't flat CSS */
.grain::after {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.vignette::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(120% 90% at 50% 30%, transparent 55%, oklch(15% 0.05 285 / 0.55) 100%);
}

/* Parallax layers driven by a --px/--py custom property set on pointermove */
.parallax-layer { will-change: transform; transform: translate3d(calc(var(--px,0) * var(--depth,0) * 1px), calc(var(--py,0) * var(--depth,0) * 1px), 0); }

/* Calm mode: an in-app toggle independent of OS reduced-motion */
:root.calm *, :root.calm *::before, :root.calm *::after {
  animation-duration: 0.001ms !important; animation-iteration-count: 1 !important;
}
```

- [ ] **Step 2: Import it and extend the reduced-motion guard**

In `src/main.ts` add `import './styles/garden.css';` after the existing style imports.

In `src/styles/theme.css`, the existing `@media (prefers-reduced-motion: reduce)` block already zeroes `animation-duration`/`transition-duration`. Add inside that block to also neutralize parallax:

```css
  .parallax-layer { transform: none !important; }
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/styles/garden.css src/main.ts src/styles/theme.css
git commit -m "feat(theme): shared garden primitives (glow/grain/vignette/parallax/calm-mode)"
```

---

## Phase B — Plant illustration system (the art foundation)

> Visual tasks are verified by screenshot against the §14 rubric in the spec, not by unit tests. The flagship plant here (moonflower / times-tables) sets the grammar the other 9 inherit in Plan 2.

### Task 7: `<Plant>` SVG component (flagship moonflower)

**Files:**
- Create: `src/components/Plant.svelte`

- [ ] **Step 1: Scaffold the component contract**

Create `src/components/Plant.svelte` with this exact props interface and a hand-crafted SVG body. Render five growth stages (0 seed → 4 bloom) driven by `stage`, glowing in `glow` color, obeying the upper-left moonlight key.

```svelte
<script lang="ts">
  interface Props {
    species?: 'moonflower'; // Plan 2 adds: vine, lattice, blossom, pie, grid…
    stage: 0 | 1 | 2 | 3 | 4;
    glow?: string;          // CSS color, defaults to firefly gold
    size?: number;          // px, height of the pod
    sparkles?: number;      // fluent_facts count -> firefly twinkles above bloom
  }
  let { species = 'moonflower', stage, glow = 'var(--glow-firefly)', size = 96, sparkles = 0 }: Props = $props();
</script>

<!-- Author hand-tuned beziers: pot (with ambient occlusion), stem (consistent weight),
     stage-gated leaves/bud/petals, layered glow halo behind the bloom.
     Light key = upper-left: highlights top-left, shadow bottom-right. -->
<svg class="plant" viewBox="0 0 64 96" style="height:{size}px" style:--glow-c={glow} aria-hidden="true">
  <!-- pot, stem, and stage layers go here; gate with {#if stage >= n} -->
</svg>

<style>
  .plant { display:block; overflow:visible; }
  /* bloom halo uses layered glow (core+halo), breathing sway only when motion allowed */
  @media (prefers-reduced-motion: no-preference) {
    :global(.plant .bloom) { transform-origin: 50% 100%; animation: sway 4s ease-in-out infinite alternate; }
    @keyframes sway { from { transform: rotate(-2.5deg); } to { transform: rotate(2.5deg); } }
  }
</style>
```

- [ ] **Step 2: Author the five stages to studio quality**

Fill the SVG: a common pot silhouette with AO; a single stem weight; stage 1 seedling, 2 sprout (two leaves), 3 bud, 4 bloom (layered-glow petals + firefly sparkles count = `sparkles`). Highlights top-left, shadows bottom-right. Use `filter: url(#soft)` Gaussian blur for the halo, not a flat shadow.

- [ ] **Step 3: Visual check via a scratch route**

Run: `npm run dev`. Temporarily render `<Plant stage={0..4} />` side by side in `HubScreen` (or a scratch block), screenshot, confirm: stages read as one growth sequence; bloom glows with core+halo; light direction consistent.

- [ ] **Step 4: Commit**

```bash
git add src/components/Plant.svelte
git commit -m "feat(garden): hand-crafted Plant SVG with 5 growth stages (moonflower)"
```

### Task 8: `<GardenScene>` fluid meadow

**Files:**
- Create: `src/components/GardenScene.svelte`

- [ ] **Step 1: Build the scene**

Create `src/components/GardenScene.svelte`: a single responsive SVG (`viewBox`, `preserveAspectRatio`) with four `.parallax-layer` groups (`--depth` 0.2/0.5/0.8/1.2): star-field+hills, curving path, 10 equal-aspect pod slots positioned along the path, foreground grass + drifting fireflies. Pods are grouped into 3 groves by ground-glow tint + a marker sign; **all pods identical size**. Each pod hosts a `<Plant>` whose `stage` derives from `mastery` and emits `onSelect(modeId)`. Wire pointer parallax by setting `--px/--py` on the root on `pointermove` (guarded by reduced-motion).

```svelte
<script lang="ts">
  import Plant from './Plant.svelte';
  import { profileStore, MATH_MODES, type MathMode } from '../lib/profile.svelte';
  interface Props { onSelect: (m: MathMode) => void }
  let { onSelect }: Props = $props();
  function stageFor(m: string): 0|1|2|3|4 {
    const v = m === 'times-tables'
      ? profileStore.timesTablesRingFill
      : (((profileStore.profile?.module_overrides?.math as any)?.mastery?.[m]) ?? 0);
    return v <= 0 ? 0 : v <= 0.3 ? 1 : v <= 0.6 ? 2 : v <= 0.85 ? 3 : 4;
  }
  // POD_LAYOUT: 10 {id, x, y, grove} positions along the path (author by eye against viewBox)
</script>
```

- [ ] **Step 2: Responsive curves**

Author 3 path/layout variants via container width (CSS container query or `matchMedia`): wide serpentine, tall serpentine (tablet portrait), single vertical column (<600px) with grove headers. Confirm no pod overlap/overflow at 1440 / 834 / 390 widths.

- [ ] **Step 3: Visual check**

Run: `npm run dev`, screenshot at the three widths. Confirm: one continuous world, equal pods, readable grove clustering, parallax depth.

- [ ] **Step 4: Commit**

```bash
git add src/components/GardenScene.svelte
git commit -m "feat(garden): fluid SVG meadow with parallax layers and 10 equal pods"
```

---

## Phase C — Hub

### Task 9: Glow-meters

**Files:**
- Create: `src/components/GlowMeters.svelte`

- [ ] **Step 1: Build the three meters**

Create `src/components/GlowMeters.svelte`: **Garden Glow** ring (average of `mastery` across `MATH_MODES`, using `timesTablesRingFill` for times-tables), **Bloomed Beds** count (modes with gate-mastery ≥ 0.85), **Watering Streak** candle row (one flame per `streak`, plus a dimmed "dewdrop" freeze affordance). Ring is an SVG `stroke-dasharray` arc with layered glow. Honest labels ("Garden Glow", "Bloomed Beds", "Watering Streak").

- [ ] **Step 2: Visual check + commit**

Run: `npm run dev`, screenshot. Then:

```bash
git add src/components/GlowMeters.svelte
git commit -m "feat(hub): glow-meters (garden glow ring, bloomed beds, streak candles)"
```

### Task 10: `<GardenerBadge>` settings sheet

**Files:**
- Create: `src/components/GardenerBadge.svelte`

- [ ] **Step 1: Build it**

Create `src/components/GardenerBadge.svelte`: a small badge button (top-right) that opens an inline sheet wrapping the existing `ProfileBanner` controls (import paste, re-export download, view activity `#profile=` URL, stale badge, override nudge, forget). Reuse the logic from `src/components/ProfileBanner.svelte` — move its markup into the sheet; keep all handlers. Dark-skinned.

- [ ] **Step 2: Verify build, visual check, commit**

Run: `npm run check && npm run dev` (screenshot the open sheet). Then:

```bash
git add src/components/GardenerBadge.svelte src/components/ProfileBanner.svelte
git commit -m "feat(hub): collapse profile controls into gardener's-badge sheet"
```

### Task 11: Rewrite `HubScreen`

**Files:**
- Rewrite: `src/screens/HubScreen.svelte`

- [ ] **Step 1: Compose the new hub**

Replace `src/screens/HubScreen.svelte` with: a `.grain .vignette` twilight container; **sky band** = Astrid on a lantern (`<Mascot pose="waving" />`) + a short speech bubble using the existing `smartRecommendation`-style copy but driven by `profileStore.smartPick`, a large **"Tonight's Plant"** button (`onSelectMode(profileStore.smartPick)`), and `<GlowMeters>`; **garden band** = `<GardenScene onSelect={handleSelect} />`; `<GardenerBadge>` top-right. Keep the `times-tables` ≥0.85 → `<GridModal>` behavior from the old `handlePlantClick`. Delete the bento grid, `CATEGORIES`/`MODES_METADATA` size logic, and the old `GardenPlot` import.

- [ ] **Step 2: Update launch telemetry to use smartPick**

Wherever a mode is launched from the hub, ensure the eventual `recordLaunch(mode, profileStore.smartPick)` is used (see Task 12/GameScreen wiring) so telemetry matches the surfaced recommendation.

- [ ] **Step 3: Verify build + visual check at 3 widths**

Run: `npm run check && npm run dev`. Screenshot desktop/tablet/mobile. Confirm hub matches §6.

- [ ] **Step 4: Commit**

```bash
git add src/screens/HubScreen.svelte
git commit -m "feat(hub): twilight sky band + garden meadow, drop bento grid"
```

---

## Phase D — Game shell, Times Tables, end screen, bloom

### Task 12: `<GameShell>` shared frame

**Files:**
- Create: `src/components/GameShell.svelte`
- Modify: `src/screens/GameScreen.svelte`

- [ ] **Step 1: Build the shell**

Create `src/components/GameShell.svelte` with props `{ title: string; plantModeId: string; questionIndex: number; total: number; onBack: () => void }` and a default slot for the game widget. Render: 48px round back-leaf (calls `onBack`), centered title + a small `<Plant>` thumbnail of `plantModeId`, top-right `<Mascot>`, and a **watering-can progress strip** rendering `total` droplets (filled up to `questionIndex`) — so 5- and 10-question games both render honestly. Dark-glass `.glass-panel` play surface in the slot.

- [ ] **Step 2: Wrap the active game in GameScreen**

In `src/screens/GameScreen.svelte`, render the selected game inside `<GameShell …>`. Pass `total` from the game's known length and the live `questionIndex`. Ensure `recordLaunch(mode, profileStore.smartPick)` fires on entry (replace any prior `recommendedMathMode` argument with `profileStore.smartPick`).

- [ ] **Step 3: Verify build + visual check + commit**

Run: `npm run check && npm run dev` (enter Times Tables, screenshot the shell). Then:

```bash
git add src/components/GameShell.svelte src/screens/GameScreen.svelte
git commit -m "feat(game): shared twilight GameShell with honest watering-can progress"
```

### Task 13: Re-skin Times Tables into the world

**Files:**
- Modify: `src/games/TimesTables.svelte`

- [ ] **Step 1: Apply the dark input treatment + fluency sparkle**

Restyle `TimesTables.svelte` to the dark-glass inputs (pale-glow on dark, ≥48px), correct = `--color-correct` check + soft chord + corner-plant pulse, wrong = `--color-retry` ripple + Astrid hint (no red X). Surface `fluent_facts` as firefly `sparkles` on the shell's plant thumbnail / corner plant for sub-3s answers. Keep all existing `recordTimesTableFact`/`recordTimesTableMistake` calls intact.

- [ ] **Step 2: Verify build + visual check + commit**

Run: `npm run check && npm run dev`. Screenshot a correct and an incorrect answer state. Then:

```bash
git add src/games/TimesTables.svelte
git commit -m "feat(game): re-skin Times Tables into twilight world + fluency sparkles"
```

### Task 14: Rewrite `EndScreen` — the signature bloom moment

**Files:**
- Rewrite: `src/screens/EndScreen.svelte`

- [ ] **Step 1: Build the camera-pull + ratio tiers**

Replace `src/screens/EndScreen.svelte`: show the watered bed center, **brighter than before**, with earned droplets flying in (brief, **skippable** via tap/Esc). Tier headline computed on **ratio** `score/total`: `>=0.9` "Your brightest night yet!", `>=0.7` "This bed is glowing brighter!", else "Good practice — let's tend it again." Large glow-ring out of the real `total`. Personal-best line when the new score beats the best in `scores[mode]`. Buttons: **Water Again** / **Tend Another**. Quiet "Next: tend [smartPick]" link.

- [ ] **Step 2: Bloom only on real threshold crossing; reduced-motion collapses it**

Play the bloom celebration only when this result pushes gate-mastery across 0.85. Drive all motion via `@keyframes` so reduced-motion + calm-mode render the final lit state instantly.

- [ ] **Step 3: Verify build + visual check (this is the screenshot moment) + commit**

Run: `npm run check && npm run dev`. Screenshot the end screen at a passing score and at a bloom crossing. Then:

```bash
git add src/screens/EndScreen.svelte
git commit -m "feat(end): camera-pull bloom moment, ratio tiers, personal-best"
```

### Task 15: "Seed packet" GridModal re-skin

**Files:**
- Modify: `src/components/GridModal.svelte`

- [ ] **Step 1: Re-skin dark + glowing**

Restyle the 12×12 heat map in `src/components/GridModal.svelte` to the twilight world: dark-glass packet surface, mastered cells glow (`--glow-firefly`), a subtle distinct dot in cells whose fact is in `fluent_facts` (speed vs accuracy). Keep the existing mastery/highlight logic.

- [ ] **Step 2: Verify build + visual check + commit**

Run: `npm run check && npm run dev` (master times-tables enough to open it, or temporarily lower the gate to inspect). Then:

```bash
git add src/components/GridModal.svelte
git commit -m "feat(hub): seed-packet dark glowing times-tables heat map"
```

---

## Phase E — A++ critique gate

### Task 16: Screenshot critique loop until the rubric clears

**Files:** none (verification + iteration on prior tasks)

- [ ] **Step 1: Build and run the app**

Run: `npm run build && npm run preview` (or `npm run dev`). Confirm no console errors and the full Times Tables flow works: hub → game → end → back.

- [ ] **Step 2: Capture real pixels at three breakpoints**

Capture screenshots of hub, game shell (mid-question), and end-screen bloom at desktop (1440), tablet-portrait (834), and mobile (390) — via Claude Preview / chrome-devtools MCP.

- [ ] **Step 3: Dispatch the independent design-critique agent**

Dispatch a fresh agent with the screenshots, the spec §4 art-direction standard, and the §14 rubric. Ask it to grade each rubric line pass/fail and return specific "not studio yet because X → do Y" fixes. (Per user decision: an independent agent grades each round.)

- [ ] **Step 4: Apply fixes and re-grade**

Implement the agent's fixes, re-screenshot, re-dispatch. Repeat until every §14 rubric line passes at all three breakpoints. Commit each iteration:

```bash
git add -A && git commit -m "polish(garden): A++ critique round N fixes"
```

- [ ] **Step 5: Run the full suite + checks before handoff**

Run: `npm test && npm run check && npm run build`
Expected: all green.

- [ ] **Step 6: Present to the user for sign-off**

Show the user the final screenshots and rubric scorecard. On approval, this unblocks **Plan 2** (roll the world across the other 9 games, with their interaction fixes) and **Plan 3** (final polish + PWA-offline audit), which are written referencing the now-locked `<Plant>`/`<GameShell>`/glow-token APIs.

---

## Self-review notes

- **Spec coverage (this plan's scope):** theme war → Tasks 4-6; bento grid → Tasks 8, 11; streak bug → Task 1; smooth TT ring → Tasks 2, 7-9; all-10 Smart Pick + telemetry → Task 3, 11, 12; honest hub copy/Times-Tables rename → Tasks 11, 13; watering-can honest totals → Task 12; ratio end-tiers + bloom → Task 14; seed-packet heat map → Task 15; A++ standard + critique loop → Tasks 7-9, 14, 16. Deferred (declared): Coordinate Plot draw bug, Decimal Shading touch, Number Sort keyboard, the other 8 game re-skins → **Plan 2**.
- **Telemetry semantic** is documented in Task 3, Step 5.
- **Plant species enum** is introduced in Task 7 as `'moonflower'` and widened in Plan 2 — no later task in *this* plan references an undefined species.
