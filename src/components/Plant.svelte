<script lang="ts">
  import type { PlantSpecies } from './SpeciesMap';

  interface Props {
    species?: PlantSpecies;
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
      <!-- a short, thin stem — barely above the soil -->
      <path
        class="stem"
        d="M32 69 C 31.4 65 31 63 31.6 60.5"
        fill="none"
        stroke="oklch(60% 0.12 165)"
        stroke-width="2"
        stroke-linecap="round"
      />
      <!-- one small leaf on the lit (left) side -->
      <path
        d="M31.4 64 C 28 62.8 26.4 64.2 26.8 66.2 C 29.2 66.2 30.8 65.4 31.4 64 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(66% 0.12 165)"
        stroke-width="0.5"
      />
      <!-- tender growing tip, faint glow -->
      <circle cx="31.6" cy="60.2" r="1.4" fill="var(--glow-c)" opacity="0.6" />
    </g>
  {/if}

  <!-- ===================== STAGE 2: sprout ===================== -->
  {#if stage === 2}
    <g class="bloom sprout">
      <!-- clearly taller, thicker stem — reads as established growth -->
      <path
        class="stem"
        d="M32 69 C 30 59 29.5 48 32 39"
        fill="none"
        stroke="oklch(60% 0.12 165)"
        stroke-width="3"
        stroke-linecap="round"
      />
      <!-- lower-left leaf — broad and full -->
      <path
        d="M31 58 C 23 55.5 19.5 58.5 20.5 62.8 C 25.5 63.2 29.5 61.4 31 58 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(66% 0.12 165)"
        stroke-width="0.6"
      />
      <!-- higher-right leaf — broad, slightly shaded (away from key light) -->
      <path
        d="M31.6 49 C 40 46.5 43.5 49.5 42.5 53.8 C 37.5 54.2 33 52.4 31.6 49 Z"
        fill="url(#plant-leaf)"
        stroke="oklch(60% 0.11 168)"
        stroke-width="0.6"
        opacity="0.92"
      />
      <circle cx="32" cy="38.6" r="1.8" fill="var(--glow-c)" opacity="0.75" />
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

        <!-- LAYER 2: petal/head group, branched by species. All groups center
             on (32,22), fill var(--glow-c) so per-grove glow flows through, and
             obey the upper-left moonlight key (lit elements highest opacity). -->
        {#if species === 'moonflower'}
          <!-- six broad round-lobed petals around (32,22) — a compact daisy/blossom.
               Each petal is a fat rounded oval with a blunt tip (wide shoulders,
               no sharp points), reaching ~r12 so the bloom stays compact and reads
               as a ROUND FLOWER, never a star. 60° apart; upper-left lit brightest. -->
          <g class="petals">
            <!-- top -->
            <path
              d="M32 22 C 26.5 18 26 12 32 10.8 C 38 12 37.5 18 32 22 Z"
              fill="var(--glow-c)"
              opacity="0.92"
            />
            <!-- upper-right -->
            <path
              d="M32 22 C 32.7 15.2 37.7 11.8 41.7 16.4 C 43.7 22.2 38.2 24.8 32 22 Z"
              fill="var(--glow-c)"
              opacity="0.85"
            />
            <!-- lower-right -->
            <path
              d="M32 22 C 38.2 19.2 43.7 21.8 41.7 27.6 C 37.7 32.2 32.7 28.8 32 22 Z"
              fill="var(--glow-c)"
              opacity="0.8"
            />
            <!-- bottom -->
            <path
              d="M32 22 C 37.5 26 38 32 32 33.2 C 26 32 26.5 26 32 22 Z"
              fill="var(--glow-c)"
              opacity="0.82"
            />
            <!-- lower-left -->
            <path
              d="M32 22 C 31.3 28.8 26.3 32.2 22.3 27.6 C 20.3 21.8 25.8 19.2 32 22 Z"
              fill="var(--glow-c)"
              opacity="0.85"
            />
            <!-- upper-left (most lit by the key light, slightly brighter) -->
            <path
              d="M32 22 C 25.8 24.8 20.3 22.2 22.3 16.4 C 26.3 11.8 31.3 15.2 32 22 Z"
              fill="var(--glow-c)"
              opacity="0.95"
            />
          </g>
        {:else if species === 'starbloom'}
          <!-- five sharp slender spikes radiating from (32,22) — reads as a star.
               Each spike is a thin kite: tip → two shoulders → back to center.
               Longer and thinner than the moonflower teardrops. -->
          <g class="petals">
            <!-- top spike -->
            <path
              d="M32 22 L 30.6 9 L 32 3.5 L 33.4 9 Z"
              fill="var(--glow-c)"
              opacity="0.9"
            />
            <!-- upper-right spike -->
            <path
              d="M32 22 L 41.5 14.5 L 46.5 11.5 L 43 17 Z"
              fill="var(--glow-c)"
              opacity="0.86"
            />
            <!-- lower-right spike -->
            <path
              d="M32 22 L 40 30.5 L 43 35.5 L 37.5 32.5 Z"
              fill="var(--glow-c)"
              opacity="0.8"
            />
            <!-- lower-left spike -->
            <path
              d="M32 22 L 24 30.5 L 21 35.5 L 26.5 32.5 Z"
              fill="var(--glow-c)"
              opacity="0.83"
            />
            <!-- upper-left spike (most lit by the key light) -->
            <path
              d="M32 22 L 22.5 14.5 L 17.5 11.5 L 21 17 Z"
              fill="var(--glow-c)"
              opacity="0.95"
            />
          </g>
        {:else if species === 'bellflower'}
          <!-- three drooping bells hanging from a slightly higher node (~32,18),
               each flaring downward (foxglove/bluebell feel). Side bells angle
               out-and-down; the lit (left) bell carries the highest opacity. -->
          <g class="petals">
            <!-- right bell (away from key light, shaded) -->
            <path
              d="M32 18 C 40 21 43.5 28.5 40 33 C 37.5 34.5 34 32 32 27 C 31.4 24 31.4 21 32 18 Z"
              fill="var(--glow-c)"
              opacity="0.82"
            />
            <!-- center bell, pointing straight down -->
            <path
              d="M32 18 C 26.5 25 26.5 32.5 29 35.5 C 30.3 36.6 33.7 36.6 35 35.5 C 37.5 32.5 37.5 25 32 18 Z"
              fill="var(--glow-c)"
              opacity="0.88"
            />
            <!-- left bell (most lit by the key light) -->
            <path
              d="M32 18 C 24 21 20.5 28.5 24 33 C 26.5 34.5 30 32 32 27 C 32.6 24 32.6 21 32 18 Z"
              fill="var(--glow-c)"
              opacity="0.92"
            />
          </g>
        {:else}
          <!-- gembud: faceted crystal cluster around (32,22). Four angular
               diamond facets at stepped opacity (upper-left brightest), with
               thin bright rim lines on the lit upper-left edges to read as cut
               crystal. -->
          <g class="petals gem">
            <!-- right facet (shaded) -->
            <path
              d="M37 18 L 42.5 24 L 36 32.5 L 32 24 Z"
              fill="var(--glow-c)"
              opacity="0.8"
            />
            <!-- bottom facet -->
            <path
              d="M28 32.5 L 32 24 L 36 32.5 L 32 37.5 Z"
              fill="var(--glow-c)"
              opacity="0.83"
            />
            <!-- top facet -->
            <path
              d="M32 9.5 L 37 18 L 32 24 L 27 18 Z"
              fill="var(--glow-c)"
              opacity="0.9"
            />
            <!-- left facet (most lit by the key light) -->
            <path
              d="M27 18 L 32 24 L 28 32.5 L 21.5 24 Z"
              fill="var(--glow-c)"
              opacity="0.95"
            />
            <!-- bright rim lines on the lit upper-left facet edges -->
            <path
              d="M32 9.5 L 27 18 L 21.5 24"
              fill="none"
              stroke="oklch(95% 0.02 280)"
              stroke-width="0.4"
              stroke-linejoin="round"
              opacity="0.7"
            />
            <path
              d="M27 18 L 32 24"
              fill="none"
              stroke="oklch(95% 0.02 280)"
              stroke-width="0.4"
              stroke-linecap="round"
              opacity="0.6"
            />
          </g>
        {/if}

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
