<script lang="ts">
  import Plant from './Plant.svelte';
  import { profileStore, MATH_MODES, type MathMode } from '../lib/profile.svelte';
  import { speciesFor } from './SpeciesMap';
  interface Props { onSelect: (m: MathMode) => void }
  let { onSelect }: Props = $props();

  // ---- Grove metadata --------------------------------------------------
  // Three groves by spatial proximity along the path (3-3-4).
  // grove1 firefly gold · grove2 moonflower cyan · grove3 blossom magenta.
  type Grove = 1 | 2 | 3;
  const GROVE_GLOW: Record<Grove, string> = {
    1: 'var(--glow-firefly)',
    2: 'var(--glow-moonflower)',
    3: 'var(--glow-blossom)',
  };
  const GROVE_SIGN: Record<Grove, string> = {
    1: 'Number Patch',
    2: 'Shape & Space Grove',
    3: 'Big-Kid Greenhouse',
  };
  const GROVE_OF: Record<MathMode, Grove> = {
    'times-tables': 1,
    'speed-add': 1,
    'number-sort': 1,
    'fractions-visual': 2,
    'multiplication-grid': 2,
    'decimals-grid': 2,
    'place-value': 3,
    'long-division': 3,
    'geometry-angles': 3,
    'pemdas-tree': 3,
  };

  const PRETTY: Record<MathMode, string> = {
    'times-tables': 'Times Tables',
    'speed-add': 'Speed Add',
    'number-sort': 'Number Sort',
    'fractions-visual': 'Fraction Garden',
    'multiplication-grid': 'Multiplication Grid',
    'decimals-grid': 'Decimal Shading',
    'place-value': 'Place Value',
    'long-division': 'Long Division',
    'geometry-angles': 'Coordinate Plot',
    'pemdas-tree': 'Order of Operations',
  };

  const STAGE_LABEL = ['just a seed', 'a seedling', 'a sprout', 'budding', 'in full bloom'] as const;

  // ---- Mastery → stage -------------------------------------------------
  function stageFor(m: string): 0 | 1 | 2 | 3 | 4 {
    const v = m === 'times-tables'
      ? profileStore.timesTablesRingFill
      : (((profileStore.profile?.module_overrides?.math as any)?.mastery?.[m]) ?? 0);
    return v <= 0 ? 0 : v <= 0.3 ? 1 : v <= 0.6 ? 2 : v <= 0.85 ? 3 : 4;
  }

  // ---- Pod layout variants --------------------------------------------
  // x/y are percentages of the scene box. Pods are equal size everywhere;
  // only their positions reflow. Three groves are kept spatially clustered.
  type Pod = { id: MathMode; x: number; y: number; grove: Grove };

  // Wide (>=1100px): serpentine with 11–12% x-steps so pods never overlap.
  // At 1100px viewport: 11% x-step → 121px horizontal gap (pod width ~104px, need ≥116px).
  // Grove 3 uses a 2×2 arrangement (x=71/83, y=38/66) so all 4 fit within the right margin.
  // Every adjacent/near pair satisfies: dx_px ≥ 116 OR dy_px ≥ 132 (pod dims + 12px margin).
  const LAYOUT_WIDE: Pod[] = [
    { id: 'times-tables', x: 5, y: 32, grove: 1 },
    { id: 'speed-add', x: 16, y: 52, grove: 1 },
    { id: 'number-sort', x: 27, y: 32, grove: 1 },
    { id: 'fractions-visual', x: 38, y: 52, grove: 2 },
    { id: 'multiplication-grid', x: 49, y: 32, grove: 2 },
    { id: 'decimals-grid', x: 60, y: 52, grove: 2 },
    { id: 'place-value', x: 71, y: 26, grove: 3 },
    { id: 'long-division', x: 83, y: 52, grove: 3 },
    { id: 'geometry-angles', x: 71, y: 54, grove: 3 },
    { id: 'pemdas-tree', x: 83, y: 28, grove: 3 },
  ];

  // Tablet portrait (600–1100px): taller serpentine, ~3 visual rows of groves.
  const LAYOUT_TABLET: Pod[] = [
    { id: 'times-tables', x: 18, y: 22, grove: 1 },
    { id: 'speed-add', x: 50, y: 18, grove: 1 },
    { id: 'number-sort', x: 82, y: 24, grove: 1 },
    { id: 'fractions-visual', x: 20, y: 50, grove: 2 },
    { id: 'multiplication-grid', x: 52, y: 46, grove: 2 },
    { id: 'decimals-grid', x: 82, y: 52, grove: 2 },
    { id: 'place-value', x: 16, y: 80, grove: 3 },
    { id: 'long-division', x: 40, y: 76, grove: 3 },
    { id: 'geometry-angles', x: 64, y: 80, grove: 3 },
    { id: 'pemdas-tree', x: 86, y: 74, grove: 3 },
  ];

  // Narrow (<600px): single vertical column. Rendered as a grouped list
  // (see the markup branch) so pods never overlap on small screens.
  const NARROW_BP = 600;
  const TABLET_BP = 1100;

  let sceneW = $state(1200);
  const layout = $derived(
    sceneW >= TABLET_BP ? LAYOUT_WIDE : sceneW >= NARROW_BP ? LAYOUT_TABLET : null,
  );
  const isNarrow = $derived(sceneW < NARROW_BP);

  // Grove sign positions (percent), placed near each cluster, per variant.
  const SIGN_WIDE: Record<Grove, { x: number; y: number }> = {
    1: { x: 16, y: 80 },
    2: { x: 49, y: 80 },
    3: { x: 77, y: 80 },
  };
  const SIGN_TABLET: Record<Grove, { x: number; y: number }> = {
    1: { x: 50, y: 6 },
    2: { x: 50, y: 34 },
    3: { x: 50, y: 64 },
  };
  const signPos = $derived(sceneW >= TABLET_BP ? SIGN_WIDE : SIGN_TABLET);
  const GROVES: Grove[] = [1, 2, 3];

  // Narrow column: modes grouped under their grove header, in MATH_MODES order.
  const narrowGroups = $derived(
    GROVES.map((g) => ({
      grove: g,
      modes: MATH_MODES.filter((m) => GROVE_OF[m] === g),
    })),
  );

  // ---- Parallax pointer ------------------------------------------------
  // Always set --px/--py; CSS neutralizes .parallax-layer under reduced-motion.
  let root: HTMLDivElement;
  function onPointerMove(e: PointerEvent) {
    if (!root) return;
    const r = root.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1; // -1..1
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    root.style.setProperty('--px', String(Math.max(-1, Math.min(1, nx)) * 24));
    root.style.setProperty('--py', String(Math.max(-1, Math.min(1, ny)) * 24));
  }

  // ---- Width signal via ResizeObserver --------------------------------
  function observeWidth(node: HTMLElement) {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        sceneW = entry.contentRect.width;
      }
    });
    ro.observe(node);
    sceneW = node.getBoundingClientRect().width;
    return { destroy() { ro.disconnect(); } };
  }

  function activate(m: MathMode) {
    onSelect(m);
  }
  function onKey(e: KeyboardEvent, m: MathMode) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      activate(m);
    }
  }

  // Pre-computed firefly drift positions for the foreground layer.
  const FIREFLIES = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 67) % 100,
    y: 30 + ((i * 41) % 60),
    d: (i % 7) * 0.5,
    r: 0.8 + (i % 3) * 0.4,
  }));
</script>

<div
  class="garden grain vignette"
  bind:this={root}
  use:observeWidth
  onpointermove={onPointerMove}
  role="presentation"
>
  <!-- ============ SVG SCENE: 4 parallax layers ============ -->
  <svg
    class="scene"
    viewBox="0 0 1200 700"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--sky-top)" />
        <stop offset="55%" stop-color="var(--sky-mid)" />
        <stop offset="100%" stop-color="var(--sky-bot)" />
      </linearGradient>
      <radialGradient id="gs-moon" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="oklch(98% 0.02 250)" />
        <stop offset="70%" stop-color="oklch(92% 0.04 250)" />
        <stop offset="100%" stop-color="oklch(92% 0.04 250 / 0)" />
      </radialGradient>
      <linearGradient id="gs-path" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="oklch(60% 0.05 250 / 0.55)" />
        <stop offset="100%" stop-color="oklch(70% 0.06 200 / 0.35)" />
      </linearGradient>
    </defs>

    <!-- sky always fills -->
    <rect x="-40" y="-40" width="1280" height="780" fill="url(#gs-sky)" />

    <!-- LAYER 1 (far, depth 0.15): star-field + moon + rolling hills -->
    <g class="parallax-layer" style="--depth:0.15">
      <circle cx="1040" cy="95" r="74" fill="url(#gs-moon)" />
      <circle cx="1040" cy="95" r="40" fill="oklch(97% 0.02 250)" opacity="0.9" />
      {#each Array.from({ length: 60 }, (_, i) => i) as i (i)}
        <circle
          cx={(i * 197) % 1200}
          cy={(i * 83) % 360}
          r={0.6 + ((i * 7) % 3) * 0.5}
          fill="oklch(96% 0.02 250)"
          opacity={0.3 + ((i % 5) * 0.12)}
        />
      {/each}
      <path
        d="M-40 470 C 200 410 420 470 640 440 C 880 408 1060 470 1240 430 L 1240 780 L -40 780 Z"
        fill="oklch(30% 0.06 270)"
      />
    </g>

    <!-- LAYER 2 (mid, depth 0.4): nearer hills + the curving moonlit path -->
    <g class="parallax-layer" style="--depth:0.4">
      <path
        d="M-40 540 C 180 480 420 560 660 520 C 900 482 1080 560 1240 520 L 1240 780 L -40 780 Z"
        fill="oklch(26% 0.06 280)"
      />
      <!-- the serpentine path the pods sit along -->
      <path
        d="M-20 690 C 180 560 300 600 360 500 C 430 388 560 360 660 440 C 760 516 840 400 940 350 C 1040 300 1140 320 1240 270"
        fill="none"
        stroke="url(#gs-path)"
        stroke-width="56"
        stroke-linecap="round"
        opacity="0.5"
      />
    </g>

    <!-- LAYER 3 (plant beds, depth 0.7): soft glowing mounds under the pods -->
    <g class="parallax-layer" style="--depth:0.7">
      <path
        d="M-40 600 C 240 540 520 600 760 560 C 980 524 1120 590 1240 560 L 1240 780 L -40 780 Z"
        fill="oklch(22% 0.05 285)"
      />
      {#each [180, 470, 760, 1040] as bx (bx)}
        <ellipse cx={bx} cy="620" rx="150" ry="34" fill="oklch(40% 0.05 200 / 0.18)" />
      {/each}
    </g>

    <!-- LAYER 4 (foreground, depth 1.1): grass blades + drifting fireflies -->
    <g class="parallax-layer fg" style="--depth:1.1">
      {#each Array.from({ length: 40 }, (_, i) => i) as i (i)}
        <path
          d="M{i * 31} 700 C {i * 31 + 4} 660 {i * 31 - 4} 650 {i * 31 + 2} 624"
          fill="none"
          stroke="oklch(34% 0.08 150)"
          stroke-width="3"
          stroke-linecap="round"
          opacity="0.7"
        />
      {/each}
      <g class="fireflies">
        {#each FIREFLIES as f, i (i)}
          <circle
            class="firefly"
            cx={f.x * 12}
            cy={f.y * 7}
            r={f.r * 2.2}
            fill="var(--glow-firefly)"
            style="--d:{f.d}s"
          />
        {/each}
      </g>
    </g>
  </svg>

  <!-- ============ POD OVERLAY: accessible HTML buttons ============ -->
  {#if isNarrow}
    <div class="column">
      {#each narrowGroups as group (group.grove)}
        <h2 class="grove-sign narrow" style:--glow-c={GROVE_GLOW[group.grove]}>
          {GROVE_SIGN[group.grove]}
        </h2>
        <div class="column-row">
          {#each group.modes as m (m)}
            {@const st = stageFor(m)}
            <button
              class="pod"
              style:--glow-c={GROVE_GLOW[group.grove]}
              aria-label={`${PRETTY[m]}: ${STAGE_LABEL[st]}`}
              onclick={() => activate(m)}
            >
              <Plant stage={st} glow={GROVE_GLOW[group.grove]} size={88} species={speciesFor(m)} />
              <span class="pod-name">{PRETTY[m]}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {:else if layout}
    <div class="overlay">
      {#each GROVES as g (g)}
        <h2
          class="grove-sign"
          style:--glow-c={GROVE_GLOW[g]}
          style:left={`${signPos[g].x}%`}
          style:top={`${signPos[g].y}%`}
        >
          {GROVE_SIGN[g]}
        </h2>
      {/each}

      {#each layout as pod (pod.id)}
        {@const st = stageFor(pod.id)}
        <button
          class="pod"
          style:--glow-c={GROVE_GLOW[pod.grove]}
          style:left={`${pod.x}%`}
          style:top={`${pod.y}%`}
          aria-label={`${PRETTY[pod.id]}: ${STAGE_LABEL[st]}`}
          onclick={() => activate(pod.id)}
          onkeydown={(e) => onKey(e, pod.id)}
        >
          <Plant stage={st} glow={GROVE_GLOW[pod.grove]} size={104} species={speciesFor(pod.id)} />
          <span class="pod-name">{PRETTY[pod.id]}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .garden {
    position: relative; /* required for .grain / .vignette and the overlay */
    width: 100%;
    min-height: 460px;
    height: min(78vh, 760px);
    overflow: hidden;
    border-radius: 20px;
    background: var(--sky-top);
    touch-action: pan-y;
  }

  .scene {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  .fg :global(.firefly) {
    filter: drop-shadow(0 0 4px var(--glow-firefly)) drop-shadow(0 0 10px var(--glow-firefly));
    opacity: 0.5;
    transform-box: fill-box;
    transform-origin: center;
  }

  @media (prefers-reduced-motion: no-preference) {
    .fg :global(.firefly) {
      animation: gs-drift 5.5s ease-in-out infinite;
      animation-delay: var(--d, 0s);
    }
    @keyframes gs-drift {
      0%,
      100% {
        opacity: 0.25;
        transform: translate(0, 2px) scale(0.8);
      }
      50% {
        opacity: 0.85;
        transform: translate(6px, -8px) scale(1.15);
      }
    }
  }

  /* ---- Pod overlay (wide / tablet): absolute % positioning ---- */
  .overlay {
    position: absolute;
    inset: 0;
    pointer-events: none; /* let only pods/signs catch events */
  }

  .pod {
    pointer-events: auto;
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    /* equal hit target everywhere, well above the 48px minimum */
    min-width: 96px;
    min-height: 120px;
    padding: 6px 8px 8px;
    border: none;
    background: transparent;
    border-radius: 18px;
    cursor: pointer;
    color: oklch(94% 0.02 250);
    font: inherit;
    transition: transform 0.18s ease, filter 0.18s ease;
  }

  .pod-name {
    font-size: 0.8rem;
    font-weight: 600;
    text-align: center;
    line-height: 1.1;
    text-shadow: 0 1px 4px oklch(15% 0.05 285 / 0.8);
    max-width: 11ch;
  }

  .pod:hover {
    transform: translate(-50%, -54%);
    filter: brightness(1.08);
  }

  /* Glowing focus ring — visible for keyboard users. */
  .pod:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px oklch(98% 0.02 250 / 0.9),
      0 0 14px 4px var(--glow-c),
      0 0 28px 8px var(--glow-c);
  }

  .grove-sign {
    pointer-events: none;
    position: absolute;
    transform: translate(-50%, -50%);
    margin: 0;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
    color: oklch(97% 0.02 250);
    background: oklch(22% 0.05 285 / 0.55);
    border: 1px solid var(--glow-c);
    box-shadow: 0 0 14px -2px var(--glow-c);
    backdrop-filter: blur(3px);
  }

  /* ---- Narrow column layout ---- */
  .column {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 12px 28px;
    min-height: 100%;
  }

  .grove-sign.narrow {
    position: static;
    transform: none;
    align-self: center;
    margin-top: 8px;
  }

  .column-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }

  .column .pod {
    position: static;
    transform: none;
    width: 100%;
    background: oklch(20% 0.04 285 / 0.4);
  }
  .column .pod:hover {
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .pod,
    .pod:hover {
      transition: none;
    }
  }
</style>
