<script lang="ts">
  import { profileStore } from "../lib/profile.svelte";
  import { onMount } from "svelte";

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  const facts = $derived.by(() => {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    return mathOverrides.times_tables_facts || {};
  });

  const fluentFacts = $derived.by(() => {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    return mathOverrides.fluent_facts || {};
  });

  const isMastered = (r: number, c: number) => {
    return facts[r] >= 5 || facts[c] >= 5;
  };

  const isFluent = (r: number, c: number) => {
    const a = r;
    const b = c;
    const key = a < b ? `${a}x${b}` : `${b}x${a}`;
    return (fluentFacts[key] || 0) > 0;
  };

  let closeBtn: HTMLButtonElement | null = null;

  onMount(() => {
    closeBtn?.focus();
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="modal-backdrop"
  role="presentation"
  onclick={onClose}
>
  <div
    class="modal-content seed-packet"
    role="dialog"
    aria-modal="true"
    aria-labelledby="grid-modal-title"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
  >
    <div class="modal-header">
      <h2 id="grid-modal-title" class="modal-title">Times Tables Mastery</h2>
      <button
        class="close-btn"
        onclick={onClose}
        aria-label="Close times tables grid"
        bind:this={closeBtn}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
    <div class="grid-container">
      <div class="times-grid" role="table" aria-label="12 by 12 times tables heat map">
        <!-- Header row -->
        <div class="cell header empty" role="columnheader" aria-label="multiplication">×</div>
        {#each Array(12) as _, c}
          <div class="cell header col-header" role="columnheader">{c + 1}</div>
        {/each}

        <!-- Grid rows -->
        {#each Array(12) as _, r}
          <div class="cell header row-header" role="rowheader">{r + 1}</div>
          {#each Array(12) as _, c}
            {@const mastered = isMastered(r + 1, c + 1)}
            {@const fluent = mastered && isFluent(r + 1, c + 1)}
            <div
              class="cell"
              class:mastered
              class:fluent
              role="cell"
              aria-label="{r + 1} times {c + 1} equals {(r + 1) * (c + 1)}{mastered ? ', mastered' : ''}{fluent ? ', fluent' : ''}"
            >
              {(r + 1) * (c + 1)}
              {#if fluent}
                <span class="fluency-dot" aria-hidden="true"></span>
              {/if}
            </div>
          {/each}
        {/each}
      </div>
    </div>
    <div class="legend">
      <span class="legend-item">
        <span class="legend-swatch swatch-mastered"></span>
        <span class="legend-label">Mastered</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch swatch-fluent">
          <span class="fluency-dot" aria-hidden="true"></span>
        </span>
        <span class="legend-label">Fluent (fast)</span>
      </span>
    </div>
  </div>
</div>

<style>
  /* ── Backdrop ─────────────────────────────────────────────── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: oklch(10% 0.04 270 / 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  /* ── Seed-packet panel ────────────────────────────────────── */
  .seed-packet {
    background: var(--color-panel, oklch(30% 0.05 275 / 0.55));
    border: 1px solid var(--color-border, oklch(85% 0.02 280 / 0.12));
    border-radius: var(--r-lg, 32px);
    padding: 1.75rem 2rem;
    max-width: min(90vw, 560px);
    max-height: 90vh;
    overflow-y: auto;
    box-shadow:
      0 0 0 1px oklch(85% 0.04 280 / 0.08),
      0 8px 32px -8px oklch(10% 0.05 270 / 0.6),
      0 0 48px -12px var(--glow-crystal);
    /* Animation */
    animation: packet-open 0.25s ease-out both;
  }

  /* ── Header ───────────────────────────────────────────────── */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    gap: 1rem;
  }

  .modal-title {
    margin: 0;
    font-family: var(--font-display, sans-serif);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text, oklch(95% 0.02 280));
    letter-spacing: 0.01em;
  }

  /* ── Close button ─────────────────────────────────────────── */
  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: var(--touch, 48px);
    min-height: var(--touch, 48px);
    background: oklch(85% 0.02 280 / 0.08);
    border: 1px solid oklch(85% 0.02 280 / 0.14);
    border-radius: var(--r-sm, 12px);
    color: var(--color-text-muted, oklch(78% 0.03 280));
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  }

  .close-btn:hover,
  .close-btn:focus-visible {
    background: oklch(85% 0.02 280 / 0.16);
    color: var(--color-text, oklch(95% 0.02 280));
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* ── Grid container ───────────────────────────────────────── */
  .grid-container {
    overflow-x: auto;
  }

  .times-grid {
    display: grid;
    grid-template-columns: repeat(13, minmax(28px, 1fr));
    gap: 3px;
    font-family: var(--font-display, sans-serif);
    font-variant-numeric: tabular-nums;
  }

  /* ── Base cell ────────────────────────────────────────────── */
  .cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.25rem;
    background: oklch(85% 0.02 280 / 0.06);
    border-radius: 4px;
    color: var(--color-text-muted, oklch(78% 0.03 280));
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    min-height: 28px;
  }

  /* Header cells */
  .cell.header {
    background: oklch(85% 0.02 280 / 0.12);
    font-weight: 700;
    color: var(--glow-crystal);
    font-size: 0.72rem;
    letter-spacing: 0.02em;
  }

  .cell.header.empty {
    color: var(--color-text-muted, oklch(78% 0.03 280));
    font-size: 0.85rem;
  }

  /* Mastered cells — glow via firefly/correct, still legible */
  .cell.mastered {
    background: oklch(80% 0.16 150 / 0.14);
    color: var(--color-correct, oklch(80% 0.16 150));
    font-weight: 700;
    border: 1px solid oklch(80% 0.16 150 / 0.3);
    --glow-c: var(--glow-firefly, oklch(88% 0.15 95));
    box-shadow:
      0 0 4px oklch(88% 0.15 95 / 0.5),
      0 0 14px -2px oklch(88% 0.15 95 / 0.35);
  }

  /* Fluency dot — small spark in top-right corner */
  .fluency-dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--glow-firefly, oklch(88% 0.15 95));
    box-shadow: 0 0 4px var(--glow-firefly, oklch(88% 0.15 95));
    animation: twinkle 2.4s ease-in-out infinite;
  }

  /* ── Legend ───────────────────────────────────────────────── */
  .legend {
    display: flex;
    gap: 1.25rem;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid oklch(85% 0.02 280 / 0.1);
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-display, sans-serif);
    font-size: 0.72rem;
    color: var(--color-text-muted, oklch(78% 0.03 280));
  }

  .legend-swatch {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .swatch-mastered {
    background: oklch(80% 0.16 150 / 0.14);
    border: 1px solid oklch(80% 0.16 150 / 0.3);
    box-shadow: 0 0 4px oklch(88% 0.15 95 / 0.5), 0 0 10px -2px oklch(88% 0.15 95 / 0.35);
  }

  .swatch-fluent {
    background: oklch(80% 0.16 150 / 0.14);
    border: 1px solid oklch(80% 0.16 150 / 0.3);
    box-shadow: 0 0 4px oklch(88% 0.15 95 / 0.5), 0 0 10px -2px oklch(88% 0.15 95 / 0.35);
  }

  .swatch-fluent .fluency-dot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 5px;
    height: 5px;
  }

  /* ── Animations — only when motion is OK ─────────────────── */
  @media (prefers-reduced-motion: no-preference) {
    @keyframes packet-open {
      from {
        opacity: 0;
        transform: scale(0.93) translateY(8px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes twinkle {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.35;
        transform: scale(0.65);
      }
    }
  }

  /* Reduced-motion: no animation on packet-open or twinkle */
  @media (prefers-reduced-motion: reduce) {
    .seed-packet {
      animation: none;
    }

    .fluency-dot {
      animation: none;
    }
  }
</style>
