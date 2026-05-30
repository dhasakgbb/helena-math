<script lang="ts">
  import { onMount } from 'svelte';
  import Mascot from '../components/Mascot.svelte';
  import MasteryCell from '../components/MasteryCell.svelte';
  import { profileStore } from '../lib/profile.svelte';

  interface Props {
    mode: string;
    score: number;
    total: number;
    ringFrom: number; // 0..1 display fill before
    ringTo: number; // 0..1 display fill after
    bloomed: boolean; // gate crossed 0.85 this result
    isPersonalBest: boolean;
    onPlayAgain: () => void;
    onPickAnother: () => void;
    onSelectNext: (mode: string) => void;
  }

  let {
    mode,
    score,
    total,
    ringFrom,
    ringTo,
    bloomed,
    isPersonalBest,
    onPlayAgain,
    onPickAnother,
    onSelectNext,
  }: Props = $props();

  // Mode Names
  const MODE_NAMES: Record<string, string> = {
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

  const modeName = $derived(MODE_NAMES[mode] ?? 'this cell');
  const ratio = $derived(total > 0 ? score / total : 0);

  const tierHeadline = $derived(
    ratio >= 0.9
      ? 'Outstanding Synchronization!'
      : ratio >= 0.7
        ? 'Core stabilizing nicely!'
        : "Nurturing complete — let's reinforce it.",
  );

  const mascotPose = $derived(ratio >= 0.7 ? 'cheering' : 'waving');

  const ringPct = (f: number) => Math.round(f * 100);
  const ringCaption = $derived(
    ringTo > ringFrom
      ? `You stabilized this cell from ${ringPct(ringFrom)}% to ${ringPct(ringTo)}%`
      : `This cell is holding steady at ${ringPct(ringTo)}%`,
  );

  const smartPick = $derived(profileStore.smartPick);
  const smartPickName = $derived(MODE_NAMES[smartPick] ?? 'another cell');

  // Celebratory animations skippable state
  let skipped = $state(false);
  let reducedMotion = $state(false);
  
  // Transition fill value representation
  let displayValue = $state(0);

  onMount(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || skipped) {
      displayValue = ringTo;
    } else {
      displayValue = ringFrom;
      setTimeout(() => {
        // Smoothly count up to the new value
        const duration = 1200; // ms
        const steps = 30;
        const stepTime = duration / steps;
        let currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          const t = currentStep / steps;
          // Ease-out quad
          const ease = t * (2 - t);
          displayValue = ringFrom + ease * (ringTo - ringFrom);
          if (currentStep >= steps) {
            displayValue = ringTo;
            clearInterval(interval);
          }
        }, stepTime);
      }, 100);
    }
  });

  function skip() {
    skipped = true;
    displayValue = ringTo;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') skip();
  }

  // Ring geometry
  const R = 86;
  const C = 2 * Math.PI * R;
  const offset = $derived(C * (1 - displayValue));
</script>

<svelte:window onkeydown={onKey} />

<!-- Background mesh blobs -->
<div class="mesh-bg" aria-hidden="true">
  <div class="mesh-blob mesh-blob-1"></div>
  <div class="mesh-blob mesh-blob-2"></div>
</div>

<div
  class="end-screen glass-panel animate-entrance text-center"
  class:is-skipped={skipped}
  role="group"
  aria-label="Practice results"
>
  <button
    type="button"
    class="skip-surface no-print"
    aria-label="Skip the celebration"
    onclick={skip}
  ></button>

  <div class="mascot-wrapper">
    <Mascot pose={mascotPose} size={130} />
  </div>

  <h1 class="headline">{tierHeadline}</h1>

  <p class="score-display">
    You stabilized <span class="score-val">{score}</span> of {total} nodes.
  </p>

  {#if isPersonalBest}
    <p class="personal-best">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      New stabilization record achieved!
    </p>
  {/if}

  <!-- Stabilized Cell Display: ring + central MasteryCell -->
  <div class="stabilization-ring-area" role="img" aria-label="{modeName} cell, {ringPct(ringTo)} percent synchronized">
    <svg class="stabilization-svg" viewBox="0 0 200 200" aria-hidden="true">
      <circle class="ring-track" cx="100" cy="100" r={R} />
      <circle
        class="ring-fill"
        cx="100"
        cy="100"
        r={R}
        stroke-dasharray={C}
        stroke-dashoffset={offset}
      />
    </svg>

    <div class="central-cell">
      <MasteryCell mastery={displayValue} size={128} />
    </div>

    <!-- Celebration spark particles -->
    {#if bloomed && !skipped}
      <div class="burst-sparks" aria-hidden="true">
        {#each Array(12) as _, i (i)}
          <span class="spark" style="--a:{(360 / 12) * i}deg;"></span>
        {/each}
      </div>
    {/if}
  </div>

  <p class="ring-caption">{ringCaption}</p>

  {#if bloomed}
    <p class="bloom-line">This node reached full crystallization phase!</p>
  {/if}

  <div class="actions mt-8">
    <button onclick={onPlayAgain} class="btn-primary">Reinforce Cell</button>
    <button onclick={onPickAnother} class="btn-ghost">Back to Topology</button>
  </div>

  <button type="button" class="next-link" onclick={() => onSelectNext(smartPick)}>
    Next Cell: stabilize {smartPickName} →
  </button>
</div>

<style>
  .end-screen {
    position: relative;
    width: 100%;
    max-width: 600px;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    border-radius: var(--r-xl);
    background: var(--glass-bg);
    margin: 0 auto;
  }

  .skip-surface {
    position: absolute;
    inset: 0;
    z-index: 0;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: default;
  }
  
  .is-skipped .skip-surface {
    pointer-events: none;
  }

  .mascot-wrapper,
  .headline,
  .score-display,
  .personal-best,
  .stabilization-ring-area,
  .ring-caption,
  .bloom-line,
  .actions,
  .next-link {
    position: relative;
    z-index: 1;
  }

  .mascot-wrapper {
    height: 130px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .headline {
    font-family: var(--font-display);
    font-size: clamp(1.4rem, 5vw, 2rem);
    color: var(--color-primary);
    margin: 0;
    letter-spacing: -0.02em;
    text-shadow: 0 0 10px oklch(0.70 0.12 190 / 0.15);
  }

  .score-display {
    font-size: 1.15rem;
    font-weight: 500;
    margin: 0;
    color: var(--color-text-muted);
  }

  .score-val {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--glow-fluid-cyan);
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 8px var(--glow-fluid-cyan);
  }

  .personal-best {
    margin: 0;
    font-weight: 700;
    color: var(--color-coral);
    text-shadow: 0 0 10px oklch(0.70 0.19 32 / 0.3);
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.95rem;
  }

  /* ── Stabilization ring and MasteryCell center ────────────────── */
  .stabilization-ring-area {
    position: relative;
    width: 220px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0.5rem 0;
  }

  .stabilization-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    overflow: visible;
  }

  .ring-track {
    fill: none;
    stroke: var(--color-border);
    stroke-width: 8;
  }

  .ring-fill {
    fill: none;
    stroke: var(--color-primary);
    stroke-width: 8;
    stroke-linecap: round;
    filter: drop-shadow(0 0 6px var(--color-primary));
    transition: stroke-dashoffset 0.1s linear;
  }

  .central-cell {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ring-caption {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.95rem;
  }

  .bloom-line {
    margin: 0;
    font-weight: 700;
    color: var(--glow-crystal);
    text-shadow: 0 0 6px var(--glow-crystal);
  }

  /* ── Sparks explosion ─────────────────────────────────────────── */
  .burst-sparks {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    z-index: 2;
  }

  .spark {
    position: absolute;
    width: 4px;
    height: 36px;
    border-radius: 99px;
    background: linear-gradient(var(--glow-crystal), transparent);
    transform: rotate(var(--a)) translateY(-50px) scaleY(0);
    transform-origin: center bottom;
    opacity: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    .spark {
      animation: spark-burst 1s ease-out forwards;
      animation-delay: 1.1s;
    }

    @keyframes spark-burst {
      0% {
        opacity: 0;
        transform: rotate(var(--a)) translateY(-50px) scaleY(0);
      }
      50% {
        opacity: 0.95;
        transform: rotate(var(--a)) translateY(-95px) scaleY(1);
      }
      100% {
        opacity: 0;
        transform: rotate(var(--a)) translateY(-120px) scaleY(0.4);
      }
    }
  }

  .actions {
    display: flex;
    gap: 1rem;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .actions :global(.btn-primary),
  .actions :global(.btn-ghost) {
    min-height: var(--touch);
    min-width: 160px;
  }

  .next-link {
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 4px;
    cursor: pointer;
    padding: 0.5rem 1rem;
    min-height: var(--touch);
    transition: color 0.2s ease;
  }
  
  .next-link:hover {
    color: var(--color-coral);
  }
</style>
