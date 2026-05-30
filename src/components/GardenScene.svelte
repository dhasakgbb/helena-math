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

  // ~70 foreground grass blades. Height / lean / width / opacity are all
  // derived from the index so the band reads dense but non-uniform. Blades
  // span the full 1200-wide box and sit in the low foreground band, behind
  // the HTML pod overlay (so they never cover hit targets/labels).
  const BLADES = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 17.3) % 1212 - 6;
    const wob = ((i * 53) % 100) / 100; // pseudo-random 0..1
    const wob2 = ((i * 37) % 100) / 100;
    return {
      x,
      h: 46 + wob * 52, // blade height 46..98
      lean: (wob2 - 0.5) * 26, // lean -13..+13 px
      w: 2.4 + wob2 * 1.6, // stroke width 2.4..4.0
      o: 0.6 + wob * 0.3, // opacity 0.6..0.9
    };
  });

  // Pre-computed firefly drift positions for the foreground layer. Denser
  // (22) with extra position/size variance derived from the index so the
  // swarm reads scattered rather than gridded.
  const FIREFLIES = Array.from({ length: 22 }, (_, i) => ({
    x: (i * 71 + ((i * 29) % 19)) % 100,
    y: 22 + ((i * 47) % 70),
    d: (i % 9) * 0.45,
    r: 0.7 + ((i * 13) % 5) * 0.3,
  }));

  // Glowing mushrooms scattered along the floor band (y≈580–680). Hand-placed
  // in the gaps between the plant mounds (mound centers x≈180/470/760/1040) and
  // along the path so they read as ground decor. They live in the SVG foreground
  // layer, behind the HTML pod overlay, so they never block taps. Each is drawn
  // inline via the {#each} below (stem + cap + spots + layered glow).
  const MUSHROOMS = [
    { x: 96, y: 642, scale: 1.05 },
    { x: 300, y: 668, scale: 0.82 },
    { x: 392, y: 600, scale: 0.92 },
    { x: 600, y: 660, scale: 1.0 },
    { x: 678, y: 596, scale: 0.78 },
    { x: 892, y: 650, scale: 1.1 },
    { x: 980, y: 592, scale: 0.86 },
    { x: 1150, y: 636, scale: 0.95 },
  ];
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
        <stop offset="0%" stop-color="var(--gs-moon-outer, oklch(98% 0.02 250))" />
        <stop offset="70%" stop-color="var(--gs-moon-inner, oklch(92% 0.04 250))" />
        <stop offset="100%" stop-color="var(--gs-moon-fade, oklch(92% 0.04 250 / 0))" />
      </radialGradient>
      <linearGradient id="gs-path" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--gs-path1, oklch(60% 0.05 250 / 0.55))" />
        <stop offset="100%" stop-color="var(--gs-path2, oklch(70% 0.06 200 / 0.35))" />
      </linearGradient>
      <!-- Bioluminescent floor glow: brightest along the mound's lit top edge,
           fading down into the bed. Token carries the day/night color + alpha. -->
      <linearGradient id="gs-ground-glow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--gs-ground-glow, oklch(70% 0.12 160 / 0.22))" stop-opacity="0" />
        <stop offset="35%" stop-color="var(--gs-ground-glow, oklch(70% 0.12 160 / 0.22))" />
        <stop offset="100%" stop-color="var(--gs-ground-glow, oklch(70% 0.12 160 / 0.22))" stop-opacity="0" />
      </linearGradient>
      <filter id="gs-ground-blur" x="-10%" y="-40%" width="120%" height="180%">
        <feGaussianBlur stdDeviation="22" />
      </filter>
      <!-- soft blur for the path's wide under-glow stroke -->
      <filter id="gs-path-blur" x="-10%" y="-40%" width="120%" height="180%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
      <!-- low fog band: fades top→bottom so it melts into the mid-ground -->
      <linearGradient id="gs-fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--gs-fog, oklch(62% 0.04 250 / 0.12))" stop-opacity="0" />
        <stop offset="45%" stop-color="var(--gs-fog, oklch(62% 0.04 250 / 0.12))" />
        <stop offset="100%" stop-color="var(--gs-fog, oklch(62% 0.04 250 / 0.12))" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- sky always fills -->
    <rect x="-40" y="-40" width="1280" height="780" fill="url(#gs-sky)" />

    <!-- LAYER 1 (far, depth 0.15): star-field + moon + rolling hills -->
    <g class="parallax-layer" style="--depth:0.15">
      <circle cx="1040" cy="95" r="74" fill="url(#gs-moon)" />
      <circle cx="1040" cy="95" r="40" fill="var(--gs-moon-core, oklch(97% 0.02 250))" opacity="0.9" />
      {#each Array.from({ length: 60 }, (_, i) => i) as i (i)}
        <circle
          cx={(i * 197) % 1200}
          cy={(i * 83) % 360}
          r={0.6 + ((i * 7) % 3) * 0.5}
          fill="var(--gs-star, oklch(96% 0.02 250))"
          opacity={0.3 + ((i % 5) * 0.12)}
        />
      {/each}
      <path
        d="M-40 470 C 200 410 420 470 640 440 C 880 408 1060 470 1240 430 L 1240 780 L -40 780 Z"
        fill="var(--gs-hill1, oklch(30% 0.06 270))"
      />
    </g>

    <!-- LAYER 2 (mid, depth 0.4): nearer hills + the curving moonlit path -->
    <g class="parallax-layer" style="--depth:0.4">
      <path
        d="M-40 540 C 180 480 420 560 660 520 C 900 482 1080 560 1240 520 L 1240 780 L -40 780 Z"
        fill="var(--gs-hill2, oklch(26% 0.06 280))"
      />
      <!-- the serpentine path the pods sit along, rendered as a glowing lit
           trail: a wide soft under-glow + a narrower bright core on top. -->
      <!-- wide under-glow: blurred, low opacity, gradient tone -->
      <path
        d="M-20 690 C 180 560 300 600 360 500 C 430 388 560 360 660 440 C 760 516 840 400 940 350 C 1040 300 1140 320 1240 270"
        fill="none"
        stroke="url(#gs-path)"
        stroke-width="64"
        stroke-linecap="round"
        opacity="0.4"
        filter="url(#gs-path-blur)"
      />
      <!-- bright core: narrower, lighter tone, higher opacity -->
      <path
        d="M-20 690 C 180 560 300 600 360 500 C 430 388 560 360 660 440 C 760 516 840 400 940 350 C 1040 300 1140 320 1240 270"
        fill="none"
        stroke="var(--gs-path2, oklch(70% 0.06 200 / 0.35))"
        stroke-width="22"
        stroke-linecap="round"
        opacity="0.7"
      />
      <!-- faint stepping-stone dots threading the trail -->
      {#each [[120, 588], [360, 500], [520, 392], [660, 440], [820, 432], [940, 350], [1120, 308]] as [sx, sy] (sx)}
        <circle cx={sx} cy={sy} r="6" fill="var(--gs-path2, oklch(70% 0.06 200 / 0.35))" opacity="0.5" />
      {/each}
    </g>

    <!-- FOG BAND (depth 0.55): a soft low haze across the mid-ground so distant
         elements read hazier. Sits between the hills/path and the plant beds. -->
    <g class="parallax-layer" style="--depth:0.55">
      <rect x="-40" y="470" width="1280" height="90" fill="url(#gs-fog)" />
    </g>

    <!-- LAYER 3 (plant beds, depth 0.7): soft glowing mounds under the pods -->
    <g class="parallax-layer" style="--depth:0.7">
      <path
        d="M-40 600 C 240 540 520 600 760 560 C 980 524 1120 590 1240 560 L 1240 780 L -40 780 Z"
        fill="var(--gs-hill3, oklch(22% 0.05 285))"
      />
      <!-- Soft glowing band hugging the lit top edge of the mound. The gradient
           fades top→bottom; the blur melts it into the floor so it reads lit. -->
      <path
        d="M-40 600 C 240 540 520 600 760 560 C 980 524 1120 590 1240 560 L 1240 700 C 1120 730 980 664 760 700 C 520 740 240 680 -40 740 Z"
        fill="url(#gs-ground-glow)"
        filter="url(#gs-ground-blur)"
      />
      {#each [180, 470, 760, 1040] as bx (bx)}
        <ellipse cx={bx} cy="620" rx="150" ry="34" fill="var(--gs-mound-shadow, oklch(40% 0.05 200 / 0.18))" />
      {/each}
    </g>

    <!-- LAYER 4 (foreground, depth 1.1): grass blades + drifting fireflies -->
    <g class="parallax-layer fg" style="--depth:1.1">
      <!-- Glowing mushrooms: ground decor in the floor band, drawn before the
           grass so blades overlap their stems and they nestle into the bed.
           Each: layered cap glow (wide halo + tight core) → slightly-curved
           stem → domed cap (lit upper-left) → 2–3 light spots. -->
      {#each MUSHROOMS as m, i (i)}
        {@const s = m.scale}
        <g class="mushroom" transform="translate({m.x} {m.y}) scale({s})" style="--mi:{i}">
          <!-- layered cap glow: wide soft halo behind, tighter core in front -->
          <ellipse
            class="m-glow m-glow-halo"
            cx="0"
            cy="-20"
            rx="34"
            ry="26"
            fill="var(--gs-mushroom-glow)"
          />
          <ellipse
            class="m-glow m-glow-core"
            cx="0"
            cy="-20"
            rx="17"
            ry="13"
            fill="var(--gs-mushroom-glow)"
          />
          <!-- slightly-curved stem rising from the floor baseline -->
          <path
            d="M-4.5 1 C -5.5 -8 -4 -14 -1.5 -18 L 4 -18 C 5.5 -13 6 -7 5 1 Z"
            fill="var(--gs-mushroom-stem)"
          />
          <!-- domed cap, sitting on the stem -->
          <path
            d="M-15 -17 C -15 -29 -8 -34 0 -34 C 8 -34 15 -29 15 -17 C 9 -20 -9 -20 -15 -17 Z"
            fill="var(--gs-mushroom-cap)"
          />
          <!-- lit upper-left highlight on the cap -->
          <path
            d="M-13 -19 C -12 -28 -6 -32 0 -32 C -5 -29 -10 -25 -12 -18 Z"
            fill="var(--gs-mushroom-glow)"
            opacity="0.45"
          />
          <!-- light spots on the cap -->
          <circle cx="-6" cy="-26" r="2.4" fill="var(--gs-mushroom-glow)" opacity="0.85" />
          <circle cx="4" cy="-28" r="1.9" fill="var(--gs-mushroom-glow)" opacity="0.8" />
          <circle cx="7" cy="-23" r="1.5" fill="var(--gs-mushroom-glow)" opacity="0.75" />
        </g>
      {/each}
      {#each BLADES as b (b.x)}
        <!-- blade body: rises from the foreground baseline, leaning naturally -->
        <path
          d="M{b.x} 700 C {b.x + b.lean * 0.35} {700 - b.h * 0.45} {b.x + b.lean * 0.75} {700 - b.h * 0.78} {b.x + b.lean} {700 - b.h}"
          fill="none"
          stroke="var(--gs-grass)"
          stroke-width={b.w}
          stroke-linecap="round"
          opacity={b.o}
        />
        <!-- rim-lit tip: brighter highlight on the upper third -->
        <path
          d="M{b.x + b.lean * 0.7} {700 - b.h * 0.7} C {b.x + b.lean * 0.82} {700 - b.h * 0.82} {b.x + b.lean * 0.92} {700 - b.h * 0.92} {b.x + b.lean} {700 - b.h}"
          fill="none"
          stroke="var(--gs-grass-tip)"
          stroke-width={b.w * 0.7}
          stroke-linecap="round"
          opacity={b.o * 0.95}
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

  /* Mushroom cap glow: soft blurred halo + tighter core. Held opacities here
     so reduced-motion / calm-mode (no animation) still shows a steady glow. */
  .fg :global(.m-glow) {
    filter: blur(7px);
    transform-box: fill-box;
    transform-origin: center;
  }
  .fg :global(.m-glow-halo) {
    opacity: 0.3;
  }
  .fg :global(.m-glow-core) {
    filter: blur(3px);
    opacity: 0.55;
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

    /* Gentle cap-glow pulse, staggered per mushroom by index (--mi). */
    .fg :global(.mushroom .m-glow-halo) {
      animation: gs-shroom-halo 6s ease-in-out infinite;
      animation-delay: calc(var(--mi, 0) * -0.8s);
    }
    .fg :global(.mushroom .m-glow-core) {
      animation: gs-shroom-core 6s ease-in-out infinite;
      animation-delay: calc(var(--mi, 0) * -0.8s);
    }
    @keyframes gs-shroom-halo {
      0%,
      100% {
        opacity: 0.22;
        transform: scale(0.92);
      }
      50% {
        opacity: 0.42;
        transform: scale(1.08);
      }
    }
    @keyframes gs-shroom-core {
      0%,
      100% {
        opacity: 0.45;
      }
      50% {
        opacity: 0.7;
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
