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
  interface Point {
    x: number;
    y: number;
  }
  interface Question {
    shapeName: string;
    points: Point[];
  }
  let questions = $state<Question[]>([]);
  let currentQuestion = $derived(questions[questionIndex]);

  // User plotted points
  let userPoints = $state<Point[]>([]);
  let drawLines = $state(false);

  onMount(() => {
    generateQuestions();
    loadQuestion(0);
  });

  function generateQuestions() {
    const shapePool: Question[] = [
      {
        shapeName: 'Triangle',
        points: [{ x: 2, y: 2 }, { x: 5, y: 8 }, { x: 8, y: 2 }]
      },
      {
        shapeName: 'Square',
        points: [{ x: 3, y: 3 }, { x: 3, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 3 }]
      },
      {
        shapeName: 'Rectangle',
        points: [{ x: 2, y: 3 }, { x: 2, y: 7 }, { x: 8, y: 7 }, { x: 8, y: 3 }]
      },
      {
        shapeName: 'Trapezoid',
        points: [{ x: 2, y: 2 }, { x: 4, y: 7 }, { x: 6, y: 7 }, { x: 8, y: 2 }]
      },
      {
        shapeName: 'Parallelogram',
        points: [{ x: 2, y: 2 }, { x: 4, y: 7 }, { x: 8, y: 7 }, { x: 6, y: 2 }]
      }
    ];

    // Pick 5 shapes to run (since geometry coordinate plotting is a multi-point task)
    // We shuffle and take all 5
    questions = [...shapePool].sort(() => 0.5 - Math.random());
  }

  function loadQuestion(idx: number) {
    questionIndex = idx;
    userPoints = [];
    drawLines = false;
    feedback = '';
    feedbackClass = '';
    disabled = false;
  }

  // Check if a point is already plotted
  function findPointIndex(x: number, y: number): number {
    return userPoints.findIndex(p => p.x === x && p.y === y);
  }

  function toggleGridPoint(x: number, y: number) {
    if (disabled) return;
    const idx = findPointIndex(x, y);
    if (idx >= 0) {
      // Remove point
      userPoints = userPoints.filter((_, index) => index !== idx);
      playTone(250);
    } else {
      // Add point (up to matching target size)
      if (userPoints.length < currentQuestion.points.length) {
        userPoints = [...userPoints, { x, y }];
        playTone(350 + userPoints.length * 50);
      }
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
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) {}
  }

  function connectConstellation() {
    if (disabled) return;
    const q = currentQuestion;
    if (!q) return;

    disabled = true;
    drawLines = true;

    // Check points match target points. Ordering doesn't matter, just match set coords.
    const isCorrect = q.points.every(tPoint =>
      userPoints.some(uPoint => uPoint.x === tPoint.x && uPoint.y === tPoint.y)
    ) && userPoints.length === q.points.length;

    if (isCorrect) {
      score++;
      feedback = `✓ Brilliant Constellation! You plotted the ${q.shapeName}!`;
      feedbackClass = 'correct';
      playTone(523.25); // high C
      setTimeout(() => playTone(659.25), 100); // E
      setTimeout(() => playTone(783.99), 200); // G
      onCorrect();
    } else {
      feedback = `Oops! That didn't match the ${q.shapeName} coordinates.`;
      feedbackClass = 'wrong';
      playTone(220);
      onIncorrect({
        question: `Plot ${q.shapeName}`,
        answer: q.points.map(p => `(${p.x},${p.y})`).join(', '),
        userVal: userPoints.map(p => `(${p.x},${p.y})`).join(', ')
      });
    }

    setTimeout(() => {
      if (questionIndex + 1 < questions.length) {
        loadQuestion(questionIndex + 1);
      } else {
        onFinished(score, questions.length);
      }
    }, 2500);
  }

  function clearAll() {
    if (disabled) return;
    userPoints = [];
    drawLines = false;
  }
</script>

<div class="game-container">
  <div class="status-bar">
    <span>Constellation {questionIndex + 1} of {questions.length}</span>
    <span>Score: {score}</span>
  </div>

  {#if currentQuestion}
    <div class="instruction">
      Plot coordinates to draw the <strong class="shape-lbl">{currentQuestion.shapeName}</strong>:
      <div class="coords-list">
        {#each currentQuestion.points as pt}
          <span class="coord-badge">({pt.x}, {pt.y})</span>
        {/each}
      </div>
    </div>

    <!-- 10x10 Coordinate Grid -->
    <div class="grid-wrapper">
      <svg viewBox="0 0 110 110" class="coordinate-grid">
        <!-- Grid lines -->
        {#each Array(10) as _, i}
          <!-- vertical lines -->
          <line x1={10 + i * 10} y1="0" x2={10 + i * 10} y2="100" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" />
          <!-- horizontal lines -->
          <line x1="10" y1={i * 10} x2="110" y2={i * 10} stroke="rgba(255,255,255,0.06)" stroke-width="0.5" />
          
          <!-- axis labels -->
          <text x={10 + i * 10} y="105" text-anchor="middle" font-size="3" fill="var(--color-text-muted)">{i}</text>
          <text x="5" y={100 - i * 10 + 1} text-anchor="middle" font-size="3" fill="var(--color-text-muted)">{i}</text>
        {/each}

        <!-- Axes -->
        <line x1="10" y1="0" x2="10" y2="100" stroke="var(--color-border)" stroke-width="1" />
        <line x1="10" y1="100" x2="110" y2="100" stroke="var(--color-border)" stroke-width="1" />

        <!-- Plotted Lines (Constellation connection) -->
        {#if drawLines && userPoints.length > 1}
          {#each userPoints as pt, idx}
            {@const nextPt = userPoints[(idx + 1) % userPoints.length]}
            <line
              x1={10 + pt.x * 10}
              y1={100 - pt.y * 10}
              x2={10 + nextPt.x * 10}
              y2={100 - nextPt.y * 10}
              stroke="var(--glow-moonflower)"
              stroke-width="1.5"
              stroke-dasharray="2, 2"
              class="glow-line"
            />
          {/each}
        {/if}

        <!-- Interactive Plot Intersections -->
        {#each Array(10) as _, yIdx}
          {#each Array(10) as _, xIdx}
            {@const isPlotted = findPointIndex(xIdx, yIdx) >= 0}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <circle
              cx={10 + xIdx * 10}
              cy={100 - yIdx * 10}
              r={isPlotted ? 2.5 : 1.5}
              class="grid-dot"
              class:plotted={isPlotted}
              onclick={() => toggleGridPoint(xIdx, yIdx)}
            />
          {/each}
        {/each}
      </svg>
    </div>

    <div class="control-row mt-4">
      <button onclick={connectConstellation} disabled={userPoints.length < currentQuestion.points.length || disabled} class="btn-primary">
        Connect Stars 🌌
      </button>
      <button onclick={clearAll} {disabled} class="btn-ghost size-btn delete">
        Reset Grid
      </button>
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
  .shape-lbl {
    color: var(--color-primary);
  }

  .coords-list {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 0.4rem;
  }

  .coord-badge {
    background: rgba(255, 208, 0, 0.1);
    border: 1px solid rgba(255, 208, 0, 0.2);
    color: var(--color-accent);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  /* Grid SVG */
  .grid-wrapper {
    width: 250px;
    height: 250px;
    background: rgba(0, 0, 0, 0.25);
    border: 2px solid var(--color-border);
    border-radius: var(--r-md);
    padding: 0.6rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }

  .coordinate-grid {
    width: 100%;
    height: 100%;
  }

  .grid-dot {
    fill: rgba(255, 255, 255, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .grid-dot:hover {
    fill: var(--neon-cyan);
    r: 3;
  }
  .grid-dot.plotted {
    fill: var(--neon-yellow);
    r: 3;
    filter: drop-shadow(0 0 4px var(--neon-yellow));
  }

  .glow-line {
    filter: drop-shadow(0 0 6px var(--neon-cyan));
    animation: pulse-line 1s infinite alternate;
  }
  @keyframes pulse-line {
    from { stroke-width: 1.2; }
    to { stroke-width: 1.8; }
  }

  .control-row {
    display: flex;
    gap: 1rem;
  }

  .size-btn {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
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
