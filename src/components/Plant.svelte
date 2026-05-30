<script lang="ts">
  interface Props {
    species?: 'moonflower'; // Plan 2 adds more species
    stage: 0 | 1 | 2 | 3 | 4;
    glow?: string; // CSS color; default firefly gold
    size?: number; // px height of the pod
    sparkles?: number; // fluent_facts count -> firefly twinkles above bloom
  }

  let {
    species = 'moonflower',
    stage,
    glow = 'var(--glow-firefly)',
    size = 96,
    sparkles = 0,
  }: Props = $props();

  // Firefly twinkles above the bloom, capped so a high fluency count never
  // floods the canvas. Pre-positioned along a gentle arc over the flower head.
  const SPARK_SLOTS: { x: number; y: number; r: number; d: number }[] = [
    { x: 24, y: 16, r: 0.9, d: 0 },
    { x: 40, y: 13, r: 1.1, d: 0.6 },
    { x: 32, y: 9, r: 0.8, d: 1.2 },
    { x: 17, y: 22, r: 0.7, d: 1.8 },
    { x: 47, y: 21, r: 0.9, d: 2.4 },
  ];
  const sparkleList = $derived(SPARK_SLOTS.slice(0, Math.max(0, Math.min(5, sparkles))));
</script>

<svg
  class="plant"
  viewBox="0 0 64 96"
  style="height:{size}px"
  style:--glow-c={glow}
  data-species={species}
  data-stage={stage}
  aria-hidden="true"
>
  <defs>
    <!-- Wide soft halo behind the bloom: bright core path is drawn sharp on top -->
    <filter id="plant-halo" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.4" />
    </filter>

    <!-- Moonlight key from the upper-left: lit face cooler/brighter, shaded
         face falls into the warm glow color. -->
    <linearGradient id="plant-pot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="oklch(46% 0.05 270)" />
      <stop offset="55%" stop-color="oklch(38% 0.05 275)" />
      <stop offset="100%" stop-color="oklch(28% 0.05 280)" />
    </linearGradient>
    <!-- Ambient occlusion inside the rim: dark pools toward bottom-right. -->
    <radialGradient id="plant-soil" cx="0.38" cy="0.32" r="0.85">
      <stop offset="0%" stop-color="oklch(34% 0.04 285)" />
      <stop offset="100%" stop-color="oklch(20% 0.04 285)" />
    </radialGradient>
    <!-- Bloom core: hot center reading the glow color, fading to translucent. -->
    <radialGradient id="plant-bloom" cx="0.42" cy="0.4" r="0.62">
      <stop offset="0%" stop-color="oklch(98% 0.02 100)" />
      <stop offset="45%" stop-color="var(--glow-c)" />
      <stop offset="100%" stop-color="var(--glow-c)" stop-opacity="0.55" />
    </radialGradient>
    <!-- Single leaf body, lit top-left edge to shaded base. -->
    <linearGradient id="plant-leaf" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="oklch(72% 0.13 165)" />
      <stop offset="100%" stop-color="oklch(48% 0.11 168)" />
    </linearGradient>
  </defs>

  <!-- ===================== POT (always present) ===================== -->
  <!-- Common silhouette reused at every stage: a tapered planter with a rim.
       The body is a hand-tuned trapezoid; the rim sits on top. -->
  <g class="pot">
    <!-- soft contact shadow on the ground -->
    <ellipse cx="32" cy="92" rx="20" ry="3.4" fill="oklch(16% 0.03 280)" opacity="0.55" />
    <!-- pot body -->
    <path
      d="M16 70
         C 16 70 17.5 70 32 70
         C 46.5 70 48 70 48 70
         L 44.5 89
         C 44.5 90.6 43 91.5 40.5 91.5
         L 23.5 91.5
         C 21 91.5 19.5 90.6 19.5 89
         Z"
      fill="url(#plant-pot)"
      stroke="oklch(52% 0.05 270)"
      stroke-width="0.8"
    />
    <!-- moonlit highlight running down the upper-left wall -->
    <path
      d="M20 72 C 21 80 21.5 85 22.5 89.5"
      fill="none"
      stroke="oklch(82% 0.04 260)"
      stroke-width="1.1"
      stroke-linecap="round"
      opacity="0.5"
    />
    <!-- ambient-occlusion core pooling bottom-right inside the body -->
    <path
      d="M22 78 L 42 78 L 40 90 C 40 90.6 39.2 91 38 91 L 26 91 C 24.8 91 24 90.6 24 90 Z"
      fill="oklch(18% 0.03 285)"
      opacity="0.45"
    />
    <!-- rim: lit ellipse top, recessed interior with AO toward bottom-right -->
    <ellipse cx="32" cy="70" rx="16.5" ry="4.4" fill="url(#plant-soil)" />
    <ellipse
      cx="32"
      cy="70"
      rx="16.5"
      ry="4.4"
      fill="none"
      stroke="oklch(58% 0.05 268)"
      stroke-width="1.1"
    />
    <!-- rim top-left specular -->
    <path
      d="M19 68.4 C 22 66.6 27 66 32 66"
      fill="none"
      stroke="oklch(88% 0.03 255)"
      stroke-width="1"
      stroke-linecap="round"
      opacity="0.55"
    />
    <!-- soil mound inside the rim, lit top-left -->
    <path
      d="M21 70.5 C 25 67.8 39 67.8 43 70.5 C 39 71.8 25 71.8 21 70.5 Z"
      fill="oklch(30% 0.04 60)"
    />
  </g>

  <!-- ===================== STAGE 0: seed ===================== -->
  {#if stage === 0}
    <g class="seed">
      <!-- small seed mound nestled in the soil, faintly glowing -->
      <ellipse class="seed-glow" cx="31.5" cy="68.8" rx="3.6" ry="2.2" fill="var(--glow-c)" />
      <path
        d="M28.8 69 C 29.4 66.6 33.6 66.6 34.2 69 C 33 70 30 70 28.8 69 Z"
        fill="oklch(40% 0.05 60)"
      />
      <!-- specular pip catching the moonlight -->
      <circle cx="30.6" cy="67.8" r="0.8" fill="oklch(94% 0.04 95)" opacity="0.8" />
    </g>
  {/if}

  <!-- ===================== STAGE 1: seedling ===================== -->
  {#if stage === 1}
    <g class="bloom seedling">
      <!-- one thin curved stem, the canonical stem weight -->
      <path
        class="stem"
        d="M32 69 C 31 62 30.5 58 31.5 53"
        fill="none"
        stroke="oklch(60% 0.12 165)"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <!-- one tiny leaf on the lit (left) side -->
      <path
        d="M31 60 C 26.5 58.5 24.5 60.5 25 63 C 28 63 30.5 62 31 60 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(66% 0.12 165)"
        stroke-width="0.5"
      />
      <!-- tender growing tip, faint glow -->
      <circle cx="31.5" cy="52.6" r="1.6" fill="var(--glow-c)" opacity="0.7" />
    </g>
  {/if}

  <!-- ===================== STAGE 2: sprout ===================== -->
  {#if stage === 2}
    <g class="bloom sprout">
      <!-- taller stem, identical weight to stage 1 -->
      <path
        class="stem"
        d="M32 69 C 30.5 60 30 50 32 41"
        fill="none"
        stroke="oklch(60% 0.12 165)"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <!-- lower-left leaf -->
      <path
        d="M31 56 C 25 54 22.5 56.5 23.2 59.8 C 27 60 30 58.6 31 56 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(66% 0.12 165)"
        stroke-width="0.5"
      />
      <!-- higher-right leaf (slightly shaded, right side away from key light) -->
      <path
        d="M31.6 48 C 38 46 40.6 48.6 39.8 52 C 35.8 52 32.6 50.6 31.6 48 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(60% 0.11 168)"
        stroke-width="0.5"
        opacity="0.9"
      />
      <circle cx="32" cy="40.6" r="1.7" fill="var(--glow-c)" opacity="0.7" />
    </g>
  {/if}

  <!-- ===================== STAGE 3: bud ===================== -->
  {#if stage === 3}
    <g class="bloom bud">
      <!-- stem extends further up -->
      <path
        class="stem"
        d="M32 69 C 30.5 58 30 44 32 33"
        fill="none"
        stroke="oklch(60% 0.12 165)"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <!-- paired sepal leaves cradling the bud -->
      <path
        d="M31 54 C 25 52 22.5 54.5 23.2 57.8 C 27 58 30 56.6 31 54 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(66% 0.12 165)"
        stroke-width="0.5"
      />
      <path
        d="M31.8 47 C 38 45 40.6 47.6 39.8 51 C 35.8 51 32.6 49.6 31.8 47 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(60% 0.11 168)"
        stroke-width="0.5"
        opacity="0.9"
      />
      <!-- closed teardrop bud in the glow color -->
      <g class="head" filter="url(#plant-halo)">
        <path
          d="M32 24
             C 27.5 27 27.5 33 30 36
             C 31 36.8 33 36.8 34 36
             C 36.5 33 36.5 27 32 24 Z"
          fill="var(--glow-c)"
          opacity="0.5"
        />
      </g>
      <path
        d="M32 24
           C 27.5 27 27.5 33 30 36
           C 31 36.8 33 36.8 34 36
           C 36.5 33 36.5 27 32 24 Z"
        fill="var(--glow-c)"
        stroke="oklch(70% 0.1 200)"
        stroke-width="0.4"
      />
      <!-- subtle inner core glint, offset to the lit upper-left -->
      <ellipse cx="30.6" cy="30" rx="1.4" ry="3" fill="oklch(96% 0.02 100)" opacity="0.7" />
    </g>
  {/if}

  <!-- ===================== STAGE 4: bloom ===================== -->
  {#if stage === 4}
    <g class="bloom flower">
      <!-- stem at full height -->
      <path
        class="stem"
        d="M32 69 C 30.5 58 30 42 32 30"
        fill="none"
        stroke="oklch(60% 0.12 165)"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <!-- a leaf pair lower on the stem -->
      <path
        d="M31 54 C 25 52 22.5 54.5 23.2 57.8 C 27 58 30 56.6 31 54 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(66% 0.12 165)"
        stroke-width="0.5"
      />
      <path
        d="M31.8 47 C 38 45 40.6 47.6 39.8 51 C 35.8 51 32.6 49.6 31.8 47 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(60% 0.11 168)"
        stroke-width="0.5"
        opacity="0.9"
      />

      <g class="head">
        <!-- LAYER 1: wide soft halo (blurred copy of the petal disc) -->
        <circle cx="32" cy="22" r="13" fill="var(--glow-c)" opacity="0.45" filter="url(#plant-halo)" />

        <!-- LAYER 2: five petals around the center, hand-tuned teardrops.
             Each petal is one bezier loop; the ring reads as a moonflower. -->
        <g class="petals">
          <!-- top -->
          <path
            d="M32 22 C 29.5 14 30.5 7 32 6 C 33.5 7 34.5 14 32 22 Z"
            fill="var(--glow-c)"
            opacity="0.92"
          />
          <!-- upper-right -->
          <path
            d="M32 22 C 38 18 43.5 16 44.5 17.5 C 44.5 19.5 39.5 23 32 22 Z"
            fill="var(--glow-c)"
            opacity="0.85"
          />
          <!-- lower-right -->
          <path
            d="M32 22 C 38 25 42 30 41 31.5 C 39 32 33.5 29 32 22 Z"
            fill="var(--glow-c)"
            opacity="0.8"
          />
          <!-- lower-left -->
          <path
            d="M32 22 C 26 25 22 30 23 31.5 C 25 32 30.5 29 32 22 Z"
            fill="var(--glow-c)"
            opacity="0.82"
          />
          <!-- upper-left (most lit by the key light, slightly brighter) -->
          <path
            d="M32 22 C 26 18 20.5 16 19.5 17.5 C 19.5 19.5 24.5 23 32 22 Z"
            fill="var(--glow-c)"
            opacity="0.95"
          />
        </g>

        <!-- LAYER 3: tight bright core -->
        <circle cx="32" cy="22" r="5.4" fill="url(#plant-bloom)" />
        <!-- core specular catching the upper-left moonlight -->
        <circle cx="30.2" cy="20.2" r="1.7" fill="oklch(99% 0.01 100)" opacity="0.85" />
      </g>
    </g>

    <!-- firefly twinkles drifting above the bloom, gated to stage 4 -->
    {#if sparkleList.length > 0}
      <g class="sparkles" aria-hidden="true">
        {#each sparkleList as s, i (i)}
          <circle
            class="spark"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="var(--glow-firefly)"
            style="--d:{s.d}s"
          />
        {/each}
      </g>
    {/if}
  {/if}
</svg>

<style>
  .plant {
    display: block;
    overflow: visible;
  }

  /* The whole illustration emits its own bioluminescence on top of the
     moonlight key. Layered drop-shadows = tight core + wide soft halo. */
  .plant :global(.bloom .head),
  .plant :global(.seed-glow) {
    filter:
      drop-shadow(0 0 3px var(--glow-c))
      drop-shadow(0 0 12px var(--glow-c));
  }

  @media (prefers-reduced-motion: no-preference) {
    /* gentle bloom sway, pivoting from the soil */
    .plant :global(.bloom) {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      animation: plant-sway 4s ease-in-out infinite alternate;
    }

    /* fireflies drift up and twinkle, each offset by its --d delay */
    .plant :global(.spark) {
      transform-box: fill-box;
      transform-origin: center;
      animation: plant-twinkle 3.2s ease-in-out infinite;
      animation-delay: var(--d, 0s);
    }

    @keyframes plant-sway {
      from {
        transform: rotate(-2.5deg);
      }
      to {
        transform: rotate(2.5deg);
      }
    }

    @keyframes plant-twinkle {
      0%,
      100% {
        opacity: 0.2;
        transform: translateY(1px) scale(0.7);
      }
      50% {
        opacity: 1;
        transform: translateY(-2px) scale(1.15);
      }
    }
  }
</style>
