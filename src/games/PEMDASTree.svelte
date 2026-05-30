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

  let { grade: _grade, onCorrect, onIncorrect, onFinished, help = $bindable(null) }: Props = $props();

  let questionIndex = $state(0);
  let score = $state(0);
  let feedback = $state<string>('');
  let feedbackClass = $state<'correct' | 'wrong' | ''>('');
  let disabled = $state(false);

  // Question details
  interface Question {
    rawExpr: string; // e.g. "4 + 2 * 3"
    displayExpr: string; // e.g. "4 + 2 × 3"
    steps: {
      expr: string;
      correctOpIdx: number; // index of operator to click
      incorrectFeedback: string;
      replacement: string; // replacement for the evaluated part
    }[];
    answer: number;
  }
  let questions = $state<Question[]>([]);
  let currentQuestion = $derived(questions[questionIndex]);

  // Active step in equation collapse
  let activeStepIdx = $state(0);

  $effect(() => {
    const steps = currentQuestion?.steps;
    if (!steps || steps.length === 0) { help = null; return; }
    const idx = activeStepIdx;
    const cur = steps[idx] ?? steps[0];
    help = {
      howToPlay: 'Tap the operation to do next, following PEMDAS (parentheses, ×÷, +−).',
      hint: cur.incorrectFeedback ?? 'Do parentheses first, then × and ÷, then + and −.',
      steps: steps.map((s) => s.incorrectFeedback ?? '').filter(Boolean).slice(0, 4),
    };
  });

  onMount(() => {
    generateQuestions();
    loadQuestion(0);
  });

  function generateQuestions() {
    const list: Question[] = [
      {
        rawExpr: '4 + 2 * 3',
        displayExpr: '4 + 2 × 3',
        steps: [
          {
            expr: '4 + 2 × 3',
            correctOpIdx: 1, // * is second operator
            incorrectFeedback: 'Remember: Multiplication comes before Addition!',
            replacement: '6'
          },
          {
            expr: '4 + 6',
            correctOpIdx: 0,
            incorrectFeedback: 'Evaluate the remaining addition.',
            replacement: '10'
          }
        ],
        answer: 10
      },
      {
        rawExpr: '(5 + 3) * 2',
        displayExpr: '(5 + 3) × 2',
        steps: [
          {
            expr: '(5 + 3) × 2',
            correctOpIdx: 0, // + is inside parentheses
            incorrectFeedback: 'Remember: Always solve operations inside Parentheses first!',
            replacement: '8'
          },
          {
            expr: '8 × 2',
            correctOpIdx: 0,
            incorrectFeedback: 'Evaluate the remaining multiplication.',
            replacement: '16'
          }
        ],
        answer: 16
      },
      {
        rawExpr: '12 - 8 / 2',
        displayExpr: '12 - 8 ÷ 2',
        steps: [
          {
            expr: '12 - 8 ÷ 2',
            correctOpIdx: 1, // / is second
            incorrectFeedback: 'Remember: Division comes before Subtraction!',
            replacement: '4'
          },
          {
            expr: '12 - 4',
            correctOpIdx: 0,
            incorrectFeedback: 'Evaluate the subtraction.',
            replacement: '8'
          }
        ],
        answer: 8
      },
      {
        rawExpr: '3 * (4 + 6)',
        displayExpr: '3 × (4 + 6)',
        steps: [
          {
            expr: '3 × (4 + 6)',
            correctOpIdx: 1, // + is inside
            incorrectFeedback: 'Remember: Solve Parentheses first!',
            replacement: '10'
          },
          {
            expr: '3 × 10',
            correctOpIdx: 0,
            incorrectFeedback: 'Evaluate the multiplication.',
            replacement: '30'
          }
        ],
        answer: 30
      },
      {
        rawExpr: '10 - 3 + 2',
        displayExpr: '10 - 3 + 2',
        steps: [
          {
            expr: '10 - 3 + 2',
            correctOpIdx: 0, // - comes first from left to right
            incorrectFeedback: 'Addition and Subtraction have equal priority! Solve from left to right.',
            replacement: '7'
          },
          {
            expr: '7 + 2',
            correctOpIdx: 0,
            incorrectFeedback: 'Evaluate the remaining addition.',
            replacement: '9'
          }
        ],
        answer: 9
      }
    ];

    // Pick 5 order of operation questions
    questions = [...list].sort(() => 0.5 - Math.random());
  }

  function loadQuestion(idx: number) {
    questionIndex = idx;
    activeStepIdx = 0;
    feedback = '';
    feedbackClass = '';
    disabled = false;
  }

  // Split expression into tokens: numbers and operator buttons
  interface Token {
    type: 'number' | 'op' | 'paren';
    text: string;
    opIdx?: number; // index of this operator among all operators in expression
  }
  function tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    const parts = expr.split(/(\s+|[()])/);
    
    let opCounter = 0;
    parts.forEach(p => {
      const trimmed = p.trim();
      if (!trimmed) return;
      if (trimmed === '(' || trimmed === ')') {
        tokens.push({ type: 'paren', text: trimmed });
      } else if (trimmed === '+' || trimmed === '-' || trimmed === '×' || trimmed === '÷') {
        tokens.push({ type: 'op', text: trimmed, opIdx: opCounter++ });
      } else {
        tokens.push({ type: 'number', text: trimmed });
      }
    });
    return tokens;
  }

  function handleOpClick(opIdx: number) {
    if (disabled) return;
    const q = currentQuestion;
    if (!q) return;

    const step = q.steps[activeStepIdx];
    if (!step) return;

    if (opIdx === step.correctOpIdx) {
      playTone(400 + activeStepIdx * 100);
      feedback = '✓ Correct step!';
      feedbackClass = 'correct';
      
      disabled = true;
      setTimeout(() => {
        disabled = false;
        feedback = '';
        feedbackClass = '';
        if (activeStepIdx + 1 < q.steps.length) {
          activeStepIdx++;
        } else {
          // Completed
          score++;
          onCorrect();
          feedback = `✓ Completed! Answer is ${q.answer}.`;
          feedbackClass = 'correct';
          disabled = true;
          setTimeout(() => {
            if (questionIndex + 1 < questions.length) {
              loadQuestion(questionIndex + 1);
            } else {
              onFinished(score, questions.length);
            }
          }, 1800);
        }
      }, 1000);
    } else {
      feedback = step.incorrectFeedback;
      feedbackClass = 'wrong';
      playTone(220);
      onIncorrect({
        question: `Solve ${q.displayExpr}`,
        answer: `Step ${activeStepIdx + 1}: Click operator at index ${step.correctOpIdx}`,
        userVal: `Clicked operator at index ${opIdx}`
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
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (_) {}
  }
</script>

<div class="game-container">
  {#if currentQuestion}
    <div class="instruction">
      Click on the operator that should be evaluated <strong>next</strong>:
    </div>

    <!-- Active collapsing equation display -->
    <div class="expr-display {feedbackClass === 'correct' ? 'pulse' : ''} {feedbackClass === 'wrong' ? 'shake' : ''}">
      {#each tokenize(currentQuestion.steps[activeStepIdx].expr) as token}
        {#if token.type === 'op'}
          <button
            onclick={() => handleOpClick(token.opIdx!)}
            {disabled}
            class="op-btn"
            aria-label="Operator {token.text}"
          >
            {token.text}
          </button>
        {:else if token.type === 'paren'}
          <span class="paren-lbl">{token.text}</span>
        {:else}
          <span class="num-lbl">{token.text}</span>
        {/if}
      {/each}
    </div>

    <!-- PEMDAS priorities display banner -->
    <div class="pemdas-banner">
      <div class="p-letter group-p">P</div>
      <div class="p-letter group-e">E</div>
      <div class="p-letter group-md">M</div>
      <div class="p-letter group-md">D</div>
      <div class="p-letter group-as">A</div>
      <div class="p-letter group-as">S</div>
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
    text-align: center;
  }

  /* Equation display */
  .expr-display {
    display: flex;
    gap: 0.8rem;
    align-items: center;
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: bold;
    font-variant-numeric: tabular-nums;
    min-height: 80px;
    margin: 1rem 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .num-lbl {
    color: var(--color-text);
  }

  .paren-lbl {
    color: var(--color-text-muted);
  }

  .op-btn {
    --glow-c: var(--glow-blossom);
    background: oklch(18% 0.05 300 / 0.75);
    color: var(--color-text);
    width: 52px;
    height: 52px;
    min-width: 48px;
    min-height: 48px;
    border-radius: var(--r-sm);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.8rem;
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .op-btn:hover:not(:disabled),
  .op-btn:focus-visible:not(:disabled) {
    border-color: var(--color-primary);
    box-shadow: var(--glow-md);
    outline: none;
  }
  .op-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* PEMDAS visual aid */
  .pemdas-banner {
    display: flex;
    gap: 0.3rem;
    background: var(--color-panel);
    border: 1px solid var(--color-border);
    padding: 0.4rem 0.8rem;
    border-radius: var(--r-md);
  }

  .p-letter {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: bold;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
  }

  .group-p {
    background: oklch(20% 0.06 300 / 0.6);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
  .group-e {
    background: oklch(20% 0.06 270 / 0.6);
    color: var(--color-text-muted);
  }
  .group-md {
    background: oklch(20% 0.05 200 / 0.6);
    color: var(--color-correct);
    border-color: var(--color-correct);
  }
  .group-as {
    background: oklch(20% 0.06 60 / 0.6);
    color: var(--color-retry);
    border-color: var(--color-retry);
  }

  .feedback-msg {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--r-sm);
    text-align: center;
    max-width: 340px;
  }
  .feedback-msg.correct {
    color: var(--color-correct);
    background: oklch(80% 0.16 150 / 0.12);
  }
  .feedback-msg.wrong {
    color: var(--color-retry);
    background: oklch(82% 0.15 75 / 0.12);
    border: 1px solid oklch(82% 0.15 75 / 0.3);
  }

  /* All animation is keyframe-based and gated by no-preference */
  @media (prefers-reduced-motion: no-preference) {
    .expr-display.pulse {
      animation: glowPulse 0.7s ease-out;
    }
    .expr-display.shake {
      animation: gentleShake 0.45s ease-in-out;
    }

    @keyframes glowPulse {
      0% { filter: none; }
      40% { filter: drop-shadow(0 0 8px oklch(80% 0.16 150 / 0.8)); }
      100% { filter: none; }
    }

    @keyframes gentleShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-5px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(3px); }
    }
  }
</style>
