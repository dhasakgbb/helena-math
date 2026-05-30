# Astrid Help System — Design

**Date:** 2026-05-30
**Status:** Design — approved (build & ship)
**App:** `helena/math` — Svelte 5 PWA, offline, no backend
**Builds on:** the merged Moonlit Math Garden redesign (Plans 1–3).

---

## 1. Goal

Make Astrid actually *help*, not just react. Today she poses (thinking/happy/wow/sad/sleeping) and gives canned encouragement, and only Times Tables receives real guidance. This adds an in-game help system delivered through Astrid that teaches without spoiling, fully offline, authored per game.

Four help types (all requested):
1. **On-demand hint** for the current question.
2. **How-to-play** when entering a game.
3. **Step-by-step** worked example when stuck.
4. **Warmer encouragement** at the help moments.

Trigger: a persistent **"Stuck? Ask Astrid"** button **plus** an auto-offer after 2 consecutive misses on the current question.

### Non-goals (YAGNI)
- No live AI / backend (stays offline; CSP `connect-src 'self'` unchanged).
- No hub help (the hub already has Smart Pick guidance).
- No help-usage telemetry in this iteration (a `help_used` counter could be added later for the parent dashboard).
- No new math content; help is authored text over existing game state.

## 2. The contract

A shared interface every game fills in for its CURRENT question:

```ts
// src/lib/help.ts
export interface GameHelp {
  howToPlay: string;   // static per game: the rules + one tiny example
  hint: string;        // a nudge for the current on-screen question
  steps: string[];     // 2–4 worked steps for the current question
}
```

Each game gains a `$bindable` prop:
```ts
let { /* …existing… */, help = $bindable<GameHelp | null>(null) }: Props = $props();
```
The game sets `help` reactively whenever its question changes (`howToPlay` constant; `hint`/`steps` recomputed). `null` means "no help available yet" (e.g., results state) → the Ask-Astrid button hides.

## 3. Components & data flow

- **`src/lib/help.ts`** — the `GameHelp` type. (No logic.)
- **`src/components/AstridHelp.svelte`** (new) — owns the help UI. Props:
  - `help: GameHelp | null`
  - `glow: string` (grove color, for on-theme styling — passed from GameScreen's existing per-mode glow)
  - `autoOffer: boolean` (GameScreen sets true after 2 misses; AstridHelp shows the gentle "Want a hint?" offer; it resets to false when dismissed/accepted via a callback)
  - `onAutoOfferHandled: () => void` (lets AstridHelp tell GameScreen the offer was shown/dismissed so it isn't re-triggered every render)
  - `seenKey: string` (e.g. `helena-math:help:seen:<mode>`) — used to auto-show `howToPlay` only on first entry per mode.
- **`GameScreen.svelte`** (modify) — already owns Astrid (pose, message, inactivity), wraps games in GameShell, and handles `handleCorrect`/`handleIncorrect`. Changes:
  - `bind:help={currentHelp}` on the active game.
  - Track `missCount` ($state): increment in `handleIncorrect`, reset to 0 in `handleCorrect`. When `missCount` reaches 2, set `autoOffer = true`.
  - Render `<AstridHelp help={currentHelp} glow={GLOW[mode]} autoOffer={autoOffer} onAutoOfferHandled={() => { autoOffer = false; }} seenKey={`helena-math:help:seen:${mode}`} />` inside the existing mascot snippet area (so it sits with Astrid).
- **10 game components** (modify) — add the `help` bindable + author `howToPlay`/`hint`/`steps` for the current question (see §6).
- **`GameShell.svelte`** — unchanged (Astrid + help live in GameScreen's mascot snippet that GameShell renders).

Data flow: **Game** (sets `help` reactively) → `bind:help` → **GameScreen** → prop → **AstridHelp** (renders button + panel).

## 4. Help UX (progressive reveal — teaches, doesn't spoil)

`AstridHelp` renders near Astrid:

- **"Stuck? Ask Astrid" button** — always shown when `help !== null`. ≥48px, on-theme (grove glow), `aria-label="Ask Astrid for help"`.
- Tapping opens a **help panel** (a dark-glass speech-bubble/popover, `role="dialog"` `aria-modal="false"` so it doesn't trap the game, with an accessible label and a close button; Escape closes; click-outside closes):
  - **Level 1 — Hint:** shows `help.hint`. A **"Still stuck? Show me"** button advances to level 2.
  - **Level 2 — Steps:** reveals `help.steps` **one at a time** (a "Next step" button appends each step; the last step ends with a kind "Now you try!"). This is the worked example.
  - A persistent **"How do I play?"** link in the panel shows `help.howToPlay` at any level.
  - Panel resets to Level 1 each time it's opened fresh for a new question.
- **How-to-play on entry:** on mounting a game, if `localStorage[seenKey]` is unset, auto-open the panel to `howToPlay` (dismissible), then set the flag so it doesn't repeat. Always reachable via the button afterward. (Reduced-motion: appears without animation.)
- **Auto-offer after 2 misses:** when `autoOffer` is true, Astrid shows a small, kind prompt near the button — *"No worries — want a hint?"* — with **Yes** (opens panel to the hint) and **Not yet** (dismisses). Either choice calls `onAutoOfferHandled()`. Never auto-reveals the answer.
- **Tone:** warm, brief, second-person ("Let's try…", "You're close!", "Now you try!").

## 5. Accessibility & theme

- Button + all controls ≥48px (`var(--touch)`), visible `:focus-visible` glow ring, `aria-label`s.
- Panel: `role="dialog"`, labelled, focus moves to it on open and returns to the button on close, Escape closes, click-outside/backdrop closes; does NOT block interacting with the game behind it (non-modal — it's help, not a gate).
- Twilight tokens only (`--color-panel`, `--color-border`, `--color-text`, `--color-primary`, `--glow-*`), Lexend, tabular numerals where digits appear. Zero dead tokens.
- All motion `@keyframes` under `@media (prefers-reduced-motion: no-preference)` + honored by the in-app calm mode.

## 6. Per-game help content (authored)

Each game provides `howToPlay` (static) and computes `hint`/`steps` from its current question. Guidance per game (final wording refined in implementation, kept kid-friendly, ≤ ~2 short sentences for hints, 2–4 steps):

| Game | howToPlay | hint (example) | steps (example) |
| --- | --- | --- | --- |
| Times Tables | "Type the answer to each multiplication. Example: 3 × 4 = 12." | "Count up by 7s, or split it: 7×8 = 7×4 + 7×4." | ["7 × 4 = 28", "28 + 28 = 56", "So 7 × 8 = 56"] |
| Speed Add | "Listen to the sum and type the total. Example: 'four plus five' → 9." | "Add the bigger number first, then count on." | ["Start at 8", "Count on 5: 9,10,11,12,13", "8 + 5 = 13"] |
| Number Sort | "Put each number in Even, Odd, or Prime. Prime wins if it's both." | "Ends in 0,2,4,6,8 → even. Only 1 and itself as factors → prime." | ["Is it only divisible by 1 and itself? → Prime", "Else even/odd by last digit"] |
| Fraction Garden | "Water petals to match the target fraction. Pick a denominator first." | "Make the bottom numbers match, then count equal petals." | ["Target = 1/2", "With 6 petals, half = 3", "Water 3 of 6"] |
| Place Value | "Build the number by setting each place column." | "Read it place by place: thousands, hundreds, tens, ones." | ["3 in thousands = 3000", "…add each place", "Total = the number"] |
| Multiplication Grid | "Fill each box (partial product), then add them for the total." | "Multiply the tens and ones separately, then add the boxes." | ["20 × 30 = 600", "20 × 4, 3 × 30, 3 × 4…", "Add all boxes"] |
| Long Division | "Solve one step at a time: divide, multiply, subtract, bring down." | "How many times does the divisor fit? Then multiply and subtract." | (reuse the game's existing 4 step prompts for the current problem) |
| Decimal Shading | "Shade squares to match the value. The grid is hundredths." | "0.1 = 10 squares, 0.25 = 25 squares." | ["Target 0.30", "0.30 = 30 hundredths", "Shade 30 squares"] |
| Coordinate Plot | "Tap grid points to plot each (x, y), then Connect." | "Find the column (x) first, then count up for y." | ["(3,5): go right to 3", "then up to 5", "tap that point"] |
| Order of Operations | "Tap the operation to do next, following PEMDAS." | (reuse the step's existing rule reminder, e.g. "Parentheses first!") | (reuse the game's existing per-step structure) |

Long Division and Order of Operations already encode step structure — reuse it rather than re-authoring.

## 7. Testing

- **Unit (vitest):** a small pure helper per game where hint/steps are computed by a function (where practical) can be unit-tested; at minimum, add a test that `AstridHelp`'s level progression logic (level 1 → 2, reset on new help) behaves correctly if extracted to a pure function. Realistically most help is presentational (verified at the gate); the data-layer additions (miss-count reset, seen-flag) are the testable seams.
- **A++ + UX gate:** independent critique agent drives the live app — opens a game, taps "Ask Astrid", verifies hint→steps progression, how-to-play on first entry, the 2-miss auto-offer, a11y (focus/Escape/≥48px), twilight cohesion, and that help never blocks play — across desktop + mobile.
- Regression: existing 14 tests stay green; no game logic/scoring changed (help is additive).

## 8. Build sequencing

1. Contract + UI shell: `help.ts` type, `AstridHelp.svelte` (button + panel + progressive reveal + auto-offer + first-entry how-to-play), wired into `GameScreen` with miss-count + a ONE-game vertical slice (Times Tables) authoring `help`. Gate the UX on the slice.
2. Author `help` for the remaining 9 games (one task each), reusing existing step structure for Long Division & Order of Operations.
3. Final A++/UX gate across all 10 + full verification.

## 9. Risks
- **Per-game authoring volume** (10 games) — the bulk; mitigated by the shared contract + slice-first.
- **Non-modal panel focus management** — must not trap focus or block the game; verified at the gate.
- **Auto-offer pacing** — must feel kind, not nagging; reset correctly per question (miss-count resets on correct).
