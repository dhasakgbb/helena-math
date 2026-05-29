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
  <div class="status-bar">
    <span>Equation {questionIndex + 1} of {questions.length}</span>
    <span>Score: {score}</span>
  </div>

  {#if currentQuestion}
    <div class="instruction">
      Click on the operator that should be evaluated <strong>next</strong>:
    </div>

    <!-- Active collapsing equation display -->
    <div class="expr-display">
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
      <div class="p-letter group-md">E</div>
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

  .status-bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .instruction {
    font-size: 1.05rem;
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
    min-height: 80px;
    margin: 1rem 0;
  }

  .num-lbl {
    color: var(--color-text);
  }

  .paren-lbl {
    color: var(--color-text-muted);
  }

  .op-btn {
    background: linear-gradient(135deg, var(--color-primary), var(--neon-purple));
    color: light-dark(#ffffff, #0b0c16);
    width: 44px;
    height: 44px;
    border-radius: var(--r-sm);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.8rem;
    box-shadow: 0 4px 12px rgba(157,78,221,0.25);
    border: 1px solid rgba(255,255,255,0.2);
  }
  .op-btn:hover {
    transform: scale(1.08) translateY(-2px);
    box-shadow: 0 6px 16px rgba(157,78,221,0.4);
  }
  .op-btn:disabled {
    opacity: 0.5;
    transform: none;
    box-shadow: none;
    cursor: not-allowed;
  }

  /* PEMDAS visual aid */
  .pemdas-banner {
    display: flex;
    gap: 0.3rem;
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid var(--color-border);
    padding: 0.4rem 0.8rem;
    border-radius: var(--r-md);
  }

  .p-letter {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: bold;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .group-p { background: rgba(157,78,221,0.2); color: var(--neon-purple); border: 1px solid rgba(157,78,221,0.3); }
  .group-md { background: rgba(0,255,224,0.15); color: var(--neon-cyan); border: 1px solid rgba(0,255,224,0.3); }
  .group-as { background: rgba(255,0,127,0.15); color: var(--neon-pink); border: 1px solid rgba(255,0,127,0.3); }

  .feedback-msg {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--r-sm);
    text-align: center;
    max-width: 320px;
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
