<script lang="ts">
  import { onMount } from 'svelte';
  import Mascot from '../components/Mascot.svelte';
  import Plant from '../components/Plant.svelte';
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

  // Honest, plain-spoken names for the 10 modes (mirrors HubScreen MODE_NAMES).
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

  const modeName = $derived(MODE_NAMES[mode] ?? 'this bed');
  const ratio = $derived(total > 0 ? score / total : 0);

  // Ratio tiers — intrinsic only, no leaderboards, no peer comparison.
  const tierHeadline = $derived(
    ratio >= 0.9
      ? 'Your brightest night yet!'
      : ratio >= 0.7
        ? 'This bed is glowing brighter!'
        : "Good practice — let's tend it again.",
  );

  const mascotPose = $derived(ratio >= 0.7 ? 'cheering' : 'waving');

  // Plant stage derived from the AFTER fill (where the bed stands now).
  function stageFor(fill: number): 0 | 1 | 2 | 3 | 4 {
    if (fill >= 0.85) return 4;
    if (fill >= 0.6) return 3;
    if (fill >= 0.3) return 2;
    if (fill > 0) return 1;
    return 0;
  }
  const bedStage = $derived(stageFor(ringTo));

  const ringPct = (f: number) => Math.round(f * 100);
  const ringCaption = $derived(
    ringTo > ringFrom
      ? `You moved this skill from ${ringPct(ringFrom)}% to ${ringPct(ringTo)}%`
      : `This bed is holding steady at ${ringPct(ringTo)}%`,
  );

  const smartPick = $derived(profileStore.smartPick);
  const smartPickName = $derived(MODE_NAMES[smartPick] ?? 'a new bed');

  // ----- Skippable celebration + reduced-motion ---------------------------
  // skipped jumps ring + droplets + bloom to their FINAL state instantly.
  let skipped = $state(false);

  // The ring target. We render at ringFrom initially, then drive to ringTo via
  // a keyframe (motion only). When skipped/reduced-motion, the final value
  // (ringTo) is what shows — guaranteed by binding the stroke offset to `to`.
  let mounted = $state(false);
  let reducedMotion = $state(false);
  const ringValue = $derived(skipped || !mounted || reducedMotion ? ringTo : undefined);

  onMount(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Defer one frame so the from→to keyframe has a start state to animate from.
    requestAnimationFrame(() => {
      mounted = true;
    });
  });

  function skip() {
    skipped = true;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') skip();
  }

  // Ring geometry (large glow-ring).
  const R = 86;
  const C = 2 * Math.PI * R;
  // Final dash offset (what reduced-motion / skipped must show).
  const offsetTo = $derived(C * (1 - ringTo));
  const offsetFrom = $derived(C * (1 - ringFrom));

  // Earned droplets — a brief shower flying into the bed.
  const DROPLETS = [
    { x: -120, delay: 0 },
    { x: -64, delay: 0.12 },
    { x: -10, delay: 0.24 },
    { x: 48, delay: 0.36 },
    { x: 104, delay: 0.48 },
    { x: -36, delay: 0.6 },
    { x: 72, delay: 0.72 },
  ];
</script>

<svelte:window onkeydown={onKey} />

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
    <Mascot pose={mascotPose} size={140} />
  </div>

  <h1>{tierHeadline}</h1>

  <p class="score-display">
    You tended <span class="score-val">{score}</span> of {total} tonight.
  </p>

  {#if isPersonalBest}
    <p class="personal-best">Your brightest night yet for this plant!</p>
  {/if}

  <!-- The watered bed: ring + plant, lit, with the earned-droplet shower. -->
  <div class="bed" role="img" aria-label="{modeName} bed, {ringPct(ringTo)} percent grown">

    <svg class="ring" viewBox="0 0 200 200" aria-hidden="true">
      <circle class="ring-track" cx="100" cy="100" r={R} />
      <circle
        class="ring-fill"
        class:animate={mounted && !skipped && !reducedMotion}
        cx="100"
        cy="100"
        r={R}
        stroke-dasharray={C}
        stroke-dashoffset={ringValue !== undefined ? offsetTo : offsetFrom}
        style="--off-from:{offsetFrom}; --off-to:{offsetTo};"
      />
    </svg>

    <div class="bed-plant">
      <Plant
        species="moonflower"
        stage={bedStage}
        glow="var(--glow-moonflower)"
        size={132}
      />
    </div>

    <!-- earned droplets flying in (skippable / reduced-motion: hidden, bed already lit) -->
    {#if !skipped}
      <div class="droplets" aria-hidden="true">
        {#each DROPLETS as d, i (i)}
          <span class="droplet" style="--x:{d.x}px; --delay:{d.delay}s;"></span>
        {/each}
      </div>
    {/if}

    <!-- bloom flourish — only when the 85% gate was crossed this result -->
    {#if bloomed && !skipped}
      <div class="bloom-burst" aria-hidden="true">
        {#each Array(10) as _, i (i)}
          <span class="ray" style="--a:{(360 / 10) * i}deg;"></span>
        {/each}
      </div>
    {/if}
  </div>

  <p class="ring-caption">{ringCaption}</p>

  {#if bloomed}
    <p class="bloom-line">This bed came into full bloom tonight.</p>
  {/if}

  <div class="actions mt-8">
    <button onclick={onPlayAgain} class="btn-primary">Water Again</button>
    <button onclick={onPickAnother} class="btn-ghost">Tend Another</button>
  </div>

  <button type="button" class="next-link" onclick={() => onSelectNext(smartPick)}>
    Next: tend {smartPickName}
  </button>
</div>

<style>
  .end-screen {
    position: relative;
    width: 100%;
    max-width: 640px;
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    font-family: var(--font-sans);
  }

  /* Invisible tap surface that captures a tap-anywhere to skip the show.
     Sits behind the interactive controls (which have their own z-index). */
  .skip-surface {
    position: absolute;
    inset: 0;
    z-index: 0;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: default;
  }
  /* Once skipped there's nothing left to skip — let clicks fall through. */
  .is-skipped .skip-surface {
    pointer-events: none;
  }

  .mascot-wrapper,
  h1,
  .score-display,
  .personal-best,
  .bed,
  .ring-caption,
  .bloom-line,
  .actions,
  .next-link {
    position: relative;
    z-index: 1;
  }

  .mascot-wrapper {
    height: 140px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .end-screen h1 {
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 5vw, 2.2rem);
    color: var(--color-primary);
    margin: 0;
  }

  .score-display {
    font-size: 1.25rem;
    font-weight: 500;
    margin: 0;
  }

  .score-val {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    color: var(--glow-moonflower);
    font-variant-numeric: tabular-nums;
    text-shadow: var(--glow-md, 0 0 10px var(--glow-moonflower));
    --glow-c: var(--glow-moonflower);
  }

  .personal-best {
    margin: 0;
    font-weight: 600;
    color: var(--glow-firefly);
    text-shadow: 0 0 10px oklch(88% 0.15 95 / 0.5);
  }

  /* ---- The watered bed: ring + plant ---- */
  .bed {
    position: relative;
    width: 220px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0.25rem 0;
  }

  .ring {
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
    stroke-width: 10;
  }
  .ring-fill {
    fill: none;
    stroke: var(--glow-moonflower);
    stroke-width: 10;
    stroke-linecap: round;
    filter: drop-shadow(0 0 4px var(--glow-moonflower))
      drop-shadow(0 0 14px var(--glow-moonflower));
  }

  .bed-plant {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .droplets {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .droplet {
    position: absolute;
    top: 0;
    left: 50%;
    width: 7px;
    height: 11px;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    background: var(--glow-moonflower);
    box-shadow: 0 0 8px var(--glow-moonflower);
    opacity: 0;
  }

  .ring-caption {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
  }

  .bloom-line {
    margin: 0;
    font-weight: 600;
    color: var(--glow-moonflower);
  }

  /* ---- Bloom burst flourish (gated by `bloomed`) ---- */
  .bloom-burst {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    z-index: 2;
  }
  .ray {
    position: absolute;
    width: 3px;
    height: 70px;
    border-radius: 3px;
    background: linear-gradient(var(--glow-firefly), transparent);
    transform: rotate(var(--a)) translateY(-40px) scaleY(0);
    transform-origin: center bottom;
    opacity: 0;
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
    min-height: var(--touch, 48px);
    min-width: 160px;
  }

  .next-link {
    position: relative;
    z-index: 1;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    min-height: var(--touch, 48px);
  }
  .next-link:hover {
    color: var(--color-primary);
  }

  /* ===== Motion: only under prefers-reduced-motion: no-preference =====
     With reduced motion (or skipped), no keyframes run, so the ring renders at
     its final offset (ringTo), droplets/bloom are not in the DOM, and the bed
     plant shows its final stage immediately. */
  @media (prefers-reduced-motion: no-preference) {
    .ring-fill.animate {
      animation: ring-fill 1100ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .droplet {
      animation: droplet-fall 900ms ease-in forwards;
      animation-delay: var(--delay, 0s);
    }

    .ray {
      animation: ray-burst 900ms ease-out forwards;
      animation-delay: 120ms;
    }

    @keyframes ring-fill {
      from {
        stroke-dashoffset: var(--off-from);
      }
      to {
        stroke-dashoffset: var(--off-to);
      }
    }

    @keyframes droplet-fall {
      0% {
        opacity: 0;
        transform: translate(var(--x), -90px) scale(0.6);
      }
      30% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(0, 70px) scale(1);
      }
    }

    @keyframes ray-burst {
      0% {
        opacity: 0;
        transform: rotate(var(--a)) translateY(-40px) scaleY(0);
      }
      45% {
        opacity: 0.9;
        transform: rotate(var(--a)) translateY(-72px) scaleY(1);
      }
      100% {
        opacity: 0;
        transform: rotate(var(--a)) translateY(-96px) scaleY(0.6);
      }
    }
  }
</style>
