<script lang="ts">
  import { onMount } from 'svelte';
  import { profileStore, type MathMode } from './lib/profile.svelte';
  import HubScreen from './screens/HubScreen.svelte';
  import GameScreen from './screens/GameScreen.svelte';
  import EndScreen from './screens/EndScreen.svelte';

  // Router screen state
  let currentScreen = $state<'hub' | 'game' | 'end'>('hub');
  let selectedMode = $state<MathMode | null>(null);

  // Scores
  let lastScore = $state(0);
  let lastTotal = $state(0);

  // End-screen bloom-moment data
  let lastMode = $state<string | null>(null);
  let ringFrom = $state(0);
  let ringTo = $state(0);
  let bloomed = $state(false);
  let isPersonalBest = $state(false);

  // Toast
  let toastMessage = $state<string | null>(null);
  let toastClass = $state<'ok' | 'bad' | ''>('');

  onMount(() => {
    // Try to import profile from hash
    const importResult = profileStore.tryImportFromHash();
    if (importResult === 'imported') {
      showToast("Profile loaded! Astrid has recommended a customized mode.", 'ok');
    } else if (importResult === 'invalid') {
      showToast("Could not read profile link data.", 'bad');
    }

    window.addEventListener('hashchange', handleHashChange);
  });

  function handleHashChange() {
    const result = profileStore.tryImportFromHash();
    if (result === 'imported') {
      showToast("Profile loaded successfully!", 'ok');
    } else if (result === 'invalid') {
      showToast("New profile link was invalid.", 'bad');
    }
  }

  function showToast(msg: string, type: 'ok' | 'bad') {
    toastMessage = msg;
    toastClass = type;
    setTimeout(() => {
      toastMessage = null;
      toastClass = '';
    }, 4500);
  }

  // Safe grade extractor
  const gradeLevel = $derived(profileStore.profile ? (profileStore.profile as any).grade_level ?? 4 : 4);

  // Mastery + ring-fill helpers for the end-screen bloom moment.
  const gateMastery = (m: string) =>
    (profileStore.profile?.module_overrides?.math as any)?.mastery?.[m] ?? 0;
  const ringFill = (m: string) =>
    m === 'times-tables' ? profileStore.timesTablesRingFill : gateMastery(m);

  function handleSelectMode(mode: string) {
    selectedMode = mode as MathMode;
    
    // Record telemetry launch — smartPick is the single source of truth (spec §10.6)
    const recommended = profileStore.smartPick;
    profileStore.recordLaunch(selectedMode, recommended);
    profileStore.advanceSession();

    currentScreen = 'game';
  }

  function handleGameFinished(score: number, total: number) {
    lastScore = score;
    lastTotal = total;
    if (selectedMode) {
      const m = selectedMode;
      const prevGate = gateMastery(m);
      const prevRing = ringFill(m);
      // personal best = beat the best PRIOR ratio (first-ever play is not a "new best")
      const prior = ((profileStore.profile?.module_overrides?.math as any)?.scores?.[m]) ?? [];
      const prevBestRatio = prior.length
        ? Math.max(...prior.map((s: any) => s.score / s.total))
        : -1;
      profileStore.recordGameResult(m, score, total, gradeLevel);
      lastMode = m;
      ringFrom = prevRing;
      ringTo = ringFill(m);
      bloomed = prevGate < 0.85 && gateMastery(m) >= 0.85;
      isPersonalBest = prior.length > 0 && score / total > prevBestRatio;
    }
    currentScreen = 'end';
  }
</script>

<div class="app-layout">
  <main class="main-content">
    {#if currentScreen === 'hub'}
      <HubScreen onSelectMode={handleSelectMode} />
    {:else}
      <!-- Safe checks to ensure selectedMode is defined -->
      {#if selectedMode}
        {#if currentScreen === 'game'}
          <GameScreen
            mode={selectedMode}
            grade={gradeLevel}
            onBack={() => currentScreen = 'hub'}
            onFinished={handleGameFinished}
          />
        {:else if currentScreen === 'end'}
          <EndScreen
            mode={lastMode ?? selectedMode}
            score={lastScore}
            total={lastTotal}
            ringFrom={ringFrom}
            ringTo={ringTo}
            bloomed={bloomed}
            isPersonalBest={isPersonalBest}
            onPlayAgain={() => currentScreen = 'game'}
            onPickAnother={() => currentScreen = 'hub'}
            onSelectNext={(m) => handleSelectMode(m)}
          />
        {/if}
      {/if}
    {/if}
  </main>

  <footer class="app-footer no-print">
    <span>Part of the Astrid learning platform.</span>
    <a href="https://helena-learner-profile.vercel.app/hub" target="_blank" rel="noopener">All games →</a>
  </footer>

  <!-- Toasts -->
  {#if toastMessage}
    <div class="toast-popup {toastClass}" role="status" aria-live="polite">
      {toastMessage}
    </div>
  {/if}
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 2rem 1rem;
    box-sizing: border-box;
  }

  .main-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .app-footer {
    margin-top: 2rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    display: flex;
    gap: 1rem;
  }
  .app-footer a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
  }
  .app-footer a:hover {
    text-decoration: underline;
  }

  .toast-popup {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-panel);
    border: 1px solid var(--color-border);
    padding: 0.8rem 1.5rem;
    border-radius: var(--r-md);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
    z-index: 999;
    font-size: 0.95rem;
    font-weight: 600;
    max-width: 90%;
    text-align: center;
  }
  .toast-popup.ok {
    color: var(--color-correct);
    border-color: oklch(70% 0.18 165 / 0.35);
  }
  .toast-popup.bad {
    color: var(--color-retry);
    border-color: oklch(65% 0.20 25 / 0.35);
  }
</style>
