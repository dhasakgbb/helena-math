<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { profileStore } from '../lib/profile.svelte';
  import Mascot from '../components/Mascot.svelte';
  import GameShell from '../components/GameShell.svelte';
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

  // Honest game titles
  const GAME_TITLES: Record<string, string> = {
    'times-tables': 'Times Tables',
    'speed-add': 'Speed Add',
    'number-sort': 'Number Sort',
    'fractions-visual': 'Fraction Garden',
    'place-value': 'Place Value',
    'multiplication-grid': 'Multiplication Grid',
    'long-division': 'Long Division',
    'decimals-grid': 'Decimal Shading',
    'geometry-angles': 'Coordinate Plot',
    'pemdas-tree': 'Order of Operations',
  };

  // Questions per game: 5 for long-division, geometry-angles, pemdas-tree; 10 for the rest
  const TOTALS: Record<string, number> = {
    'times-tables': 10,
    'speed-add': 10,
    'number-sort': 10,
    'fractions-visual': 10,
    'place-value': 10,
    'multiplication-grid': 10,
    'long-division': 5,
    'decimals-grid': 10,
    'geometry-angles': 5,
    'pemdas-tree': 5,
  };

  const total = $derived(TOTALS[mode] ?? 10);

  const GLOW: Record<string, string> = {
    'times-tables': 'var(--glow-firefly)', 'speed-add': 'var(--glow-firefly)', 'number-sort': 'var(--glow-firefly)',
    'fractions-visual': 'var(--glow-moonflower)', 'multiplication-grid': 'var(--glow-moonflower)', 'decimals-grid': 'var(--glow-moonflower)',
    'place-value': 'var(--glow-blossom)', 'long-division': 'var(--glow-blossom)', 'geometry-angles': 'var(--glow-blossom)', 'pemdas-tree': 'var(--glow-blossom)',
  };

  // Live answered counter — incremented by both handleCorrect and handleIncorrect
  let answered = $state(0);

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
    answered++;
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
    answered++;
    currentStreak = 0;
    triggerPose('sad', 1800);

    if (mode === 'times-tables' && details?.a && details?.b) {
      profileStore.recordTimesTableMistake(details.a, details.b);
    }
  }
</script>

<GameShell
  title={GAME_TITLES[mode] ?? 'Math'}
  plantModeId={mode}
  questionIndex={answered}
  {total}
  {onBack}
  glow={GLOW[mode] ?? 'var(--glow-firefly)'}
>
  {#snippet mascot()}
    <div class="mascot-wrapper">
      <Mascot pose={mascotPose} size={110} />
      {#if astridMessage}
        <div class="game-speech-bubble animate-pop">
          {astridMessage}
          <div class="bubble-arrow"></div>
        </div>
      {/if}
    </div>
  {/snippet}

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
</GameShell>

<style>
  .mascot-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .game-speech-bubble {
    position: absolute;
    right: calc(100% + 0.75rem);
    top: 50%;
    transform: translateY(-50%);
    background: oklch(18% 0.06 280);
    color: var(--color-text, oklch(92% 0.02 270));
    padding: 0.7rem 1.1rem;
    border-radius: 14px;
    font-size: 1rem;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    z-index: 20;
    border: 2px solid var(--color-primary, var(--glow-firefly, oklch(78% 0.18 280)));
  }

  .bubble-arrow {
    position: absolute;
    right: -7px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: oklch(18% 0.06 280);
    border-right: 2px solid var(--color-primary, var(--glow-firefly, oklch(78% 0.18 280)));
    border-top: 2px solid var(--color-primary, var(--glow-firefly, oklch(78% 0.18 280)));
  }

  .animate-pop {
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes popIn {
    0% {
      transform: translateY(-50%) scale(0.8);
      opacity: 0;
    }
    100% {
      transform: translateY(-50%) scale(1);
      opacity: 1;
    }
  }
</style>
