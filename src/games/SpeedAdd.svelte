<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    grade: number;
    onCorrect: (a?: number, b?: number, timeMs?: number) => void;
    onIncorrect: (details: { question: string; answer: number; userVal: number }) => void;
    onFinished: (score: number, total: number) => void;
  }

  let { grade, onCorrect, onIncorrect, onFinished }: Props = $props();

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
  <div class="status-bar">
    <span>Question {questionIndex + 1} of 10</span>
    <span>Score: {score}</span>
  </div>

  {#if questions.length > 0}
    <div class="question-box">
      <div class="listening-prompt">
        🎧 Listen carefully...
        {#if isSpeaking}
          <div class="sound-waves">
            <span></span><span></span><span></span>
          </div>
        {/if}
      </div>
      
      <button onclick={() => speakQuestion(questionIndex)} {disabled} class="btn-ghost audio-btn">
        🔊 Hear problem again
      </button>

      <input
        type="number"
        bind:this={inputEl}
        bind:value={currentVal}
        {disabled}
        onkeydown={handleKeydown}
        class="answer-input"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="Type sum here..."
        aria-label="Type the sum"
      />
      <button onclick={handleCheck} disabled={currentVal.trim() === '' || disabled} class="btn-primary">
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

  .status-bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .question-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    width: 100%;
    margin-top: 1rem;
  }

  .listening-prompt {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  .audio-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    border-radius: var(--r-md);
    font-size: 1rem;
    font-weight: 600;
  }

  .answer-input {
    width: 100%;
    max-width: 220px;
    padding: 0.8rem 1rem;
    border-radius: var(--r-md);
    background: rgba(0, 0, 0, 0.15);
    border: 2px solid var(--color-border);
    color: var(--color-text);
    font-size: 1.8rem;
    text-align: center;
    font-weight: 700;
    transition: border-color 0.2s ease;
  }
  .answer-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--glow-cyan);
  }
  .answer-input::-webkit-outer-spin-button,
  .answer-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .feedback-msg {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 600;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--r-sm);
  }
  .feedback-msg.correct {
    color: var(--success);
    background: rgba(0, 230, 118, 0.1);
  }
  .feedback-msg.wrong {
    color: var(--danger);
    background: rgba(255, 23, 68, 0.1);
  }

  :global(.game-container.sonic-boom) {
    animation: goldenFlash 0.8s ease-out;
  }
  @keyframes goldenFlash {
    0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.8); }
    50% { box-shadow: 0 0 40px 20px rgba(255, 215, 0, 0.4); background: rgba(255, 215, 0, 0.1); }
    100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
  }

  .sound-waves {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 10px;
    height: 1.5rem;
  }
  .sound-waves span {
    display: inline-block;
    width: 4px;
    background-color: var(--color-primary);
    border-radius: 2px;
    animation: eqBounce 0.5s infinite alternate ease-in-out;
  }
  .sound-waves span:nth-child(1) { height: 40%; animation-delay: 0s; }
  .sound-waves span:nth-child(2) { height: 100%; animation-delay: 0.2s; }
  .sound-waves span:nth-child(3) { height: 60%; animation-delay: 0.4s; }

  @keyframes eqBounce {
    0% { height: 20%; }
    100% { height: 100%; }
  }
</style>
