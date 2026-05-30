<script lang="ts">
  import { onMount } from 'svelte';
  import type { GameHelp } from '../lib/help';

  interface Props {
    grade: number;
    onCorrect: () => void;
    onIncorrect: (details: { question: string; answer: string; userVal: string }) => void;
    onFinished: (score: number, total: number) => void;
    help?: GameHelp | null;
  }

  let { grade, onCorrect, onIncorrect, onFinished, help = $bindable(null) }: Props = $props();

  let questionIndex = $state(0);
  let score = $state(0);
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');
  let disabled = $state(false);

  // Question details
  interface Question {
    a: number; // e.g. 24
    b: number; // e.g. 35
    aTens: number; // 20
    aOnes: number; // 4
    bTens: number; // 30
    bOnes: number; // 5
    q1: number; // 20 * 30 = 600
    q2: number; // 20 * 5 = 100
    q3: number; // 4 * 30 = 120
    q4: number; // 4 * 5 = 20
    answer: number; // 740
  }
  let questions = $state<Question[]>([]);
  let currentQuestion = $derived(questions[questionIndex]);

  $effect(() => {
    const q = currentQuestion;
    if (!q) { help = null; return; }
    const a = q.a, b = q.b;
    if (q.aTens > 0) {
      // 4-box area model (grade > 3)
      help = {
        howToPlay: 'Fill each box (a partial product), then add the boxes for the total.',
        hint: 'Split each number into tens and ones, multiply the boxes, then add.',
        steps: [
          `Split: ${a} = ${q.aTens} + ${q.aOnes};  ${b} = ${q.bTens} + ${q.bOnes}`,
          `Top row: ${q.aTens} × ${q.bTens} = ${q.q1},  ${q.aTens} × ${q.bOnes} = ${q.q2}`,
          `Bottom row: ${q.aOnes} × ${q.bTens} = ${q.q3},  ${q.aOnes} × ${q.bOnes} = ${q.q4}`,
          `Add all boxes: ${a} × ${b} = ${q.answer}`,
        ],
      };
    } else {
      // 2-box area model (grade ≤ 3): single-digit a, split b into tens/ones
      help = {
        howToPlay: 'Fill each box (a partial product), then add the boxes for the total.',
        hint: 'Split the bigger number into tens and ones, multiply each part, then add.',
        steps: [
          `Split: ${b} = ${q.bTens} + ${q.bOnes}`,
          `Left box: ${a} × ${q.bTens} = ${a * q.bTens}`,
          `Right box: ${a} × ${q.bOnes} = ${a * q.bOnes}`,
          `Add the boxes: ${a} × ${b} = ${q.answer}`,
        ],
      };
    }
  });

  // User input states
  let uQ1 = $state<string>('');
  let uQ2 = $state<string>('');
  let uQ3 = $state<string>('');
  let uQ4 = $state<string>('');
  let uSum = $state<string>('');

  onMount(() => {
    generateQuestions();
    loadQuestion(0);
  });

  function generateQuestions() {
    const list: Question[] = [];
    for (let i = 0; i < 10; i++) {
      let a = 12 + Math.floor(Math.random() * 28); // 12 to 39
      let b = 12 + Math.floor(Math.random() * 38); // 12 to 49
      if (grade <= 3) {
        // simpler 1-digit * 2-digit representation
        a = 4 + Math.floor(Math.random() * 5); // 4 to 8
        b = 12 + Math.floor(Math.random() * 18); // 12 to 29
      }
      const aTens = Math.floor(a / 10) * 10;
      const aOnes = a % 10;
      const bTens = Math.floor(b / 10) * 10;
      const bOnes = b % 10;

      list.push({
        a, b,
        aTens, aOnes,
        bTens, bOnes,
        q1: aTens * bTens,
        q2: aTens * bOnes,
        q3: aOnes * bTens,
        q4: aOnes * bOnes,
        answer: a * b
      });
    }
    questions = list;
  }

  function loadQuestion(idx: number) {
    questionIndex = idx;
    uQ1 = ''; uQ2 = ''; uQ3 = ''; uQ4 = ''; uSum = '';
    feedback = '';
    feedbackClass = '';
    disabled = false;
  }

  function handleCheck() {
    if (disabled) return;
    const q = currentQuestion;
    if (!q) return;

    disabled = true;

    const ansQ1 = parseInt(uQ1, 10);
    const ansQ2 = parseInt(uQ2, 10);
    const ansQ3 = q.aTens > 0 ? parseInt(uQ3, 10) : 0;
    const ansQ4 = q.aTens > 0 ? parseInt(uQ4, 10) : parseInt(uQ2, 10); // adjustment for 1-digit
    const ansSum = parseInt(uSum, 10);

    const isGridCorrect = q.aTens > 0
      ? (ansQ1 === q.q1 && ansQ2 === q.q2 && ansQ3 === q.q3 && ansQ4 === q.q4)
      : (ansQ1 === q.q1 && ansQ2 === q.q2); // 1-digit adjustments

    const isSumCorrect = ansSum === q.answer;

    if (isGridCorrect && isSumCorrect) {
      score++;
      feedback = '✓ Brilliant! The grid area model is completely correct!';
      feedbackClass = 'correct';
      onCorrect();
    } else {
      feedback = `Not quite. Let's look at the correct grid values: ${q.aTens > 0 ? `${q.q1}, ${q.q2}, ${q.q3}, ${q.q4}` : `${q.q1}, ${q.q2}`}. Sum: ${q.answer}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        question: `${q.a} × ${q.b}`,
        answer: String(q.answer),
        userVal: uSum
      });
    }

    setTimeout(() => {
      if (questionIndex + 1 < 10) {
        loadQuestion(questionIndex + 1);
      } else {
        onFinished(score, 10);
      }
    }, 2000);
  }
</script>

<div class="game-container">
  {#if currentQuestion}
    <div class="instruction">
      Fill out the area model values for: <strong class="math-expr">{currentQuestion.a} &times; {currentQuestion.b}</strong>
    </div>

    <!-- Area Model Grid -->
    <div class="area-model-container {feedbackClass === 'correct' ? 'grid-pulse' : ''} {feedbackClass === 'wrong' ? 'grid-shake' : ''}">

      <!-- Top header (bTens + bOnes) -->
      <div class="grid-header-row">
        <div class="corner-cell"></div>
        <div class="header-cell">{currentQuestion.bTens}</div>
        <div class="header-cell">{currentQuestion.bOnes}</div>
      </div>

      <!-- Row 1: aTens -->
      {#if currentQuestion.aTens > 0}
        <div class="grid-body-row">
          <div class="side-cell">{currentQuestion.aTens}</div>
          <div class="input-cell q1-color">
            <span class="sub-label">{currentQuestion.aTens} &times; {currentQuestion.bTens}</span>
            <input type="number" bind:value={uQ1} {disabled} class="grid-input" placeholder="?" aria-label="Top-left quadrant" />
          </div>
          <div class="input-cell q2-color">
            <span class="sub-label">{currentQuestion.aTens} &times; {currentQuestion.bOnes}</span>
            <input type="number" bind:value={uQ2} {disabled} class="grid-input" placeholder="?" aria-label="Top-right quadrant" />
          </div>
        </div>
      {/if}

      <!-- Row 2: aOnes -->
      <div class="grid-body-row">
        <div class="side-cell">{currentQuestion.aOnes}</div>
        <!-- If 1-digit, q1 and q2 are the single row values -->
        {#if currentQuestion.aTens > 0}
          <div class="input-cell q3-color">
            <span class="sub-label">{currentQuestion.aOnes} &times; {currentQuestion.bTens}</span>
            <input type="number" bind:value={uQ3} {disabled} class="grid-input" placeholder="?" aria-label="Bottom-left quadrant" />
          </div>
          <div class="input-cell q4-color">
            <span class="sub-label">{currentQuestion.aOnes} &times; {currentQuestion.bOnes}</span>
            <input type="number" bind:value={uQ4} {disabled} class="grid-input" placeholder="?" aria-label="Bottom-right quadrant" />
          </div>
        {:else}
          <div class="input-cell q1-color">
            <span class="sub-label">{currentQuestion.aOnes} &times; {currentQuestion.bTens}</span>
            <input type="number" bind:value={uQ1} {disabled} class="grid-input" placeholder="?" aria-label="Left side" />
          </div>
          <div class="input-cell q2-color">
            <span class="sub-label">{currentQuestion.aOnes} &times; {currentQuestion.bOnes}</span>
            <input type="number" bind:value={uQ2} {disabled} class="grid-input" placeholder="?" aria-label="Right side" />
          </div>
        {/if}
      </div>

    </div>

    <!-- Final Sum Area -->
    <div class="sum-container">
      <div class="sum-row">
        <span>Add them up:</span>
        <input
          type="number"
          bind:value={uSum}
          {disabled}
          class="sum-input {feedbackClass === 'correct' ? 'sum-correct' : ''} {feedbackClass === 'wrong' ? 'sum-wrong' : ''}"
          placeholder="Total Sum"
          aria-label="Total Sum"
        />
      </div>
    </div>

    <button onclick={handleCheck} disabled={uSum.trim() === '' || disabled} class="btn-primary mt-4">
      Check Area Model
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
  }

  .instruction {
    font-size: 1.05rem;
    text-align: center;
    color: var(--color-text);
  }

  .math-expr {
    color: var(--color-primary);
    --glow-c: var(--glow-moonflower);
    text-shadow: var(--glow-sm);
    font-size: 1.3rem;
  }

  .area-model-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 420px;
    gap: 6px;
    margin: 0.5rem 0;
  }

  .grid-header-row, .grid-body-row {
    display: grid;
    grid-template-columns: 50px 1fr 1fr;
    gap: 6px;
    align-items: center;
  }

  .corner-cell, .side-cell, .header-cell {
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: bold;
    color: var(--color-text-muted);
  }

  .input-cell {
    background: var(--color-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--r-md);
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    min-height: 85px;
    justify-content: center;
  }

  .sub-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .grid-input {
    width: 90%;
    min-height: var(--touch, 48px);
    background: oklch(20% 0.02 260 / 0.6);
    border: 1px solid var(--color-border);
    border-radius: var(--r-sm);
    color: var(--color-text);
    padding: 0.3rem;
    text-align: center;
    font-size: 1rem;
    font-weight: bold;
    font-variant-numeric: tabular-nums lining-nums;
  }

  .grid-input:focus-visible {
    outline: none;
    border-color: var(--color-primary);
    --glow-c: var(--glow-moonflower);
    box-shadow: var(--glow-md);
  }

  /* Color-coding quadrants using twilight tokens */
  .q1-color { border-left: 3px solid var(--color-primary); }
  .q2-color { border-left: 3px solid oklch(72% 0.14 300); }
  .q3-color { border-left: 3px solid oklch(78% 0.13 200); }
  .q4-color { border-left: 3px solid oklch(80% 0.13 55); }

  .sum-container {
    width: 100%;
    max-width: 420px;
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }

  .sum-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: 1.1rem;
    color: var(--color-text);
  }

  .sum-input {
    max-width: 150px;
    min-height: var(--touch, 48px);
    background: oklch(20% 0.02 260 / 0.6);
    border: 2px solid var(--color-border);
    border-radius: var(--r-md);
    color: var(--color-text);
    padding: 0.5rem;
    text-align: center;
    font-size: 1.2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums lining-nums;
  }

  .sum-input:focus-visible {
    outline: none;
    border-color: var(--color-primary);
    --glow-c: var(--glow-moonflower);
    box-shadow: var(--glow-md);
  }

  .sum-input.sum-correct {
    border-color: var(--color-correct);
    --glow-c: var(--color-correct);
    box-shadow: var(--glow-sm);
  }

  .sum-input.sum-wrong {
    border-color: var(--color-retry);
    --glow-c: var(--color-retry);
    box-shadow: var(--glow-sm);
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
    color: var(--color-correct);
    background: oklch(55% 0.16 150 / 0.12);
  }

  .feedback-msg.wrong {
    color: var(--color-retry);
    background: oklch(72% 0.13 75 / 0.12);
  }

  /* Motion gated by preference */
  @media (prefers-reduced-motion: no-preference) {
    .area-model-container.grid-pulse {
      animation: gridGlowPulse 0.7s ease-out;
    }
    .area-model-container.grid-shake {
      animation: gentleShake 0.45s ease-in-out;
    }
  }

  @keyframes gridGlowPulse {
    0% { box-shadow: none; }
    40% {
      --glow-c: var(--color-correct);
      box-shadow: var(--glow-lg);
    }
    100% { box-shadow: none; }
  }

  @keyframes gentleShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(2px); }
  }
</style>
