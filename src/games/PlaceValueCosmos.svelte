<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    grade: number;
    onCorrect: () => void;
    onIncorrect: (details: { question: string; answer: string; userVal: string }) => void;
    onFinished: (score: number, total: number) => void;
  }

  let { grade, onCorrect, onIncorrect, onFinished }: Props = $props();

  let questionIndex = $state(0);
  let score = $state(0);
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');
  let disabled = $state(false);

  // Question details
  interface Question {
    type: 'build' | 'expanded';
    targetNumber: number;
    expandedParts?: string[];
  }
  let questions = $state<Question[]>([]);
  let currentQuestion = $derived(questions[questionIndex]);

  // User input states
  // For 'build' type: counters for columns: Ten-Thousands (10k), Thousands (1k), Hundreds (100), Tens (10), Ones (1)
  let userDigits = $state<Record<string, number>>({
    '10k': 0,
    '1k': 0,
    '100': 0,
    '10': 0,
    '1': 0
  });

  // For 'expanded' type: typed input
  let userTextVal = $state<string>('');
  let inputEl = $state<HTMLInputElement | null>(null);

  const COLUMNS = [
    { key: '10k', label: 'Ten-Thousands', value: 10000, color: 'oklch(60% 0.18 310)' },
    { key: '1k', label: 'Thousands', value: 10000, color: 'oklch(65% 0.22 258)' },
    { key: '100', label: 'Hundreds', value: 100, color: 'oklch(58% 0.2 140)' },
    { key: '10', label: 'Tens', value: 10, color: 'oklch(68% 0.18 45)' },
    { key: '1', label: 'Ones', value: 1, color: 'oklch(62% 0.22 20)' }
  ];

  onMount(() => {
    generateQuestions();
    loadQuestion(0);
  });

  function generateQuestions() {
    const list: Question[] = [];
    for (let i = 0; i < 10; i++) {
      // Determine max value based on grade
      const maxVal = grade <= 3 ? 1000 : grade === 4 ? 20000 : 99999;
      const minVal = grade <= 3 ? 100 : 1000;

      const targetNumber = minVal + Math.floor(Math.random() * (maxVal - minVal));
      const type = Math.random() > 0.5 ? 'build' : 'expanded';

      if (type === 'expanded') {
        const str = String(targetNumber);
        const parts: string[] = [];
        for (let j = 0; j < str.length; j++) {
          const digit = parseInt(str[j], 10);
          if (digit > 0) {
            parts.push(String(digit * Math.pow(10, str.length - 1 - j)));
          }
        }
        list.push({ type, targetNumber, expandedParts: parts });
      } else {
        list.push({ type, targetNumber });
      }
    }
    questions = list;
  }

  function loadQuestion(idx: number) {
    questionIndex = idx;
    userDigits = { '10k': 0, '1k': 0, '100': 0, '10': 0, '1': 0 };
    userTextVal = '';
    feedback = '';
    feedbackClass = '';
    disabled = false;
    setTimeout(() => inputEl?.focus(), 50);
  }

  function incrementDigit(key: string) {
    if (disabled) return;
    if (userDigits[key] < 9) userDigits[key]++;
  }

  function decrementDigit(key: string) {
    if (disabled) return;
    if (userDigits[key] > 0) userDigits[key]--;
  }

  function getBuiltNumber(): number {
    return (
      userDigits['10k'] * 10000 +
      userDigits['1k'] * 1000 +
      userDigits['100'] * 100 +
      userDigits['10'] * 10 +
      userDigits['1']
    );
  }

  function handleCheck() {
    if (disabled) return;
    const q = currentQuestion;
    if (!q) return;

    disabled = true;
    let isCorrect = false;
    let userAnsStr = '';
    let correctAnsStr = String(q.targetNumber);

    if (q.type === 'build') {
      const builtVal = getBuiltNumber();
      isCorrect = builtVal === q.targetNumber;
      userAnsStr = String(builtVal);
    } else {
      const val = parseInt(userTextVal.replace(/,/g, '').trim(), 10);
      isCorrect = val === q.targetNumber;
      userAnsStr = userTextVal;
    }

    if (isCorrect) {
      score++;
      feedback = '✓ Excellent! You matched the place values!';
      feedbackClass = 'correct';
      onCorrect();
    } else {
      feedback = `Not quite — the correct number was ${q.targetNumber.toLocaleString()}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        question: q.type === 'build' ? `Build ${q.targetNumber}` : `Solve ${q.expandedParts?.join(' + ')}`,
        answer: correctAnsStr,
        userVal: userAnsStr,
      });
    }

    setTimeout(() => {
      if (questionIndex + 1 < 10) {
        loadQuestion(questionIndex + 1);
      } else {
        onFinished(score, 10);
      }
    }, 1500);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && currentQuestion.type === 'expanded' && userTextVal.trim() !== '') {
      handleCheck();
    }
  }
</script>

<div class="game-container">
  {#if currentQuestion}
    {#if currentQuestion.type === 'build'}
      <div class="instruction">
        Place gems in each column to build: <strong class="target-num">{currentQuestion.targetNumber.toLocaleString()}</strong>
      </div>

      <div class="built-display">
        Current value: <span class="built-val">{getBuiltNumber().toLocaleString()}</span>
      </div>

      <!-- Place Value Columns -->
      <div class="columns-container">
        {#each COLUMNS as col}
          <!-- Hide Ten-Thousands column for smaller numbers to keep it clean -->
          {#if col.key !== '10k' || currentQuestion.targetNumber >= 10000}
            <div class="col-panel" style="--col-color: {col.color}">
              <span class="col-title">{col.key.toUpperCase()}</span>

              <!-- Gem Visuals Area -->
              <div class="gem-slots">
                {#each Array(userDigits[col.key]) as _}
                  <div class="gem"></div>
                {/each}
              </div>

              <div class="col-controls">
                <button
                  onclick={() => incrementDigit(col.key)}
                  {disabled}
                  class="control-btn control-btn--inc"
                  aria-label="Increase {col.label}"
                >+</button>
                <span class="digit-count">{userDigits[col.key]}</span>
                <button
                  onclick={() => decrementDigit(col.key)}
                  {disabled}
                  class="control-btn control-btn--dec"
                  aria-label="Decrease {col.label}"
                >&minus;</button>
              </div>
            </div>
          {/if}
        {/each}
      </div>

      <button onclick={handleCheck} {disabled} class="btn-primary mt-8">
        Verify Construction
      </button>

    {:else}
      <div class="instruction">
        Convert the expanded form into standard number format:
      </div>

      <div class="expanded-expr">
        {currentQuestion.expandedParts?.join(' + ')}
      </div>

      <input
        type="text"
        bind:this={inputEl}
        bind:value={userTextVal}
        {disabled}
        onkeydown={handleKeydown}
        class="answer-input"
        placeholder="Type number..."
        aria-label="Standard format answer"
      />

      <button onclick={handleCheck} disabled={userTextVal.trim() === '' || disabled} class="btn-primary">
        Submit Answer
      </button>
    {/if}

    {#if feedback}
      <div class="feedback-msg {feedbackClass}" aria-live="polite">
        {feedback}
      </div>
    {/if}
  {/if}
</div>

<style>
  /* ── Grove 3 local glow colour ──────────────────────────────────── */
  .game-container {
    --glow-c: var(--glow-blossom);
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    align-items: center;
    width: 100%;
  }

  /* ── Instruction / target number ─────────────────────────────────── */
  .instruction {
    font-size: 1.1rem;
    text-align: center;
    color: var(--color-text);
  }

  .target-num {
    --glow-c: var(--glow-blossom);
    color: var(--color-primary);
    font-size: 1.3rem;
    box-shadow: 0 0 var(--glow-sm) var(--glow-c), 0 0 var(--glow-md) var(--glow-c);
    border-radius: 4px;
    padding: 0 0.2em;
  }

  /* ── Running built value ─────────────────────────────────────────── */
  .built-display {
    font-size: 0.95rem;
    color: var(--color-text-muted);
  }

  .built-val {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-text);
    font-variant-numeric: tabular-nums lining-nums;
  }

  /* ── Column layout ───────────────────────────────────────────────── */
  .columns-container {
    display: flex;
    gap: 0.8rem;
    width: 100%;
    justify-content: center;
    overflow-x: auto;
    padding: 0.5rem 0;
  }

  .col-panel {
    background: var(--color-panel);
    border: 2px dashed var(--col-color, var(--color-border));
    border-radius: var(--r-md);
    width: 90px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.6rem;
  }

  .col-title {
    font-size: 0.85rem;
    font-weight: 700;
    margin-bottom: 0.6rem;
    color: var(--col-color, var(--color-text));
    text-shadow: 0 0 var(--glow-sm) var(--col-color, transparent);
  }

  /* ── Gem slots ───────────────────────────────────────────────────── */
  .gem-slots {
    display: flex;
    flex-direction: column-reverse;
    gap: 4px;
    height: 150px;
    width: 100%;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 0.8rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 4px;
  }

  .gem {
    --glow-c: var(--glow-blossom);
    width: 16px;
    height: 12px;
    border-radius: 50%;
    background: var(--col-color, var(--color-primary));
    border: 1px solid oklch(from var(--col-color, var(--color-primary)) calc(l + 0.15) c h / 0.5);
    box-shadow: 0 0 var(--glow-sm) var(--col-color, var(--glow-c)),
                0 0 var(--glow-md) var(--glow-c);
  }

  /* ── +/- stepper controls ≥48px ─────────────────────────────────── */
  .col-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .control-btn {
    font-size: 1.4rem;
    font-weight: bold;
    line-height: 1;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-panel);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    transition: background 0.15s, box-shadow 0.15s;
  }

  .control-btn--inc {
    --glow-c: var(--color-correct);
    color: var(--color-correct);
  }

  .control-btn--dec {
    --glow-c: var(--color-retry);
    color: var(--color-retry);
  }

  .control-btn:hover:not(:disabled) {
    background: oklch(from var(--color-panel) calc(l + 0.05) c h);
    box-shadow: 0 0 var(--glow-sm) var(--glow-c, var(--glow-blossom));
  }

  .control-btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .control-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .digit-count {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: bold;
    font-variant-numeric: tabular-nums lining-nums;
    color: var(--color-text);
  }

  /* ── Expanded form expression ────────────────────────────────────── */
  .expanded-expr {
    --glow-c: var(--glow-blossom);
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-primary);
    text-shadow: 0 0 var(--glow-sm) var(--glow-c), 0 0 var(--glow-lg) var(--glow-c);
    text-align: center;
    word-break: break-word;
    max-width: 100%;
    font-variant-numeric: tabular-nums lining-nums;
  }

  /* ── Typed answer input ──────────────────────────────────────────── */
  .answer-input {
    --glow-c: var(--glow-blossom);
    width: 100%;
    max-width: 250px;
    padding: 0.8rem 1rem;
    border-radius: var(--r-md);
    background: var(--color-panel);
    border: 2px solid var(--color-border);
    color: var(--color-text);
    font-size: 1.6rem;
    text-align: center;
    font-weight: 700;
    min-height: var(--touch);
    font-variant-numeric: tabular-nums lining-nums;
  }

  .answer-input:focus-visible {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 var(--glow-sm) var(--glow-c), 0 0 var(--glow-md) var(--glow-c);
  }

  .answer-input:disabled {
    opacity: 0.5;
  }

  /* ── Feedback ────────────────────────────────────────────────────── */
  .feedback-msg {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--r-sm);
    text-align: center;
    border: 2px solid transparent;
  }

  .feedback-msg.correct {
    --glow-c: var(--color-correct);
    color: var(--color-correct);
    background: oklch(from var(--color-correct) l c h / 0.1);
    border-color: oklch(from var(--color-correct) l c h / 0.35);
  }

  .feedback-msg.wrong {
    --glow-c: var(--color-retry);
    color: var(--color-retry);
    background: oklch(from var(--color-retry) l c h / 0.1);
    border-color: oklch(from var(--color-retry) l c h / 0.35);
  }

  /* ── Motion-safe keyframes ───────────────────────────────────────── */
  @media (prefers-reduced-motion: no-preference) {
    .feedback-msg.correct {
      animation: glowPulse 0.6s ease-out;
    }

    .feedback-msg.wrong {
      animation: gentleShake 0.4s ease-out;
    }

    @keyframes glowPulse {
      0% { box-shadow: 0 0 0 0 var(--color-correct); }
      50% { box-shadow: 0 0 var(--glow-md) var(--glow-lg) oklch(from var(--color-correct) l c h / 0.5); }
      100% { box-shadow: 0 0 0 0 var(--color-correct); }
    }

    @keyframes gentleShake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
  }
</style>
