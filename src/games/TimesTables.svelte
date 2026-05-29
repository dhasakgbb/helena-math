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

  // Read mastery from store reactively to show live growth
  const currentFocusMastery = $derived.by(() => {
    if (!focusTable) return 0;
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    const facts = mathOverrides.times_tables_facts || {};
    return Math.min(5, facts[focusTable] || 0);
  });

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
      feedback = '✓ Correct';
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
  <!-- Progress Header -->
  <div class="progress-header">
    <div class="status-bar">
      <span>Question {questionIndex + 1} of 10</span>
      <span>Score: {score}</span>
    </div>
    
    {#if focusTable}
      <div class="mastery-tracker">
        <div class="tracker-top">
          <span class="target-label">Target: <strong>{focusTable}s Table</strong></span>
          <span class="mastery-count">{currentFocusMastery} / 5</span>
        </div>
        <div class="tracker-bar">
          <div class="tracker-fill" style="width: {(currentFocusMastery / 5) * 100}%"></div>
        </div>
        {#if currentFocusMastery >= 5}
          <div class="bloomed-badge animate-bounce">🌸 Bloomed!</div>
        {/if}
      </div>
    {/if}
  </div>

  {#if questions.length > 0}
    <div class="question-box">
      <div class="math-expr">
        {questions[questionIndex].a} &times; {questions[questionIndex].b} = ?
      </div>
      <input
        type="number"
        bind:this={inputEl}
        bind:value={currentVal}
        {disabled}
        onkeydown={handleKeydown}
        class="answer-input {isFluent ? 'fluent-flash' : ''}"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="Type here..."
        aria-label="Type your answer"
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

  .progress-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    padding: 1rem 1.5rem;
    border: 1px solid rgba(255, 0, 127, 0.15);
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .mastery-tracker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
  }

  .tracker-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: #fff;
  }

  .target-label strong {
    color: #ff007f; /* Times Tables Theme Color */
  }

  .mastery-count {
    font-weight: 700;
    color: #ff007f;
  }

  .tracker-bar {
    width: 100%;
    height: 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    overflow: hidden;
  }

  .tracker-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff007f, #ff7ab8);
    border-radius: 6px;
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .bloomed-badge {
    position: absolute;
    right: 0;
    top: -30px;
    background: #ff007f;
    color: #fff;
    padding: 0.2rem 0.8rem;
    border-radius: 12px;
    font-weight: 800;
    font-size: 0.8rem;
    box-shadow: 0 4px 10px rgba(255, 0, 127, 0.4);
  }

  .animate-bounce {
    animation: bouncePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes bouncePop {
    0% { transform: scale(0); opacity: 0; }
    80% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  .question-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    margin-top: 1rem;
  }

  .math-expr {
    font-family: var(--font-display);
    font-size: 3.5rem;
    font-weight: 700;
    color: var(--color-primary);
    text-shadow: 0 4px 12px rgba(98, 154, 258, 0.15);
  }

  .answer-input {
    width: 100%;
    max-width: 220px;
    padding: 0.8rem 1rem;
    border-radius: var(--r-md);
    background: rgba(0, 0, 0, 0.15);
    border: 2px solid var(--color-border);
    color: var(--color-text);
    font-size: 2rem;
    text-align: center;
    font-weight: 700;
    transition: border-color 0.2s ease;
  }
  .answer-input:focus {
    outline: none;
    border-color: #ff007f;
    box-shadow: 0 0 15px rgba(255, 0, 127, 0.3);
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

  .fluent-flash {
    animation: fluentGlow 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes fluentGlow {
    0% { box-shadow: 0 0 0 rgba(0, 230, 118, 0); border-color: var(--success); }
    50% { box-shadow: 0 0 20px rgba(0, 230, 118, 0.8); border-color: var(--success); transform: scale(1.05); }
    100% { box-shadow: 0 0 10px rgba(0, 230, 118, 0.4); border-color: var(--success); transform: scale(1); }
  }
</style>
