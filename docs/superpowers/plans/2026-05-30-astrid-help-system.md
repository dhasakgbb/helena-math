# Astrid Help System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-game help system delivered through Astrid — a "Stuck? Ask Astrid" button + auto-offer-after-2-misses, with progressive reveal (how-to-play → hint → worked steps) authored per game, fully offline.

**Architecture:** A shared `GameHelp` interface; each game exposes its current-question help via a `$bindable` prop; `GameScreen` binds it, tracks consecutive misses, and renders a new `AstridHelp.svelte` (button + non-modal help panel) inside the Astrid mascot snippet. No backend, no game-logic changes — help is additive. The app compiles at every step: each game gains the `help` bindable + its `bind:help` wiring in its own task, so partial states are valid.

**Tech Stack:** Svelte 5 (runes, `$bindable`, snippets), TypeScript, Vite + vite-plugin-pwa, Vitest, hand-authored help text.

**Spec:** `docs/superpowers/specs/2026-05-30-astrid-help-system-design.md`

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/lib/help.ts` | `GameHelp` interface (type only) | Create |
| `src/components/AstridHelp.svelte` | Help UI: Ask-Astrid button + non-modal panel + progressive reveal + auto-offer + first-entry how-to-play | Create |
| `src/screens/GameScreen.svelte` | `currentHelp` bind, `missCount`/`autoOffer`, render `<AstridHelp>` in mascot snippet; per-game `bind:help` added incrementally | Modify (Tasks 3, 5–13) |
| `src/games/TimesTables.svelte` | `help` bindable + authored content (slice) | Modify (Task 3) |
| `src/games/SpeedAdd.svelte` … `PEMDASTree.svelte` (9) | `help` bindable + authored content | Modify (Tasks 5–13, one each) |

---

## Task 1: `GameHelp` type

**Files:** Create `src/lib/help.ts`.

- [ ] **Step 1: Create the type**

```ts
// src/lib/help.ts
// Help content a game exposes for its CURRENT question. null = no help yet.
export interface GameHelp {
  /** Static per game: the rules + one tiny example. */
  howToPlay: string;
  /** A nudge for the current on-screen question (does not give the answer). */
  hint: string;
  /** 2–4 worked steps for the current question (revealed one at a time). */
  steps: string[];
}
```

- [ ] **Step 2: Verify** `npm run check` → 0 errors.
- [ ] **Step 3: Commit**

```bash
git add src/lib/help.ts
git commit -m "feat(help): GameHelp contract type"
```

## Task 2: `AstridHelp.svelte` — the help UI

**Files:** Create `src/components/AstridHelp.svelte`.

A self-contained component: takes the current `help` and renders the Ask-Astrid button + a non-modal help panel with progressive reveal, plus the auto-offer prompt and first-entry how-to-play.

- [ ] **Step 1: Create the component** with this exact implementation:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { GameHelp } from '../lib/help';

  interface Props {
    help: GameHelp | null;
    glow?: string;            // grove color for on-theme styling
    autoOffer?: boolean;      // parent sets true after 2 misses
    onAutoOfferHandled?: () => void;
    seenKey?: string;         // localStorage key for first-entry how-to-play
  }
  let { help, glow = 'var(--glow-firefly)', autoOffer = false, onAutoOfferHandled, seenKey }: Props = $props();

  // Panel state: closed, or open at a level. 0 = how-to-play, 1 = hint, 2 = steps.
  let open = $state(false);
  let level = $state<0 | 1 | 2>(1);
  let revealed = $state(1);          // how many steps shown at level 2
  let offerVisible = $state(false);
  let panelEl = $state<HTMLDivElement | null>(null);
  let buttonEl = $state<HTMLButtonElement | null>(null);

  function openAt(l: 0 | 1 | 2) {
    level = l;
    if (l === 2) revealed = 1;
    open = true;
    setTimeout(() => panelEl?.focus(), 20);
  }
  function close() {
    open = false;
    setTimeout(() => buttonEl?.focus(), 20);
  }
  function showSteps() {
    level = 2;
    revealed = 1;
  }
  function nextStep() {
    if (help && revealed < help.steps.length) revealed += 1;
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  // First-entry how-to-play: auto-open to level 0 once per mode.
  onMount(() => {
    if (seenKey && help) {
      let seen = false;
      try { seen = localStorage.getItem(seenKey) === '1'; } catch (_) {}
      if (!seen) {
        openAt(0);
        try { localStorage.setItem(seenKey, '1'); } catch (_) {}
      }
    }
  });

  // Auto-offer after misses: show the gentle prompt (not the answer).
  $effect(() => {
    if (autoOffer && !open) {
      offerVisible = true;
    }
  });
  function acceptOffer() {
    offerVisible = false;
    onAutoOfferHandled?.();
    openAt(1);
  }
  function dismissOffer() {
    offerVisible = false;
    onAutoOfferHandled?.();
  }
</script>

{#if help}
  <div class="astrid-help" style:--help-glow={glow}>
    {#if offerVisible}
      <div class="offer" role="status">
        <span>No worries — want a hint?</span>
        <div class="offer-actions">
          <button class="offer-yes" onclick={acceptOffer}>Yes please</button>
          <button class="offer-no" onclick={dismissOffer}>Not yet</button>
        </div>
      </div>
    {/if}

    <button
      bind:this={buttonEl}
      class="ask-btn"
      onclick={() => (open ? close() : openAt(1))}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label="Ask Astrid for help"
    >
      <span class="ask-spark" aria-hidden="true">✦</span> Stuck? Ask Astrid
    </button>

    {#if open}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        bind:this={panelEl}
        class="panel"
        role="dialog"
        aria-modal="false"
        aria-label="Astrid's help"
        tabindex="-1"
        onkeydown={onKeydown}
      >
        <button class="close" onclick={close} aria-label="Close help">×</button>

        {#if level === 0}
          <p class="panel-title">How to play</p>
          <p class="panel-body">{help.howToPlay}</p>
        {:else if level === 1}
          <p class="panel-title">Hint</p>
          <p class="panel-body">{help.hint}</p>
          {#if help.steps.length > 0}
            <button class="advance" onclick={showSteps}>Still stuck? Show me →</button>
          {/if}
        {:else}
          <p class="panel-title">Let's work it out</p>
          <ol class="steps">
            {#each help.steps.slice(0, revealed) as step, i}
              <li>{step}</li>
            {/each}
          </ol>
          {#if revealed < help.steps.length}
            <button class="advance" onclick={nextStep}>Next step →</button>
          {:else}
            <p class="panel-body now-you">Now you try! 🌱</p>
          {/if}
        {/if}

        <button class="howto-link" onclick={() => (level = 0)}>How do I play?</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .astrid-help { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }

  .ask-btn {
    min-height: var(--touch, 48px); padding: 0 1rem; border-radius: 999px;
    background: var(--color-panel); color: var(--color-text);
    border: 1px solid var(--color-border); font-family: var(--font-display); font-weight: 600; font-size: 0.9rem;
    cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;
    --glow-c: var(--help-glow); box-shadow: var(--glow-sm);
  }
  .ask-btn:hover { box-shadow: var(--glow-md); }
  .ask-btn:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
  .ask-spark { color: var(--help-glow); }

  .offer {
    background: var(--color-panel); border: 1px solid var(--color-border); border-radius: var(--r-md);
    padding: 0.6rem 0.8rem; --glow-c: var(--help-glow); box-shadow: var(--glow-sm);
    display: flex; flex-direction: column; gap: 0.5rem; align-items: center; max-width: 16rem; text-align: center;
    color: var(--color-text); font-size: 0.9rem;
  }
  .offer-actions { display: flex; gap: 0.5rem; }
  .offer-yes, .offer-no { min-height: var(--touch, 48px); padding: 0 0.9rem; border-radius: 999px; cursor: pointer; font-weight: 600; font-family: var(--font-display); }
  .offer-yes { background: var(--color-primary); color: oklch(20% 0.03 280); border: none; }
  .offer-no { background: transparent; color: var(--color-text-muted); border: 1px solid var(--color-border); }
  .offer-yes:focus-visible, .offer-no:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }

  .panel {
    position: absolute; top: calc(100% + 0.5rem); left: 50%; transform: translateX(-50%);
    width: min(20rem, 80vw); z-index: 30;
    background: var(--color-panel); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--color-border); border-radius: var(--r-md);
    --glow-c: var(--help-glow); box-shadow: var(--glow-lg);
    padding: 1rem 1rem 0.75rem; color: var(--color-text); text-align: left;
  }
  .panel:focus-visible { outline: none; }
  .close { position: absolute; top: 0.3rem; right: 0.3rem; width: var(--touch, 48px); height: var(--touch, 48px); background: none; border: none; color: var(--color-text-muted); font-size: 1.4rem; cursor: pointer; line-height: 1; }
  .close:focus-visible { outline: 3px solid var(--color-primary); outline-offset: -4px; border-radius: 50%; }
  .panel-title { font-family: var(--font-display); font-weight: 700; color: var(--help-glow); margin: 0 0 0.4rem; font-size: 0.95rem; }
  .panel-body { margin: 0 0 0.6rem; line-height: 1.5; font-size: 0.95rem; }
  .now-you { color: var(--color-correct); font-weight: 600; }
  .steps { margin: 0 0 0.6rem; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.35rem; line-height: 1.5; font-variant-numeric: tabular-nums lining-nums; }
  .advance { min-height: var(--touch, 48px); width: 100%; border-radius: var(--r-sm); background: transparent; border: 1px solid var(--color-border); color: var(--color-primary); font-weight: 600; font-family: var(--font-display); cursor: pointer; }
  .advance:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
  .howto-link { display: block; margin-top: 0.5rem; background: none; border: none; color: var(--color-text-muted); text-decoration: underline; font: inherit; font-size: 0.8rem; cursor: pointer; padding: 0.3rem; }

  @media (prefers-reduced-motion: no-preference) {
    .panel { animation: help-pop 0.18s ease-out; }
    .offer { animation: help-pop 0.18s ease-out; }
    @keyframes help-pop { from { opacity: 0; transform: translateX(-50%) translateY(-4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  }
</style>
```

- [ ] **Step 2: Verify** `npm run check && npm run build` → 0 errors, 0 warnings; succeeds.
- [ ] **Step 3: Dead-token grep** `grep -nE "\-\-neon-|\-\-success|\-\-danger|\-\-glow-cyan|\-\-glow-purple|\-\-glow-pink|#fff|#ff007f|rgba\(255, ?255, ?255|#f4f5f7|\-\-glass-blur" src/components/AstridHelp.svelte` → empty.
- [ ] **Step 4: Commit**

```bash
git add src/components/AstridHelp.svelte
git commit -m "feat(help): AstridHelp UI (ask button, progressive panel, auto-offer)"
```

## Task 3: Wire GameScreen + Times Tables slice

**Files:** Modify `src/screens/GameScreen.svelte`, `src/games/TimesTables.svelte`.

- [ ] **Step 1: GameScreen — imports + state.** In `src/screens/GameScreen.svelte` add near the other imports:

```ts
  import AstridHelp from '../components/AstridHelp.svelte';
  import type { GameHelp } from '../lib/help';
```
Add state (near `answered`):

```ts
  let currentHelp = $state<GameHelp | null>(null);
  let missCount = $state(0);
  let autoOffer = $state(false);
```

- [ ] **Step 2: GameScreen — miss tracking.** In `handleCorrect`, add `missCount = 0;`. In `handleIncorrect`, add `missCount += 1; if (missCount >= 2) autoOffer = true;`. (Place these alongside the existing `answered++`/`currentStreak` lines.)

- [ ] **Step 3: GameScreen — render AstridHelp in the mascot snippet.** Inside `{#snippet mascot()}`, below the `.mascot-wrapper` div, add:

```svelte
    <AstridHelp
      help={currentHelp}
      glow={GLOW[mode] ?? 'var(--glow-firefly)'}
      autoOffer={autoOffer}
      onAutoOfferHandled={() => (autoOffer = false)}
      seenKey={`helena-math:help:seen:${mode}`}
    />
```

- [ ] **Step 4: GameScreen — bind help on Times Tables only (for now).** Change the `<TimesTables ... />` render to add `bind:help={currentHelp}`. Leave the other 9 game renders unchanged (they gain `bind:help` in their own tasks).

- [ ] **Step 5: TimesTables — expose help.** In `src/games/TimesTables.svelte`:
  - Add to Props + destructure: `import type { GameHelp } from '../lib/help';` and `help = $bindable<GameHelp | null>(null)` in the `$props()` destructure.
  - Populate it reactively from the current question. The game has the current factors (e.g. `q.a`, `q.b` — confirm exact names by reading the file). Add a `$effect` (or `$derived` assigned in the question-advance code) that sets:

```ts
  $effect(() => {
    if (!q) { help = null; return; }
    const { a, b } = q; // use the file's actual current-question vars
    const half = a * Math.floor(b / 2);
    const rest = a * (b - Math.floor(b / 2));
    help = {
      howToPlay: 'Type the answer to each multiplication. Example: 3 × 4 = 12.',
      hint: `Count up by ${a}s, or split it: ${a}×${b} = ${a}×${Math.floor(b/2)} + ${a}×${b - Math.floor(b/2)}.`,
      steps: [
        `${a} × ${Math.floor(b/2)} = ${half}`,
        `${a} × ${b - Math.floor(b/2)} = ${rest}`,
        `${half} + ${rest} = ${a * b}`,
        `So ${a} × ${b} = ${a * b}`,
      ],
    };
  });
```
  (Adapt the destructured names to the file's actual current-question variable. Do NOT change game logic/scoring/`onFinished`/`onCorrect`/`onIncorrect`.)

- [ ] **Step 6: Verify** `npm run check && npm run build && npm test` → 0 errors/0 warnings; 14 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/screens/GameScreen.svelte src/games/TimesTables.svelte
git commit -m "feat(help): wire AstridHelp into GameScreen + Times Tables help slice"
```

## Task 4: UX gate on the slice

**Files:** none (verification on Tasks 1–3).

- [ ] **Step 1:** `npm run build` then start the dev server (preview); seed a profile; enter Times Tables.
- [ ] **Step 2:** Verify by screenshot/interaction: (a) first entry auto-shows How-to-play (and not on second entry — localStorage flag); (b) "Stuck? Ask Astrid" shows the hint; (c) "Still stuck? Show me" reveals steps one at a time ending in "Now you try!"; (d) two wrong answers trigger the gentle "want a hint?" offer; (e) Escape/close/click-outside dismiss; (f) ≥48px targets, focus ring, on-theme twilight, panel does NOT block playing the game.
- [ ] **Step 3:** Dispatch the independent design/UX-critique agent against the spec §4–§5 to grade the slice; apply fixes; re-grade until PASS. Commit fixes: `git add -A && git commit -m "polish(help): slice UX fixes"`.

## Tasks 5–13: author help for the remaining 9 games

> Each task: (a) read the game, (b) add `help = $bindable<GameHelp | null>(null)` to its `$props()` (+ `import type { GameHelp } from '../lib/help';`), (c) populate `help` reactively from the current question via a `$effect`, (d) add `bind:help={currentHelp}` to that game's render in `GameScreen.svelte`, (e) verify `npm run check && npm run build` 0/0 and `npm test` 14 pass, (f) commit. Do NOT change game logic/scoring/contracts. Use the content below (refine wording to be kid-friendly and accurate to the actual current question — the game's real question variables drive the dynamic parts). Reuse existing step structure where noted.

### Task 5: Speed Add (`src/games/SpeedAdd.svelte`)
howToPlay: "Listen to the sum and type the total. Example: 'four plus five' → 9."
hint (current a+b): `Add the bigger number first, then count on.`
steps: [`Start at ${Math.max(a,b)}`, `Count on ${Math.min(a,b)} more`, `${a} + ${b} = ${a+b}`]. Commit `feat(help): Speed Add help`.

### Task 6: Number Sort (`src/games/NumberSort.svelte`)
howToPlay: "Put each number in Even, Odd, or Prime. If it's prime, prime wins."
hint (current n): `Ends in 0,2,4,6,8 → even. Only 1 and itself as factors → prime.`
steps: [`Is ${n} only divisible by 1 and ${n}? If yes → Prime`, `Otherwise: last digit even → Even, else Odd`]. Commit `feat(help): Number Sort help`.

### Task 7: Fraction Garden (`src/games/FractionGarden.svelte`)
howToPlay: "Water petals to match the target fraction. Pick a denominator first."
hint: `Make the bottom number match, then count how many equal petals you need.`
steps (target t/d shown): [`Target is ${targetText}`, `With ${den} petals, you need ${needed}`, `Water ${needed} of ${den}`]. (Use the game's actual target + chosen denominator vars.) Commit `feat(help): Fraction Garden help`.

### Task 8: Place Value (`src/games/PlaceValue.svelte`)
howToPlay: "Build the number by setting each place column (ones, tens, …)."
hint: `Read it place by place: how many thousands, hundreds, tens, ones?`
steps: derive from the target's digits, e.g. [`${thousands} in the thousands = ${thousands*1000}`, `…each place`, `Add them: ${target}`]. (Use the game's target value, split into place digits.) Commit `feat(help): Place Value help`.

### Task 9: Multiplication Grid (`src/games/MultiplicationGrid.svelte`)
howToPlay: "Fill each box (a partial product), then add the boxes for the total."
hint: `Split each number into tens and ones, multiply the boxes, then add.`
steps: from the current factors' partial products, e.g. [`${aTens} × ${bTens} = …`, `…the other boxes`, `Add all boxes = ${a*b}`]. (Use the game's actual partial-product vars.) Commit `feat(help): Multiplication Grid help`.

### Task 10: Long Division (`src/games/LongDivision.svelte`)
howToPlay: "Solve one step at a time: divide, multiply, subtract, bring down."
hint: `How many times does ${divisor} fit? Then multiply and subtract.`
steps: REUSE the game's existing 4 guided-step prompts for the current problem (the game already encodes them — surface those strings as `steps`). Commit `feat(help): Long Division help`.

### Task 11: Decimal Shading (`src/games/DecimalGridZoom.svelte`)
howToPlay: "Shade squares to match the value. The whole grid is 100 (hundredths)."
hint: `0.1 is 10 squares, 0.25 is 25 squares.`
steps (target value v): [`Target is ${targetText}`, `${targetText} = ${hundredths} hundredths`, `Shade ${hundredths} squares`]. (Use the game's target → hundredths.) Commit `feat(help): Decimal Shading help`.

### Task 12: Coordinate Plot (`src/games/CoordinatePlot.svelte`)
howToPlay: "Tap grid points to plot each (x, y), then press Connect."
hint: `Find the column (x) first, then count up for y.`
steps: from the first unplotted target point (x,y): [`(${x},${y}): go right to ${x}`, `then up to ${y}`, `tap that point`]. (Use the game's current target points.) Commit `feat(help): Coordinate Plot help`.

### Task 13: Order of Operations (`src/games/PEMDASTree.svelte`)
howToPlay: "Tap the operation to do next, following PEMDAS (parentheses, ×÷, +−)."
hint: REUSE the current step's existing rule reminder (`incorrectFeedback`) as the hint.
steps: the ordered list of which operation to evaluate next for the current expression (reuse the game's step structure). Commit `feat(help): Order of Operations help`.

## Task 14: Final A++/UX gate + verification

- [ ] **Step 1:** `npm run build && npm run preview` (or dev); seed a profile.
- [ ] **Step 2:** For each of the 10 games, enter it and exercise help: how-to-play on first entry, hint, steps, and the 2-miss auto-offer. Capture screenshots at desktop + mobile for a representative few (incl. a reuse-structure game: Long Division or Order of Operations).
- [ ] **Step 3:** Dispatch the independent design/UX-critique agent: grade help cohesion (on-theme twilight, ≥48px, focus/Escape, non-blocking), that hints don't give away the answer outright, steps progressively reveal, content is accurate per game, and no regression to gameplay. Iterate to PASS; commit each round.
- [ ] **Step 4:** `npm test && npm run check && npm run build` → all green (14 tests; help is additive — no scoring changes).
- [ ] **Step 5:** Present screenshots + scorecard to the user.

---

## Self-review notes

- **Spec coverage:** contract (§2) → Task 1; AstridHelp UI incl. progressive reveal, auto-offer, first-entry how-to-play, a11y (§3–§5) → Task 2 + wiring Task 3; miss-count/auto-offer (§3) → Task 3; per-game content (§6) → Tasks 3 (TT) + 5–13; testing/gate (§7) → Tasks 4, 14. Encouragement (§1.4) is folded into the offer/step copy (Task 2) per the spec.
- **Compiles at every step:** `bind:help` is added per game only after that game gains the `help` bindable; `currentHelp` is null for un-authored games → the Ask-Astrid button hides (Task 2 guards `{#if help}`).
- **No "similar to Task N":** the shared per-game recipe is stated once; each of Tasks 5–13 gives that game's concrete content + the same 6 mechanical steps + reuse notes where applicable.
- **Type/name consistency:** `GameHelp` (Task 1) is imported by AstridHelp (2), GameScreen (3), and every game (3, 5–13). `help`/`currentHelp`/`autoOffer`/`missCount`/`seenKey` names are consistent across tasks.
- **No game logic changes:** every authoring task states help is additive (set a bindable from existing question state); reviewers confirm scoring/contracts untouched.
