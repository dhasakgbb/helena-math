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

  // A short, encouraging one-liner — no pressure, just an invitation.
  const speech = $derived.by(() => {
    const name = childName;
    const mode = MODE_NAMES[pick];
    const mastery = (profileStore.profile?.module_overrides?.math as any)?.mastery?.[pick] ?? 0;
    if (mastery >= 0.85) {
      return `Lovely work, ${name} — ${mode} is in full bloom. Want to tend it again tonight?`;
    }
    if (mastery > 0) {
      return `Hi ${name}! ${mode} is growing nicely. A little water tonight?`;
    }
    return `Hi ${name}! The moon is out. ${mode} looks like a nice spot to plant tonight.`;
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

{#if profileStore.profile === null}
  <EmptyGardenState onStart={() => {}} />
{:else}
  <div class="hub grain vignette">
    <!-- ============ SKY BAND ============ -->
    <section class="sky-band">
      <GardenerBadge />

      <div class="lantern" aria-hidden="true">
        <span class="lantern-cord"></span>
        <div class="lantern-glow">
          <Mascot pose="waving" size={132} />
        </div>
      </div>

      <div class="sky-content">
        <div class="bubble" role="status">
          <p class="bubble-text">{speech}</p>
        </div>

        <button class="tonight-btn" onclick={() => handleSelect(pick)}>
          <svg
            class="tonight-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M21 14.2A8.4 8.4 0 0 1 9.8 3 8.4 8.4 0 1 0 21 14.2Z"
            />
          </svg>
          <span class="tonight-label">
            <span class="tonight-kicker">Tonight's Plant</span>
            <span class="tonight-mode">{MODE_NAMES[pick]}</span>
          </span>
        </button>

        <GlowMeters />
      </div>
    </section>

    <!-- ============ GARDEN BAND ============ -->
    <section class="garden-band">
      <GardenScene onSelect={handleSelect} />
    </section>
  </div>

  {#if showGridModal}
    <GridModal onClose={() => (showGridModal = false)} />
  {/if}
{/if}

<style>
  .hub {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    padding: 1.25rem;
    border-radius: var(--r-lg);
    background:
      radial-gradient(120% 90% at 80% -10%, oklch(40% 0.08 250 / 0.5), transparent 60%),
      linear-gradient(to bottom, var(--sky-top), var(--sky-mid) 60%, var(--sky-bot));
    color: var(--color-text);
    overflow: hidden;
  }

  /* ---- Sky band ---- */
  .sky-band {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 1.5rem 2rem;
    padding: 1rem 0.5rem 0.5rem;
  }

  /* Badge floats top-right of the whole hub */
  .sky-band :global(.gb-badge) {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 5;
  }

  .lantern {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform-origin: top center;
    padding-top: 1.25rem;
  }

  .lantern-cord {
    position: absolute;
    top: 0;
    width: 2px;
    height: 1.5rem;
    background: linear-gradient(to bottom, oklch(70% 0.04 250 / 0), oklch(82% 0.06 250 / 0.7));
    border-radius: 2px;
  }

  .lantern-glow {
    border-radius: 50%;
    padding: 0.5rem;
    --glow-c: var(--glow-firefly);
    filter:
      drop-shadow(0 0 18px color-mix(in oklch, var(--glow-firefly), transparent 35%))
      drop-shadow(0 0 44px color-mix(in oklch, var(--glow-firefly), transparent 65%));
  }

  .sky-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.1rem;
    min-width: 0;
  }

  /* ---- Speech bubble ---- */
  .bubble {
    position: relative;
    max-width: 46ch;
    padding: 0.85rem 1.15rem;
    border-radius: var(--r-md);
    background: oklch(30% 0.05 275 / 0.55);
    border: 1px solid oklch(85% 0.02 280 / 0.16);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .bubble::before {
    content: '';
    position: absolute;
    left: -9px;
    top: 1.4rem;
    width: 16px;
    height: 16px;
    background: inherit;
    border-left: 1px solid oklch(85% 0.02 280 / 0.16);
    border-bottom: 1px solid oklch(85% 0.02 280 / 0.16);
    transform: rotate(45deg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .bubble-text {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 500;
    line-height: 1.45;
    color: var(--color-text);
  }

  /* ---- Tonight's Plant button ---- */
  .tonight-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
    min-height: 56px;
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--color-primary);
    border-radius: var(--r-md);
    cursor: pointer;
    color: oklch(20% 0.04 280);
    background:
      radial-gradient(120% 140% at 30% 0%, oklch(90% 0.13 80), var(--color-primary) 70%);
    font-family: var(--font-display);
    --glow-c: var(--color-primary);
    box-shadow:
      0 0 0 0 transparent,
      var(--glow-md),
      0 8px 24px -6px oklch(20% 0.04 280 / 0.6);
    transition: transform 0.18s ease, box-shadow 0.22s ease, filter 0.18s ease;
  }

  .tonight-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--glow-lg), 0 12px 30px -6px oklch(20% 0.04 280 / 0.65);
    filter: brightness(1.04);
  }

  .tonight-btn:active {
    transform: translateY(0);
  }

  .tonight-btn:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px oklch(98% 0.02 250 / 0.95),
      0 0 0 6px var(--color-primary),
      var(--glow-md);
  }

  .tonight-icon {
    flex: none;
    display: block;
    color: oklch(24% 0.05 70);
    filter: drop-shadow(0 1px 1px oklch(95% 0.1 80 / 0.5));
  }

  .tonight-label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.15;
  }

  .tonight-kicker {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.8;
  }

  .tonight-mode {
    font-size: 1.2rem;
    font-weight: 700;
  }

  /* ---- Garden band ---- */
  .garden-band {
    position: relative;
  }

  /* ---- Desktop: spread the row so the right third isn't dead space ---- */
  @media (min-width: 1100px) {
    .sky-content {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.25rem 2rem;
    }
    /* bubble + button form the left cluster, capped so meters get room */
    .bubble {
      flex: 1 1 22rem;
      max-width: 34ch;
    }
    .tonight-btn {
      flex: 0 0 auto;
    }
    /* push the three meters to the right edge and let them spread */
    .sky-content :global(.glow-meters) {
      flex: 1 1 360px;
      margin-left: auto;
      justify-content: flex-end;
    }
  }

  /* ---- Responsive: stack on narrow ---- */
  @media (max-width: 720px) {
    .sky-band {
      grid-template-columns: 1fr;
      justify-items: center;
      text-align: center;
    }
    .sky-content {
      align-items: center;
    }
    .bubble::before {
      display: none;
    }
  }

  /* ---- Motion: lantern sway + bubble fade-in ---- */
  @media (prefers-reduced-motion: no-preference) {
    .lantern {
      animation: lantern-sway 6s ease-in-out infinite;
    }
    @keyframes lantern-sway {
      0%, 100% { transform: rotate(-2deg); }
      50% { transform: rotate(2deg); }
    }

    .lantern-glow {
      animation: lantern-pulse 4s ease-in-out infinite;
    }
    @keyframes lantern-pulse {
      0%, 100% { filter: drop-shadow(0 0 16px color-mix(in oklch, var(--glow-firefly), transparent 40%)) drop-shadow(0 0 40px color-mix(in oklch, var(--glow-firefly), transparent 70%)); }
      50% { filter: drop-shadow(0 0 22px color-mix(in oklch, var(--glow-firefly), transparent 25%)) drop-shadow(0 0 54px color-mix(in oklch, var(--glow-firefly), transparent 55%)); }
    }

    .bubble {
      animation: bubble-fade 0.5s ease both;
    }
    @keyframes bubble-fade {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  }
</style>
