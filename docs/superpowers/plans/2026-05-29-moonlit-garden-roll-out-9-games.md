# Moonlit Math Garden — Plan 2: Roll the World Across the 9 Games

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three real interaction/logic bugs and re-skin the remaining 9 games into the bioluminescent twilight world (matching the Times Tables slice), so entering ANY game stays in the same cohesive A++ world — then verify with an independent design-critique gate.

**Architecture:** Each game keeps 100% of its logic and prop contract (`grade`, `onCorrect`, `onIncorrect`, `onFinished`, plus `setAstridMessage` for Times Tables) and is restyled to the shared twilight tokens + feedback patterns established in the slice. Three correctness fixes (Coordinate Plot draws the player's points, Decimal Shading supports touch/pointer, Number Sort supports keyboard) land first. A per-game plant glow color is wired through `GameShell`/`GardenScene` so each bed reads distinctly; bespoke per-mode plant *silhouettes* remain a Plan 3 enhancement (the round-2 critique already PASSED with one silhouette + per-grove color).

**Tech Stack:** Svelte 5 (runes), TypeScript, Vite + vite-plugin-pwa, Vitest + jsdom, hand-authored SVG/CSS. Tokens in `src/styles/theme.css`; shared primitives in `src/styles/garden.css`.

**Spec:** `docs/superpowers/specs/2026-05-29-moonlit-math-garden-redesign-design.md`
**Builds on:** Plan 1 (`2026-05-29-moonlit-garden-foundation-and-slice.md`) — `<Plant>`, `<GameShell>`, `theme.css` tokens, the Times Tables reskin recipe.

**Out of scope (Plan 3):** bespoke per-mode plant silhouettes, empty/loading states, full PWA-offline audit, the Lexend single-face was already fixed, dist/ untracking.

---

## Reskin Recipe (Appendix A) — applied by every game task in Phase B

This is the concrete, shared treatment. Each game task below says "apply Recipe A" and then adds game-specific detail. The recipe itself (do all of these):

1. **Preserve ALL logic + contract.** Do NOT change question generation, scoring, the `onFinished(score, total)` total, `onCorrect`/`onIncorrect` call sites/signatures, or any `profileStore` call. This is a RESTYLE + (where listed) a specific interaction fix — never a logic rewrite. If you find yourself changing a numeric/scoring line, stop and report DONE_WITH_CONCERNS.
2. **Purge dead tokens.** Replace every occurrence of `--neon-cyan`, `--neon-purple`, `--neon-pink`, `--glow-cyan`, `--glow-purple`, `--glow-pink`, `--success`, `--danger`, `--glass-blur`, and light/neon hardcodes (`#fff`/`#ffffff` text, `#ff007f`, `rgba(255,255,255,…)` strokes/fills meant for a dark canvas, `#f4f5f7`) with twilight tokens:
   - text → `--color-text` / `--color-text-muted`
   - primary/action → `--color-primary` (lantern amber)
   - correct → `--color-correct` (green); wrong/retry → `--color-retry` (amber) — **never red**
   - glows → the layered `--glow-sm/md/lg` (set a local `--glow-c` to `--glow-moonflower` / `--glow-firefly` / `--glow-blossom` as fits the game's grove)
   - surfaces → `--color-panel` dark glass + `--color-border` hairline
   Grep the file for the dead tokens listed in its task and confirm ZERO remain after.
3. **Dark-glass play surface + pale-glow inputs.** Any text/number `<input>` is a pale-glowing field on dark, `min-height: var(--touch)` (48px), `font-variant-numeric: tabular-nums lining-nums`, with a clear glowing `:focus-visible` ring. Buttons ≥48px, on-theme.
4. **Gentle multimodal feedback.** Correct = `--color-correct` + a check glyph (not color-alone) + a brief `@keyframes` glow pulse. Wrong = `--color-retry` outline + a `@keyframes` gentle shake (NOT a JS transform) + the game's existing hint text. No red X, no harsh failure styling.
5. **Motion safety.** All animation via `@keyframes` under `@media (prefers-reduced-motion: no-preference)` so the global reduced-motion rule + in-app calm mode disable it. No JS-driven transforms for motion.
6. **No header/title/progress inside the game.** `GameShell` owns the back-leaf, title, plant thumbnail, and watering-can progress. If a game still renders its own title/score/progress header, remove it (as was done for Times Tables).
7. **Verify per task:** `npm run check` → 0 errors; `npm run build` → succeeds; grep confirms no dead tokens remain in that file.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/games/GeometryConstellation.svelte` | Coordinate Plot — fix draw bug + reskin | Modify |
| `src/games/DecimalGridZoom.svelte` | Decimal Shading — pointer/touch paint + reskin | Modify |
| `src/games/NumberSort.svelte` | Number Sort — keyboard a11y + reskin | Modify |
| `src/games/SpeedAdd.svelte` | reskin | Modify |
| `src/games/FractionGarden.svelte` | reskin | Modify |
| `src/games/PlaceValueCosmos.svelte` | reskin | Modify |
| `src/games/MultiplicationGrid.svelte` | reskin | Modify |
| `src/games/LongDivisionSpace.svelte` | reskin | Modify |
| `src/games/PEMDASTree.svelte` | reskin | Modify |
| `src/components/GameShell.svelte` | accept + render a per-game `glow` color on the thumbnail | Modify |
| `src/screens/GameScreen.svelte` | pass a per-mode glow color to GameShell | Modify |

---

## Phase A — Correctness fixes (do first; these are real bugs)

### Task 1: Coordinate Plot draws the player's points (not the answer)

`GeometryConstellation.svelte` draws the connecting lines through `currentQuestion.points` (the TARGET shape) gated on `userPoints.length > 1` — so it reveals the answer instead of showing what the child plotted. Fix to draw through `userPoints` in click order.

**Files:** Modify `src/games/GeometryConstellation.svelte` (the "Plotted Lines" block, ~lines 198-212).

- [ ] **Step 1: Read the block** at `src/games/GeometryConstellation.svelte` around lines 198-212 (the `{#if drawLines && userPoints.length > 1}` … `{#each currentQuestion.points as pt, idx}` loop with `nextPt = currentQuestion.points[(idx + 1) % currentQuestion.points.length]`).

- [ ] **Step 2: Replace the loop to use `userPoints`**

```svelte
        <!-- Plotted Lines (player's constellation, drawn through THEIR points) -->
        {#if drawLines && userPoints.length > 1}
          {#each userPoints as pt, idx}
            {@const nextPt = userPoints[(idx + 1) % userPoints.length]}
            <line
              x1={10 + pt.x * 10}
              y1={100 - pt.y * 10}
              x2={10 + nextPt.x * 10}
              y2={100 - nextPt.y * 10}
              stroke="var(--glow-moonflower)"
              stroke-width="1.5"
              stroke-dasharray="2, 2"
              class="glow-line"
            />
          {/each}
        {/if}
```
(Note the stroke changes from the dead `--neon-cyan` to `--glow-moonflower`.)

- [ ] **Step 3: Verify build/types**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/games/GeometryConstellation.svelte
git commit -m "fix(game): Coordinate Plot draws the player's plotted points, not the target"
```

> The full twilight reskin + remaining dead-token purge for this file happens in Task 11; this task is the focused correctness fix only.

### Task 2: Decimal Shading supports pointer + touch painting

`DecimalGridZoom.svelte` paints cells via `onmousedown`/`onmouseenter` (mouse-only) with `onmouseup` on the container — broken on tablets. Convert to Pointer Events with `touch-action: none` so drag-paint works on touch and pointer.

**Files:** Modify `src/games/DecimalGridZoom.svelte` (container ~line 192; cell handlers ~lines 213-217; the `handleMouseDown`/`handleMouseEnter`/`handleMouseUp` functions; `.grid-cell` CSS ~line 298).

- [ ] **Step 1: Read** the `handleMouseDown`, `handleMouseEnter`, `handleMouseUp` functions and the cell/container markup. Note the painting state variable (a boolean like `isPainting`/`isMouseDown`).

- [ ] **Step 2: Convert handlers to pointer events.** Rename the handlers to pointer semantics (keep the same body/logic) and add pointer capture so dragging off-and-on works:
   - Container `onmouseup={handleMouseUp}` → `onpointerup={handlePointerUp}` and also `onpointerleave={handlePointerUp}` (end paint if the pointer leaves).
   - Cell `onmousedown={() => handleMouseDown(i)}` → `onpointerdown={(e) => { e.currentTarget.releasePointerCapture?.(e.pointerId); handlePointerDown(i); }}`.
   - Cell `onmouseenter={() => handleMouseEnter(i)}` → `onpointerenter={() => handlePointerEnter(i)}`.
   Rename the functions accordingly (`handleMouseDown`→`handlePointerDown`, etc.); their internal logic (set painting true, toggle/shade cell) is unchanged.

- [ ] **Step 3: Add `touch-action: none` to the grid cells/grid** so touch-drag paints instead of scrolling. In the `.grid-cell` (and/or the grid container) CSS add:

```css
  touch-action: none;
```

- [ ] **Step 4: Verify build/types**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/games/DecimalGridZoom.svelte
git commit -m "fix(game): Decimal Shading paints with pointer events + touch (iPad support)"
```

> Full reskin/token purge for this file is Task 10.

### Task 3: Number Sort keyboard activation

`NumberSort.svelte` tiles are a `<div draggable onclick>` with no keyboard path, and bins are clickable divs. Add keyboard operability so the tap-to-select-then-tap-bin flow also works via keyboard.

**Files:** Modify `src/games/NumberSort.svelte` (tile ~lines 167-171; bins ~lines 182-188).

- [ ] **Step 1: Read** the tile element (~167-171: `class="tile"`, `draggable="true"`, `ondragstart`, `onclick={() => selectTile(q.n)}`) and the bin element (~182-188: `class="bin {binType}"`, `ondragover`, `ondrop`, and an `onclick` calling `handleBinClick`). Confirm the exact handler names (`selectTile`, `handleBinClick`).

- [ ] **Step 2: Make the tile keyboard-operable.** Add to the tile element: `role="button"`, `tabindex="0"`, an `aria-label` (e.g. `aria-label={`Number ${q.n}`}`), and an `onkeydown` that activates select on Enter/Space:

```svelte
          role="button"
          tabindex="0"
          aria-label={`Select number ${q.n}`}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTile(q.n); } }}
```

- [ ] **Step 3: Make the bins keyboard-operable.** Add to each bin element: `role="button"`, `tabindex="0"`, an `aria-label` (e.g. `aria-label={`Place in ${binType} bin`}`), and `onkeydown` activating the existing bin click handler on Enter/Space:

```svelte
        role="button"
        tabindex="0"
        aria-label={`Sort selected number into the ${binType} bin`}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBinClick(binType as any); } }}
```
(Use the exact bin click handler name found in Step 1 — `handleBinClick` — and the same `binType as any` cast already used by its `onclick`.)

- [ ] **Step 4: Add a visible focus ring** for `.tile:focus-visible` and `.bin:focus-visible` (glowing outline using `--color-primary`), so keyboard focus is visible. Example:

```css
  .tile:focus-visible, .bin:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
  }
```

- [ ] **Step 5: Verify build/types**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/games/NumberSort.svelte
git commit -m "fix(a11y): Number Sort tiles and bins operable by keyboard"
```

> Full reskin/token purge for this file is Task 6.

---

## Phase B — Per-game glow wiring + the 9 reskins

### Task 4: Wire a per-mode glow color through GameShell

So each game's shell thumbnail (and later its accents) reads in its grove color.

**Files:** Modify `src/components/GameShell.svelte`, `src/screens/GameScreen.svelte`.

- [ ] **Step 1: Add an optional `glow` prop to GameShell.** In `src/components/GameShell.svelte` add `glow?: string` to the Props interface (default `'var(--glow-firefly)'`) and pass it to the thumbnail `<Plant glow={glow} … />`.

```ts
    glow?: string;
```
```svelte
  let { title, plantModeId, questionIndex, total, onBack, glow = 'var(--glow-firefly)', mascot, children }: Props = $props();
```
(and on the thumbnail Plant: `glow={glow}`)

- [ ] **Step 2: Pass a per-mode glow from GameScreen.** In `src/screens/GameScreen.svelte` add a `GLOW` map keyed by mode using the three grove accents (grove1 firefly gold: times-tables/speed-add/number-sort; grove2 moonflower cyan: fractions-visual/multiplication-grid/decimals-grid; grove3 blossom magenta: place-value/long-division/geometry-angles/pemdas-tree) and pass `glow={GLOW[mode] ?? 'var(--glow-firefly)'}` to `<GameShell>`.

```ts
  const GLOW: Record<string, string> = {
    'times-tables': 'var(--glow-firefly)', 'speed-add': 'var(--glow-firefly)', 'number-sort': 'var(--glow-firefly)',
    'fractions-visual': 'var(--glow-moonflower)', 'multiplication-grid': 'var(--glow-moonflower)', 'decimals-grid': 'var(--glow-moonflower)',
    'place-value': 'var(--glow-blossom)', 'long-division': 'var(--glow-blossom)', 'geometry-angles': 'var(--glow-blossom)', 'pemdas-tree': 'var(--glow-blossom)',
  };
```

- [ ] **Step 3: Verify build/types**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameShell.svelte src/screens/GameScreen.svelte
git commit -m "feat(game): per-mode plant glow color through GameShell thumbnail"
```

> Each reskin task below: **apply Reskin Recipe (Appendix A)** to that file, plus the game-specific notes. Steps are the same shape; the implementer reads the file, applies the recipe, and verifies. Each game lists its dead-token count from the audit so the implementer can grep-confirm zero remain.

### Task 5: Re-skin Speed Add

**Files:** Modify `src/games/SpeedAdd.svelte` (3 dead-token hits).

Speed Add: audio-first; SpeechSynthesis reads "A plus B", child types the sum; sub-3s answers trigger a gold flash. Grove 1 (firefly gold).

- [ ] **Step 1: Read** `src/games/SpeedAdd.svelte`; identify the answer input, the replay button, the correct/incorrect feedback, the "sonic boom" gold flash, and the 3 dead tokens.
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: keep the SpeechSynthesis logic and the sub-3s bonus untouched; render the bonus as a silent gold shimmer (`--glow-firefly`), no countdown. The numeric answer input gets the dark pale-glow + tabular-nums + 48px treatment. Correct=green+check+pulse; wrong=amber+shake. Remove any in-game title/score header (GameShell owns it).
- [ ] **Step 3: Grep-confirm zero dead tokens** in the file: `grep -nE "\-\-neon-|\-\-success|\-\-danger|\-\-glow-cyan|\-\-glow-purple|\-\-glow-pink|#fff|#ff007f|rgba\(255, ?255, ?255" src/games/SpeedAdd.svelte` → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build` → 0 errors; succeeds.
- [ ] **Step 5: Commit** `git add src/games/SpeedAdd.svelte && git commit -m "feat(game): re-skin Speed Add into twilight world"`

### Task 6: Re-skin Number Sort

**Files:** Modify `src/games/NumberSort.svelte` (8 dead-token hits). (Keyboard a11y already added in Task 3 — preserve it.)

Number Sort: drag/tap a number tile into Even/Odd/Prime bins. Grove 1 (firefly gold).

- [ ] **Step 1: Read** the file; identify tiles, bins, drag-over highlight, particle burst, feedback, and the 8 dead tokens. Confirm the Task 3 keyboard handlers + focus ring are present (do not remove them).
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: tiles and bins become dark-glass with glow; the drag-over/selected highlight uses `--color-primary`/grove glow; correct sort = green pulse + check, wrong = amber shake (no red); preserve drag-and-drop + the Task 3 keyboard handlers + 48px targets. Particle burst recolored on-theme.
- [ ] **Step 3: Grep-confirm zero dead tokens** in `src/games/NumberSort.svelte` (same grep as Task 5, adjusted path) → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build`.
- [ ] **Step 5: Commit** `git add src/games/NumberSort.svelte && git commit -m "feat(game): re-skin Number Sort into twilight world"`

### Task 7: Re-skin Fraction Garden

**Files:** Modify `src/games/FractionGarden.svelte` (12 dead-token hits). Grove 2 (moonflower cyan).

Fraction Garden: choose a denominator (2-8 slider) and "water" (toggle) pie petals to match a target fraction; Web Audio tones; chord chime on match.

- [ ] **Step 1: Read** the file; identify the pie/petal SVG, the denominator slider, the "Water Flower" button, the match feedback, and the 12 dead tokens.
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: petals glow when watered (use `--glow-moonflower`); the slider gets an on-theme track/thumb (≥48px thumb hit area) with a glowing fill; the pie reads on dark; match = green pulse + check + the existing chime; wrong = amber. Keep the Web Audio + denominator logic untouched.
- [ ] **Step 3: Grep-confirm zero dead tokens** in `src/games/FractionGarden.svelte` → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build`.
- [ ] **Step 5: Commit** `git add src/games/FractionGarden.svelte && git commit -m "feat(game): re-skin Fraction Garden into twilight world"`

### Task 8: Re-skin Place Value

**Files:** Modify `src/games/PlaceValueCosmos.svelte` (9 dead-token hits). Grove 3 (blossom magenta).

Place Value: +/- gem-counter steppers per place-value column (Ones..Ten-Thousands) to build a target, OR a typed standard-form input for expanded form.

- [ ] **Step 1: Read** the file; identify the per-column +/- steppers, the gem counters, the typed input variant, the feedback, and the 9 dead tokens.
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: the +/- stepper buttons ≥48px on-theme; gem counters glow (`--glow-blossom`); the typed input gets the dark pale-glow + tabular-nums treatment; correct=green+check+pulse, wrong=amber+shake. Keep the build/expanded logic + grade scaling untouched.
- [ ] **Step 3: Grep-confirm zero dead tokens** in `src/games/PlaceValueCosmos.svelte` → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build`.
- [ ] **Step 5: Commit** `git add src/games/PlaceValueCosmos.svelte && git commit -m "feat(game): re-skin Place Value into twilight world"`

### Task 9: Re-skin Multiplication Grid

**Files:** Modify `src/games/MultiplicationGrid.svelte` (8 dead-token hits). Grove 2 (moonflower cyan).

Multiplication Grid: fill an area-model decomposition (4 partial-product cells + final sum; 2 cells for grade ≤3); must get all cells AND the sum right to score.

- [ ] **Step 1: Read** the file; identify the grid cells (multiple numeric inputs), the Check button, the feedback, and the 8 dead tokens.
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: each grid-cell numeric input gets the dark pale-glow + tabular-nums + ≥48px treatment; the area-model grid reads on dark with `--color-border` lines; correct=green+check+pulse on the whole grid, wrong=amber+shake. Keep the partial-product + all-cells-correct scoring untouched.
- [ ] **Step 3: Grep-confirm zero dead tokens** in `src/games/MultiplicationGrid.svelte` → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build`.
- [ ] **Step 5: Commit** `git add src/games/MultiplicationGrid.svelte && git commit -m "feat(game): re-skin Multiplication Grid into twilight world"`

### Task 10: Re-skin Decimal Shading

**Files:** Modify `src/games/DecimalGridZoom.svelte` (9 dead-token hits). (Pointer/touch painting added in Task 2 — preserve it.) Grove 2 (moonflower cyan).

Decimal Shading: shade a 10×10 hundredths grid to a target (decimal/fraction/words); "Fill +10"/"Clear All" helpers; Submit.

- [ ] **Step 1: Read** the file; confirm the Task 2 pointer handlers + `touch-action: none` are present (preserve them). Identify shaded vs empty cell styling, helper buttons, target display, and the 9 dead tokens.
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: shaded cells glow (`--glow-moonflower`), empty cells are dim but legible on dark with `--color-border`; helper buttons + Submit ≥48px on-theme; correct=green pulse + check, wrong=amber. Keep the shading/target logic + pointer painting untouched.
- [ ] **Step 3: Grep-confirm zero dead tokens** in `src/games/DecimalGridZoom.svelte` → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build`.
- [ ] **Step 5: Commit** `git add src/games/DecimalGridZoom.svelte && git commit -m "feat(game): re-skin Decimal Shading into twilight world"`

### Task 11: Re-skin Coordinate Plot

**Files:** Modify `src/games/GeometryConstellation.svelte` (11 dead-token hits). (Draw-bug fixed in Task 1 — preserve it.) Grove 3 (blossom magenta).

Coordinate Plot: tap 10×10 grid intersections to plot the listed (x,y) points to form a named shape; Connect/Reset.

- [ ] **Step 1: Read** the file; confirm the Task 1 fix (lines drawn through `userPoints`) is present (preserve it). Identify the grid, plotted-point markers, coord badges, Connect/Reset buttons, and the 11 dead tokens (the Task 1 edit already removed one `--neon-cyan`).
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: grid lines use `--color-border`/faint twilight strokes (not `rgba(255,255,255,…)`); plotted points glow (`--glow-blossom`); the player's connecting lines glow; Connect/Reset ≥48px on-theme; correct=green pulse + check, wrong=amber. Keep the set-match scoring untouched.
- [ ] **Step 3: Grep-confirm zero dead tokens** in `src/games/GeometryConstellation.svelte` → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build`.
- [ ] **Step 5: Commit** `git add src/games/GeometryConstellation.svelte && git commit -m "feat(game): re-skin Coordinate Plot into twilight world"`

### Task 12: Re-skin Long Division

**Files:** Modify `src/games/LongDivisionSpace.svelte` (8 dead-token hits). Grove 3 (blossom magenta).

Long Division: 5 problems, each 4 guided steps (divide tens, multiply&subtract, bring down, divide ones) rendered in a division-bracket layout that fills in as you go; numeric input per step.

- [ ] **Step 1: Read** the file; identify the bracket layout, the per-step numeric inputs, the step-progress fill, the feedback, and the 8 dead tokens.
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: the division-bracket reads on dark with `--color-border`; per-step numeric inputs get the dark pale-glow + tabular-nums + ≥48px treatment; completed steps glow (`--glow-blossom`); correct=green+check+pulse, wrong=amber+shake. Keep the 4-step logic and `onFinished(score, 5)` total untouched.
- [ ] **Step 3: Grep-confirm zero dead tokens** in `src/games/LongDivisionSpace.svelte` → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build`.
- [ ] **Step 5: Commit** `git add src/games/LongDivisionSpace.svelte && git commit -m "feat(game): re-skin Long Division into twilight world"`

### Task 13: Re-skin Order of Operations

**Files:** Modify `src/games/PEMDASTree.svelte` (8 dead-token hits). Grove 3 (blossom magenta).

Order of Operations: click the operator that should be evaluated next; the expression collapses step-by-step; wrong clicks show a PEMDAS rule reminder.

- [ ] **Step 1: Read** the file; identify the expression/operator buttons, the PEMDAS letter banner, the collapse animation, the rule-reminder, and the 8 dead tokens.
- [ ] **Step 2: Apply Reskin Recipe (Appendix A).** Game-specifics: operator buttons are dark-glass ≥48px with glow on hover/focus; the collapsing-expression animation is keyframe-based + reduced-motion safe; correct operator = green pulse + check, wrong = amber + the existing rule reminder (no red); the PEMDAS banner reads on dark. Keep the order-of-operations logic and `onFinished(score, 5)` untouched.
- [ ] **Step 3: Grep-confirm zero dead tokens** in `src/games/PEMDASTree.svelte` → no output.
- [ ] **Step 4: Verify** `npm run check && npm run build`.
- [ ] **Step 5: Commit** `git add src/games/PEMDASTree.svelte && git commit -m "feat(game): re-skin Order of Operations into twilight world"`

---

## Phase C — A++ critique gate (all 9 games)

### Task 14: Screenshot critique loop across the 9 games + final verification

- [ ] **Step 1: Build + run** `npm run build` then start the dev server (preview). Seed a profile (varied mastery + grade) so games render with content. Confirm no console errors.
- [ ] **Step 2: Capture each of the 9 games** mid-question at desktop (1280) / tablet (834) / mobile (390) — enter each game from the hub (or set the router), screenshot the play surface, and capture a correct AND an incorrect feedback state where feasible. Also re-capture the hub + a game-shell to confirm no regression.
- [ ] **Step 3: Dispatch the independent design-critique agent** with the screenshots, spec §4 art-direction standard, and §14 rubric. It grades each game PASS/FAIL on: twilight cohesion (no light/neon leftovers), dark-glass inputs + tabular nums + 48px, gentle correct/wrong feedback (no red), readable contrast (AA), motion safety, and "does entering this game stay in the world." Returns specific "not studio yet because X → do Y" fixes per game.
- [ ] **Step 4: Apply fixes and re-grade** until every game passes at all three breakpoints. Commit each round: `git add -A && git commit -m "polish(games): A++ critique round N fixes"`.
- [ ] **Step 5: Run full verification** `npm test && npm run check && npm run build` → all green (the Plan 1 data-layer tests must still pass).
- [ ] **Step 6: Present** the final per-game scorecard + screenshots to the user for sign-off. On approval, Plan 2 is complete (Plan 3 = bespoke plant silhouettes + empty/loading states + PWA-offline audit).

---

## Self-review notes

- **Spec coverage:** the 3 audited interaction/logic bugs deferred from Plan 1 → Tasks 1-3; all 9 game re-skins (twilight cohesion, the spec's "one world" requirement) → Tasks 5-13; per-game glow distinction → Task 4; honest names were already corrected in Plan 1; A++ gate → Task 14. Deferred (declared): bespoke per-mode plant silhouettes, empty/loading states, PWA-offline audit → Plan 3.
- **No "similar to Task N" placeholders:** the shared treatment is spelled out in full in Reskin Recipe (Appendix A), which is present in this same document; each game task adds concrete game-specific detail + its dead-token count + grep verification. Each task is independently actionable.
- **Logic-preservation guard** is stated in Recipe item 1 and repeated per bug-fix task; reviewers must confirm no scoring/contract change (as enforced for the Times Tables reskin in Plan 1).
- **Type/name consistency:** the `GLOW` map keys (Task 4) use the canonical mode ids from `MATH_MODES`; the per-game glow tokens (`--glow-firefly/-moonflower/-blossom`) exist in `theme.css` from Plan 1.
