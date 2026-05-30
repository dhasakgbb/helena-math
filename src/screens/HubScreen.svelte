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
            <span class="tonight-kicker">{isDay ? "Today's" : "Tonight's"} Plant</span>
            <span class="tonight-mode">{MODE_NAMES[pick]}</span>
            <!-- DR-05: lightweight recommended indicator using astrid tokens for platform cohesion.
                 Subtle firefly glow + pill radius; full garden personality preserved. -->
            <span class="recommended-pill" aria-label="Recommended by Astrid for your profile">RECOMMENDED</span>
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
      radial-gradient(120% 90% at 80% -10%, var(--sky-radial, oklch(40% 0.08 250 / 0.5)), transparent 60%),
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
    position: relative;
    border-radius: 50%;
    padding: 0.5rem;
    --glow-c: var(--glow-firefly);
    /* Two-layer drop-shadow: tight bright core + wide soft halo */
    filter:
      drop-shadow(0 0 6px color-mix(in oklch, var(--glow-firefly), transparent 15%))
      drop-shadow(0 0 22px color-mix(in oklch, var(--glow-firefly), transparent 42%))
      drop-shadow(0 0 54px color-mix(in oklch, var(--glow-firefly), transparent 68%))
      drop-shadow(0 4px 8px color-mix(in oklch, oklch(10% 0.04 280), transparent 50%));
  }

  /* Radial halo behind Astrid — warm amber bloom */
  .lantern-glow::before {
    content: '';
    position: absolute;
    inset: -28px;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at 50% 52%,
      color-mix(in oklch, var(--glow-firefly), transparent 30%) 0%,
      color-mix(in oklch, var(--glow-firefly), transparent 62%) 35%,
      transparent 70%
    );
    pointer-events: none;
    z-index: -1;
  }

  /* Soft grounded shadow — depth cue below Astrid */
  .lantern-glow::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 55%;
    height: 10px;
    border-radius: 50%;
    background: color-mix(in oklch, oklch(12% 0.05 260), transparent 55%);
    filter: blur(6px);
    pointer-events: none;
    z-index: -1;
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
    background: var(--color-panel);
    border: 1px solid var(--color-border);
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
    border-left: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
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
    /* DR-05: astrid radius + motion on the primary recommended action in hub */
    border-radius: var(--astrid-radius-lg);
    cursor: pointer;
    color: var(--btn-text, oklch(20% 0.04 280));
    background:
      radial-gradient(120% 140% at 30% 0%, var(--btn-highlight, oklch(90% 0.13 80)), var(--color-primary) 70%);
    font-family: var(--font-display);
    --glow-c: var(--color-primary);
    box-shadow:
      0 0 0 0 transparent,
      var(--glow-md),
      0 8px 24px -6px var(--btn-shadow, oklch(20% 0.04 280 / 0.6));
    transition: transform var(--astrid-motion-duration-fast) var(--astrid-motion-easing-ease-out),
                box-shadow var(--astrid-motion-duration-base) var(--astrid-motion-easing-ease-out),
                filter var(--astrid-motion-duration-fast) var(--astrid-motion-easing-ease-out);
  }

  .tonight-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--glow-lg), 0 12px 30px -6px var(--btn-shadow, oklch(20% 0.04 280 / 0.65));
    filter: brightness(1.04);
  }

  .tonight-btn:active {
    transform: translateY(0);
  }

  .tonight-btn:focus-visible {
    outline: none;
    /* DR-05: platform focus ring */
    box-shadow:
      0 0 0 3px var(--astrid-color-focus-ring-offset),
      0 0 0 6px var(--astrid-color-focus-ring),
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

  /* DR-05 recommended indicator — uses astrid tokens for scale/cohesion.
     Garden twilight colors (no cyan flood), pill + small glow from tokens. */
  .recommended-pill {
    align-self: flex-start;
    margin-top: 2px;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    padding: var(--astrid-spacing-1) var(--astrid-spacing-2);
    border-radius: var(--astrid-radius-pill);
    background: color-mix(in oklch, var(--glow-firefly), transparent 30%);
    color: var(--color-text);
    border: 1px solid color-mix(in oklch, var(--glow-firefly), transparent 10%);
    box-shadow: var(--astrid-shadow-glow-yellow-sm);
    text-transform: uppercase;
    pointer-events: none;
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
      0%, 100% {
        filter:
          drop-shadow(0 0 5px color-mix(in oklch, var(--glow-firefly), transparent 20%))
          drop-shadow(0 0 18px color-mix(in oklch, var(--glow-firefly), transparent 48%))
          drop-shadow(0 0 46px color-mix(in oklch, var(--glow-firefly), transparent 72%))
          drop-shadow(0 4px 8px color-mix(in oklch, oklch(10% 0.04 280), transparent 50%));
      }
      50% {
        filter:
          drop-shadow(0 0 9px color-mix(in oklch, var(--glow-firefly), transparent 8%))
          drop-shadow(0 0 28px color-mix(in oklch, var(--glow-firefly), transparent 32%))
          drop-shadow(0 0 64px color-mix(in oklch, var(--glow-firefly), transparent 58%))
          drop-shadow(0 4px 8px color-mix(in oklch, oklch(10% 0.04 280), transparent 50%));
      }
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
