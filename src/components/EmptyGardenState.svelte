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

  function plantFirstSeed() {
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

<div class="empty-garden grain vignette">
  <div class="welcome">
    <div class="lantern"><Mascot pose="waving" size={120} /></div>
    <h1 class="title">Welcome to the Number Garden</h1>
    <p class="sub">It's a quiet twilight. Plant your first seed and watch the garden light up as you learn.</p>

    <button class="btn-seed" onclick={plantFirstSeed}>🌱 Plant my first seed</button>

    <div class="alt-actions">
      <a class="alt-link" href={QUIZ_URL} target="_blank" rel="noopener">Take the quiz</a>
      <span class="dot">·</span>
      <button class="alt-link" aria-expanded={showImport} onclick={() => (showImport = !showImport)}>Import a profile</button>
    </div>

    {#if showImport}
      <div class="import-sheet">
        <textarea bind:value={importText} placeholder="Paste profile JSON…" rows="4"></textarea>
        {#if importError}<p class="import-error" role="alert">{importError}</p>{/if}
        <button class="btn-seed btn-import" onclick={doImport}>Load profile</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .empty-garden {
    position: relative; min-height: 70vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(180deg, var(--sky-top), var(--sky-mid) 55%, var(--sky-bot));
    border-radius: var(--r-lg); overflow: hidden; padding: 2rem;
  }
  .welcome { position: relative; z-index: 1; text-align: center; max-width: 30rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .lantern { filter: drop-shadow(0 0 18px var(--lantern-glow, oklch(88% 0.15 95 / 0.5))); }
  .title { font-family: var(--font-display); font-weight: 700; color: var(--color-text); font-size: 1.7rem; }
  .sub { color: var(--color-text-muted); line-height: 1.5; max-width: 26rem; }
  .btn-seed {
    --glow-c: var(--glow-firefly);
    /* DR-05: Adopt astrid-tokens spacing + radii + motion for profile import buttons.
       Twilight garden colors/glows/illustrations fully preserved; only structural scales + focus ring shared. */
    min-height: var(--touch);
    padding: var(--astrid-spacing-3) var(--astrid-spacing-6);
    border-radius: var(--astrid-radius-md);
    background: var(--color-primary);
    color: var(--btn-text, oklch(20% 0.03 280));
    font-weight: 700;
    font-family: var(--font-display);
    box-shadow: var(--glow-md);
    border: none;
    cursor: pointer;
    font-size: 1.05rem;
    transition: transform var(--astrid-motion-duration-fast) var(--astrid-motion-easing-ease-out),
                box-shadow var(--astrid-motion-duration-base) var(--astrid-motion-easing-ease-out);
  }
  .btn-seed:focus-visible {
    /* Platform-coherent focus using astrid focus ring (cyan thread) + garden personality */
    outline: 3px solid var(--astrid-color-focus-ring);
    outline-offset: 3px;
    border-radius: var(--astrid-radius-sm);
  }
  .btn-seed:active:not(:disabled) {
    transform: translateY(1px);
  }
  .alt-actions { display: flex; align-items: center; gap: 0.6rem; color: var(--color-text-muted); }
  .alt-link { background: none; border: none; color: var(--color-primary); font: inherit; cursor: pointer; text-decoration: underline; padding: 0.4rem; }
  .import-sheet { width: 100%; display: flex; flex-direction: column; gap: var(--astrid-spacing-3); }
  .import-sheet textarea {
    /* DR-05: astrid spacing/radius on profile import UI (cross-room banner pattern) */
    width: 100%; background: var(--color-panel); border: 1px solid var(--color-border);
    border-radius: var(--astrid-radius-lg);
    color: var(--color-text); padding: var(--astrid-spacing-3); font-family: monospace; resize: vertical;
    transition: border-color var(--astrid-motion-duration-fast) var(--astrid-motion-easing-ease-out);
  }
  .import-sheet textarea:focus-visible {
    outline: none;
    border-color: var(--astrid-color-cyan);
    box-shadow: var(--astrid-shadow-glow-cyan-sm);
  }
  .import-error { color: var(--color-retry); font-size: 0.85rem; }
  .btn-import { align-self: center; }
  @media (prefers-reduced-motion: no-preference) {
    .lantern { animation: eg-bob 4s ease-in-out infinite alternate; }
    @keyframes eg-bob { from { transform: translateY(-3px); } to { transform: translateY(3px); } }
  }
</style>
