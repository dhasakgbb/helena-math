<!--
  GlowMeters.svelte
  Three progress meters for the hub's sky band representing the Quantum Fluid Topology status.

  1. Network Sync   — circular ring: average mastery across all 10 modes
  2. Solid Cells    — count of modes whose mastery ≥ 0.85
  3. Energy Streak  — consecutive games scored ≥ 70% shown as energy synapse drops
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

  /** Average mastery over all 10 modes */
  const averageMastery = $derived(
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

  const averageMasteryPct = $derived(Math.round(averageMastery * 100));

  /** Ring geometry — 120px viewBox, ring centred */
  const RING_R = 44;
  const RING_CX = 60;
  const RING_CY = 60;
  const CIRCUMFERENCE = 2 * Math.PI * RING_R;
  const ringDash = $derived(averageMastery * CIRCUMFERENCE);
  const ringGap = $derived(CIRCUMFERENCE - ringDash);

  /** Count of modes whose gate mastery ≥ 0.85 */
  const BLOOM_GATE = 0.85;
  const solidCellsCount = $derived(
    MATH_MODES.filter((id) => (masteryMap[id] ?? 0) >= BLOOM_GATE).length
  );

  /** Consecutive games scored ≥ 70% */
  const streak = $derived(
    ((profileStore.profile?.module_overrides?.math as any)?.streak ?? 0) as number
  );

  const STREAK_CAP = 7;
  const streakLit = $derived(Math.min(streak, STREAK_CAP));
  const streakOverflow = $derived(streak > STREAK_CAP);
</script>

<div class="glow-meters" class:compact>
  <!-- ── 1. Network Sync ─────────────────────────────────────────────── -->
  <div class="meter-chip network-sync-chip">
    <div class="chip-label">Network Sync</div>

    <div
      class="ring-wrap"
      role="img"
      aria-label="Network Sync: {averageMasteryPct} percent"
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
          stroke-width="8"
          stroke-linecap="round"
        />
        <!-- Progress arc — rotated so start is top-centre -->
        <circle
          class="ring-arc"
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray="{ringDash} {ringGap}"
          transform="rotate(-90 {RING_CX} {RING_CY})"
          style="--dash: {ringDash}; --circ: {CIRCUMFERENCE};"
        />
      </svg>

      <!-- Center node icon -->
      <div class="ring-center" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" class="node-icon">
          <circle cx="12" cy="12" r="5" fill="var(--color-primary)" opacity="0.8" />
          <circle cx="12" cy="12" r="10" stroke="var(--color-primary)" stroke-width="1.5" stroke-dasharray="3 3" />
          <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>

      <!-- Percentage on the right -->
      <div class="ring-pct-right" aria-hidden="true">
        <span class="ring-pct">{averageMasteryPct}</span>
        <span class="ring-unit">%</span>
      </div>
    </div>
  </div>

  <!-- ── 2. Solid Cells ───────────────────────────────────────────── -->
  <div
    class="meter-chip solid-cells-chip"
    role="img"
    aria-label="Solid Cells: {solidCellsCount} of 10 modes crystallized"
  >
    <div class="chip-label">Solid Cells</div>

    <div class="crystal-dots" aria-hidden="true">
      {#each MATH_MODES as id (id)}
        <span
          class="crystal-dot"
          class:crystal-dot--active={(masteryMap[id] ?? 0) >= BLOOM_GATE}
          title={id}
        >
          <!-- Stylized diamond crystal shape -->
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 2L2 12L12 22L22 12L12 2Z" />
          </svg>
        </span>
      {/each}
    </div>

    <div class="solid-cells-value" aria-hidden="true">
      <span class="solid-n">{solidCellsCount}</span>
      <span class="solid-denom">/ 10</span>
    </div>
  </div>

  <!-- ── 3. Energy Streak ────────────────────────────────────────── -->
  <div
    class="meter-chip streak-chip"
    role="img"
    aria-label="Energy Streak: {streak} in a row"
  >
    <div class="chip-label">Energy Streak</div>

    <div class="streak-bubbles-row" aria-hidden="true">
      {#each { length: STREAK_CAP } as _, i}
        <span class="streak-bubble" class:streak-bubble--lit={i < streakLit}>
          <!-- Fluid synapse node -->
          <span class="synapse-node"></span>
        </span>
      {/each}
      {#if streakOverflow}
        <span class="streak-overflow">+</span>
      {/if}
    </div>

    <div class="streak-sublabel" aria-hidden="true">
      {streak} Node Streak
    </div>
  </div>
</div>

<style>
  /* ── Layout ─────────────────────────────────────────────────────────── */
  .glow-meters {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
    align-items: center;
  }

  /* ── Shared chip ────────────────────────────────────────────────────── */
  .meter-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    min-width: 140px;
    flex: 1 1 140px;
    max-width: 200px;
  }

  .chip-label {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
  }

  /* ── Network Sync ring ───────────────────────────────────────────────── */
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
    stroke: var(--glow-fluid-cyan);
    filter: drop-shadow(0 0 4px var(--glow-fluid-cyan));
    stroke-dashoffset: 0;
  }

  .ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .node-icon {
    filter: drop-shadow(0 0 6px var(--color-primary));
  }

  .ring-pct-right {
    position: absolute;
    top: 50%;
    right: -45px;
    transform: translateY(-50%);
    display: flex;
    align-items: baseline;
    gap: 0.05em;
    pointer-events: none;
  }

  .ring-pct {
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 800;
    line-height: 1;
    color: var(--text-main);
    font-variant-numeric: tabular-nums lining-nums;
  }

  .ring-unit {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-left: 2px;
  }

  /* Animate ring fill on load */
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

  /* ── Solid Cells ───────────────────────────────────────────────────── */
  .crystal-dots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    max-width: 140px;
    margin-top: 4px;
    margin-bottom: 4px;
  }

  .crystal-dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: oklch(100% 0 0 / 0.12);
    transition: color 0.3s, filter 0.3s;
  }

  .crystal-dot--active {
    color: var(--glow-crystal);
    filter: drop-shadow(0 0 4px var(--glow-crystal));
  }

  .solid-cells-value {
    display: flex;
    align-items: baseline;
    gap: 0.15em;
  }

  .solid-n {
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: 800;
    line-height: 1;
    color: var(--glow-crystal);
    text-shadow: 0 0 8px oklch(0.88 0.12 180 / 0.3);
    font-variant-numeric: tabular-nums lining-nums;
  }

  .solid-denom {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  /* ── Energy Streak ────────────────────────────────────────────────── */
  .streak-bubbles-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .streak-bubble {
    display: block;
    position: relative;
  }

  .synapse-node {
    display: block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: oklch(100% 0 0 / 0.1);
    border: 1px solid var(--color-border);
    transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
  }

  .streak-bubble--lit .synapse-node {
    background: var(--color-coral);
    border-color: var(--color-coral);
    box-shadow: 0 0 8px var(--color-coral);
    animation: synapse-pulse 2s ease-in-out infinite alternate;
  }

  @keyframes synapse-pulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    100% { transform: scale(1.1); opacity: 1; }
  }

  .streak-bubble:nth-child(2) .synapse-node { animation-delay: -0.3s; }
  .streak-bubble:nth-child(3) .synapse-node { animation-delay: -0.6s; }
  .streak-bubble:nth-child(4) .synapse-node { animation-delay: -0.9s; }
  .streak-bubble:nth-child(5) .synapse-node { animation-delay: -1.2s; }
  .streak-bubble:nth-child(6) .synapse-node { animation-delay: -1.5s; }
  .streak-bubble:nth-child(7) .synapse-node { animation-delay: -1.8s; }

  .streak-overflow {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--color-coral);
    align-self: center;
  }

  .streak-sublabel {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    text-align: center;
  }

  /* ── Compact variant ────────────────────────────────────────────────── */
  .compact .meter-chip {
    padding: 0.4rem 0.6rem;
    min-width: 110px;
    max-width: 150px;
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

  .compact .solid-n {
    font-size: 1.8rem;
  }
</style>
