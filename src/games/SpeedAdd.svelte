<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { GameHelp } from '../lib/help';

  interface Props {
    grade: number;
    onCorrect: (a?: number, b?: number, timeMs?: number) => void;
    onIncorrect: (details: { question: string; answer: number; userVal: number }) => void;
    onFinished: (score: number, total: number) => void;
    help?: GameHelp | null;
  }

  let { grade, onCorrect, onIncorrect, onFinished, help = $bindable(null) }: Props = $props();

  let questionIndex = $state(0);
  let score = $state(0);
  let currentVal = $state<string>('');
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');
  let disabled = $state(false);
  let inputEl = $state<HTMLInputElement | null>(null);
  let startTime = 0;
  let sonicBoom = $state(false);
  let isSpeaking = $state(false);

  interface Question {
    a: number;
    b: number;
    answer: number;
  }
  let questions = $state<Question[]>([]);

  $effect(() => {
    const q = questions[questionIndex];
    if (!q) { help = null; return; }
    const a = q.a, b = q.b;
    const big = Math.max(a, b), small = Math.min(a, b);
    help = {
      howToPlay: "Listen to the sum and type the total. Example: 'four plus five' → 9.",
      hint: 'Add the bigger number first, then count on.',
      steps: [
        `Start at ${big}`,
        `Count on ${small} more`,
        `${a} + ${b} = ${a + b}`,
      ],
    };
  });

  onMount(() => {
    generateQuestions();
    speakQuestion(0);
    focusInput();
  });

  onDestroy(() => {
    cancelSpeech();
  });

  function generateQuestions() {
    const list: Question[] = [];
    let minVal = 5;
    let maxVal = 49;
    if (grade <= 3) {
      minVal = 5;
      maxVal = 30;
    } else if (grade === 4) {
      minVal = 10;
      maxVal = 60;
    } else {
      minVal = 15;
      maxVal = 99;
    }

    for (let i = 0; i < 10; i++) {
      const a = minVal + Math.floor(Math.random() * (maxVal - minVal));
      const b = minVal + Math.floor(Math.random() * (maxVal - minVal));
      list.push({ a, b, answer: a + b });
    }
    questions = list;
  }

  function speakQuestion(index: number) {
    const q = questions[index];
    if (!q) return;
    const text = `${q.a} plus ${q.b}`;
    speakText(text);
    startTime = Date.now();
  }

  function speakText(text: string) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => { isSpeaking = true; };
      utterance.onend = () => { isSpeaking = false; };
      utterance.onerror = () => { isSpeaking = false; };
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      isSpeaking = false;
    }
  }

  function cancelSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
    }
  }

  function focusInput() {
    setTimeout(() => inputEl?.focus(), 50);
  }

  function handleCheck() {
    if (disabled) return;
    const val = parseInt(currentVal, 10);
    const q = questions[questionIndex];
    if (!q) return;

    disabled = true;
    cancelSpeech();

    if (val === q.answer) {
      score++;
      feedback = '✓ Correct';
      feedbackClass = 'correct';

      const elapsedMs = Date.now() - startTime;
      if (elapsedMs <= 3000) {
        sonicBoom = true;
        onCorrect(q.a, q.b, elapsedMs);
      } else {
        onCorrect();
      }
    } else {
      feedback = `Not quite — the answer was ${q.answer}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        question: `${q.a} + ${q.b}`,
        answer: q.answer,
        userVal: val
      });
    }

    setTimeout(() => {
      if (questionIndex + 1 < 10) {
        questionIndex++;
        currentVal = '';
        feedback = '';
        feedbackClass = '';
        sonicBoom = false;
        disabled = false;
        speakQuestion(questionIndex);
        focusInput();
      } else {
        onFinished(score, 10);
      }
    }, 1200);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && currentVal.trim() !== '') {
      handleCheck();
    }
  }
</script>

<div class="game-container" class:sonic-boom={sonicBoom}>
  {#if questions.length > 0}
    <div class="question-box">
      <div class="listening-prompt">
        🎧 Listen carefully…
        {#if isSpeaking}
          <div class="sound-waves" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
        {/if}
      </div>

      <button onclick={() => speakQuestion(questionIndex)} {disabled} class="btn-audio">
        🔊 Hear again
      </button>

      <div class="input-wrap {feedbackClass === 'wrong' ? 'shake' : ''}">
        <input
          type="number"
          bind:this={inputEl}
          bind:value={currentVal}
          {disabled}
          onkeydown={handleKeydown}
          class="answer-input {feedbackClass} {feedbackClass === 'correct' ? 'pulse' : ''}"
          inputmode="numeric"
          pattern="[0-9]*"
          placeholder="…"
          aria-label="Type the sum"
        />

        {#if feedbackClass === 'correct'}
          <span class="check-glyph" aria-hidden="true">✓</span>
        {/if}

        {#if sonicBoom && feedbackClass === 'correct'}
          <div class="sparkles" aria-hidden="true">
            <span class="spark spark-1"></span>
            <span class="spark spark-2"></span>
            <span class="spark spark-3"></span>
            <span class="spark spark-4"></span>
          </div>
        {/if}
      </div>

      <button
        onclick={handleCheck}
        disabled={currentVal.trim() === '' || disabled}
        class="btn-check"
      >
        Check Answer
      </button>

      {#if feedback}
        <div class="feedback-msg {feedbackClass}" aria-live="polite">
          {feedback}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .game-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
    width: 100%;
  }

  .question-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
    width: 100%;
    margin-top: 1rem;
  }

  /* Audio-first listening prompt */
  .listening-prompt {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  /* Replay button — at least 48px tall, ghost-on-dark style */
  .btn-audio {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: var(--touch);
    padding: 0 1.2rem;
    border: 2px solid var(--color-border);
    border-radius: var(--r-md);
    background: transparent;
    color: var(--color-text-muted);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease;
  }
  .btn-audio:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .btn-audio:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .input-wrap {
    position: relative;
    display: flex;
    justify-content: center;
    width: 100%;
  }

  /* Pale-glowing field on dark */
  .answer-input {
    width: 100%;
    max-width: 240px;
    min-height: var(--touch);
    padding: 0.7rem 1rem;
    border-radius: var(--r-md);
    background: oklch(22% 0.04 280 / 0.55);
    border: 2px solid var(--color-border);
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    font-variant-numeric: tabular-nums lining-nums;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease;
  }
  .answer-input::placeholder {
    color: var(--color-text-muted);
    opacity: 0.55;
  }
  /* Clear glowing focus ring */
  .answer-input:focus-visible {
    outline: none;
    border-color: var(--color-primary);
    --glow-c: var(--color-primary);
    box-shadow: var(--glow-md);
    background: oklch(26% 0.04 280 / 0.6);
  }
  .answer-input.correct {
    border-color: var(--color-correct);
    --glow-c: var(--color-correct);
    box-shadow: var(--glow-md);
  }
  /* Wrong = amber retry outline (no red) */
  .answer-input.wrong {
    border-color: var(--color-retry);
    --glow-c: var(--color-retry);
    box-shadow: var(--glow-sm);
  }
  .answer-input::-webkit-outer-spin-button,
  .answer-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Check glyph — accompanies the green so feedback isn't color-alone */
  .check-glyph {
    position: absolute;
    right: max(0px, calc(50% - 145px));
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--color-correct);
    --glow-c: var(--color-correct);
    text-shadow: var(--glow-sm);
    pointer-events: none;
  }

  /* Check Answer button — ≥48px, on-theme */
  .btn-check {
    min-height: var(--touch);
    padding: 0 1.75rem;
    border: none;
    border-radius: var(--r-md);
    background: var(--color-primary);
    color: oklch(22% 0.05 280);
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    --glow-c: var(--color-primary);
    box-shadow: var(--glow-sm);
    transition: transform 0.12s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  .btn-check:hover:not(:disabled) {
    background: var(--color-primary-strong);
    box-shadow: var(--glow-md);
  }
  .btn-check:active:not(:disabled) {
    transform: translateY(1px);
  }
  .btn-check:disabled {
    opacity: 0.45;
    cursor: default;
    box-shadow: none;
  }

  .feedback-msg {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 600;
    padding: 0.4rem 1.1rem;
    border-radius: var(--r-sm);
  }
  .feedback-msg.correct {
    color: var(--color-correct);
    background: oklch(80% 0.16 150 / 0.12);
  }
  /* Wrong = amber, never red */
  .feedback-msg.wrong {
    color: var(--color-retry);
    background: oklch(82% 0.15 75 / 0.12);
  }

  /* Sonic-boom gold shimmer — firefly sparkles for sub-3s bonus */
  .sparkles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .spark {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--glow-firefly);
    --glow-c: var(--glow-firefly);
    box-shadow: var(--glow-sm);
    opacity: 0;
  }
  .spark-1 { top: -6px; left: 28%; }
  .spark-2 { top: 4px; right: 24%; }
  .spark-3 { bottom: -4px; left: 38%; }
  .spark-4 { bottom: 2px; right: 32%; }

  /* Sound waves — EQ bars shown while TTS is speaking */
  .sound-waves {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 1.4rem;
  }
  .sound-waves span {
    display: inline-block;
    width: 4px;
    background-color: var(--color-primary);
    border-radius: 2px;
  }
  .sound-waves span:nth-child(1) { height: 40%; }
  .sound-waves span:nth-child(2) { height: 100%; }
  .sound-waves span:nth-child(3) { height: 60%; }

  /* All motion gated by prefers-reduced-motion — zero JS transforms for motion */
  @media (prefers-reduced-motion: no-preference) {
    .answer-input.pulse {
      animation: bloomPulse 0.7s ease-out;
    }
    .input-wrap.shake {
      animation: gentleShake 0.45s ease-in-out;
    }
    .spark-1 { animation: twinkle 0.9s ease-out 0.02s; }
    .spark-2 { animation: twinkle 0.9s ease-out 0.12s; }
    .spark-3 { animation: twinkle 0.9s ease-out 0.08s; }
    .spark-4 { animation: twinkle 0.9s ease-out 0.18s; }
    .sound-waves span {
      animation: eqBounce 0.5s infinite alternate ease-in-out;
    }
    .sound-waves span:nth-child(1) { animation-delay: 0s; }
    .sound-waves span:nth-child(2) { animation-delay: 0.2s; }
    .sound-waves span:nth-child(3) { animation-delay: 0.4s; }
  }

  @keyframes bloomPulse {
    0% { box-shadow: 0 0 0 oklch(80% 0.16 150 / 0); }
    45% {
      box-shadow: 0 0 10px var(--color-correct), 0 0 36px -4px var(--color-correct);
      transform: scale(1.04);
    }
    100% { transform: scale(1); }
  }

  @keyframes gentleShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(2px); }
  }

  @keyframes twinkle {
    0% { opacity: 0; transform: scale(0.3); }
    40% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0; transform: scale(0.4) translateY(-8px); }
  }

  @keyframes eqBounce {
    0% { height: 20%; }
    100% { height: 100%; }
  }
</style>
