<!--
  GlowMeters.svelte — Task 9
  Three honest progress meters for the hub's sky band.

  1. Garden Glow  — circular ring: average mastery across all 10 modes
                    (timesTablesRingFill for TT, mastery[id] for others)
  2. Bloomed Beds — count of modes whose gate mastery ≥ 0.85 (mastery[id])
  3. Watering Streak — candle flames (capped at 7) + honest "in a row" label
-->
<script lang="ts">
  import { profileStore, MATH_MODES } from "../lib/profile.svelte";

  interface Props {
    compact?: boolean;
  }
  let { compact = false }: Props = $props();

  // ── Derived data ─────────────────────────────────────────────────────────

  /** Raw mastery map from the store */
  const masteryMap = $derived(
    ((profileStore.profile?.module_overrides?.math as any)?.mastery ?? {}) as Record<string, number>
  );

  /**
   * Meter 1 — Garden Glow
   * Average mastery over all 10 modes.
   * Times-tables uses the smooth ring fill (partial-credit count of facts);
   * all other modes use their stored gate mastery value.
   */
  const gardenGlowFill = $derived(
    (() => {
      const ttFill = profileStore.timesTablesRingFill;
      let sum = ttFill; // times-tables slot
      for (const id of MATH_MODES) {
        if (id === "times-tables") continue;
        sum += (masteryMap[id] ?? 0);
      }
      return sum / 10;
    })()
  );

  const gardenGlowPct = $derived(Math.round(gardenGlowFill * 100));

  /** Ring geometry — 120px viewBox, ring centred */
  const RING_R = 44;
  const RING_CX = 60;
  const RING_CY = 60;
  const CIRCUMFERENCE = 2 * Math.PI * RING_R;
  const ringDash = $derived(gardenGlowFill * CIRCUMFERENCE);
  const ringGap = $derived(CIRCUMFERENCE - ringDash);

  /**
   * Meter 2 — Bloomed Beds
   * Count of modes whose gate mastery ≥ 0.85.
   * For all modes (including times-tables) we use mastery[id] directly —
   * the gate value recorded by recordGameResult / recordTimesTableFact.
   */
  const BLOOM_GATE = 0.85;
  const bloomedCount = $derived(
    MATH_MODES.filter((id) => (masteryMap[id] ?? 0) >= BLOOM_GATE).length
  );

  /**
   * Meter 3 — Watering Streak
   * Consecutive games scored ≥ 70% (not calendar days).
   */
  const streak = $derived(
    ((profileStore.profile?.module_overrides?.math as any)?.streak ?? 0) as number
  );

  const FLAME_CAP = 7;
  const flamesLit = $derived(Math.min(streak, FLAME_CAP));
  const streakOverflow = $derived(streak > FLAME_CAP);
</script>

<div class="glow-meters" class:compact>
  <!-- ── 1. Garden Glow ─────────────────────────────────────────────── -->
  <div class="meter-chip garden-glow-chip">
    <div class="chip-label">Garden Glow</div>

    <div
      class="ring-wrap"
      role="img"
      aria-label="Garden Glow: {gardenGlowPct} percent"
    >
      <svg
        class="ring-svg"
        viewBox="0 0 120 120"
        width="120"
        height="120"
        aria-hidden="true"
      >
        <!-- Track -->
        <circle
          class="ring-track"
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke-width="10"
          stroke-linecap="round"
        />
        <!-- Progress arc — rotated so start is top-centre -->
        <circle
          class="ring-arc"
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke-width="10"
          stroke-linecap="round"
          stroke-dasharray="{ringDash} {ringGap}"
          transform="rotate(-90 {RING_CX} {RING_CY})"
          style="--dash: {ringDash}; --circ: {CIRCUMFERENCE};"
        />
      </svg>

      <!-- Percentage in the centre -->
      <div class="ring-center" aria-hidden="true">
        <span class="ring-pct">{gardenGlowPct}</span>
        <span class="ring-unit">%</span>
      </div>
    </div>
  </div>

  <!-- ── 2. Bloomed Beds ───────────────────────────────────────────── -->
  <div
    class="meter-chip bloomed-chip"
    role="img"
    aria-label="Bloomed Beds: {bloomedCount} of 10 modes mastered"
  >
    <div class="chip-label">Bloomed Beds</div>

    <div class="bloomed-value" aria-hidden="true">
      <span class="bloomed-n">{bloomedCount}</span>
      <span class="bloomed-denom">/ 10</span>
    </div>

    <!-- Mini bed icons — filled circles for bloomed, dim for not yet -->
    <div class="bed-dots" aria-hidden="true">
      {#each MATH_MODES as id (id)}
        <span
          class="bed-dot"
          class:bed-dot--bloomed={(masteryMap[id] ?? 0) >= BLOOM_GATE}
          title={id}
        ></span>
      {/each}
    </div>
  </div>

  <!-- ── 3. Watering Streak ────────────────────────────────────────── -->
  <div
    class="meter-chip streak-chip"
    role="img"
    aria-label="Watering Streak: {streak} in a row"
  >
    <div class="chip-label">Watering Streak</div>

    <div class="flames-row" aria-hidden="true">
      {#each { length: FLAME_CAP } as _, i}
        <span class="flame" class:flame--lit={i < flamesLit}>
          <!-- Candle body -->
          <span class="candle-body"></span>
          <!-- Flame shape (CSS clip + glow) -->
          <span class="candle-flame"></span>
        </span>
      {/each}
      {#if streakOverflow}
        <span class="flame-overflow">+</span>
      {/if}

      <!-- Dewdrop / freeze affordance (purely visual) -->
      <span class="dewdrop" aria-hidden="true" title="Streak resets on a score below 70%">
        <svg viewBox="0 0 16 20" width="14" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 1 C8 1 2 8 2 13 a6 6 0 0 0 12 0 C14 8 8 1 8 1 Z"
            fill="currentColor"
            opacity="0.25"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <div class="streak-sublabel" aria-hidden="true">
      {streak} in a row
    </div>
  </div>
</div>

<style>
  /* ── Layout ─────────────────────────────────────────────────────────── */
  .glow-meters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    align-items: flex-start;
  }

  /* ── Shared chip ────────────────────────────────────────────────────── */
  .meter-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem 1.1rem;
    border-radius: var(--r-lg);
    background: oklch(30% 0.05 275 / 0.52);
    border: 1px solid oklch(85% 0.02 280 / 0.14);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    min-width: 130px;
    flex: 1 1 130px;
    max-width: 200px;
  }

  .chip-label {
    font-family: var(--font-display);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  /* ── Garden Glow ring ───────────────────────────────────────────────── */
  .garden-glow-chip {
    --glow-c: var(--glow-moonflower);
  }

  .ring-wrap {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .ring-svg {
    display: block;
  }

  .ring-track {
    stroke: oklch(85% 0.02 280 / 0.12);
  }

  .ring-arc {
    stroke: var(--glow-moonflower);
    filter: drop-shadow(0 0 4px var(--glow-moonflower)) drop-shadow(0 0 14px color-mix(in oklch, var(--glow-moonflower), transparent 40%));
    /* Start at 0 and animate to full dash length */
    stroke-dashoffset: 0;
  }

  .ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.05em;
    color: var(--color-text);
    pointer-events: none;
  }

  .ring-pct {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
    color: var(--glow-moonflower);
    --glow-c: var(--glow-moonflower);
    text-shadow: var(--glow-sm);
    font-variant-numeric: tabular-nums lining-nums;
  }

  .ring-unit {
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
    align-self: flex-end;
    margin-bottom: 0.2em;
  }

  /* Animate ring fill on load (respects reduced-motion via media) */
  @media (prefers-reduced-motion: no-preference) {
    .ring-arc {
      animation: ring-fill-grow 1.1s cubic-bezier(0.34, 1.2, 0.64, 1) both;
    }

    @keyframes ring-fill-grow {
      from {
        stroke-dasharray: 0 var(--circ);
      }
      to {
        stroke-dasharray: var(--dash) calc(var(--circ) - var(--dash));
      }
    }
  }

  /* ── Bloomed Beds ───────────────────────────────────────────────────── */
  .bloomed-chip {
    --glow-c: var(--glow-blossom);
  }

  .bloomed-value {
    display: flex;
    align-items: baseline;
    gap: 0.15em;
  }

  .bloomed-n {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    color: var(--glow-blossom);
    --glow-c: var(--glow-blossom);
    text-shadow: var(--glow-md);
    font-variant-numeric: tabular-nums lining-nums;
  }

  .bloomed-denom {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .bed-dots {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
    max-width: 140px;
  }

  .bed-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: oklch(85% 0.02 280 / 0.18);
    border: 1px solid oklch(85% 0.02 280 / 0.22);
    transition: background 0.3s, box-shadow 0.3s;
  }

  .bed-dot--bloomed {
    background: var(--glow-blossom);
    border-color: var(--glow-blossom);
    box-shadow: 0 0 5px var(--glow-blossom), 0 0 12px color-mix(in oklch, var(--glow-blossom), transparent 50%);
  }

  /* ── Watering Streak ────────────────────────────────────────────────── */
  .streak-chip {
    --glow-c: var(--glow-firefly);
  }

  .flames-row {
    display: flex;
    align-items: flex-end;
    gap: 5px;
  }

  .flame {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    position: relative;
  }

  .candle-body {
    display: block;
    width: 7px;
    height: 14px;
    border-radius: 2px 2px 1px 1px;
    background: oklch(85% 0.02 280 / 0.18);
    border: 1px solid oklch(85% 0.02 280 / 0.22);
    transition: background 0.3s;
  }

  .flame--lit .candle-body {
    background: oklch(82% 0.10 75 / 0.6);
    border-color: var(--glow-firefly);
  }

  .candle-flame {
    display: block;
    width: 7px;
    height: 10px;
    background: transparent;
    /* Teardrop flame shape via clip-path */
    clip-path: polygon(50% 0%, 85% 50%, 70% 100%, 30% 100%, 15% 50%);
    background: oklch(85% 0.02 280 / 0.12);
    border-radius: 50% 50% 30% 30%;
    transition: background 0.3s, box-shadow 0.3s;
  }

  .flame--lit .candle-flame {
    background: var(--glow-firefly);
    box-shadow: 0 0 4px var(--glow-firefly), 0 0 14px color-mix(in oklch, var(--glow-firefly), transparent 40%);
  }

  /* Flame flicker animation — lit candles only */
  @media (prefers-reduced-motion: no-preference) {
    .flame--lit .candle-flame {
      animation: flame-flicker 1.8s ease-in-out infinite alternate;
    }

    @keyframes flame-flicker {
      0%   { transform: scaleY(1)    scaleX(1)    translateY(0);    opacity: 1; }
      30%  { transform: scaleY(1.1)  scaleX(0.92) translateY(-1px); opacity: 0.95; }
      60%  { transform: scaleY(0.92) scaleX(1.06) translateY(0.5px); opacity: 1; }
      100% { transform: scaleY(1.05) scaleX(0.96) translateY(-0.5px); opacity: 0.9; }
    }

    /* Stagger flicker per-flame using nth-of-type tricks on the parent */
    .flame:nth-child(2) .candle-flame { animation-delay: -0.4s; }
    .flame:nth-child(3) .candle-flame { animation-delay: -0.8s; }
    .flame:nth-child(4) .candle-flame { animation-delay: -0.3s; }
    .flame:nth-child(5) .candle-flame { animation-delay: -1.1s; }
    .flame:nth-child(6) .candle-flame { animation-delay: -0.6s; }
    .flame:nth-child(7) .candle-flame { animation-delay: -1.5s; }
  }

  .flame-overflow {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--glow-firefly);
    --glow-c: var(--glow-firefly);
    text-shadow: var(--glow-sm);
    align-self: center;
    margin-bottom: 2px;
  }

  /* Dewdrop freeze icon — dim, purely decorative */
  .dewdrop {
    display: inline-flex;
    align-items: flex-end;
    color: var(--glow-moonflower);
    opacity: 0.35;
    margin-left: 3px;
    margin-bottom: 1px;
  }

  .streak-sublabel {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-align: center;
  }

  /* ── Compact variant ────────────────────────────────────────────────── */
  .compact .meter-chip {
    padding: 0.7rem 0.9rem 0.8rem;
    min-width: 100px;
    max-width: 160px;
  }

  .compact .ring-wrap {
    width: 80px;
    height: 80px;
  }

  .compact .ring-svg {
    width: 80px;
    height: 80px;
  }

  .compact .ring-pct {
    font-size: 1.2rem;
  }

  .compact .bloomed-n {
    font-size: 1.8rem;
  }
</style>
