<script lang="ts">
  import Mascot from '../components/Mascot.svelte';

  interface Props {
    score: number;
    total: number;
    onPlayAgain: () => void;
    onPickAnother: () => void;
  }

  let { score, total, onPlayAgain, onPickAnother }: Props = $props();

  const isHighscore = $derived(score >= 8);
  const mascotPose = $derived(isHighscore ? 'cheering' : 'waving');

  const titleMessage = $derived(
    score >= 9 ? 'Excellent!' :
    score >= 7 ? 'Strong work.' :
    score >= 5 ? 'Solid effort.' :
                 'Good try — keep going.'
  );
</script>

<div class="end-screen glass-panel animate-entrance text-center">
  <div class="mascot-wrapper">
    <Mascot pose={mascotPose} size={150} />
  </div>

  <h1>{titleMessage}</h1>
  
  <p class="score-display">
    You got <span class="score-val">{score}</span> out of {total} correct!
  </p>

  <p class="text-muted description">
    {#if score >= 9}
      Amazing! Helena, you crushed this round! Astrid is dancing with joy.
    {:else}
      Great practicing today. Every question you answer helps you build your math superpowers!
    {/if}
  </p>

  <div class="actions mt-8">
    <button onclick={onPlayAgain} class="btn-primary">
      Play Again
    </button>
    <button onclick={onPickAnother} class="btn-ghost">
      Pick a Different Mode
    </button>
  </div>
</div>

<style>
  .end-screen {
    width: 100%;
    max-width: 650px;
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .mascot-wrapper {
    height: 150px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .end-screen h1 {
    font-size: 2.2rem;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
  }

  .score-display {
    font-size: 1.5rem;
    font-weight: 500;
  }

  .score-val {
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--neon-cyan);
    text-shadow: var(--glow-cyan);
  }

  .description {
    max-width: 420px;
    margin: 0 auto;
    font-size: 1rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
