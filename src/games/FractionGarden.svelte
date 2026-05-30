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

  // Fraction target
  interface Fraction {
    num: number;
    den: number;
  }
  let target = $state<Fraction>({ num: 1, den: 2 });
  let questions = $state<Fraction[]>([]);

  // User input state
  let selectedDenominator = $state(4);
  let wateredPetals = $state<Record<number, boolean>>({});

  onMount(() => {
    generateQuestions();
    loadQuestion(0);
  });

  function generateQuestions() {
    const fractionPool: Fraction[] = [
      { num: 1, den: 2 },
      { num: 1, den: 3 },
      { num: 2, den: 3 },
      { num: 1, den: 4 },
      { num: 3, den: 4 },
      { num: 2, den: 4 }, // equivalent to 1/2
      { num: 2, den: 6 }, // equivalent to 1/3
      { num: 3, den: 6 }, // equivalent to 1/2
      { num: 4, den: 6 }, // equivalent to 2/3
      { num: 2, den: 8 }, // equivalent to 1/4
      { num: 4, den: 8 }, // equivalent to 1/2
      { num: 6, den: 8 }  // equivalent to 3/4
    ];
    
    // Sort / filter based on grade if necessary
    // Let's shuffle and pick 10
    const list = [...fractionPool].sort(() => 0.5 - Math.random()).slice(0, 10);
    questions = list;
  }

  function loadQuestion(idx: number) {
    questionIndex = idx;
    target = questions[idx];
    // Reset flower
    selectedDenominator = target.den; // starting point
    wateredPetals = {};
  }

  function getWateredCount(): number {
    return Object.values(wateredPetals).filter(Boolean).length;
  }

  // Path generator for circle slices
  function getSlicePath(index: number, total: number): string {
    const radius = 42;
    const center = 50;
    const startAngle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const endAngle = ((index + 1) * 2 * Math.PI) / total - Math.PI / 2;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  }

  function togglePetal(idx: number) {
    if (disabled) return;
    wateredPetals[idx] = !wateredPetals[idx];
    playTone(300 + idx * 50, 'drop'); // Auditory tick
  }

  function playTone(freq: number, type: 'drop' | 'chime' = 'drop') {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (type === 'drop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.type = 'sine';
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc2.frequency.setValueAtTime(freq * 2.76, ctx.currentTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc2.start();
        osc.stop(ctx.currentTime + 0.9);
        osc2.stop(ctx.currentTime + 0.9);
      }
    } catch (_) {}
  }

  function playHarmony() {
    // Play a nice major chord (equivalent fractions match)
    [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'chime'), idx * 80);
    });
  }

  function checkEquivalent() {
    if (disabled) return;
    const watered = getWateredCount();
    const userVal = watered / selectedDenominator;
    const targetVal = target.num / target.den;

    // JavaScript precision safety
    const isCorrect = Math.abs(userVal - targetVal) < 0.0001;

    disabled = true;

    if (isCorrect) {
      score++;
      feedback = '✓ Perfect Match! Equivalent fraction created!';
      feedbackClass = 'correct';
      playHarmony();
      onCorrect();
    } else {
      feedback = `Not quite. ${watered}/${selectedDenominator} does not equal ${target.num}/${target.den}.`;
      feedbackClass = 'wrong';
      onIncorrect({
        question: `Match ${target.num}/${target.den}`,
        answer: `${target.num}/${target.den}`,
        userVal: `${watered}/${selectedDenominator}`
      });
    }

    setTimeout(() => {
      if (questionIndex + 1 < 10) {
        loadQuestion(questionIndex + 1);
        feedback = '';
        feedbackClass = '';
        disabled = false;
      } else {
        onFinished(score, 10);
      }
    }, 1800);
  }
</script>

<div class="game-container">
  <div class="status-bar">
    <span>Flower {questionIndex + 1} of 10</span>
    <span>Score: {score}</span>
  </div>

  {#if target}
    <div class="target-container">
      <span class="target-label">Water the flower to match:</span>
      <div class="target-visual-wrapper">
        <div class="fraction-display animate-pulse">
          <span class="numerator">{target.num}</span>
          <span class="fraction-line"></span>
          <span class="denominator">{target.den}</span>
        </div>
        <svg viewBox="0 0 100 100" class="target-pie">
          <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.05)" stroke="var(--color-border)" />
          {#each Array(target.den) as _, i}
            <path
              d={getSlicePath(i, target.den)}
              class="target-slice"
              class:filled={i < target.num}
            />
          {/each}
        </svg>
      </div>
    </div>

    <!-- The Garden Plot -->
    <div class="garden-plot">
      <svg viewBox="0 0 100 100" class="flower-svg">
        <defs>
          <linearGradient id="waterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#00f2fe" />
            <stop offset="100%" stop-color="#4facfe" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <!-- Dirt / Plot background -->
        <circle cx="50" cy="50" r="46" fill="rgba(112, 98, 235, 0.03)" stroke="var(--color-border)" stroke-width="1" />
        
        <!-- Petals -->
        {#each Array(selectedDenominator) as _, i}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
          <path
            d={getSlicePath(i, selectedDenominator)}
            class="petal"
            class:watered={wateredPetals[i]}
            onclick={() => togglePetal(i)}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePetal(i); } }}
            aria-label="Petal {i + 1}"
          />
        {/each}
        
        <!-- Center of Flower -->
        <circle cx="50" cy="50" r="10" fill="var(--color-accent)" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
        <text x="50" y="53" text-anchor="middle" font-size="7" font-weight="bold" fill="#0b0c16">
          {getWateredCount()}/{selectedDenominator}
        </text>
      </svg>
    </div>

    <!-- Denominator Slider Control -->
    <div class="control-panel">
      <div class="control-label">
        Number of Petals (Denominator): <strong>{selectedDenominator}</strong>
      </div>
      <div class="slider-wrapper">
        <span class="slider-val">2</span>
        <input
          type="range"
          min="2"
          max="8"
          step="1"
          {disabled}
          bind:value={selectedDenominator}
          oninput={() => wateredPetals = {}}
          class="denom-slider"
        />
        <span class="slider-val">8</span>
      </div>
    </div>

    <button onclick={checkEquivalent} disabled={getWateredCount() === 0 || disabled} class="btn-primary">
      Water Flower
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

  .status-bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .target-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .target-label {
    font-size: 0.95rem;
    color: var(--color-text-muted);
  }

  .target-visual-wrapper {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 0.5rem;
  }

  .target-pie {
    width: 60px;
    height: 60px;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
  }
  
  .target-slice {
    fill: transparent;
    stroke: var(--color-border);
    stroke-width: 1;
    transition: fill 0.3s ease;
  }
  
  .target-slice.filled {
    fill: var(--neon-cyan);
    opacity: 0.8;
  }

  .fraction-display {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--neon-cyan);
    text-shadow: var(--glow-cyan);
  }
  .fraction-line {
    width: 100%;
    height: 3px;
    background: var(--neon-cyan);
    margin: 2px 0;
    box-shadow: 0 0 8px var(--neon-cyan);
  }

  .garden-plot {
    width: 200px;
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .flower-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.2));
  }

  .petal {
    fill: rgba(255, 255, 255, 0.04);
    stroke: var(--color-border);
    stroke-width: 1.5;
    cursor: pointer;
    transition: fill 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.6s ease, transform 0.3s ease;
    transform-origin: 50px 50px;
  }
  .petal:hover {
    fill: rgba(255, 255, 255, 0.12);
    transform: scale(1.02);
  }
  .petal.watered {
    fill: url(#waterGrad);
    stroke: rgba(255, 255, 255, 0.4);
    filter: url(#glow);
    transform: scale(1.05);
  }

  .control-panel {
    width: 100%;
    max-width: 320px;
    background: rgba(0, 0, 0, 0.12);
    border: 1px solid var(--color-border);
    border-radius: var(--r-md);
    padding: 0.8rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .slider-wrapper {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .slider-val {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .denom-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-border);
    height: 6px;
    border-radius: 3px;
    outline: none;
  }
  .denom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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
