<script lang="ts">
  import { profileStore } from '../lib/profile.svelte';
  import Mascot from './Mascot.svelte';

  interface Props {
    onStart: () => void; // called after a profile exists, to refresh/continue
  }
  let { onStart }: Props = $props();

  let showImport = $state(false);
  let importText = $state('');
  let importError = $state('');

  const QUIZ_URL = 'https://helena-learner-profile.vercel.app/hub';

  function initializeCore() {
    profileStore.initializeDefaultProfile();
    onStart();
  }

  function doImport() {
    const res = profileStore.importFromText(importText);
    if (res.ok) {
      importError = '';
      showImport = false;
      onStart();
    } else {
      importError = res.error ?? 'Could not read that profile.';
    }
  }
</script>

<div class="empty-topology animate-entrance">
  <div class="welcome glass-panel">
    <div class="mascot-holder">
      <Mascot pose="waving" size={130} />
    </div>
    <h1 class="title">Welcome to the Topology Network</h1>
    <p class="sub">
      A beautiful mathematical ecosystem. Nurture math cells and stabilize their energy structures as you learn.
    </p>

    <button class="btn-initialize btn-primary" onclick={initializeCore}>
      🧬 Initialize Core Cells
    </button>

    <div class="alt-actions">
      <a class="alt-link" href={QUIZ_URL} target="_blank" rel="noopener">Take the quiz</a>
      <span class="dot">·</span>
      <button class="alt-link" aria-expanded={showImport} onclick={() => (showImport = !showImport)}>Import a profile</button>
    </div>

    {#if showImport}
      <div class="import-sheet">
        <textarea bind:value={importText} placeholder="Paste profile JSON…" rows="4"></textarea>
        {#if importError}<p class="import-error" role="alert">{importError}</p>{/if}
        <button class="btn-primary btn-import" onclick={doImport}>Load profile</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .empty-topology {
    position: relative;
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .welcome {
    position: relative;
    z-index: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 3rem 2rem;
    width: 100%;
  }

  .mascot-holder {
    animation: eg-bob 4s ease-in-out infinite alternate;
  }
  
  @keyframes eg-bob {
    from { transform: translateY(-5px); }
    to { transform: translateY(5px); }
  }

  .title {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--color-text);
    font-size: 1.9rem;
    margin: 0;
  }

  .sub {
    color: var(--color-text-muted);
    line-height: 1.6;
    font-size: 1rem;
    margin: 0;
  }

  .btn-initialize {
    min-height: var(--touch);
    padding: 0.8rem 2rem;
    cursor: pointer;
    font-size: 1.1rem;
    font-family: var(--font-display);
  }

  .btn-initialize:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 3px;
  }

  .alt-actions {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .alt-link {
    background: none;
    border: none;
    color: var(--color-primary);
    font: inherit;
    cursor: pointer;
    text-decoration: underline;
    padding: 0.4rem;
  }

  .import-sheet {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  .import-sheet textarea {
    width: 100%;
    background: oklch(0.14 0.02 210 / 0.7);
    border: 1px solid var(--color-border);
    border-radius: var(--r-md);
    color: var(--color-text);
    padding: 1rem;
    font-family: monospace;
    font-size: 0.85rem;
    resize: vertical;
  }

  .import-sheet textarea:focus {
    outline: 2px solid var(--color-primary);
    border-color: var(--color-primary);
  }

  .import-error {
    color: var(--color-retry);
    font-size: 0.85rem;
    margin: 0;
  }

  .btn-import {
    align-self: center;
    padding: 0.6rem 1.5rem;
    font-size: 0.95rem;
  }
</style>
