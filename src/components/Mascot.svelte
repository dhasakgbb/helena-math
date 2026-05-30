<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    pose: 'waving' | 'cheering' | 'thinking' | 'happy' | 'wow' | 'sad' | 'sleeping';
    size?: number;
  }

  let { pose, size = 120 }: Props = $props();

  let time = $state(0);
  let animationFrameId: number;

  onMount(() => {
    const updateTime = () => {
      time += 0.05;
      animationFrameId = requestAnimationFrame(updateTime);
    };
    animationFrameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationFrameId);
  });

  // Calculate dynamic node positions based on the active pose and time for idle movement.
  const positions = $derived.by(() => {
    const t = time;
    const center = { x: 50, y: 50, r: 24 };
    let nodes: Array<{ x: number; y: number; r: number }> = [];
    let eyes = {
      left: { x: 44, y: 46, rx: 3, ry: 4, isOpen: true },
      right: { x: 56, y: 46, rx: 3, ry: 4, isOpen: true }
    };
    let smilePath = "M 42 58 Q 50 63 58 58";

    if (pose === 'waving') {
      // One large hand node waving high up and down, one steady node
      nodes = [
        { x: 22 + Math.sin(t * 1.5) * 4, y: 52 + Math.cos(t) * 3, r: 10 }, // left arm
        { x: 74 + Math.sin(t * 3.5) * 5, y: 28 + Math.cos(t * 3.5) * 3, r: 9 }  // right arm waving high
      ];
      eyes.left.y += Math.sin(t) * 0.5;
      eyes.right.y += Math.sin(t) * 0.5;
      smilePath = "M 44 56 Q 50 61 56 56";
    } else if (pose === 'cheering') {
      // Both hands cheering high up, body bouncing
      const bounce = Math.sin(t * 4) * 3;
      center.y += bounce;
      nodes = [
        { x: 20 + Math.sin(t * 4) * 3, y: 26 + bounce, r: 9 },
        { x: 80 - Math.sin(t * 4) * 3, y: 26 + bounce, r: 9 }
      ];
      eyes.left.y += bounce;
      eyes.right.y += bounce;
      eyes.left.ry = 6;
      eyes.right.ry = 6;
      smilePath = `M 40 ${54 + bounce} Q 50 ${65 + bounce} 60 ${54 + bounce}`;
    } else if (pose === 'thinking') {
      // Satellites orbiting in vertical/elongated fashion
      nodes = [
        { x: 50 + Math.sin(t) * 20, y: 50 + Math.cos(t * 1.5) * 12, r: 8 },
        { x: 30 + Math.sin(t * 0.8) * 4, y: 64, r: 10 }
      ];
      eyes.left.rx = 3; eyes.left.ry = 3;
      eyes.right.rx = 3; eyes.right.ry = 3;
      smilePath = "M 45 56 Q 50 56 55 56"; // Straight mouth
    } else if (pose === 'happy') {
      // Nodes bounce outwards, happy squinty eyes
      nodes = [
        { x: 24 + Math.sin(t * 2) * 2, y: 50, r: 11 },
        { x: 76 - Math.sin(t * 2) * 2, y: 50, r: 11 }
      ];
      eyes.left.isOpen = false;
      eyes.right.isOpen = false;
      smilePath = "M 42 54 Q 50 64 58 54";
    } else if (pose === 'wow') {
      // Concentric explosion of small metaballs, eyes wide open
      nodes = [
        { x: 50 + Math.cos(t * 5) * 28, y: 50 + Math.sin(t * 5) * 28, r: 6 },
        { x: 50 + Math.cos(t * 5 + Math.PI) * 28, y: 50 + Math.sin(t * 5 + Math.PI) * 28, r: 6 },
        { x: 24, y: 48, r: 9 },
        { x: 76, y: 48, r: 9 }
      ];
      eyes.left.rx = 4; eyes.left.ry = 7;
      eyes.right.rx = 4; eyes.right.ry = 7;
      smilePath = "M 44 58 Q 50 66 56 58";
    } else if (pose === 'sad') {
      // Slumped down, tiny nodes
      center.y += 4;
      nodes = [
        { x: 24, y: 62, r: 7 },
        { x: 76, y: 62, r: 7 }
      ];
      eyes.left.isOpen = true; eyes.left.rx = 3; eyes.left.ry = 2; // droopy
      eyes.right.isOpen = true; eyes.right.rx = 3; eyes.right.ry = 2;
      smilePath = "M 44 58 Q 50 52 56 58"; // inverted smile
    } else if (pose === 'sleeping') {
      // Slow breathing cycle, eyes closed (straight lines)
      const breathing = Math.sin(t * 0.8) * 1.5;
      center.r += breathing;
      nodes = [
        { x: 28, y: 54 + breathing, r: 8 },
        { x: 72, y: 54 + breathing, r: 8 }
      ];
      eyes.left.isOpen = false;
      eyes.right.isOpen = false;
      smilePath = "M 46 56 Q 50 58 54 56";
    }

    return { center, nodes, eyes, smilePath };
  });
</script>

<div class="mascot-wrapper" style="width: {size}px; height: {size}px;" aria-hidden="true">
  <svg viewBox="0 0 100 100" class="mascot-svg">
    <defs>
      <!-- Metaball filter -->
      <filter id="metaball-filter-astrid" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>

      <!-- Iridescent Liquid Metal Gradient -->
      <linearGradient id="liquid-gradient-astrid" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="oklch(0.85 0.12 190)" />
        <stop offset="50%" stop-color="oklch(0.72 0.15 195)" />
        <stop offset="100%" stop-color="oklch(0.60 0.18 210)" />
      </linearGradient>
    </defs>

    <!-- Filtered liquid metaball body -->
    <g filter="url(#metaball-filter-astrid)" fill="url(#liquid-gradient-astrid)">
      <!-- Main Core -->
      <circle cx={positions.center.x} cy={positions.center.y} r={positions.center.r} />
      <!-- Satellites -->
      {#each positions.nodes as node}
        <circle cx={node.x} cy={node.y} r={node.r} />
      {/each}
    </g>

    <!-- Eyes (Rendered on top without blur filter for pixel-sharp clarity) -->
    <g fill="oklch(0.20 0.04 210)">
      {#if positions.eyes.left.isOpen}
        <ellipse cx={positions.eyes.left.x} cy={positions.eyes.left.y} rx={positions.eyes.left.rx} ry={positions.eyes.left.ry} />
      {:else}
        <!-- Squinting line -->
        <path d="M {positions.eyes.left.x - 3} {positions.eyes.left.y} Q {positions.eyes.left.x} {positions.eyes.left.y - 2} {positions.eyes.left.x + 3} {positions.eyes.left.y}" stroke="oklch(0.20 0.04 210)" stroke-width="2" stroke-linecap="round" fill="none" />
      {/if}

      {#if positions.eyes.right.isOpen}
        <ellipse cx={positions.eyes.right.x} cy={positions.eyes.right.y} rx={positions.eyes.right.rx} ry={positions.eyes.right.ry} />
      {:else}
        <!-- Squinting line -->
        <path d="M {positions.eyes.right.x - 3} {positions.eyes.right.y} Q {positions.eyes.right.x} {positions.eyes.right.y - 2} {positions.eyes.right.x + 3} {positions.eyes.right.y}" stroke="oklch(0.20 0.04 210)" stroke-width="2" stroke-linecap="round" fill="none" />
      {/if}
    </g>

    <!-- Mouth / Smile -->
    <path d={positions.smilePath} stroke="oklch(0.20 0.04 210)" stroke-width="2.5" stroke-linecap="round" fill="none" />
  </svg>
</div>

<style>
  .mascot-wrapper {
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }
  
  .mascot-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: drop-shadow(0 8px 24px oklch(0.70 0.12 190 / 0.25));
  }
</style>
