<script lang="ts">
  import { profileStore, type MathMode } from '../lib/profile.svelte';

  interface Props {
    onSelectMode: (mode: MathMode) => void;
    onPlantClick?: (mode: MathMode) => void;
  }

  let { onSelectMode, onPlantClick }: Props = $props();

  const MODES_PLANTS = [
    { id: 'times-tables', name: 'Times Tables', color: '#ff007f', rx: 25, ry: 35 },
    { id: 'speed-add', name: 'Speed Add', color: '#00ffe0', rx: 62, ry: 35 },
    { id: 'number-sort', name: 'Number Sort', color: '#00e676', rx: 99, ry: 35 },
    { id: 'fractions-visual', name: 'Fraction Garden', color: '#ff8e00', rx: 136, ry: 35 },
    { id: 'place-value', name: 'Place Value Orchard', color: '#ff00e0', rx: 173, ry: 35 },
    { id: 'multiplication-grid', name: 'Multiplication Grid', color: '#ffd000', rx: 25, ry: 75 },
    { id: 'long-division', name: 'Division Stones', color: '#00bfff', rx: 62, ry: 75 },
    { id: 'decimals-grid', name: 'Decimal Shading', color: '#7cfc00', rx: 99, ry: 75 },
    { id: 'geometry-angles', name: 'Garden Star Maps', color: '#ff4500', rx: 136, ry: 75 },
    { id: 'pemdas-tree', name: 'PEMDAS Trees', color: '#9d4edd', rx: 173, ry: 75 }
  ] as const;

  // Determine plant stage based on mastery value (0 to 1)
  function getGrowthStage(mastery: number | undefined): 0 | 1 | 2 | 3 | 4 {
    if (mastery === undefined || mastery <= 0) return 0;
    if (mastery <= 0.3) return 1; // Seedling
    if (mastery <= 0.6) return 2; // Sprout
    if (mastery <= 0.85) return 3; // Bud
    return 4; // Fully Bloomed
  }

  function getStageLabel(stage: number): string {
    if (stage === 0) return 'Planted Seed';
    if (stage === 1) return 'Seedling';
    if (stage === 2) return 'Sprout';
    if (stage === 3) return 'Bud';
    return 'Fully Bloomed!';
  }

  function handlePlantClick(modeId: string) {
    if (onPlantClick) {
      onPlantClick(modeId as MathMode);
    } else {
      onSelectMode(modeId as MathMode);
    }
  }
</script>

<div class="garden-panel glass-panel">
  <h2>Helena's Number Garden</h2>
  <p class="text-muted">Master math modules to grow and bloom your glowing plants! Click any plant to play.</p>

  <div class="svg-container">
    <svg viewBox="0 0 200 100" class="garden-svg">
      <!-- Background grass/dirt patch -->
      <rect x="5" y="5" width="190" height="90" rx="10" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      
      <!-- Fence in background -->
      <g stroke="rgba(255,255,255,0.05)" stroke-width="1">
        {#each Array(10) as _, idx}
          <line x1={20 + idx * 18} y1="10" x2={20 + idx * 18} y2="22" />
          <path d="M {15 + idx * 18} 14 L {25 + idx * 18} 14" />
        {/each}
      </g>

      <!-- Draw plant spots -->
      {#each MODES_PLANTS as plant}
        {@const mastery = (profileStore.profile?.module_overrides?.math as any)?.mastery?.[plant.id] ?? 0}
        {@const stage = getGrowthStage(mastery)}
        
        <!-- Interactive Group -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g class="plant-spot" onclick={() => handlePlantClick(plant.id)}>
          <!-- Tooltip description on hover -->
          <title>{plant.name}: {getStageLabel(stage)} ({(mastery * 100).toFixed(0)}%)</title>

          <!-- Soil Mound -->
          <ellipse cx={plant.rx} cy={plant.ry} rx="12" ry="3.5" fill="oklch(28% 0.04 50)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5" />
          
          <!-- Seed (Stage 0) -->
          {#if stage === 0}
            <circle cx={plant.rx} cy={plant.ry - 1} r="1" fill="#8b5a2b" />
          {/if}

          <!-- Seedling (Stage 1) -->
          {#if stage >= 1}
            <!-- Curved Stem -->
            <path d="M {plant.rx} {plant.ry} Q {plant.rx - 2} {plant.ry - 5} {plant.rx - 3} {plant.ry - 7}" stroke="#00e676" stroke-width="1.2" fill="none" />
            <!-- Tiny Leaf -->
            <path d="M {plant.rx - 3} {plant.ry - 7} C {plant.rx - 5} {plant.ry - 8} {plant.rx - 4} {plant.ry - 10} {plant.rx - 3} {plant.ry - 7} Z" fill="#00e676" />
          {/if}

          <!-- Sprout (Stage 2) -->
          {#if stage >= 2}
            <!-- Main Stem -->
            <path d="M {plant.rx} {plant.ry} Q {plant.rx - 1} {plant.ry - 8} {plant.rx - 2} {plant.ry - 12}" stroke="#00e676" stroke-width="1.5" fill="none" />
            <!-- Left Leaf -->
            <path d="M {plant.rx - 1} {plant.ry - 6} Q {plant.rx - 6} {plant.ry - 7} {plant.rx - 2} {plant.ry - 4}" fill="#00e676" />
            <!-- Right Leaf -->
            <path d="M {plant.rx - 1} {plant.ry - 9} Q {plant.rx + 4} {plant.ry - 10} {plant.rx - 1} {plant.ry - 7}" fill="#00e676" />
          {/if}

          <!-- Bud (Stage 3) -->
          {#if stage >= 3}
            <!-- Bud Stem extension -->
            <path d="M {plant.rx - 2} {plant.ry - 12} Q {plant.rx - 2} {plant.ry - 15} {plant.rx - 2} {plant.ry - 17}" stroke="#00e676" stroke-width="1.5" fill="none" />
            <!-- Closed Bud -->
            <path d="M {plant.rx - 2} {plant.ry - 17} C {plant.rx - 4} {plant.ry - 20} {plant.rx} {plant.ry - 20} {plant.rx - 2} {plant.ry - 17} Z" fill={plant.color} stroke="rgba(255,255,255,0.1)" stroke-width="0.5" />
          {/if}

          <!-- Fully Bloomed (Stage 4) -->
          {#if stage === 4}
            <!-- Tall Stem -->
            <path d="M {plant.rx - 2} {plant.ry - 17} L {plant.rx - 2} {plant.ry - 21}" stroke="#00e676" stroke-width="1.5" fill="none" />
            
            <g class="flower-head">
              <!-- Petals surrounding center -->
              <circle cx={plant.rx - 2} cy={plant.ry - 25} r="2.8" fill={plant.color} />
              <circle cx={plant.rx - 2} cy={plant.ry - 17} r="2.8" fill={plant.color} />
              <circle cx={plant.rx - 6} cy={plant.ry - 21} r="2.8" fill={plant.color} />
              <circle cx={plant.rx + 2} cy={plant.ry - 21} r="2.8" fill={plant.color} />
              
              <!-- Center Core -->
              <circle cx={plant.rx - 2} cy={plant.ry - 21} r="1.8" fill="#ffd000" />
            </g>

            <!-- Floating Sparkle Particles -->
            <g class="sparkles">
              <circle cx={plant.rx - 4} cy={plant.ry - 26} r="0.4" fill="#ffffff" class="sparkle-dot-1" />
              <circle cx={plant.rx + 2} cy={plant.ry - 28} r="0.4" fill="#ffffff" class="sparkle-dot-2" />
            </g>
          {/if}
        </g>
      {/each}
    </svg>
  </div>
</div>

<style>
  .garden-panel {
    width: 100%;
    margin-bottom: 1.5rem;
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .garden-panel h2 {
    font-size: 1.4rem;
    margin-bottom: 0.3rem;
    color: var(--color-primary);
  }
  .garden-panel p {
    font-size: 0.85rem;
    max-width: 480px;
    margin: 0 auto 1rem auto;
  }

  .svg-container {
    width: 100%;
    max-width: 580px;
  }

  .garden-svg {
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .plant-spot {
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .plant-spot:hover {
    transform: scale(1.1) translateY(-2px);
  }

  /* Flower Sway animation */
  .flower-head {
    transform-origin: 50% 100%;
    animation: sway 3s ease-in-out infinite alternate;
  }
  @keyframes sway {
    0% { transform: rotate(-3deg); }
    100% { transform: rotate(3deg); }
  }

  /* Sparkle floating particles */
  .sparkles circle {
    animation: floatUp 2s infinite linear;
    opacity: 0;
  }
  .sparkle-dot-1 {
    animation-delay: 0.5s !important;
  }
  .sparkle-dot-2 {
    animation-delay: 1.2s !important;
  }
  @keyframes floatUp {
    0% { transform: translateY(0); opacity: 0; }
    50% { opacity: 0.8; }
    100% { transform: translateY(-8px); opacity: 0; }
  }
</style>
