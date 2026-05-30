<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    mastery: number; // 0.0 to 1.0
    size?: number;   // size in px
  }

  let { mastery, size = 80 }: Props = $props();

  let phase = $state(0);
  let animationFrameId: number;

  onMount(() => {
    const updatePhase = () => {
      phase += 0.04;
      animationFrameId = requestAnimationFrame(updatePhase);
    };
    animationFrameId = requestAnimationFrame(updatePhase);
    return () => cancelAnimationFrame(animationFrameId);
  });

  const isCrystallized = $derived(mastery >= 0.85);

  // Wave rendering calculation (mastery < 0.85)
  // Maps mastery 0.0 -> y position of 80% (low fluid level), and 0.85 -> y position of 20% (high fluid level)
  const yHeight = $derived.by(() => {
    const minHeight = 82; // empty cell fluid line
    const maxHeight = 18; // near full cell fluid line
    // bound mastery between 0 and 0.85
    const bounded = Math.max(0, Math.min(0.85, mastery));
    const ratio = bounded / 0.85;
    return minHeight - ratio * (minHeight - maxHeight);
  });

  // Calculate dynamic liquid wave path
  const wavePath = $derived.by(() => {
    const y = yHeight;
    const p = phase;
    const waveAmp = isCrystallized ? 0 : 3.5;
    const wave1 = y + Math.sin(p) * waveAmp;
    const wave2 = y + Math.cos(p + 1.5) * waveAmp;
    return `M 0 100 L 0 ${wave1} Q 25 ${wave1 - 4} 50 ${wave2} T 100 ${wave1} L 100 100 Z`;
  });
</script>

<div class="mastery-cell" style="width: {size}px; height: {size}px;" class:crystallized={isCrystallized}>
  <svg viewBox="0 0 100 100" class="cell-svg">
    <defs>
      <!-- Fluid Metaball Filter -->
      <filter id="fluid-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 17 -8" result="goo" />
      </filter>

      <!-- Glass Cell Gradient -->
      <linearGradient id="cell-border-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.4)" />
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0.05)" />
      </linearGradient>

      <!-- Iridescent Fluid Gradient -->
      <linearGradient id="fluid-grad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="oklch(0.60 0.12 210 / 0.8)" />
        <stop offset="60%" stop-color="oklch(0.70 0.15 195)" />
        <stop offset="100%" stop-color="oklch(0.82 0.16 180)" />
      </linearGradient>

      <!-- Crystal Core Glow -->
      <radialGradient id="crystal-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="oklch(0.88 0.12 180 / 0.4)" />
        <stop offset="100%" stop-color="oklch(0.88 0.12 180 / 0)" />
      </radialGradient>
      
      <!-- Crystal Faces Gradients -->
      <linearGradient id="crystal-face-left" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="oklch(0.92 0.08 190)" />
        <stop offset="100%" stop-color="oklch(0.72 0.12 195)" />
      </linearGradient>
      <linearGradient id="crystal-face-right" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="oklch(0.86 0.14 180)" />
        <stop offset="100%" stop-color="oklch(0.60 0.16 200)" />
      </linearGradient>
      <linearGradient id="crystal-face-top" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="oklch(0.96 0.06 185)" />
        <stop offset="100%" stop-color="oklch(0.80 0.10 190)" />
      </linearGradient>
    </defs>

    <!-- Cell Outer Ring -->
    <rect x="5" y="5" width="90" height="90" rx="24" fill="none" stroke="url(#cell-border-grad)" stroke-width="2.5" class="cell-border" />

    {#if !isCrystallized}
      <!-- Floating Energy Blobs (underneath main fluid, filtered) -->
      <g filter="url(#fluid-filter)" fill="url(#fluid-grad)">
        <!-- Wave layer -->
        <path d={wavePath} />
        
        <!-- Random floating droplets that merge/split near the surface -->
        <circle cx="25" cy={yHeight + Math.sin(phase * 1.5) * 5 + 6} r="8" />
        <circle cx="75" cy={yHeight + Math.cos(phase * 1.2) * 5 + 6} r="7" />
        <circle cx="50" cy={yHeight + Math.sin(phase) * 6 - 2} r="9.5" />
      </g>
      
      <!-- Inside cell glint -->
      <path d="M 12 25 L 12 40" stroke="rgba(255, 255, 255, 0.2)" stroke-width="2" stroke-linecap="round" fill="none" />
    {:else}
      <!-- Crystallized geometric structure (Faceted Spinning wireframe crystal) -->
      <g class="crystal-group">
        <!-- Back glow -->
        <circle cx="50" cy="50" r="35" fill="url(#crystal-glow)" />

        <!-- Facets of the crystallized node -->
        <!-- Top triangle -->
        <polygon points="50,15 68,36 32,36" fill="url(#crystal-face-top)" opacity="0.95" />
        
        <!-- Center-left face -->
        <polygon points="32,36 50,58 30,68" fill="url(#crystal-face-left)" opacity="0.9" />
        
        <!-- Center-right face -->
        <polygon points="68,36 70,68 50,58" fill="url(#crystal-face-right)" opacity="0.85" />
        
        <!-- Center triangle face -->
        <polygon points="32,36 68,36 50,58" fill="url(#crystal-face-left)" opacity="0.8" />
        
        <!-- Bottom-left face -->
        <polygon points="30,68 50,58 50,85" fill="url(#crystal-face-right)" opacity="0.9" />
        
        <!-- Bottom-right face -->
        <polygon points="70,68 50,85 50,58" fill="url(#crystal-face-left)" opacity="0.95" />
        
        <!-- Specular crystal wireframe overlay -->
        <line x1="50" y1="15" x2="32" y2="36" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="50" y1="15" x2="68" y2="36" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="32" y1="36" x2="68" y2="36" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="32" y1="36" x2="50" y2="58" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="68" y1="36" x2="50" y2="58" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="32" y1="36" x2="30" y2="68" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="68" y1="36" x2="70" y2="68" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="30" y1="68" x2="50" y2="58" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="70" y1="68" x2="50" y2="58" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="30" y1="68" x2="50" y2="85" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="70" y1="68" x2="50" y2="85" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
        <line x1="50" y1="58" x2="50" y2="85" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" />
      </g>
    {/if}
  </svg>
</div>

<style>
  .mastery-cell {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }
  
  .cell-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  
  .cell-border {
    transition: filter 0.3s ease;
  }
  
  .mastery-cell:hover .cell-border {
    filter: drop-shadow(0 0 4px var(--color-primary));
  }
  
  .crystallized .cell-border {
    stroke: var(--glow-crystal);
    filter: drop-shadow(0 0 6px var(--glow-crystal));
  }
  
  /* Crystal Rotation Animation */
  .crystal-group {
    transform-origin: 50px 50px;
    animation: spin-crystal 15s linear infinite;
  }

  @keyframes spin-crystal {
    0% { transform: rotate(0deg) scale(0.95); }
    50% { transform: rotate(180deg) scale(1.02); }
    100% { transform: rotate(360deg) scale(0.95); }
  }
</style>
