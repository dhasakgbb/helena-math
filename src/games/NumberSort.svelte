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
    bin: 'even' | 'odd' | 'prime';
  }
  let questions = $state<Question[]>([]);
  let placedNumbers = $state<Record<number, 'even' | 'odd' | 'prime' | null>>({});

  let currentQuestionIndex = $state(0);
  let animatingOut = $state(false);

  // Touch/Keyboard Selection state
  let selectedNumber = $state<number | null>(null);
  let hoveredBin = $state<'even' | 'odd' | 'prime' | null>(null);
  let particleBin = $state<'even' | 'odd' | 'prime' | null>(null);

  onMount(() => {
    generateQuestions();
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
    questions.forEach(q => {
      placedNumbers[q.n] = null;
    });
  }

  function triggerParticles(bin: 'even' | 'odd' | 'prime') {
    particleBin = bin;
    setTimeout(() => {
      particleBin = null;
    }, 600);
  }

  function handleSort(n: number, targetBin: 'even' | 'odd' | 'prime') {
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
    <span>Item {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}</span>
    <span>Score: {score}</span>
  </div>

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
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTile(q.n); } }}
          aria-label={`Select number ${q.n}`}
        >
          {q.n}
        </button>
      {/key}
    {/if}
  </div>

  <!-- Bins -->
  <div class="bins-container">
    {#each ['even', 'odd', 'prime'] as binType}
      <button
        class="bin {binType}"
        class:drag-over={hoveredBin === binType}
        class:highlight-active={selectedNumber !== null}
        class:particle-burst={particleBin === binType}
        ondragover={(e) => handleDragOver(e, binType as any)}
        ondragleave={() => hoveredBin = null}
        ondrop={(e) => handleDrop(e, binType as any)}
        onclick={() => handleBinClick(binType as any)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBinClick(binType as any); } }}
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
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, var(--color-primary, #6200ea), var(--neon-purple, #b388ff));
    color: light-dark(#ffffff, #0b0c16);
    border-radius: var(--r-md, 8px);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.8rem;
    font-weight: 700;
    cursor: grab;
    user-select: none;
    box-shadow: 0 4px 12px rgba(157, 78, 221, 0.4);
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    border: 3px solid transparent;
  }
  .tile:hover {
    transform: scale(1.1) translateY(-2px);
    box-shadow: 0 6px 16px rgba(157, 78, 221, 0.6);
  }
  .tile.selected {
    border-color: #fff;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
    transform: scale(1.15);
  }

  .bins-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .bin {
    background: rgba(0, 0, 0, 0.15);
    border: 3px dashed;
    border-radius: var(--r-lg, 12px);
    min-height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  /* Neon Glowing Bins */
  .bin.even {
    --bin-color: #00e676; /* Neon Green */
    border-color: var(--bin-color);
    box-shadow: 0 0 15px rgba(0, 230, 118, 0.3), inset 0 0 10px rgba(0, 230, 118, 0.1);
  }
  .bin.odd {
    --bin-color: #00e5ff; /* Neon Cyan */
    border-color: var(--bin-color);
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.3), inset 0 0 10px rgba(0, 229, 255, 0.1);
  }
  .bin.prime {
    --bin-color: #d500f9; /* Neon Purple */
    border-color: var(--bin-color);
    box-shadow: 0 0 15px rgba(213, 0, 249, 0.3), inset 0 0 10px rgba(213, 0, 249, 0.1);
  }

  /* Interaction states for bins */
  .bin.even.drag-over, .bin.even.highlight-active {
    background: rgba(0, 230, 118, 0.15);
    box-shadow: 0 0 30px rgba(0, 230, 118, 0.8), inset 0 0 20px rgba(0, 230, 118, 0.4);
    transform: scale(1.03);
    border-style: solid;
  }
  .bin.odd.drag-over, .bin.odd.highlight-active {
    background: rgba(0, 229, 255, 0.15);
    box-shadow: 0 0 30px rgba(0, 229, 255, 0.8), inset 0 0 20px rgba(0, 229, 255, 0.4);
    transform: scale(1.03);
    border-style: solid;
  }
  .bin.prime.drag-over, .bin.prime.highlight-active {
    background: rgba(213, 0, 249, 0.15);
    box-shadow: 0 0 30px rgba(213, 0, 249, 0.8), inset 0 0 20px rgba(213, 0, 249, 0.4);
    transform: scale(1.03);
    border-style: solid;
  }

  /* Particle Effect Animation */
  @keyframes pop-burst {
    0% { transform: scale(1); filter: brightness(1); }
    30% { transform: scale(1.1); filter: brightness(1.5); }
    100% { transform: scale(1); filter: brightness(1); }
  }
  .particle-burst {
    animation: pop-burst 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border-style: solid !important;
  }

  .bin-label {
    font-family: var(--font-display, sans-serif);
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--color-text-muted, #ccc);
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }
  
  .bin.even .bin-label { color: #00e676; text-shadow: 0 0 8px rgba(0,230,118,0.5); }
  .bin.odd .bin-label { color: #00e5ff; text-shadow: 0 0 8px rgba(0,229,255,0.5); }
  .bin.prime .bin-label { color: #d500f9; text-shadow: 0 0 8px rgba(213,0,249,0.5); }

  .bin-contents {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    width: 100%;
    z-index: 1;
  }

  .placed-badge {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.3rem 0.6rem;
    border-radius: var(--r-sm, 4px);
    font-weight: 700;
    font-size: 1.1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    backdrop-filter: blur(4px);
  }

  .feedback-msg {
    font-family: var(--font-display, sans-serif);
    font-size: 1.2rem;
    font-weight: 700;
    margin-top: 0.5rem;
    padding: 0.8rem 1.5rem;
    border-radius: var(--r-md, 8px);
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  .feedback-msg.correct {
    color: var(--success, #00e676);
    background: rgba(0, 230, 118, 0.15);
    border: 1px solid rgba(0, 230, 118, 0.3);
  }
  .feedback-msg.wrong {
    color: var(--danger, #ff1744);
    background: rgba(255, 23, 68, 0.15);
    border: 1px solid rgba(255, 23, 68, 0.3);
  }

  .tile:focus-visible, .bin:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
  }
</style>
