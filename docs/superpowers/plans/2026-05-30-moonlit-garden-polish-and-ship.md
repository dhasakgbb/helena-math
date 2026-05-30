# Moonlit Math Garden — Plan 3: Polish & Ship

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining gaps to a truly ship-ready A++ redesign: a designed first-run/empty state (the one real UX hole), per-mode plant variety, a verified PWA-offline experience, and honest internal filenames — then a final design + offline gate.

**Architecture:** The data layer is synchronous (localStorage), so there is no async "loading" screen to design — the gap is the *empty/first-run* experience (no profile → garden of dead seeds with no onboarding). Plant variety reuses the existing `<Plant>` architecture: stages 0–3 (pot/seedling/sprout/bud) are shared DNA; only the **stage-4 bloom head** varies per `species`, keeping the 10 beds reading as one designed set. Filenames are renamed to match the honest game titles. PWA precache is audited for offline correctness.

**Tech Stack:** Svelte 5 (runes), TypeScript, Vite + vite-plugin-pwa (workbox), Vitest + jsdom, hand-authored SVG/CSS.

**Spec:** `docs/superpowers/specs/2026-05-29-moonlit-math-garden-redesign-design.md` (§4 art direction, §6 hub, §13/§14 gate/rubric).
**Builds on:** Plan 1 (foundation + slice) and Plan 2 (9-game roll-out), both merged to `main`.

**Scope decision (YAGNI):** Plant variety ships **a small set of shared-DNA bloom-head variants** (not 10 fully-bespoke illustrations) mapped across the 10 modes — visible variety, low regression risk, consistent with the round-2 critique that already PASSED on one silhouette + per-grove color. No new "loading spinner" (data is sync). No leaderboards/XP (spec non-goal).

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/components/EmptyGardenState.svelte` | First-run / no-profile onboarding overlay (Plant a seed / Take Quiz / Import) | Create |
| `src/screens/HubScreen.svelte` | Show empty state when `profileStore.profile` is null | Modify |
| `src/components/Plant.svelte` | Extend `species` union; per-species stage-4 bloom head | Modify |
| `src/components/SpeciesMap.ts` | `SPECIES_FOR: Record<MathMode, PlantSpecies>` single source of truth | Create |
| `src/components/GardenScene.svelte` | Pass per-mode `species` to each pod's `<Plant>` | Modify |
| `src/components/GameShell.svelte` | Accept + pass `species` to the thumbnail `<Plant>` | Modify |
| `src/screens/GameScreen.svelte` | Pass per-mode `species` to GameShell | Modify |
| `src/screens/EndScreen.svelte` | Use per-mode `species` for the watered-bed Plant | Modify |
| `src/games/CoordinatePlot.svelte` | Renamed from `GeometryConstellation.svelte` | Rename |
| `src/games/LongDivision.svelte` | Renamed from `LongDivisionSpace.svelte` | Rename |
| `src/games/PlaceValue.svelte` | Renamed from `PlaceValueCosmos.svelte` | Rename |
| `vite.config.ts` | PWA precache audit (globPatterns / navigateFallback) | Modify (if needed) |

---

## Phase A — First-run / empty state (the real gap)

### Task 1: `<EmptyGardenState>` onboarding component

**Files:** Create `src/components/EmptyGardenState.svelte`.

Context: when `profileStore.profile` is null, the hub currently shows dead seeds with no guidance. This component is the warm first-run welcome, on-theme (twilight, Lexend, lantern-amber). It offers two real actions that already exist elsewhere: **Take Quiz** (link to the learner-profile intake) and **Import** (paste-JSON, same as `GardenerBadge`'s import), plus a **"Plant my first seed"** button that calls `profileStore.initializeDefaultProfile()` (an existing store method) so a child can start immediately without a profile.

- [ ] **Step 1: Build the component**

Create `src/components/EmptyGardenState.svelte`:

```svelte
<script lang="ts">
  import { profileStore } from '../lib/profile.svelte';
  import Mascot from './Mascot.svelte';

  interface Props {
    onStart: () => void; // called after a profile exists, to refresh/continue
  }
  let { onStart }: Props = $props();

  let showImport = $state(false);
  let importText = $state('');
  let importError = $state('');

  const QUIZ_URL = 'https://helena-learner-profile.vercel.app/hub';

  function plantFirstSeed() {
    profileStore.initializeDefaultProfile();
    onStart();
  }

  function doImport() {
    const res = profileStore.importFromText(importText);
    if (res.ok) {
      importError = '';
      showImport = false;
      onStart();
    } else {
      importError = res.error ?? 'Could not read that profile.';
    }
  }
</script>

<div class="empty-garden grain vignette">
  <div class="welcome">
    <div class="lantern"><Mascot pose="waving" size={120} /></div>
    <h1 class="title">Welcome to the Number Garden</h1>
    <p class="sub">It's a quiet twilight. Plant your first seed and watch the garden light up as you learn.</p>

    <button class="btn-seed" onclick={plantFirstSeed}>🌱 Plant my first seed</button>

    <div class="alt-actions">
      <a class="alt-link" href={QUIZ_URL} target="_blank" rel="noopener">Take the quiz</a>
      <span class="dot">·</span>
      <button class="alt-link" onclick={() => (showImport = !showImport)}>Import a profile</button>
    </div>

    {#if showImport}
      <div class="import-sheet">
        <textarea bind:value={importText} placeholder="Paste profile JSON…" rows="4"></textarea>
        {#if importError}<p class="import-error" role="alert">{importError}</p>{/if}
        <button class="btn-seed btn-import" onclick={doImport}>Load profile</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .empty-garden {
    position: relative; min-height: 70vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(180deg, var(--sky-top), var(--sky-mid) 55%, var(--sky-bot));
    border-radius: var(--r-lg); overflow: hidden; padding: 2rem;
  }
  .welcome { position: relative; z-index: 1; text-align: center; max-width: 30rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .lantern { filter: drop-shadow(0 0 18px oklch(88% 0.15 95 / 0.5)); }
  .title { font-family: var(--font-display); font-weight: 700; color: var(--color-text); font-size: 1.7rem; }
  .sub { color: var(--color-text-muted); line-height: 1.5; max-width: 26rem; }
  .btn-seed {
    --glow-c: var(--glow-firefly);
    min-height: var(--touch); padding: 0 1.6rem; border-radius: var(--r-md);
    background: var(--color-primary); color: oklch(20% 0.03 280); font-weight: 700; font-family: var(--font-display);
    box-shadow: var(--glow-md); border: none; cursor: pointer; font-size: 1.05rem;
  }
  .btn-seed:focus-visible { outline: 3px solid var(--color-text); outline-offset: 3px; }
  .alt-actions { display: flex; align-items: center; gap: 0.6rem; color: var(--color-text-muted); }
  .alt-link { background: none; border: none; color: var(--color-primary); font: inherit; cursor: pointer; text-decoration: underline; padding: 0.4rem; }
  .import-sheet { width: 100%; display: flex; flex-direction: column; gap: 0.6rem; }
  .import-sheet textarea {
    width: 100%; background: var(--color-panel); border: 1px solid var(--color-border); border-radius: var(--r-sm);
    color: var(--color-text); padding: 0.6rem; font-family: monospace; resize: vertical;
  }
  .import-sheet textarea:focus-visible { outline: none; border-color: var(--color-primary); box-shadow: var(--glow-sm); }
  .import-error { color: var(--color-retry); font-size: 0.85rem; }
  .btn-import { align-self: center; }
  @media (prefers-reduced-motion: no-preference) {
    .lantern { animation: eg-bob 4s ease-in-out infinite alternate; }
    @keyframes eg-bob { from { transform: translateY(-3px); } to { transform: translateY(3px); } }
  }
</style>
```

- [ ] **Step 2: Verify build/types**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds.

- [ ] **Step 3: Confirm no dead tokens**

Run: `grep -nE "\-\-neon-|\-\-success|\-\-danger|\-\-glow-cyan|\-\-glow-purple|\-\-glow-pink|#fff|#ff007f|rgba\(255, ?255, ?255|#f4f5f7|\-\-glass-blur" src/components/EmptyGardenState.svelte`
Expected: empty.

- [ ] **Step 4: Commit**

```bash
git add src/components/EmptyGardenState.svelte
git commit -m "feat(hub): first-run empty-garden onboarding state"
```

### Task 2: Show the empty state in the hub when there's no profile

**Files:** Modify `src/screens/HubScreen.svelte`.

- [ ] **Step 1: Read** the top of `src/screens/HubScreen.svelte` — note the `Props { onSelectMode }` and the top-level markup (`.hub.grain.vignette` container with the sky band + `<GardenScene>`).

- [ ] **Step 2: Gate on profile presence.** Import the component and conditionally render it. Add near the other imports:

```ts
  import EmptyGardenState from '../components/EmptyGardenState.svelte';
```

Wrap the existing hub body so that when `profileStore.profile` is null, the empty state shows instead. Add a `$state` "refresh" trigger is unnecessary — `profileStore.profile` is reactive `$state`, so once `initializeDefaultProfile()`/`importFromText()` sets it, the `{#if}` re-renders automatically. Use:

```svelte
{#if profileStore.profile === null}
  <EmptyGardenState onStart={() => {}} />
{:else}
  <!-- existing hub markup (sky band + GardenScene + GardenerBadge) unchanged -->
{/if}
```

(The `onStart` no-op is fine — setting the profile flips the reactive `{#if}`. Keep the existing hub markup exactly as the `{:else}` branch.)

- [ ] **Step 3: Verify build/types**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/screens/HubScreen.svelte
git commit -m "feat(hub): render empty-garden onboarding when no profile is loaded"
```

---

## Phase B — Per-mode plant variety (shared-DNA bloom heads)

### Task 3: Species map (single source of truth)

**Files:** Create `src/components/SpeciesMap.ts`.

Defines the species union and the per-mode assignment. Four shared-DNA bloom variants across the 10 modes give visible variety while every plant keeps the same pot/stem/stage-0–3 grammar:
- `moonflower` (5 round petals) — times-tables, speed-add
- `starbloom` (pointed star petals, constellation feel) — number-sort, geometry-angles (Coordinate Plot)
- `bellflower` (drooping bell petals) — fractions-visual, decimals-grid, long-division
- `gembud` (faceted crystal cluster head) — place-value, multiplication-grid, pemdas-tree

- [ ] **Step 1: Create the file**

```ts
import type { MathMode } from '../lib/modes';

export type PlantSpecies = 'moonflower' | 'starbloom' | 'bellflower' | 'gembud';

export const SPECIES_FOR: Record<MathMode, PlantSpecies> = {
  'times-tables': 'moonflower',
  'speed-add': 'moonflower',
  'number-sort': 'starbloom',
  'geometry-angles': 'starbloom',
  'fractions-visual': 'bellflower',
  'decimals-grid': 'bellflower',
  'long-division': 'bellflower',
  'place-value': 'gembud',
  'multiplication-grid': 'gembud',
  'pemdas-tree': 'gembud',
};

export function speciesFor(mode: string): PlantSpecies {
  return (SPECIES_FOR as Record<string, PlantSpecies>)[mode] ?? 'moonflower';
}
```

- [ ] **Step 2: Verify** `npm run check` → 0 errors.
- [ ] **Step 3: Commit** `git add src/components/SpeciesMap.ts && git commit -m "feat(garden): species map (4 shared-DNA bloom variants across 10 modes)"`

### Task 4: Extend `<Plant>` with per-species bloom heads

**Files:** Modify `src/components/Plant.svelte`.

The current stage-4 block (lines ~253–323) renders a fixed moonflower head. Keep stages 0–3 shared. Branch ONLY the bloom head by `species`. This is hand-crafted SVG craft (pixel quality verified at the Task 9 gate).

- [ ] **Step 1: Widen the prop type.** Change the `species` prop type from `'moonflower'` to the full union and import it:

```ts
  import type { PlantSpecies } from './SpeciesMap';
  interface Props {
    species?: PlantSpecies;
    stage: 0 | 1 | 2 | 3 | 4;
    glow?: string;
    size?: number;
    sparkles?: number;
  }
```
(keep the `species = 'moonflower'` default and the rest of the destructure.)

- [ ] **Step 2: Branch the stage-4 bloom head by species.** Inside the existing `{#if stage === 4}` `<g class="bloom flower">` block, keep the shared stem/halo/center, and select the petal/head group by species. Replace the fixed `.petals` group with a `{#if species === ...}` switch rendering four distinct hand-tuned heads that all sit at center (32,22) and obey the upper-left moonlight key + the layered `#plant-halo` blur:
  - **moonflower** — the existing 5 round teardrop petals (keep current paths).
  - **starbloom** — 5 sharp pointed petals (narrower, longer beziers) reading as a star; same center core.
  - **bellflower** — 3 drooping bell-shaped petals pointing down/out (a foxglove/bluebell silhouette); same core.
  - **gembud** — a faceted crystal cluster (3–4 angular diamond facets with rim highlights top-left) instead of petals; same glowing core.
  Each variant keeps the `filter="url(#plant-halo)"` halo layer behind it and the `url(#plant-bloom)` center.

- [ ] **Step 3: Verify build/types**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds. (No prop callers break — `species` defaults to moonflower everywhere until wired in Tasks 5–7.)

- [ ] **Step 4: Visual self-check + commit**

Run `npm run dev`, temporarily render `<Plant stage={4} species={...} />` for all four species side by side, screenshot, confirm four visually distinct blooms that share the pot/stem DNA. Then:

```bash
git add src/components/Plant.svelte
git commit -m "feat(garden): per-species stage-4 bloom heads (moonflower/starbloom/bellflower/gembud)"
```

### Task 5: Wire species into GardenScene pods

**Files:** Modify `src/components/GardenScene.svelte`.

- [ ] **Step 1:** Import `speciesFor` and pass it to each pod's `<Plant>`:

```ts
  import { speciesFor } from './SpeciesMap';
```
On the pod `<Plant ... />` (both the overlay and the narrow-column branch), add `species={speciesFor(m)}` (use the mode id variable in scope for each branch — `m` / `pod.id`).

- [ ] **Step 2: Verify** `npm run check && npm run build` → 0 errors.
- [ ] **Step 3: Commit** `git add src/components/GardenScene.svelte && git commit -m "feat(garden): per-mode plant species in the meadow"`

### Task 6: Wire species into GameShell thumbnail

**Files:** Modify `src/components/GameShell.svelte`, `src/screens/GameScreen.svelte`.

- [ ] **Step 1: GameShell** — add `species?: PlantSpecies` to Props (default `'moonflower'`), import the type, and pass `species={species}` to the thumbnail `<Plant>`:

```ts
  import type { PlantSpecies } from './SpeciesMap';
```
(add `species = 'moonflower'` to the destructure; add `species={species}` to the thumbnail Plant.)

- [ ] **Step 2: GameScreen** — import `speciesFor` and pass `species={speciesFor(mode)}` to `<GameShell>`.

```ts
  import { speciesFor } from '../components/SpeciesMap';
```

- [ ] **Step 3: Verify** `npm run check && npm run build` → 0 errors.
- [ ] **Step 4: Commit** `git add src/components/GameShell.svelte src/screens/GameScreen.svelte && git commit -m "feat(game): per-mode plant species in the game-shell thumbnail"`

### Task 7: Wire species into EndScreen watered bed

**Files:** Modify `src/screens/EndScreen.svelte`.

- [ ] **Step 1:** Import `speciesFor` and change the watered-bed `<Plant species="moonflower" ...>` to `species={speciesFor(mode)}` (the `mode` prop is already in scope).

```ts
  import { speciesFor } from '../components/SpeciesMap';
```

- [ ] **Step 2: Verify** `npm run check && npm run build` → 0 errors.
- [ ] **Step 3: Commit** `git add src/screens/EndScreen.svelte && git commit -m "feat(end): per-mode plant species on the watered bed"`

---

## Phase C — PWA-offline audit

### Task 8: Verify and harden offline precache

**Files:** Modify `vite.config.ts` (only if the audit finds a gap).

- [ ] **Step 1: Build and inspect the precache manifest.**

Run: `npm run build` then `grep -o '"url":"[^"]*"' dist/sw.js | sort` (or open `dist/sw.js`). Confirm the precache list includes: the hashed `index.html`, the JS/CSS bundles, `favicon.svg`, and `fonts/lexend.woff2`. The current `globPatterns: ['**/*.{js,css,html,svg,woff,woff2}']` should cover all of these.

- [ ] **Step 2: Add SPA navigation fallback.** This is a single-page app served at `/`. Confirm offline deep-loads resolve to the app shell. In `vite.config.ts`, add `navigateFallback` to the workbox config so any navigation offline serves the cached `index.html`:

```ts
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
```

- [ ] **Step 3: Verify offline in the preview.** Run `npm run build && npm run preview`, load the app, then in DevTools (or via the preview MCP) set the network to Offline and reload — the hub must render fully (twilight scene, fonts as Lexend not a fallback, no failed asset requests). Enter one game offline and confirm it plays. Capture confirmation (a screenshot or the network panel showing all-from-ServiceWorker).

- [ ] **Step 4: Commit** (only the config change, if made)

```bash
git add vite.config.ts
git commit -m "fix(pwa): SPA navigateFallback for correct offline deep-loads"
```

---

## Phase D — Honest internal filenames

### Task 9: Rename the 3 legacy-named game files

**Files:** Rename `GeometryConstellation.svelte` → `CoordinatePlot.svelte`, `LongDivisionSpace.svelte` → `LongDivision.svelte`, `PlaceValueCosmos.svelte` → `PlaceValue.svelte`; update imports in `src/screens/GameScreen.svelte`.

- [ ] **Step 1: Rename with git (preserves history).**

```bash
git mv src/games/GeometryConstellation.svelte src/games/CoordinatePlot.svelte
git mv src/games/LongDivisionSpace.svelte src/games/LongDivision.svelte
git mv src/games/PlaceValueCosmos.svelte src/games/PlaceValue.svelte
```

- [ ] **Step 2: Update imports + component tags in `src/screens/GameScreen.svelte`.** Change the three import lines and their usages:

```ts
  import PlaceValue from '../games/PlaceValue.svelte';
  import LongDivision from '../games/LongDivision.svelte';
  import CoordinatePlot from '../games/CoordinatePlot.svelte';
```
And update the three component tags in the markup: `<PlaceValueCosmos` → `<PlaceValue`, `<LongDivisionSpace` → `<LongDivision`, `<GeometryConstellation` → `<CoordinatePlot` (each has one usage with its props block — keep the props identical, only the tag name changes; including the closing context if self-closing/blocks).

- [ ] **Step 3: Grep for stragglers.**

Run: `grep -rn "GeometryConstellation\|LongDivisionSpace\|PlaceValueCosmos" src/`
Expected: empty (no references to the old names remain).

- [ ] **Step 4: Verify build/types/tests**

Run: `npm run check && npm run build && npm test`
Expected: 0 errors; build succeeds; 14 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(games): rename game files to honest names (CoordinatePlot/LongDivision/PlaceValue)"
```

---

## Phase E — Final gate

### Task 10: A++ + offline gate and final verification

- [ ] **Step 1: Build + run** `npm run build && npm run preview` (or dev). Seed a profile and ALSO test the no-profile path (clear localStorage) so both the empty state and the populated garden are exercised.
- [ ] **Step 2: Capture screenshots** at desktop/tablet/mobile of: the **empty-garden first-run state**, the **hub meadow** (now with 4 distinct plant species visible across the beds), and **one game** (confirm species in the shell thumbnail). Confirm offline (Phase C) still holds.
- [ ] **Step 3: Dispatch the independent design-critique agent** with the screenshots, spec §4 + §14 rubric. It grades: the four bloom species read as distinct AND as one cohesive set; the empty state is warm/on-theme and the 3 onboarding actions work; no regression to the previously-passed hub/games; contrast/motion/responsive all hold.
- [ ] **Step 4: Apply fixes and re-grade** until PASS. Commit each round: `git add -A && git commit -m "polish(garden): Plan 3 critique round N fixes"`.
- [ ] **Step 5: Full verification** `npm test && npm run check && npm run build` → all green.
- [ ] **Step 6: Present** the final screenshots + scorecard to the user. On approval, the full redesign (Plans 1–3) is complete and ship-ready.

---

## Self-review notes

- **Spec coverage:** designed empty/loading states (§4) → Tasks 1–2 (loading is N/A: sync data — documented in Architecture); bespoke per-mode plant species (§4 illustration grammar / §10 motifs) → Tasks 3–7 (scoped to 4 shared-DNA variants, documented); offline-capable PWA (§1 success criteria) → Task 8; honest names extended to filenames (§10) → Task 9; A++ gate (§13/§14) → Task 10.
- **No "similar to Task N" placeholders:** the wiring tasks (5–7) each give the exact import + the exact prop to add; the species heads (Task 4) describe each of the four silhouettes concretely; the empty-state component (Task 1) is given in full.
- **Type/name consistency:** `PlantSpecies` + `SPECIES_FOR`/`speciesFor` are defined once in `SpeciesMap.ts` (Task 3) and imported by Plant (4), GardenScene (5), GameShell/GameScreen (6), EndScreen (7). `initializeDefaultProfile`/`importFromText` are existing `profileStore` methods (confirmed in `profile.svelte.ts`). The renamed component tags (Task 9) match the new filenames.
- **Risk:** Task 4 (bloom heads) is the only real craft risk; it's isolated to the stage-4 block, defaults keep all callers working, and the Task 10 gate verifies fidelity.
