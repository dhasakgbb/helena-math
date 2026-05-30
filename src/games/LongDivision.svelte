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

  // Steps: 0 = Divide Tens, 1 = Subtract, 2 = Bring Down, 3 = Divide Ones
  let activeStep = $state<0 | 1 | 2 | 3>(0);

  // Question details
  interface Question {
    dividend: number; // e.g. 74
    divisor: number;  // e.g. 3
    tensDigit: number; // 7
    onesDigit: number; // 4
    step0Ans: number; // 7 / 3 = 2 (quotient)
    step1Ans: number; // 7 - (2*3) = 1 (remainder)
    step2Ans: number; // 14 (bring down 4)
    step3Ans: number; // 14 / 3 = 4 (quotient)
    remAns: number;   // 14 - (4*3) = 2 (remainder)
  }
  let questions = $state<Question[]>([]);
  let currentQuestion = $derived(questions[questionIndex]);

  // User input states
  let userStepVal = $state<string>('');
  let inputEl = $state<HTMLInputElement | null>(null);

  onMount(() => {
    generateQuestions();
    loadQuestion(0);
  });

  function generateQuestions() {
    const list: Question[] = [];
    const count = 5; // 5 long division questions total (each has 4 steps, equivalent to 20 sub-steps!)
    for (let i = 0; i < count; i++) {
      const divisor = 3 + Math.floor(Math.random() * 5); // 3 to 7
      const tensDigit = 5 + Math.floor(Math.random() * 4); // 5 to 8
      const onesDigit = 1 + Math.floor(Math.random() * 8); // 1 to 8
      const dividend = tensDigit * 10 + onesDigit;

      const step0Ans = Math.floor(tensDigit / divisor);
      const step1Ans = tensDigit - (step0Ans * divisor);
      const step2Ans = step1Ans * 10 + onesDigit;
      const step3Ans = Math.floor(step2Ans / divisor);
      const remAns = step2Ans - (step3Ans * divisor);

      list.push({
        dividend,
        divisor,
        tensDigit,
        onesDigit,
        step0Ans,
        step1Ans,
        step2Ans,
        step3Ans,
        remAns
      });
    }
    questions = list;
  }

  function loadQuestion(idx: number) {
    questionIndex = idx;
    activeStep = 0;
    userStepVal = '';
    feedback = '';
    feedbackClass = '';
    disabled = false;
    focusInput();
  }

  function focusInput() {
    setTimeout(() => inputEl?.focus(), 50);
  }

  const STEP_DETAILS = [
    { title: 'Divide Tens', prompt: 'Divide the Tens digit by the divisor. What is the quotient?', key: 'step0Ans' },
    { title: 'Multiply & Subtract', prompt: 'Multiply quotient by divisor, then subtract. What is the remainder?', key: 'step1Ans' },
    { title: 'Bring Down', prompt: 'Bring down the Ones digit. What is the new number?', key: 'step2Ans' },
    { title: 'Divide Ones', prompt: 'Divide this number by the divisor. What is the quotient?', key: 'step3Ans' }
  ] as const;

  function handleCheckStep() {
    if (disabled) return;
    const q = currentQuestion;
    if (!q) return;

    const val = parseInt(userStepVal.trim(), 10);
    const targetKey = STEP_DETAILS[activeStep].key;
    const correctVal = q[targetKey];

    if (val === correctVal) {
      feedback = '✓ Correct step!';
      feedbackClass = 'correct';
      playTone(400 + activeStep * 100);

      disabled = true;
      setTimeout(() => {
        disabled = false;
        feedback = '';
        feedbackClass = '';
        userStepVal = '';
        if (activeStep < 3) {
          activeStep = (activeStep + 1) as any;
          focusInput();
        } else {
          // Completed all 4 steps for this division problem!
          score++;
          onCorrect();
          feedback = `✓ Nice! ${q.dividend} ÷ ${q.divisor} = ${q.step0Ans}${q.step3Ans} R${q.remAns}!`;
          feedbackClass = 'correct';
          disabled = true;
          setTimeout(() => {
            if (questionIndex + 1 < 5) {
              loadQuestion(questionIndex + 1);
            } else {
              onFinished(score, 5);
            }
          }, 2000);
        }
      }, 1000);
    } else {
      feedback = `Not quite. Keep trying!`;
      feedbackClass = 'wrong';
      playTone(220);
      onIncorrect({
        question: `Division ${q.dividend} ÷ ${q.divisor} (Step: ${STEP_DETAILS[activeStep].title})`,
        answer: String(correctVal),
        userVal: userStepVal
      });
    }
  }

  function playTone(freq: number) {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && userStepVal.trim() !== '') {
      handleCheckStep();
    }
  }
</script>

<div class="game-container">
  {#if currentQuestion}
    <div class="instruction">
      Help Astrid solve the long division:
    </div>

    <!-- Long Division Visual Layout -->
    <div class="division-bracket">
      <div class="divisor-val">{currentQuestion.divisor}</div>
      <div class="dividend-container">
        <!-- Quotient line -->
        <div class="quotient-row">
          <span class:filled={activeStep > 0}>{activeStep > 0 ? currentQuestion.step0Ans : ''}</span>
          <span class:filled={activeStep === 3 && feedbackClass === 'correct'}>{activeStep === 3 && feedbackClass === 'correct' ? currentQuestion.step3Ans : ''}</span>
        </div>
        <div class="bracket-roof"></div>
        <div class="dividend-row">
          <span class="digit-tens">{currentQuestion.tensDigit}</span>
          <span class="digit-ones">{currentQuestion.onesDigit}</span>
        </div>

        <!-- Step 1 subtraction lines -->
        {#if activeStep >= 1}
          <div class="work-row subtract">
            &minus; {currentQuestion.step0Ans * currentQuestion.divisor}
          </div>
          <div class="work-line"></div>
          <div class="work-row">
            {currentQuestion.step1Ans}
          </div>
        {/if}

        <!-- Step 2 bring down lines -->
        {#if activeStep >= 2}
          <div class="work-row">
            {currentQuestion.step1Ans}<span class="bring-down">{currentQuestion.onesDigit}</span>
          </div>
        {/if}

        <!-- Step 3 final subtraction lines -->
        {#if activeStep === 3 && feedbackClass === 'correct'}
          <div class="work-row subtract">
            &minus; {currentQuestion.step3Ans * currentQuestion.divisor}
          </div>
          <div class="work-line"></div>
          <div class="work-row remainder">
            Remainder: {currentQuestion.remAns}
          </div>
        {/if}
      </div>
    </div>

    <!-- Step Promoter Panel -->
    <div class="step-card">
      <span class="step-title">STEP {activeStep + 1}: {STEP_DETAILS[activeStep].title.toUpperCase()}</span>
      <p class="step-prompt">{STEP_DETAILS[activeStep].prompt}</p>

      <div class="input-row">
        <input
          type="number"
          bind:this={inputEl}
          bind:value={userStepVal}
          {disabled}
          onkeydown={handleKeydown}
          class="step-input"
          placeholder="Answer"
          aria-label="Active step answer"
        />
        <button onclick={handleCheckStep} disabled={userStepVal.trim() === '' || disabled} class="btn-primary">
          Enter
        </button>
      </div>
    </div>

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
    color: var(--color-text-muted);
  }

  /* Division Bracket Layout */
  .division-bracket {
    display: flex;
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: bold;
    align-items: flex-start;
    margin: 1rem 0;
    gap: 0.5rem;
  }

  .divisor-val {
    color: var(--color-primary);
    padding-right: 0.3rem;
  }

  .dividend-container {
    display: flex;
    flex-direction: column;
    position: relative;
    padding-left: 0.4rem;
  }

  .bracket-roof {
    height: 3px;
    background: var(--color-border);
    width: 100%;
    margin-bottom: 2px;
  }

  .quotient-row {
    display: flex;
    gap: 0.8rem;
    height: 38px;
    padding-left: 0.2rem;
    color: var(--color-text-muted);
  }

  .quotient-row span.filled {
    --glow-c: var(--glow-blossom);
    color: var(--color-text);
    text-shadow: var(--glow-sm);
  }

  .dividend-row {
    display: flex;
    gap: 0.8rem;
    padding-left: 0.2rem;
    color: var(--color-text);
  }

  .work-row {
    font-size: 1.6rem;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    color: var(--color-text-muted);
    padding-right: 0.2rem;
  }

  .work-row.subtract {
    color: var(--color-primary);
  }

  .work-row.remainder {
    color: var(--color-correct);
    font-size: 1.4rem;
  }

  .bring-down {
    color: var(--color-primary);
  }

  @media (prefers-reduced-motion: no-preference) {
    .bring-down {
      animation: bounce 1s infinite alternate;
    }
  }

  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(4px); }
  }

  .work-line {
    height: 2px;
    background: var(--color-border);
    width: 100%;
    margin: 3px 0;
  }

  /* Step Card */
  .step-card {
    width: 100%;
    max-width: 420px;
    background: var(--color-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--r-md);
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  .step-title {
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--color-primary);
    letter-spacing: 0.08em;
  }

  .step-prompt {
    font-size: 0.95rem;
    margin: 0.3rem 0;
    color: var(--color-text);
  }

  .input-row {
    display: flex;
    gap: 0.8rem;
    width: 100%;
    justify-content: center;
  }

  .step-input {
    width: 100px;
    min-height: var(--touch, 48px);
    background: var(--color-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--r-sm);
    color: var(--color-text);
    padding: 0.4rem;
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    font-variant-numeric: tabular-nums lining-nums;
  }

  .step-input:focus-visible {
    outline: none;
    --glow-c: var(--glow-blossom);
    border-color: var(--color-primary);
    box-shadow: var(--glow-md);
  }

  .btn-primary {
    min-height: var(--touch, 48px);
    padding: 0 1.2rem;
    background: var(--color-primary);
    color: var(--color-text);
    border: none;
    border-radius: var(--r-sm);
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
  }

  .btn-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
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
    border: 1px solid var(--color-correct);
    background: transparent;
    --glow-c: var(--glow-blossom);
  }

  @media (prefers-reduced-motion: no-preference) {
    .feedback-msg.correct {
      animation: glow-pulse 0.6s ease-out;
    }
  }

  @keyframes glow-pulse {
    0% { box-shadow: none; }
    50% { box-shadow: var(--glow-md); }
    100% { box-shadow: none; }
  }

  .feedback-msg.wrong {
    color: var(--color-retry);
    border: 1px solid var(--color-retry);
    background: transparent;
  }

  @media (prefers-reduced-motion: no-preference) {
    .feedback-msg.wrong {
      animation: shake 0.4s ease-out;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
</style>
