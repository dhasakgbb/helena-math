<script lang="ts">
  import { onMount } from 'svelte';
  import { profileStore } from '../lib/profile.svelte';

  interface Props {
    grade: number;
    onCorrect: (a: number, b: number, timeMs?: number) => void;
    onIncorrect: (details: { a?: number; b?: number; question: string; answer: number; userVal: number }) => void;
    onFinished: (score: number, total: number) => void;
    setAstridMessage?: (msg: string, pose?: 'thinking' | 'happy' | 'wow' | 'sad' | 'sleeping', duration?: number) => void;
  }

  let { grade, onCorrect, onIncorrect, onFinished, setAstridMessage }: Props = $props();

  let questionIndex = $state(0);
  let score = $state(0);
  let currentVal = $state<string>('');
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');
  let disabled = $state(false);
  let inputEl = $state<HTMLInputElement | null>(null);
  
  let startTime = $state(0);
  let isFluent = $state(false);

  interface Question {
    a: number;
    b: number;
    answer: number;
    isFocus: boolean;
    isMissed?: boolean;
  }
  let questions = $state<Question[]>([]);
  let focusTable = $state<number | null>(null);

  onMount(() => {
    determineFocusAndGenerate();
    focusInput();
    startTime = Date.now();
  });

  function determineFocusAndGenerate() {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    const facts = mathOverrides.times_tables_facts || {};
    const missedFacts = mathOverrides.missed_facts || {};
    
    // Find first unmastered table (2-12)
    let foundFocus = null;
    for (let f = 2; f <= 12; f++) {
      if ((facts[f] || 0) < 5) {
        foundFocus = f;
        break;
      }
    }
    
    focusTable = foundFocus;
    const initialMastery = focusTable ? (facts[focusTable] || 0) : 0;

    if (focusTable && setAstridMessage) {
      const needed = 5 - initialMastery;
      setAstridMessage(`Let's work on your ${focusTable}s! You need ${needed} more correct to master it.`, 'thinking', 5000);
    } else if (setAstridMessage) {
      setAstridMessage(`You've mastered everything! Time for a mixed review. 🌟`, 'wow', 4000);
    }

    const list: Question[] = [];
    const maxVal = grade <= 3 ? 10 : 12; 

    // Inject missed facts
    const validMissed = Object.keys(missedFacts).map(k => {
      const [aStr, bStr] = k.split('x');
      return { a: parseInt(aStr), b: parseInt(bStr) };
    }).filter(q => q.a <= maxVal && q.b <= maxVal);
    
    const missedToInject: {a: number, b: number}[] = [];
    if (validMissed.length > 0) {
      validMissed.sort(() => Math.random() - 0.5);
      const numToInject = Math.min(validMissed.length, Math.random() > 0.5 ? 2 : 1);
      for (let i = 0; i < numToInject; i++) {
        missedToInject.push(validMissed[i]);
      }
      if (setAstridMessage) {
        setTimeout(() => {
          setAstridMessage(`Hey, let's review the ones that gave you trouble last time!`, 'thinking', 4000);
        }, 5500);
      }
    }

    let injectIndex = 0;

    for (let i = 0; i < 10; i++) {
      let a, b, isFocus = false, isMissed = false;
      if (missedToInject.length > 0 && injectIndex < missedToInject.length && list.length >= 2 && Math.random() > 0.4) {
        a = missedToInject[injectIndex].a;
        b = missedToInject[injectIndex].b;
        isMissed = true;
        injectIndex++;
      } else if (focusTable && i < 7) {
        a = focusTable;
        b = 2 + Math.floor(Math.random() * (maxVal - 1));
        isFocus = true;
      } else {
        a = 2 + Math.floor(Math.random() * (maxVal - 1));
        b = 2 + Math.floor(Math.random() * (maxVal - 1));
      }
      
      // Randomize a and b order so it's not always e.g., 7 x N
      if (!isMissed && Math.random() > 0.5) {
        [a, b] = [b, a];
      }
      
      list.push({ a, b, answer: a * b, isFocus, isMissed });
    }
    
    // Ensure all injected are added
    while (injectIndex < missedToInject.length) {
      const q = missedToInject[injectIndex];
      list[list.length - 1 - injectIndex] = { a: q.a, b: q.b, answer: q.a * q.b, isFocus: false, isMissed: true };
      injectIndex++;
    }

    // Shuffle the list
    list.sort(() => Math.random() - 0.5);
    questions = list;
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
    if (val === q.answer) {
      score++;
      feedback = 'Correct!';
      feedbackClass = 'correct';
      
      const elapsedMs = Date.now() - startTime;
      if (elapsedMs <= 3000) {
        isFluent = true;
      }
      
      // This immediately updates the store, triggering reactivity for currentFocusMastery
      onCorrect(q.a, q.b, elapsedMs);
      
      if (isFluent && setAstridMessage && Math.random() > 0.5) {
        setAstridMessage(`Whoa, under 3 seconds! ⚡`, 'wow', 3000);
      } else if (q.isFocus && setAstridMessage && focusTable) {
        const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
        const newMastery = (mathOverrides.times_tables_facts?.[focusTable] || 0);
        
        if (newMastery === 5) {
          setAstridMessage(`Wow! You just mastered the ${focusTable}s table! The plant is blooming! 🌸`, 'wow', 5000);
        } else if (newMastery < 5) {
          const needed = 5 - newMastery;
          if (needed === 1) {
            setAstridMessage(`Almost there! Only 1 left to master your ${focusTable}s!`, 'happy', 3000);
          } else {
            setAstridMessage(`Nice! ${needed} more to master your ${focusTable}s.`, 'happy', 2500);
          }
        }
      } else if (!q.isFocus && setAstridMessage) {
        if (Math.random() > 0.6) setAstridMessage('Great review!', 'happy', 2000);
      }
      
    } else {
      feedback = `Not quite — the answer was ${q.answer}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        a: q.a,
        b: q.b,
        question: `${q.a} × ${q.b}`,
        answer: q.answer,
        userVal: val
      });
      if (setAstridMessage) {
        setAstridMessage(`That's okay, learning is growing!`, 'sad', 3000);
      }
    }

    setTimeout(() => {
      isFluent = false;
      if (questionIndex + 1 < 10) {
        questionIndex++;
        currentVal = '';
        feedback = '';
        feedbackClass = '';
        disabled = false;
        focusInput();
        startTime = Date.now();
      } else {
        if (setAstridMessage) setAstridMessage(`Round finished! You got ${score} out of 10.`, 'happy', 4000);
        onFinished(score, 10);
      }
    }, 1400);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && currentVal.trim() !== '') {
      handleCheck();
    }
  }
</script>

<div class="game-container">
  {#if questions.length > 0}
    <div class="question-box {feedbackClass}">
      <div class="math-expr {feedbackClass === 'correct' ? 'pulse' : ''}">
        {questions[questionIndex].a} &times; {questions[questionIndex].b} = ?
      </div>

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
          aria-label="Type your answer"
        />

        {#if feedbackClass === 'correct'}
          <span class="check-glyph" aria-hidden="true">✓</span>
        {/if}

        {#if isFluent && feedbackClass === 'correct'}
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
    align-items: center;
    width: 100%;
  }

  .question-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
    width: 100%;
  }

  /* The big "6 × 7" question — large display type, tabular numerals so digits don't jitter */
  .math-expr {
    font-family: var(--font-display);
    font-size: clamp(2.6rem, 9vw, 3.75rem);
    font-weight: 700;
    line-height: 1.1;
    color: var(--color-text);
    font-variant-numeric: tabular-nums lining-nums;
    text-shadow: 0 0 18px oklch(82% 0.15 75 / 0.18);
  }
  .math-expr.pulse {
    color: var(--color-correct);
    --glow-c: var(--color-correct);
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
  .answer-input:focus {
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
  .feedback-msg.wrong {
    color: var(--color-retry);
    background: oklch(82% 0.15 75 / 0.12);
  }

  /* Firefly sparkles — fast-correct flourish, marks SPEED distinct from accuracy */
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

  /* All motion is keyframe-based + gated by no-preference, so reduced-motion neutralizes it */
  @media (prefers-reduced-motion: no-preference) {
    .math-expr.pulse,
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
</style>
