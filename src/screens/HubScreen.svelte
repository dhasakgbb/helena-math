<script lang="ts">
  import { profileStore, type MathMode } from '../lib/profile.svelte';
  import Mascot from '../components/Mascot.svelte';
  import GardenScene from '../components/GardenScene.svelte';
  import GlowMeters from '../components/GlowMeters.svelte';
  import GardenerBadge from '../components/GardenerBadge.svelte';
  import GridModal from '../components/GridModal.svelte';
  import EmptyGardenState from '../components/EmptyGardenState.svelte';

  interface Props {
    onSelectMode: (mode: string) => void;
  }

  let { onSelectMode }: Props = $props();

  // Honest, plain-spoken names for the 10 modes.
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

  const pick = $derived(profileStore.smartPick);
  const childName = $derived(profileStore.profile?.child_label || 'gardener');

  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
  const timeOfDayStr = isDay ? "today" : "tonight";

  const speech = $derived.by(() => {
    const name = childName;
    const mode = MODE_NAMES[pick];
    const mastery = (profileStore.profile?.module_overrides?.math as any)?.mastery?.[pick] ?? 0;
    if (mastery >= 0.85) {
      return `Lovely work, ${name} — ${mode} is fully crystallized. Ready to align it again ${timeOfDayStr}?`;
    }
    if (mastery > 0) {
      return `Hi ${name}! The energy in ${mode} is coalescing nicely. A little reinforcement ${timeOfDayStr}?`;
    }
    return `Hi ${name}! ${isDay ? "The sun is shining." : "The moon is out."} ${mode} is ready to be initialized ${timeOfDayStr}.`;
  });

  let showGridModal = $state(false);

  function handleSelect(mode: string) {
    // Times Tables, once mastered (gate ≥ 0.85), opens the fact grid instead of relaunching.
    if (mode === 'times-tables') {
      const mastery =
        (profileStore.profile?.module_overrides?.math as any)?.mastery?.['times-tables'] ?? 0;
      if (mastery >= 0.85) {
        showGridModal = true;
        return;
      }
    }
    onSelectMode(mode);
  }
</script>

<!-- Drifting mesh blobs in background -->
<div class="mesh-bg" aria-hidden="true">
  <div class="mesh-blob mesh-blob-1"></div>
  <div class="mesh-blob mesh-blob-2"></div>
</div>

{#if !profileStore.profile}
  <EmptyGardenState onStart={() => {}} />
{:else}
  <div class="hub-container animate-entrance">
    <!-- Header band with profile badge and HUD capsule -->
    <header class="hub-header">
      <div class="header-top">
        <h1 class="hub-logo">helena</h1>
        <GardenerBadge />
      </div>

      <!-- Glassmorphic HUD capsule with Astrid and GlowMeters -->
      <div class="hud-capsule glass-panel">
        <div class="astrid-hud">
          <div class="astrid-avatar">
            <Mascot pose="waving" size={96} />
          </div>
          <div class="astrid-speech-bubble">
            <p class="bubble-text">{speech}</p>
          </div>
        </div>
        <div class="meters-hud">
          <GlowMeters />
        </div>
      </div>
    </header>

    <!-- Main Topology Grid -->
    <main class="grid-section">
      <h2 class="section-title">Mathematical Topology Grid</h2>
      <GardenScene onSelect={handleSelect} />
    </main>
  </div>

  {#if showGridModal}
    <GridModal onClose={() => (showGridModal = false)} />
  {/if}
{/if}

<style>
  .hub-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1.5rem 1rem;
    position: relative;
    z-index: 5;
  }

  .hub-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 0.5rem;
  }

  .hub-logo {
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 900;
    color: var(--color-primary);
    margin: 0;
    letter-spacing: -0.03em;
    text-shadow: 0 0 10px oklch(0.70 0.12 190 / 0.2);
  }

  /* Glassmorphic Capsule Layout */
  .hud-capsule {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2.5rem;
    padding: 1.5rem 2rem;
    width: 100%;
    border-radius: var(--r-xl);
    background: var(--glass-bg);
  }

  .hud-capsule:hover {
    transform: none; /* disable card hover pop here */
  }

  .astrid-hud {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex: 1;
  }

  .astrid-avatar {
    flex-shrink: 0;
    position: relative;
  }

  .astrid-speech-bubble {
    position: relative;
    background: oklch(0.14 0.02 210 / 0.5);
    border: 1px solid var(--color-border);
    border-radius: var(--r-md);
    padding: 1rem 1.25rem;
    max-width: 440px;
    box-shadow: inset 0 1px 1px oklch(1 0 0 / 0.05);
  }

  /* Arrow pointing towards mascot */
  .astrid-speech-bubble::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 14px;
    height: 14px;
    background: oklch(0.14 0.02 210 / 0.5);
    border-left: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }

  .bubble-text {
    margin: 0;
    font-size: 1rem;
    font-family: var(--font-display);
    font-weight: 500;
    line-height: 1.5;
    color: var(--color-text);
  }

  .meters-hud {
    flex-shrink: 0;
  }

  .grid-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--text-muted);
    margin: 0 0.5rem;
  }

  /* Responsive styling */
  @media (max-width: 960px) {
    .hud-capsule {
      flex-direction: column;
      align-items: stretch;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .astrid-hud {
      width: 100%;
    }

    .astrid-speech-bubble {
      max-width: none;
      width: 100%;
    }

    .meters-hud {
      width: 100%;
      border-top: 1px solid var(--color-border);
      padding-top: 1rem;
    }
  }

  @media (max-width: 580px) {
    .astrid-hud {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
    }

    .astrid-speech-bubble::before {
      display: none; /* Hide side arrow on mobile stacked views */
    }
  }
</style>
