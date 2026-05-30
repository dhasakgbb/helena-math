<script lang="ts">
  import type { Snippet } from 'svelte';
  import Plant from './Plant.svelte';
  import { profileStore } from '../lib/profile.svelte';

  interface Props {
    title: string;
    plantModeId: string;
    questionIndex: number;   // questions answered so far (0..total)
    total: number;           // 5 or 10
    onBack: () => void;
    glow?: string;
    mascot?: Snippet;        // top-right reacting mascot + speech
    children: Snippet;       // the game body
  }

  let { title, plantModeId, questionIndex, total, onBack, glow = 'var(--glow-firefly)', mascot, children }: Props = $props();

  function thumbStage(id: string): 0 | 1 | 2 | 3 | 4 {
    const v =
      id === 'times-tables'
        ? profileStore.timesTablesRingFill
        : (((profileStore.profile?.module_overrides?.math as any)?.mastery?.[id]) ?? 0);
    return v <= 0 ? 0 : v <= 0.3 ? 1 : v <= 0.6 ? 2 : v <= 0.85 ? 3 : 4;
  }

  const stage = $derived(thumbStage(plantModeId));
  const dropletSize = $derived(total <= 5 ? 'large' : 'small');
</script>

<div class="game-shell">
  <!-- Top bar -->
  <div class="top-bar">
    <button
      class="back-leaf"
      aria-label="Back to the garden"
      onclick={onBack}
    >
      <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
        <!-- Leaf shape pointing left -->
        <path
          d="M38 24 C 38 12 26 8 14 10 C 14 10 12 10 10 12 C 10 22 14 36 28 38 C 34 38 38 32 38 24 Z"
          fill="currentColor"
          opacity="0.9"
        />
        <!-- Midrib vein -->
        <path
          d="M14 11 C 20 18 28 26 30 36"
          fill="none"
          stroke="oklch(85% 0.1 165)"
          stroke-width="1.4"
          stroke-linecap="round"
          opacity="0.6"
        />
        <!-- Arrow chevron -->
        <path
          d="M26 18 L 18 24 L 26 30"
          fill="none"
          stroke="oklch(96% 0.03 165)"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div class="title-area">
      <h1 class="game-title">{title}</h1>
      <div class="plant-thumb">
        <Plant {stage} size={40} glow={glow} />
      </div>
    </div>

    <div class="mascot-slot">
      {#if mascot}
        {@render mascot()}
      {/if}
    </div>
  </div>

  <!-- Watering-can progress strip -->
  <div
    class="progress-strip"
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={total}
    aria-valuenow={questionIndex}
    aria-label="Question progress"
    style:--drop-glow={glow}
  >
    <div class="droplets droplets--{dropletSize}">
      {#each { length: total } as _, i (i)}
        <div
          class="droplet"
          class:droplet--filled={i < questionIndex}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 20 28"
            class="droplet-svg"
            aria-hidden="true"
          >
            <path
              d="M10 2 C 10 2 3 12 3 18 C 3 23.5 6.1 26 10 26 C 13.9 26 17 23.5 17 18 C 17 12 10 2 10 2 Z"
              class="droplet-body"
            />
            {#if i < questionIndex}
              <!-- inner glint for filled drops -->
              <path
                d="M7.5 14 C 7 16 7 18 7.5 20"
                fill="none"
                stroke="oklch(95% 0.05 210)"
                stroke-width="1.2"
                stroke-linecap="round"
                opacity="0.55"
              />
            {/if}
          </svg>
        </div>
      {/each}
    </div>
  </div>

  <!-- Game body -->
  <div class="garden-table">
    <div class="garden-table-inner">
      {@render children()}
    </div>
  </div>
</div>

<style>
  .game-shell {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-family: 'Lexend', 'Nunito', sans-serif;
  }

  /* ── Top bar ─────────────────────────────────────────────────── */
  .top-bar {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: color-mix(in oklch, var(--color-panel, oklch(18% 0.04 280)) 90%, transparent);
    border: 1px solid var(--color-border, oklch(35% 0.06 280));
    border-radius: var(--r-lg, 18px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  }

  /* back-leaf button */
  .back-leaf {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: oklch(28% 0.12 165);
    border: 1.5px solid oklch(45% 0.14 165);
    color: oklch(88% 0.12 165);
    cursor: pointer;
    transition: background 0.18s, box-shadow 0.18s;
    flex-shrink: 0;
  }
  .back-leaf:hover,
  .back-leaf:focus-visible {
    background: oklch(34% 0.15 165);
    box-shadow:
      0 0 8px oklch(60% 0.18 165 / 0.6),
      0 0 24px oklch(60% 0.18 165 / 0.25);
    outline: none;
  }
  .back-leaf:focus-visible {
    outline: 2px solid oklch(70% 0.18 165);
    outline-offset: 2px;
  }

  /* title + plant thumb */
  .title-area {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
    justify-content: center;
  }
  .game-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary, oklch(80% 0.15 280));
    margin: 0;
    text-align: center;
    text-wrap: balance;
    line-height: 1.2;
  }

  @media (max-width: 480px) {
    .game-title {
      font-size: 1rem;
    }
  }
  .plant-thumb {
    flex-shrink: 0;
    line-height: 0;
  }

  /* mascot slot */
  .mascot-slot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    position: relative;
    min-width: 0;
  }

  /* ── Progress strip ──────────────────────────────────────────── */
  .progress-strip {
    padding: 0.4rem 1rem;
    background: color-mix(in oklch, var(--color-panel, oklch(18% 0.04 280)) 70%, transparent);
    border: 1px solid var(--color-border, oklch(35% 0.06 280));
    border-radius: var(--r-md, 12px);
  }

  .droplets {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    flex-wrap: nowrap;
  }

  /* 5-droplet variant: bigger drops */
  .droplets--large {
    gap: 0.6rem;
  }
  .droplets--large .droplet {
    width: 28px;
    height: 38px;
  }

  /* 10-droplet variant: smaller drops */
  .droplets--small .droplet {
    width: 18px;
    height: 25px;
  }

  .droplet {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .droplet-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .droplet-body {
    fill: oklch(30% 0.07 220);
    stroke: oklch(45% 0.10 220);
    stroke-width: 1;
    transition: fill 0.25s, filter 0.25s;
  }

  /* filled state — color driven by --drop-glow (set per grove from the glow prop) */
  .droplet--filled .droplet-body {
    fill: var(--drop-glow, oklch(65% 0.18 215));
    stroke: var(--drop-glow, oklch(75% 0.20 210));
    opacity: 0.9;
  }

  @media (prefers-reduced-motion: no-preference) {
    .droplet--filled .droplet-body {
      filter:
        drop-shadow(0 0 3px var(--drop-glow, oklch(70% 0.22 210 / 0.8)))
        drop-shadow(0 0 10px var(--drop-glow, oklch(65% 0.20 215 / 0.45)));
      animation: droplet-fill 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes droplet-fill {
      0% {
        transform: scale(0.6);
        opacity: 0.4;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  }

  /* empty droplet subtle glow */
  .droplet:not(.droplet--filled) .droplet-body {
    filter: drop-shadow(0 0 2px oklch(40% 0.08 220 / 0.4));
  }

  /* ── Garden table (game body) ────────────────────────────────── */
  .garden-table {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .garden-table-inner {
    width: 100%;
    max-width: 720px;
    background: color-mix(in oklch, var(--color-panel, oklch(18% 0.04 280)) 85%, transparent);
    border: 1px solid var(--color-border, oklch(35% 0.06 280));
    border-radius: var(--r-lg, 18px);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 oklch(50% 0.06 270 / 0.2);
    padding: 1.5rem;
    position: relative;
  }
</style>
