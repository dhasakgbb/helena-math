<script lang="ts">
  import { profileStore } from '../lib/profile.svelte';

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  const facts = $derived.by(() => {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    return mathOverrides.times_tables_facts || {};
  });

  const isMastered = (r: number, c: number) => {
    return (facts[r] >= 5) || (facts[c] >= 5);
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onClose}>
  <div class="modal-content glass-panel" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2>Times Tables Mastery</h2>
      <button class="close-btn" onclick={onClose}>✕</button>
    </div>
    <div class="grid-container">
      <div class="times-grid">
        <!-- Header row -->
        <div class="cell header empty">×</div>
        {#each Array(12) as _, c}
          <div class="cell header col-header">{c + 1}</div>
        {/each}

        <!-- Grid rows -->
        {#each Array(12) as _, r}
          <div class="cell header row-header">{r + 1}</div>
          {#each Array(12) as _, c}
            <div class="cell" class:mastered={isMastered(r + 1, c + 1)}>
              {(r + 1) * (c + 1)}
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: linear-gradient(135deg, rgba(24, 22, 54, 0.95), rgba(9, 8, 25, 0.98));
    border: 1px solid rgba(255, 0, 127, 0.3);
    border-radius: 20px;
    padding: 2rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 0 30px rgba(255, 0, 127, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .modal-header h2 {
    margin: 0;
    color: var(--color-primary, #fff);
  }

  .close-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .close-btn:hover {
    opacity: 1;
  }

  .grid-container {
    overflow-x: auto;
  }

  .times-grid {
    display: grid;
    grid-template-columns: repeat(13, minmax(30px, 1fr));
    gap: 4px;
    font-family: var(--font-display, sans-serif);
  }

  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    color: #fff;
    font-size: 0.9rem;
  }

  .cell.header {
    background: rgba(255, 255, 255, 0.15);
    font-weight: bold;
    color: var(--neon-cyan, #00ffe0);
  }

  .cell.mastered {
    background: rgba(255, 0, 127, 0.2);
    color: #ff007f;
    font-weight: bold;
    border: 1px solid rgba(255, 0, 127, 0.5);
    text-shadow: 0 0 5px rgba(255, 0, 127, 0.5);
  }
</style>
