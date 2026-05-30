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

  // Honest, plain-spoken names for the 10 modes (used in Astrid's copy).
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

  // Smart Pick drives both the speech bubble and the primary button.
  const pick = $derived(profileStore.smartPick);
  const childName = $derived(profileStore.profile?.child_label || 'gardener');

  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
  const timeOfDayStr = isDay ? "today" : "tonight";

  // A short, encouraging one-liner — no pressure, just an invitation.
  const speech = $derived.by(() => {
    const name = childName;
    const mode = MODE_NAMES[pick];
    const mastery = (profileStore.profile?.module_overrides?.math as any)?.mastery?.[pick] ?? 0;
    if (mastery >= 0.85) {
      return `Lovely work, ${name} — ${mode} is in full bloom. Want to tend it again ${timeOfDayStr}?`;
    }
    if (mastery > 0) {
      return `Hi ${name}! ${mode} is growing nicely. A little water ${timeOfDayStr}?`;
    }
    return `Hi ${name}! ${isDay ? "The sun is shining." : "The moon is out."} ${mode} looks like a nice spot to plant ${timeOfDayStr}.`;
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

{#if false}
  <EmptyGardenState onStart={() => {}} />
{:else}
  <div class="hub vignette">
    <section class="sky-band">
      <GardenerBadge />

      <div class="dashboard-container">
        <!-- The big glassy pill -->
        <div class="dashboard-capsule">
          <div class="robot-slot">
            <Mascot pose="waving" size={170} />
          </div>
          <div class="meters-slot">
            <GlowMeters />
          </div>
        </div>

        <!-- The speech bubble -->
        <div class="robot-bubble">
          <p class="bubble-text">{speech}</p>
        </div>
        
        <!-- The today's plant button -->
        <div class="today-plant-wrap">
          <button class="today-plant-btn" onclick={() => handleSelect(pick)}>
            <div class="tp-content">
              <span class="tp-kicker">
                <svg class="moon-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 14.2A8.4 8.4 0 0 1 9.8 3 8.4 8.4 0 1 0 21 14.2Z"/>
                </svg>
                {isDay ? "TODAY'S PLANT:" : "TONIGHT'S PLANT:"}
              </span>
              <span class="tp-mode">{MODE_NAMES[pick]}</span>
            </div>
          </button>
        </div>
      </div>
    </section>

    <section class="garden-band">
      <GardenScene onSelect={handleSelect} />
    </section>
  </div>

  {#if showGridModal}
    <GridModal onClose={() => (showGridModal = false)} />
  {/if}
{/if}

<style>
  /* Base hub */
  .hub {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    border-radius: var(--r-lg);
    background:
      radial-gradient(120% 90% at 80% -10%, var(--sky-radial, oklch(40% 0.08 250 / 0.5)), transparent 60%),
      linear-gradient(to bottom, var(--sky-top), var(--sky-mid) 60%, var(--sky-bot));
    color: var(--color-text);
    overflow: hidden;
  }

  .sky-band {
    position: absolute;
    top: 0; left: 0; right: 0;
    z-index: 20;
    pointer-events: none;
    padding: 2rem;
  }
  
  .sky-band > *, .dashboard-container * {
    pointer-events: auto;
  }
  
  .sky-band :global(.gb-badge) {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 25;
  }

  .garden-band {
    flex: 1;
    display: flex;
    position: relative;
    width: 100%;
    margin-top: -2rem; /* Pull garden up to be under skyband nicely */
  }

  .dashboard-container {
    position: relative;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dashboard-capsule {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 2rem;
    padding: 1.5rem 2rem 1.5rem 6rem;
    background: linear-gradient(135deg, rgba(200, 240, 255, 0.25) 0%, rgba(150, 200, 255, 0.1) 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 999px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0, 50, 100, 0.2), inset 0 2px 10px rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 10;
  }

  .robot-slot {
    position: absolute;
    left: -40px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
  }

  .robot-bubble {
    position: absolute;
    left: -50px;
    top: calc(100% - 20px);
    width: 240px;
    background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(255, 255, 255, 0.4);
    border-radius: 20px;
    padding: 1rem;
    box-shadow: 0 12px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5);
    z-index: 31;
  }

  .bubble-text {
    margin: 0;
    color: #fff;
    font-weight: 500;
    font-family: var(--font-display);
    font-size: 1rem;
    line-height: 1.4;
    text-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }

  .today-plant-wrap {
    margin-top: -15px; /* Overlap the capsule */
    z-index: 35;
  }

  .today-plant-btn {
    background: linear-gradient(to bottom, #FFE8A1, #FFB922);
    border: 2px solid rgba(255,255,255,0.9);
    border-radius: 999px;
    padding: 0.5rem 2.5rem;
    box-shadow: 0 10px 24px rgba(255, 185, 34, 0.5), inset 0 2px 5px rgba(255,255,255,0.9);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
  }
  
  .today-plant-btn:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 14px 30px rgba(255, 185, 34, 0.6), inset 0 2px 5px rgba(255,255,255,0.9);
    filter: brightness(1.05);
  }
  
  .tp-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #4A3300;
  }
  
  .tp-kicker {
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.85;
    text-transform: uppercase;
  }
  
  .tp-mode {
    font-size: 1.5rem;
    font-weight: 800;
    font-family: var(--font-display);
  }
  
  @media (max-width: 900px) {
    .dashboard-capsule {
      flex-direction: column;
      padding: 1rem;
      border-radius: 30px;
    }
    .robot-slot {
      position: relative;
      left: 0; bottom: 0;
      margin-bottom: 1rem;
    }
    .robot-bubble {
      position: relative;
      left: 0; top: 0;
      margin-top: 1rem;
    }
  }
</style>
