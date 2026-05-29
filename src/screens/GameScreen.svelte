<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { profileStore } from '../lib/profile.svelte';
  import Mascot from '../components/Mascot.svelte';
  import TimesTables from '../games/TimesTables.svelte';
  import SpeedAdd from '../games/SpeedAdd.svelte';
  import NumberSort from '../games/NumberSort.svelte';
  import FractionGarden from '../games/FractionGarden.svelte';
  import PlaceValueCosmos from '../games/PlaceValueCosmos.svelte';
  import MultiplicationGrid from '../games/MultiplicationGrid.svelte';
  import LongDivisionSpace from '../games/LongDivisionSpace.svelte';
  import DecimalGridZoom from '../games/DecimalGridZoom.svelte';
  import GeometryConstellation from '../games/GeometryConstellation.svelte';
  import PEMDASTree from '../games/PEMDASTree.svelte';

  interface Props {
    mode: string;
    grade: number;
    onBack: () => void;
    onFinished: (score: number, total: number) => void;
  }

  let { mode, grade, onBack, onFinished }: Props = $props();

  // Mascot reactive pose state
  let mascotPose = $state<'thinking' | 'happy' | 'wow' | 'sad' | 'sleeping'>('thinking');
  let astridMessage = $state<string>('');
  let currentStreak = $state(0);

  // Inactivity / Sleeping Timer
  let inactivityTimer = $state<any>(null);
  const SLEEP_TIMEOUT = 120000; // 2 minutes

  onMount(() => {
    resetInactivityTimer();
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);
  });

  onDestroy(() => {
    clearInactivityTimer();
    window.removeEventListener('click', resetInactivityTimer);
    window.removeEventListener('keydown', resetInactivityTimer);
    window.removeEventListener('touchstart', resetInactivityTimer);
  });

  function clearInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
  }

  function resetInactivityTimer() {
    clearInactivityTimer();
    
    // If Astrid was sleeping, wake her up
    if (mascotPose === 'sleeping') {
      triggerPose('thinking');
    }

    inactivityTimer = setTimeout(() => {
      mascotPose = 'sleeping';
    }, SLEEP_TIMEOUT);
  }

  function triggerPose(pose: typeof mascotPose, duration?: number) {
    clearInactivityTimer(); // reset sleep timer while mascot is acting
    mascotPose = pose;
    if (duration) {
      setTimeout(() => {
        if (mascotPose !== 'sleeping') {
          mascotPose = 'thinking';
          astridMessage = ''; // clear message when pose resets
        }
        resetInactivityTimer();
      }, duration);
    } else {
      resetInactivityTimer();
    }
  }

  function setAstridMessage(msg: string, pose: typeof mascotPose = 'thinking', duration: number = 3000) {
    astridMessage = msg;
    triggerPose(pose, duration);
  }

  function handleCorrect(a?: number, b?: number, timeMs?: number) {
    currentStreak++;
    if (currentStreak >= 3) {
      triggerPose('wow', 2000);
    } else {
      triggerPose('happy', 1200);
    }

    if (mode === 'times-tables' && typeof a === 'number' && typeof b === 'number') {
      profileStore.recordTimesTableFact(a, b, timeMs);
    }
  }

  function handleIncorrect(details?: any) {
    currentStreak = 0;
    triggerPose('sad', 1800);

    if (mode === 'times-tables' && details?.a && details?.b) {
      profileStore.recordTimesTableMistake(details.a, details.b);
    }
  }

  const GAME_TITLES = {
    'times-tables': 'Times Tables',
    'speed-add': 'Speed Add',
    'number-sort': 'Number Sort',
    'fractions-visual': 'Fraction Garden',
    'place-value': 'Place Value Orchard',
    'multiplication-grid': 'Multiplication Grid',
    'long-division': 'Division Stones',
    'decimals-grid': 'Decimal Shading',
    'geometry-angles': 'Garden Star Maps',
    'pemdas-tree': 'PEMDAS Trees'
  } as Record<string, string>;
</script>

<div class="game-screen-container glass-panel animate-entrance">
  <div class="header">
    <button onclick={onBack} class="back-btn" aria-label="Go back to dashboard">
      &larr; Back to modes
    </button>
    <h1>{GAME_TITLES[mode] || 'Math Game'}</h1>
  </div>

  <div class="mascot-bar">
    <div class="mascot-wrapper">
      <Mascot pose={mascotPose} size={140} />
      {#if astridMessage}
        <div class="game-speech-bubble animate-pop">
          {astridMessage}
          <div class="bubble-arrow"></div>
        </div>
      {/if}
    </div>
  </div>

  <div class="game-body-wrapper">
    {#if mode === 'times-tables'}
      <TimesTables
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
        {setAstridMessage}
      />
    {:else if mode === 'speed-add'}
      <SpeedAdd
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {:else if mode === 'number-sort'}
      <NumberSort
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {:else if mode === 'fractions-visual'}
      <FractionGarden
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {:else if mode === 'place-value'}
      <PlaceValueCosmos
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {:else if mode === 'multiplication-grid'}
      <MultiplicationGrid
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {:else if mode === 'long-division'}
      <LongDivisionSpace
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {:else if mode === 'decimals-grid'}
      <DecimalGridZoom
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {:else if mode === 'geometry-angles'}
      <GeometryConstellation
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {:else if mode === 'pemdas-tree'}
      <PEMDASTree
        {grade}
        onCorrect={handleCorrect}
        onIncorrect={handleIncorrect}
        onFinished={onFinished}
      />
    {/if}
  </div>
</div>

<style>
  .game-screen-container {
    width: 100%;
    max-width: 650px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem 2rem;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.8rem;
  }
  .header h1 {
    font-size: 1.5rem;
    margin: 0;
    color: var(--color-primary);
  }

  .back-btn {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    padding: 0.4rem 0.8rem;
    border-radius: var(--r-sm);
  }
  .back-btn:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--color-text-muted);
  }

  .mascot-bar {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 140px;
    align-items: center;
    position: relative;
    z-index: 10;
  }

  .mascot-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .game-speech-bubble {
    position: absolute;
    left: 100%;
    top: 20px;
    margin-left: 1rem;
    background: #ffffff;
    color: #0b0c16;
    padding: 0.8rem 1.2rem;
    border-radius: 16px;
    font-size: 1.05rem;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    z-index: 20;
    border: 2px solid var(--neon-cyan);
  }

  .bubble-arrow {
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: #ffffff;
    border-left: 2px solid var(--neon-cyan);
    border-bottom: 2px solid var(--neon-cyan);
  }

  .animate-pop {
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .game-body-wrapper {
    width: 100%;
    margin-top: 0.5rem;
    position: relative;
    z-index: 1;
  }
</style>
