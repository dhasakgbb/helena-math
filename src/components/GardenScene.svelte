<script lang="ts">
  import { profileStore, MATH_MODES, type MathMode } from '../lib/profile.svelte';
  import MasteryCell from './MasteryCell.svelte';

  interface Props {
    onSelect: (mode: MathMode) => void;
  }
  let { onSelect }: Props = $props();

  // Mode Display Names
  const MODE_NAMES: Record<MathMode, string> = {
    'times-tables': 'Times Tables',
    'speed-add': 'Speed Add',
    'number-sort': 'Number Sort',
    'fractions-visual': 'Fraction Garden',
    'place-value': 'Place Value',
    'multiplication-grid': 'Multiplication Grid',
    'long-division': 'Long Division',
    'decimals-grid': 'Decimal Shading',
    'geometry-angles': 'Coordinate Plot',
    'pemdas-tree': 'Order of Operations',
  };

  // Derived properties
  const smartPick = $derived(profileStore.smartPick);

  // Return mastery for each mode
  function getMastery(mode: MathMode): number {
    if (mode === 'times-tables') {
      return profileStore.timesTablesRingFill;
    }
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    return mathOverrides.mastery?.[mode] ?? 0;
  }

  function handleSelect(mode: MathMode) {
    onSelect(mode);
  }
</script>

<div class="topology-container animate-entrance">
  <!-- Bento grid of mathematical cells -->
  <div class="topology-grid">
    {#each MATH_MODES as mode (mode)}
      {@const isSmart = mode === smartPick}
      {@const mastery = getMastery(mode)}
      {@const isCrystallized = mastery >= 0.85}

      <button
        class="mode-cell-card glass-panel"
        class:smart-featured={isSmart}
        onclick={() => handleSelect(mode)}
        aria-label={`${MODE_NAMES[mode]}, ${Math.round(mastery * 100)}% synchronized`}
      >
        <!-- Background organic pulsing aura on the Smart featured card -->
        {#if isSmart}
          <div class="coral-glow-gradient"></div>
        {/if}

        <div class="cell-layout">
          <div class="cell-header">
            {#if isSmart}
              <span class="recommendation-badge">RECOMMENDED FOR YOU</span>
            {/if}
            <h3 class="cell-title">{MODE_NAMES[mode]}</h3>
          </div>

          <div class="cell-visualization">
            <MasteryCell {mastery} size={isSmart ? 120 : 70} />
          </div>

          <div class="cell-status">
            {#if isCrystallized}
              <span class="status-badge crystallized-badge">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                </svg>
                Solid Crystal
              </span>
            {:else}
              <span class="status-badge fluid-badge">
                <span class="fluid-dot"></span>
                Fluid Node
              </span>
            {/if}
            <span class="mastery-pct">{Math.round(mastery * 100)}% Sync</span>
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .topology-container {
    width: 100%;
    padding: 1.5rem;
    position: relative;
    z-index: 10;
  }

  .topology-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 1.25rem;
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
  }

  /* Core featured card structure (bento grid item) */
  .mode-cell-card {
    position: relative;
    border-radius: var(--r-lg);
    cursor: pointer;
    overflow: hidden;
    display: flex;
    text-align: left;
    height: 100%;
    min-height: 180px;
    padding: 1.25rem;
    align-items: stretch;
  }

  /* Featured recommended smartPick card rules */
  .smart-featured {
    grid-column: span 2;
    grid-row: span 2;
    background: linear-gradient(135deg, oklch(0.20 0.04 210 / 0.6) 0%, oklch(0.70 0.19 32 / 0.15) 100%);
    border-color: var(--color-coral);
    box-shadow: 0 10px 40px oklch(0.70 0.19 32 / 0.22);
    min-height: 280px;
  }

  .smart-featured:hover {
    box-shadow: 0 16px 48px oklch(0.70 0.19 32 / 0.3);
    border-color: oklch(0.70 0.19 32 / 0.6);
  }

  /* Pulsing Coral glow aura behind smartFeatured */
  .coral-glow-gradient {
    position: absolute;
    top: -20%;
    left: -20%;
    width: 140%;
    height: 140%;
    background: radial-gradient(circle, oklch(0.70 0.19 32 / 0.18) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
    animation: coral-pulse 6s ease-in-out infinite alternate;
  }

  @keyframes coral-pulse {
    0% { transform: scale(0.9); opacity: 0.7; }
    100% { transform: scale(1.1); opacity: 1; }
  }

  .cell-layout {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .cell-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .recommendation-badge {
    font-family: var(--font-display);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--color-coral);
    text-transform: uppercase;
  }

  .cell-title {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
    line-height: 1.3;
  }

  .smart-featured .cell-title {
    font-size: 1.7rem;
    letter-spacing: -0.01em;
  }

  .cell-visualization {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 1rem 0;
    flex-grow: 1;
  }

  .smart-featured .cell-visualization {
    margin: 1.5rem 0;
  }

  .cell-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: auto;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: var(--r-sm);
  }

  .crystallized-badge {
    background: oklch(0.88 0.12 180 / 0.12);
    color: var(--glow-crystal);
    border: 1px solid oklch(0.88 0.12 180 / 0.25);
  }

  .fluid-badge {
    background: oklch(0.70 0.12 190 / 0.08);
    color: var(--text-muted);
    border: 1px solid var(--color-border);
  }

  .fluid-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--glow-fluid-cyan);
    box-shadow: 0 0 6px var(--glow-fluid-cyan);
  }

  .mastery-pct {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-main);
  }

  /* Responsive Rules */
  @media (max-width: 680px) {
    .topology-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .smart-featured {
      grid-column: span 2;
    }

    .smart-featured .cell-title {
      font-size: 1.4rem;
    }
  }

  @media (max-width: 480px) {
    .topology-grid {
      grid-template-columns: 1fr;
    }

    .smart-featured {
      grid-column: span 1;
    }
  }
</style>
