<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';

  interface Props {
    grade: number;
    onCorrect: () => void;
    onIncorrect: (details: { question: string; answer: string; userVal: string }) => void;
    onFinished: (score: number, total: number) => void;
  }

  let { grade, onCorrect, onIncorrect, onFinished }: Props = $props();

  let score = $state(0);
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');

  interface Question {
    n: number;
    bin: 'even' | 'odd';
  }
  let questions = $state<Question[]>([]);
  let placedNumbers = $state<Record<number, 'even' | 'odd' | null>>({});

  let currentQuestionIndex = $state(0);
  let animatingOut = $state(false);

  // Touch/Keyboard Selection state
  let selectedNumber = $state<number | null>(null);
  let hoveredBin = $state<'even' | 'odd' | null>(null);
  let particleBin = $state<'even' | 'odd' | null>(null);

  onMount(() => {
    generateQuestions();
  });

  function generateQuestions() {
    const list: Question[] = [];
    const seen = new Set<number>();
    const maxVal = grade <= 3 ? 30 : grade === 4 ? 50 : 100;
    while (list.length < 10) {
      const n = 2 + Math.floor(Math.random() * (maxVal - 1));
      if (seen.has(n)) continue;
      seen.add(n);
      const bin = n % 2 === 0 ? 'even' : 'odd';
      list.push({ n, bin });
    }
    questions = list;
    questions.forEach(q => {
      placedNumbers[q.n] = null;
    });
  }

  function triggerParticles(bin: 'even' | 'odd') {
    particleBin = bin;
    setTimeout(() => {
      particleBin = null;
    }, 600);
  }

  function handleSort(n: number, targetBin: 'even' | 'odd') {
    if (animatingOut) return;
    
    const q = questions[currentQuestionIndex];
    if (!q || q.n !== n) return;

    placedNumbers[n] = targetBin;
    const isCorrect = q.bin === targetBin;

    if (isCorrect) {
      score++;
      feedback = `✓ ${n} is ${targetBin.toUpperCase()}`;
      feedbackClass = 'correct';
      triggerParticles(targetBin);
      onCorrect();
    } else {
      feedback = `Oops! ${n} is ${q.bin.toUpperCase()}, not ${targetBin.toUpperCase()}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        question: `Sort ${n}`,
        answer: q.bin.toUpperCase(),
        userVal: targetBin.toUpperCase()
      });
    }

    selectedNumber = null;
    animatingOut = true;

    setTimeout(() => {
      animatingOut = false;
      feedback = '';
      feedbackClass = '';
      if (currentQuestionIndex + 1 < questions.length) {
        currentQuestionIndex++;
      } else {
        onFinished(score, questions.length);
      }
    }, isCorrect ? 1000 : 2000);
  }

  // Drag and Drop implementation
  function handleDragStart(e: DragEvent, n: number) {
    e.dataTransfer?.setData('text/plain', String(n));
    selectedNumber = n;
  }

  function handleDragOver(e: DragEvent, bin: 'even' | 'odd') {
    e.preventDefault();
    hoveredBin = bin;
  }

  function handleDrop(e: DragEvent, bin: 'even' | 'odd') {
    e.preventDefault();
    hoveredBin = null;
    const data = e.dataTransfer?.getData('text/plain');
    if (!data) return;
    const n = parseInt(data, 10);
    handleSort(n, bin);
  }

  // Tap-to-select support for mobile/keyboard
  function selectTile(n: number) {
    if (selectedNumber === n) {
      selectedNumber = null;
    } else {
      selectedNumber = n;
    }
  }

  function handleBinClick(bin: 'even' | 'odd') {
    if (selectedNumber !== null && placedNumbers[selectedNumber] === null) {
      handleSort(selectedNumber, bin);
    }
  }
</script>

<div class="game-container">
  <div class="instruction">
    Drag the number to its correct bin, or tap the number then tap a bin.
  </div>

  <!-- Number Pool -->
  <div class="pool">
    {#if questions.length > 0 && currentQuestionIndex < questions.length && !animatingOut}
      {@const q = questions[currentQuestionIndex]}
      {#key q.n}
        <button
          in:fly={{ y: -60, duration: 400 }}
          out:scale={{ duration: 200, start: 0.8 }}
          type="button"
          class="tile"
          class:selected={selectedNumber === q.n}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, q.n)}
          onclick={() => selectTile(q.n)}
          aria-label={`Select number ${q.n}`}
        >
          {q.n}
        </button>
      {/key}
    {/if}
  </div>

  <!-- Bins -->
  <div class="bins-container">
    {#each ['even', 'odd'] as binType}
      <button
        class="bin {binType}"
        class:drag-over={hoveredBin === binType}
        class:highlight-active={selectedNumber !== null}
        class:particle-burst={particleBin === binType}
        ondragover={(e) => handleDragOver(e, binType as any)}
        ondragleave={() => hoveredBin = null}
        ondrop={(e) => handleDrop(e, binType as any)}
        onclick={() => handleBinClick(binType as any)}
        aria-label={`Sort selected number into the ${binType} bin`}
      >
        <span class="bin-label">{binType.toUpperCase()}</span>
        <div class="bin-contents">
          {#each Object.keys(placedNumbers) as key}
            {@const num = parseInt(key, 10)}
            {#if placedNumbers[num] === binType}
              <span class="placed-badge" in:scale={{duration: 300}}>{num}</span>
            {/if}
          {/each}
        </div>
      </button>
    {/each}
  </div>

  {#if feedback}
    <div class="feedback-msg {feedbackClass}" aria-live="polite">
      {feedback}
    </div>
  {/if}
</div>

<style>
  .game-container {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    align-items: center;
    width: 100%;
  }

  .instruction {
    font-size: 0.95rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .pool {
    display: flex;
    justify-content: center;
    gap: 1rem;
    min-height: 80px;
    width: 100%;
    align-items: center;
    margin: 0.5rem 0;
  }

  /* Tile: dark-glass with firefly glow */
  .tile {
    --glow-c: var(--glow-firefly);
    width: 70px;
    height: 70px;
    background: var(--color-panel);
    color: var(--color-text);
    border-radius: var(--r-md, 8px);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.8rem;
    font-weight: 700;
    cursor: grab;
    user-select: none;
    border: 2px solid var(--color-border);
    box-shadow: var(--glow-sm);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  @media (prefers-reduced-motion: no-preference) {
    .tile {
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .tile:hover {
      transform: scale(1.1) translateY(-2px);
      box-shadow: var(--glow-md);
    }
    .tile.selected {
      transform: scale(1.15);
    }
  }

  .tile.selected {
    border-color: var(--color-primary);
    box-shadow: var(--glow-lg);
  }

  .bins-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  /* Bins: dark-glass with per-bin twilight accent */
  .bin {
    --glow-c: var(--glow-firefly);
    background: var(--color-panel);
    border: 2px dashed var(--color-border);
    border-radius: var(--r-lg, 12px);
    min-height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  /* Each bin gets its own twilight accent color */
  .bin.even {
    --bin-accent: var(--color-correct);
    border-color: var(--color-correct);
    box-shadow: var(--glow-sm);
  }
  .bin.odd {
    --bin-accent: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: var(--glow-sm);
  }


  /* Drag-over and highlight-active: bin lights up */
  .bin.drag-over,
  .bin.highlight-active {
    background: color-mix(in srgb, var(--bin-accent, var(--color-primary)) 12%, var(--color-panel));
    border-color: var(--bin-accent, var(--color-primary));
    border-style: solid;
    box-shadow: var(--glow-md);
  }

  @media (prefers-reduced-motion: no-preference) {
    .bin.drag-over,
    .bin.highlight-active {
      transform: scale(1.03);
    }
  }

  /* Particle burst: firefly glow pulse on correct sort */
  @keyframes pop-burst {
    0%   { box-shadow: var(--glow-sm); }
    35%  { box-shadow: var(--glow-lg); filter: brightness(1.3); }
    100% { box-shadow: var(--glow-sm); filter: brightness(1); }
  }

  @media (prefers-reduced-motion: no-preference) {
    .particle-burst {
      animation: pop-burst 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border-style: solid !important;
    }
  }

  /* Correct feedback: glow pulse */
  @keyframes correct-pulse {
    0%   { box-shadow: 0 0 0 0 var(--color-correct); }
    60%  { box-shadow: 0 0 0 8px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  /* Wrong feedback: shake */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }

  .bin-label {
    font-family: var(--font-display, sans-serif);
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--bin-accent, var(--color-text-muted));
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .bin-contents {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    width: 100%;
    z-index: 1;
  }

  .placed-badge {
    background: color-mix(in srgb, var(--bin-accent, var(--color-primary)) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--bin-accent, var(--color-primary)) 40%, transparent);
    color: var(--color-text);
    padding: 0.3rem 0.6rem;
    border-radius: var(--r-sm, 4px);
    font-weight: 700;
    font-size: 1.1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .feedback-msg {
    font-family: var(--font-display, sans-serif);
    font-size: 1.2rem;
    font-weight: 700;
    margin-top: 0.5rem;
    padding: 0.8rem 1.5rem;
    border-radius: var(--r-md, 8px);
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .feedback-msg.correct {
    color: var(--color-correct);
    background: color-mix(in srgb, var(--color-correct) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-correct) 35%, transparent);
  }

  @media (prefers-reduced-motion: no-preference) {
    .feedback-msg.correct {
      animation: correct-pulse 0.6s ease-out;
    }
    .feedback-msg.wrong {
      animation: shake 0.45s ease-in-out;
    }
  }

  .feedback-msg.wrong {
    color: var(--color-retry);
    background: color-mix(in srgb, var(--color-retry) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-retry) 35%, transparent);
  }

  /* A11y: preserved focus ring — native buttons handle Enter/Space */
  .tile:focus-visible,
  .bin:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
  }
</style>
