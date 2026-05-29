<script lang="ts">
  import { onMount } from 'svelte';

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
  let activeBatchIndex = $state(0);

  interface Question {
    n: number;
    bin: 'even' | 'odd' | 'prime';
  }
  let questions = $state<Question[]>([]);
  let currentBatch = $state<Question[]>([]);
  let placedNumbers = $state<Record<number, 'even' | 'odd' | 'prime' | null>>({});

  // Touch/Keyboard Selection state
  let selectedNumber = $state<number | null>(null);
  let hoveredBin = $state<'even' | 'odd' | 'prime' | null>(null);

  onMount(() => {
    generateQuestions();
    loadBatch(0);
  });

  function checkPrime(n: number): boolean {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  function generateQuestions() {
    const list: Question[] = [];
    const seen = new Set<number>();
    const maxVal = grade <= 3 ? 30 : grade === 4 ? 50 : 100;
    while (list.length < 10) {
      const n = 2 + Math.floor(Math.random() * (maxVal - 1));
      if (seen.has(n)) continue;
      seen.add(n);
      const isPrime = checkPrime(n);
      const bin = isPrime ? 'prime' : (n % 2 === 0 ? 'even' : 'odd');
      list.push({ n, bin });
    }
    questions = list;
  }

  function loadBatch(batchIdx: number) {
    activeBatchIndex = batchIdx;
    // We display 4 numbers at a time for dragging
    const start = batchIdx * 4;
    const end = Math.min(start + 4, 10);
    currentBatch = questions.slice(start, end);
    // Initialize placed mapping for this batch
    currentBatch.forEach(q => {
      placedNumbers[q.n] = null;
    });
  }

  function handleSort(n: number, targetBin: 'even' | 'odd' | 'prime') {
    const q = questions.find(item => item.n === n);
    if (!q) return;

    placedNumbers[n] = targetBin;
    const isCorrect = q.bin === targetBin;

    if (isCorrect) {
      score++;
      feedback = `✓ ${n} is ${targetBin.toUpperCase()}`;
      feedbackClass = 'correct';
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

    // Check if the current batch is fully sorted
    const activeBatchUnsorted = currentBatch.filter(item => placedNumbers[item.n] === null);
    if (activeBatchUnsorted.length === 0) {
      setTimeout(() => {
        feedback = '';
        feedbackClass = '';
        const nextBatchIdx = activeBatchIndex + 1;
        if (nextBatchIdx * 4 < 10) {
          loadBatch(nextBatchIdx);
        } else {
          onFinished(score, 10);
        }
      }, 1500);
    }
  }

  // Drag and Drop implementation
  function handleDragStart(e: DragEvent, n: number) {
    e.dataTransfer?.setData('text/plain', String(n));
    selectedNumber = n;
  }

  function handleDragOver(e: DragEvent, bin: 'even' | 'odd' | 'prime') {
    e.preventDefault();
    hoveredBin = bin;
  }

  function handleDrop(e: DragEvent, bin: 'even' | 'odd' | 'prime') {
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

  function handleBinClick(bin: 'even' | 'odd' | 'prime') {
    if (selectedNumber !== null && placedNumbers[selectedNumber] === null) {
      handleSort(selectedNumber, bin);
    }
  }
</script>

<div class="game-container">
  <div class="status-bar">
    <span>Sort batch {activeBatchIndex + 1} of 3</span>
    <span>Score: {score}</span>
  </div>

  <div class="instruction">
    Drag each number to its correct bin, or tap a number then tap a bin.
  </div>

  <!-- Number Pool -->
  <div class="pool">
    {#each currentBatch as q (q.n)}
      {#if placedNumbers[q.n] === null}
        <button
          type="button"
          class="tile"
          class:selected={selectedNumber === q.n}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, q.n)}
          onclick={() => selectTile(q.n)}
          aria-label="Number {q.n}"
        >
          {q.n}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Bins -->
  <div class="bins-container">
    {#each ['even', 'odd', 'prime'] as binType}
      <button
        class="bin"
        class:drag-over={hoveredBin === binType}
        class:highlight-active={selectedNumber !== null}
        ondragover={(e) => handleDragOver(e, binType as any)}
        ondragleave={() => hoveredBin = null}
        ondrop={(e) => handleDrop(e, binType as any)}
        onclick={() => handleBinClick(binType as any)}
        aria-label="Place in {binType} bin"
      >
        <span class="bin-label">{binType.toUpperCase()}</span>
        <div class="bin-contents">
          {#each Object.keys(placedNumbers) as key}
            {@const num = parseInt(key, 10)}
            {#if placedNumbers[num] === binType}
              <span class="placed-badge">{num}</span>
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

  .status-bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-weight: 500;
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

  .tile {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--color-primary), var(--neon-purple));
    color: light-dark(#ffffff, #0b0c16);
    border-radius: var(--r-md);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 700;
    cursor: grab;
    user-select: none;
    box-shadow: 0 4px 12px rgba(157, 78, 221, 0.25);
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    border: 2px solid transparent;
  }
  .tile:hover {
    transform: scale(1.08) translateY(-2px);
    box-shadow: 0 6px 16px rgba(157, 78, 221, 0.4);
  }
  .tile.selected {
    border-color: var(--neon-cyan);
    box-shadow: var(--glow-cyan);
    transform: scale(1.1);
  }

  .bins-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .bin {
    background: rgba(0, 0, 0, 0.15);
    border: 2px dashed var(--color-border);
    border-radius: var(--r-lg);
    min-height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.8rem;
    transition: all 0.2s ease;
  }
  .bin.highlight-active {
    border-color: var(--color-primary);
  }
  .bin.drag-over {
    background: rgba(0, 255, 224, 0.05);
    border-color: var(--neon-cyan);
    box-shadow: var(--glow-cyan);
    transform: scale(1.02);
  }

  .bin-label {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text-muted);
    letter-spacing: 0.05em;
    margin-bottom: 0.8rem;
  }

  .bin-contents {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
    width: 100%;
  }

  .placed-badge {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border);
    padding: 0.2rem 0.5rem;
    border-radius: var(--r-sm);
    font-weight: 600;
    font-size: 0.95rem;
  }

  .feedback-msg {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--r-sm);
    text-align: center;
  }
  .feedback-msg.correct {
    color: var(--success);
    background: rgba(0, 230, 118, 0.1);
  }
  .feedback-msg.wrong {
    color: var(--danger);
    background: rgba(255, 23, 68, 0.1);
  }
</style>
