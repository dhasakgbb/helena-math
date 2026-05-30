<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    grade: number;
    onCorrect: () => void;
    onIncorrect: (details: { question: string; answer: string; userVal: string }) => void;
    onFinished: (score: number, total: number) => void;
  }

  let { grade: _grade, onCorrect, onIncorrect, onFinished }: Props = $props();

  let questionIndex = $state(0);
  let score = $state(0);
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');
  let disabled = $state(false);

  // Question details
  interface Question {
    type: 'shade' | 'read';
    targetVal: number; // e.g. 0.45
    format: 'decimal' | 'fraction' | 'word';
  }
  let questions = $state<Question[]>([]);
  let currentQuestion = $derived(questions[questionIndex]);

  // Shaded cells state: 100 elements (boolean)
  let shaded = $state<boolean[]>(Array(100).fill(false));

  // Drag-to-shade states
  let isDrawing = $state(false);
  let drawMode = $state<boolean>(true); // true = shading, false = erasing

  onMount(() => {
    generateQuestions();
    loadQuestion(0);
    
    // Add pointerup listener on window to terminate drag-to-shade safely
    window.addEventListener('pointerup', handlePointerUp);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', handlePointerUp);
    }
  });

  import { onDestroy } from 'svelte';

  function generateQuestions() {
    const list: Question[] = [];
    const decimals = [0.1, 0.25, 0.4, 0.52, 0.7, 0.85, 0.3, 0.64, 0.15, 0.9];
    
    decimals.forEach((d, idx) => {
      const format = idx % 3 === 0 ? 'decimal' : idx % 3 === 1 ? 'fraction' : 'word';
      list.push({ type: 'shade', targetVal: d, format });
    });

    questions = list;
  }

  function loadQuestion(idx: number) {
    questionIndex = idx;
    shaded = Array(100).fill(false);
    feedback = '';
    feedbackClass = '';
    disabled = false;
  }

  function getShadedCount(): number {
    return shaded.filter(Boolean).length;
  }

  function getShadedVal(): number {
    return parseFloat((getShadedCount() / 100).toFixed(2));
  }

  // Pointer handlers for drag-to-shade (mouse + touch)
  function handlePointerDown(idx: number) {
    if (disabled) return;
    isDrawing = true;
    drawMode = !shaded[idx];
    shaded[idx] = drawMode;
    playTone(200 + idx * 5);
  }

  function handlePointerEnter(idx: number) {
    if (disabled || !isDrawing) return;
    shaded[idx] = drawMode;
    playTone(200 + idx * 5);
  }

  function handlePointerUp() {
    isDrawing = false;
  }

  function fillTen() {
    if (disabled) return;
    const count = getShadedCount();
    // Fill the next row of 10
    const startIdx = Math.floor(count / 10) * 10;
    const endIdx = Math.min(startIdx + 10, 100);
    for (let i = startIdx; i < endIdx; i++) {
      shaded[i] = true;
    }
    playTone(400);
  }

  function clearAll() {
    if (disabled) return;
    shaded = Array(100).fill(false);
    playTone(150);
  }

  function playTone(freq: number) {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }

  function getFormatPrompt(q: Question): string {
    if (q.format === 'decimal') {
      return String(q.targetVal);
    }
    if (q.format === 'fraction') {
      const den = 100;
      const num = Math.round(q.targetVal * 100);
      return num % 10 === 0 ? `${num / 10}/10` : `${num}/${den}`;
    }
    // word format
    const val = Math.round(q.targetVal * 100);
    if (val % 10 === 0) {
      const tenthsNames = ['', 'one tenth', 'two tenths', 'three tenths', 'four tenths', 'five tenths', 'six tenths', 'seven tenths', 'eight tenths', 'nine tenths'];
      return tenthsNames[val / 10];
    }
    const tens = Math.floor(val / 10);
    const ones = val % 10;
    const tensNames = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const onesNames = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const prefix = tens === 1 
      ? ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'][ones] 
      : `${tensNames[tens]}${ones > 0 ? '-' + onesNames[ones] : ''}`;
    return `${prefix} hundredths`;
  }

  function handleCheck() {
    if (disabled) return;
    const q = currentQuestion;
    if (!q) return;

    disabled = true;
    const userVal = getShadedVal();
    const isCorrect = Math.abs(userVal - q.targetVal) < 0.0001;

    if (isCorrect) {
      score++;
      feedback = '✓ Perfect! Shaded value matches the target!';
      feedbackClass = 'correct';
      onCorrect();
    } else {
      feedback = `Not quite. Shaded: ${userVal}. Target: ${q.targetVal}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        question: `Shade ${getFormatPrompt(q)}`,
        answer: String(q.targetVal),
        userVal: String(userVal)
      });
    }

    setTimeout(() => {
      if (questionIndex + 1 < 10) {
        loadQuestion(questionIndex + 1);
      } else {
        onFinished(score, 10);
      }
    }, 1800);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="game-container" onpointerup={handlePointerUp} onpointerleave={handlePointerUp}>
  <div class="status-bar">
    <span>Question {questionIndex + 1} of 10</span>
    <span>Score: {score}</span>
  </div>

  {#if currentQuestion}
    <div class="instruction">
      Shade the grid to represent: <strong class="target-val">{getFormatPrompt(currentQuestion)}</strong>
    </div>

    <div class="grid-stats">
      Shaded: <strong>{getShadedCount()} / 100</strong> (Value: <span class="val-lbl">{getShadedVal()}</span>)
    </div>

    <!-- 10x10 Shading Grid -->
    <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
    <div class="shade-grid" role="grid" aria-label="10 by 10 shading board">
      {#each Array(100) as _, i}
        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
        <div
          class="grid-cell"
          class:shaded={shaded[i]}
          onpointerdown={(e) => { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId); handlePointerDown(i); }}
          onpointerenter={() => handlePointerEnter(i)}
          role="gridcell"
          tabindex="-1"
          aria-label="Cell {i + 1}"
        ></div>
      {/each}
    </div>

    <div class="control-row mt-4">
      <button onclick={fillTen} {disabled} class="btn-ghost size-btn">
        ⚡ Fill +10 Blocks
      </button>
      <button onclick={clearAll} {disabled} class="btn-ghost size-btn delete">
        Clear All
      </button>
    </div>

    <button onclick={handleCheck} disabled={disabled} class="btn-primary mt-4">
      Submit Grid
    </button>

    {#if feedback}
      <div class="feedback-msg {feedbackClass}" aria-live="polite">
        {feedback}
      </div>
    {/if}
  {/if}
</div>

<style>
  .game-container {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    align-items: center;
    width: 100%;
    user-select: none;
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
    font-size: 1.1rem;
    text-align: center;
  }
  .target-val {
    color: var(--neon-cyan);
    text-shadow: var(--glow-cyan);
    font-size: 1.4rem;
  }

  .grid-stats {
    font-size: 0.95rem;
    color: var(--color-text-muted);
  }
  .val-lbl {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: bold;
    color: var(--color-text);
  }

  /* Shading Grid */
  .shade-grid {
    display: grid;
    grid-template-columns: repeat(10, 24px);
    grid-template-rows: repeat(10, 24px);
    gap: 2px;
    border: 3px solid var(--color-border);
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--r-sm);
    padding: 3px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }

  .grid-cell {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    touch-action: none;
    transition: background 0.1s ease;
  }
  .grid-cell:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .grid-cell.shaded {
    background: var(--color-primary);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 6px var(--color-primary);
  }

  .control-row {
    display: flex;
    gap: 1rem;
  }

  .size-btn {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    font-weight: 600;
  }
  .size-btn.delete:hover {
    color: var(--danger);
    background: rgba(255, 23, 68, 0.05);
    border-color: rgba(255, 23, 68, 0.15);
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
