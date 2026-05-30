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
  const numBloomed = $derived(
    MATH_MODES.filter((id) => (masteryMap[id] ?? 0) >= BLOOM_GATE).length
  );
  const bloomedCount = $derived(numBloomed);

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

      <!-- Sun icon in the centre -->
      <div class="ring-center" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#FFD700" style="filter: drop-shadow(0 0 10px #FFD700);">
          <path d="M12 4V2M12 22V20M4 12H2M22 12H20M5.636 5.636L4.222 4.222M19.778 19.778L18.364 18.364M5.636 18.364L4.222 19.778M19.778 4.222L18.364 5.636M12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17Z" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="5" fill="#FFB300" />
        </svg>
      </div>

      <!-- Percentage on the right -->
      <div class="ring-pct-right" aria-hidden="true">
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

    <!-- Mini bed icons — filled flowers for bloomed, dim for not yet -->
    <div class="bed-dots" aria-hidden="true">
      {#each MATH_MODES as id (id)}
        <span
          class="bed-flower"
          class:bed-flower--bloomed={(masteryMap[id] ?? 0) >= BLOOM_GATE}
          title={id}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C9 2 9 6 12 8C15 6 15 2 12 2ZM12 22C9 22 9 18 12 16C15 18 15 22 12 22ZM2 12C2 9 6 9 8 12C6 15 2 15 2 12ZM22 12C22 9 18 9 16 12C18 15 22 15 22 12ZM5 5C3 7 6 10 9 9C6 7 4 3 5 5ZM19 19C21 17 18 14 15 15C18 17 20 21 19 19ZM19 5C21 7 18 10 15 9C18 7 20 3 19 5ZM5 19C3 17 6 14 9 15C6 17 4 21 5 19ZM12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12C14 13.1 13.1 14 12 14Z" />
          </svg>
        </span>
      {/each}
    </div>

    <div class="bloomed-value" aria-hidden="true">
      <span class="bloomed-n">{bloomedCount}</span>
      <span class="bloomed-denom">/ 10</span>
    </div>
  </div>

  <!-- ── 3. Watering Streak ────────────────────────────────────────── -->
  <div
    class="meter-chip streak-chip"
    role="img"
    aria-label="Watering Streak: {streak} in a row"
  >
    <div class="chip-label">Watering Streak</div>

    <div class="water-drops" aria-hidden="true" style="display:flex; align-items:center; gap:4px; margin-bottom: -4px; color: #00DDFF; filter: drop-shadow(0 0 5px #00DDFF);">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21C8.686 21 6 18.314 6 15C6 11.2 12 2 12 2C12 2 18 11.2 18 15C18 18.314 15.314 21 12 21Z"/></svg>
      <span style="font-size:12px; font-weight:bold; color: #fff;">+</span>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21C8.686 21 6 18.314 6 15C6 11.2 12 2 12 2C12 2 18 11.2 18 15C18 18.314 15.314 21 12 21Z"/></svg>
      <span style="font-size:12px; font-weight:bold; color: #fff;">+</span>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21C8.686 21 6 18.314 6 15C6 11.2 12 2 12 2C12 2 18 11.2 18 15C18 18.314 15.314 21 12 21Z"/></svg>
    </div>

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
    </div>

    <div class="streak-sublabel" aria-hidden="true" style="color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
      {streak} Day Streak
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
    padding: 0.5rem 1rem;
    min-width: 130px;
    flex: 1 1 130px;
    max-width: 200px;
  }

  .chip-label {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
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
    stroke: var(--color-border);
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

  .ring-pct-right {
    position: absolute;
    top: 50%;
    right: -55px; /* Push to the right of the ring */
    transform: translateY(-50%);
    display: flex;
    align-items: baseline;
    gap: 0.05em;
    color: oklch(98% 0.01 200);
    pointer-events: none;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }

  .ring-pct {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 800;
    line-height: 1;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
    font-variant-numeric: tabular-nums lining-nums;
  }

  .ring-unit {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 600;
    color: #fff;
    opacity: 0.9;
    margin-left: 2px;
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

  .bed-flower {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(0,0,0,0.4); /* Dim out unbloomed */
    transition: color 0.3s, filter 0.3s;
    filter: drop-shadow(0 -1px 1px rgba(255,255,255,0.1));
  }

  .bed-flower--bloomed {
    color: var(--glow-blossom);
    filter: drop-shadow(0 0 4px var(--glow-blossom));
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
    background: var(--color-border);
    border: 1px solid var(--color-border);
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
    /* Teardrop flame shape via clip-path */
    clip-path: polygon(50% 0%, 85% 50%, 70% 100%, 30% 100%, 15% 50%);
    background: var(--color-border);
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
