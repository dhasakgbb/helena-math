<script lang="ts">
  import { svgFor } from 'astrid-mascot';

  interface Props {
    pose: string;
    size?: number;
  }

  let { pose, size = 120 }: Props = $props();
</script>

<div class="mascot" style="width: {size}px; height: {size}px;" aria-hidden="true">
  {@html svgFor(pose)}
</div>

<style>
  .mascot {
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }
  .mascot :global(svg) {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 4px 12px rgba(0, 255, 224, 0.15));
  }
</style>
