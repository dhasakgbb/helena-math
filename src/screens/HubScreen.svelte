<script lang="ts">
  import { profileStore, MATH_MODES, type MathMode } from '../lib/profile.svelte';
  import ProfileBanner from '../components/ProfileBanner.svelte';
  import Mascot from '../components/Mascot.svelte';
  import GardenPlot from '../components/GardenPlot.svelte';
  import GridModal from '../components/GridModal.svelte';

  interface Props {
    onSelectMode: (mode: string) => void;
  }

  let { onSelectMode }: Props = $props();

  const recommendedMode = $derived(profileStore.recommendedMathMode);

  // Group math modes into categories
  const CATEGORIES = [
    {
      id: 'operations',
      title: 'Warm-Up Operations',
      desc: 'Master the basics of numbers, tables, and quick additions.',
      modes: ['times-tables', 'speed-add', 'number-sort'] as MathMode[]
    },
    {
      id: 'fractions',
      title: 'Visual Fractions & Grids',
      desc: 'Explore circles, grids, and decimal shading models.',
      modes: ['fractions-visual', 'multiplication-grid', 'decimals-grid'] as MathMode[]
    },
    {
      id: 'advanced',
      title: 'Advanced Garden Math',
      desc: 'Navigate multi-digit division, trace pathways, and grow PEMDAS trees.',
      modes: ['place-value', 'long-division', 'geometry-angles', 'pemdas-tree'] as MathMode[]
    }
  ];

  const MODES_METADATA = {
    'times-tables': {
      title: 'Times Tables',
      desc: 'Practice multiplication facts and test your memory.',
      color: 'linear-gradient(135deg, rgba(255, 45, 85, 0.15), rgba(255, 45, 85, 0.05))',
      border: 'rgba(255, 45, 85, 0.5)', /* Apple Pink */
      glow: '0 10px 30px rgba(255, 45, 85, 0.1)'
    },
    'speed-add': {
      title: 'Speed Add',
      desc: 'Listen to addition equations and type the answer fast.',
      color: 'linear-gradient(135deg, rgba(52, 199, 89, 0.15), rgba(52, 199, 89, 0.05))',
      border: 'rgba(52, 199, 89, 0.5)', /* Apple Green */
      glow: '0 10px 30px rgba(52, 199, 89, 0.1)'
    },
    'number-sort': {
      title: 'Number Sort',
      desc: 'Sort numbers into Even, Odd, and Prime buckets.',
      color: 'linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(0, 122, 255, 0.05))',
      border: 'rgba(0, 122, 255, 0.5)', /* Apple Blue */
      glow: '0 10px 30px rgba(0, 122, 255, 0.1)'
    },
    'fractions-visual': {
      title: 'Fraction Garden',
      desc: 'Water fraction flower petals to match a target value.',
      color: 'linear-gradient(135deg, rgba(255, 149, 0, 0.15), rgba(255, 149, 0, 0.05))',
      border: 'rgba(255, 149, 0, 0.5)', /* Apple Orange */
      glow: '0 10px 30px rgba(255, 149, 0, 0.1)'
    },
    'place-value': {
      title: 'Place Value Orchard',
      desc: 'Collect falling apples in place value baskets.',
      color: 'linear-gradient(135deg, rgba(175, 82, 222, 0.15), rgba(175, 82, 222, 0.05))',
      border: 'rgba(175, 82, 222, 0.5)', /* Apple Purple */
      glow: '0 10px 30px rgba(175, 82, 222, 0.1)'
    },
    'multiplication-grid': {
      title: 'Multiplication Grid',
      desc: 'Practice multi-digit multiplication with area grids.',
      color: 'linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 204, 0, 0.05))',
      border: 'rgba(255, 204, 0, 0.5)', /* Apple Yellow */
      glow: '0 10px 30px rgba(255, 204, 0, 0.1)'
    },
    'long-division': {
      title: 'Division Stones',
      desc: 'Navigate quotients step-by-step across the pond.',
      color: 'linear-gradient(135deg, rgba(90, 200, 250, 0.15), rgba(90, 200, 250, 0.05))',
      border: 'rgba(90, 200, 250, 0.5)', /* Apple Teal */
      glow: '0 10px 30px rgba(90, 200, 250, 0.1)'
    },
    'decimals-grid': {
      title: 'Decimal Shading',
      desc: 'Draw areas representing tenths and hundredths.',
      color: 'linear-gradient(135deg, rgba(52, 199, 89, 0.15), rgba(52, 199, 89, 0.05))',
      border: 'rgba(52, 199, 89, 0.5)', /* Apple Green */
      glow: '0 10px 30px rgba(52, 199, 89, 0.1)'
    },
    'geometry-angles': {
      title: 'Garden Star Maps',
      desc: 'Plot (x, y) coordinates to draw glowing garden shapes.',
      color: 'linear-gradient(135deg, rgba(255, 45, 85, 0.15), rgba(255, 45, 85, 0.05))',
      border: 'rgba(255, 45, 85, 0.5)', /* Apple Pink */
      glow: '0 10px 30px rgba(255, 45, 85, 0.1)'
    },
    'pemdas-tree': {
      title: 'PEMDAS Trees',
      desc: 'Solve equations and prune trees in correct priority.',
      color: 'linear-gradient(135deg, rgba(175, 82, 222, 0.15), rgba(175, 82, 222, 0.05))',
      border: 'rgba(175, 82, 222, 0.5)', /* Apple Purple */
      glow: '0 10px 30px rgba(175, 82, 222, 0.1)'
    }
  } as const;

  // Compute game progress details live
  function getModeProgress(modeId: string): { label: string; percent: number } {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    const mastery = mathOverrides.mastery?.[modeId] ?? 0;
    const percent = Math.round(mastery * 100);

    if (modeId === 'times-tables') {
      const facts = mathOverrides.times_tables_facts || {};
      let masteredCount = 0;
      for (let f = 2; f <= 12; f++) {
        if ((facts[f] || 0) >= 5) {
          masteredCount++;
        }
      }
      return {
        label: `${masteredCount} of 11 tables mastered (2s-12s)`,
        percent: Math.round((masteredCount / 11) * 100)
      };
    }

    const scoresList = mathOverrides.scores?.[modeId] || [];
    if (scoresList.length === 0) {
      return { label: '🌱 Click to plant!', percent };
    }

    const bestScore = Math.max(...scoresList.map((s: any) => s.score));
    
    if (modeId === 'speed-add') {
      return { label: `Rounds: ${scoresList.length} • Best: ${bestScore}/10`, percent };
    }
    if (modeId === 'number-sort') {
      return { label: `Sorted • Best score: ${bestScore}/10`, percent };
    }
    return { label: `Sprout grown: ${percent}% • Best: ${bestScore}/10`, percent };
  }

  // Calculate overall garden bloom progress
  const totalMasteredFlowers = $derived.by(() => {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    const masteryMap = mathOverrides.mastery || {};
    let count = 0;
    for (const key of MATH_MODES) {
      if ((masteryMap[key] ?? 0) >= 0.85) {
        count++;
      }
    }
    return count;
  });

  const overallGardenPercent = $derived.by(() => {
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    const masteryMap = mathOverrides.mastery || {};
    let totalPercent = 0;
    for (const key of MATH_MODES) {
      totalPercent += Math.round((masteryMap[key] ?? 0) * 100);
    }
    return Math.round(totalPercent / MATH_MODES.length);
  });

  const practiceStreak = $derived((profileStore.profile?.module_overrides?.math as any)?.streak ?? 0);

  // Dynamic recommendations for Astrid
  const smartRecommendation = $derived.by(() => {
    const mode = recommendedMode || 'times-tables';
    const childName = profileStore.profile?.child_label || 'Helena';
    const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
    const facts = mathOverrides.times_tables_facts || {};
    
    let text = `Hi ${childName}! Let's plant some math seeds today. Pick a zone below to get growing!`;
    
    if (mathOverrides.last_mastered_table) {
      text = `I'm still thinking about how fast you crushed the ${mathOverrides.last_mastered_table}s! Ready for what's next?`;
    } else if (mode === 'times-tables') {
      let closeTable = null;
      let needed = 0;
      for (let f = 2; f <= 12; f++) {
        const count = facts[f] || 0;
        if (count > 0 && count < 5) {
          closeTable = f;
          needed = 5 - count;
          break;
        }
      }
      if (closeTable) {
        text = `Ready for the next level? You only need ${needed} more correct ${needed === 1 ? 'answer' : 'answers'} to completely master the ${closeTable}s table. Let's get it. ⚡`;
      } else {
        text = `Yo ${childName}. Jump into Times Tables and start lighting up the garden. 🌟`;
      }
    } else if (mode === 'speed-add') {
      text = `Speed Add is queued up. Let's see how fast your reaction time really is. 🎧`;
    } else if (mode === 'number-sort') {
      text = `Sorting numbers next. Catch the primes and keep your streak alive. 🔥`;
    } else {
      const metadata = MODES_METADATA[mode as keyof typeof MODES_METADATA];
      const title = metadata ? metadata.title : 'Math Hub';
      text = `Welcome back. Let's unlock the ${title} module and clear your goals. 📈`;
    }
    
    return { mode, text };
  });

  let showGridModal = $state(false);

  function handleSelect(mode: string) {
    onSelectMode(mode);
  }

  function handlePlantClick(mode: MathMode) {
    if (mode === 'times-tables') {
      const mathOverrides = (profileStore.profile?.module_overrides?.math as any) || {};
      const mastery = mathOverrides.mastery?.['times-tables'] ?? 0;
      if (mastery >= 0.85) {
        showGridModal = true;
        return;
      }
    }
    handleSelect(mode);
  }
</script>


<div class="bento-dashboard animate-entrance">
  
  <aside class="bento-sidebar">
    <ProfileBanner />
    
    <div class="bento-panel glass-panel astrid-panel">
      <Mascot pose="waving" size={100} />
      <div class="speech-bubble">
        <p>{smartRecommendation.text}</p>
        <button onclick={() => handleSelect(smartRecommendation.mode)} class="btn-primary recommended-play-btn">
          ⚡ Launch Smart Pick
        </button>
      </div>
    </div>
    
    <div class="bento-panel glass-panel metrics-panel">
      <h3 class="panel-title">Overview</h3>
      <div class="metric-row">
        <span class="metric-label">Modules Unlocked</span>
        <span class="metric-val">{totalMasteredFlowers} / 10</span>
      </div>
      <div class="metric-row">
        <span class="metric-label font-neon-orange">Practice Streak</span>
        <span class="metric-val">🔥 {practiceStreak} days</span>
      </div>
      <div class="metric-row-column">
        <div class="metric-label-row">
          <span class="metric-label">Total Growth</span>
          <span class="metric-val">{overallGardenPercent}%</span>
        </div>
        <div class="mini-progress-bar">
          <div class="progress-fill" style="width: {overallGardenPercent}%"></div>
        </div>
      </div>
    </div>
  </aside>

  <main class="bento-main">
    <div class="bento-panel glass-panel hero-panel">
      <GardenPlot onSelectMode={handleSelect} onPlantClick={handlePlantClick} />
    </div>

    <div class="bento-games-grid">
      {#each CATEGORIES as category}
        {#each category.modes as modeId}
          {@const meta = MODES_METADATA[modeId]}
          {@const isRec = recommendedMode === modeId}
          {@const progress = getModeProgress(modeId)}
          {@const isHero = modeId === 'times-tables' || modeId === 'geometry-angles'}
          {@const isWide = modeId === 'fractions-visual' || modeId === 'multiplication-grid'}
          
          <button
            onclick={() => handleSelect(modeId)}
            class="bento-game-card glass-panel"
            class:recommended={isRec}
            class:hero-tile={isHero}
            class:wide-tile={isWide}
            style="--card-color: {meta.border}"
          >
            {#if isRec}
              <div class="smart-pick-badge">Smart Pick</div>
            {/if}
            <div class="card-icon-area" style="background: {meta.color}; border: 1px solid {meta.border}">
              <!-- Visual abstraction based on mode -->
              {#if modeId === 'times-tables'}
                <div class="preview-mini">6×7</div>
              {:else if modeId === 'speed-add'}
                <div class="preview-mini">🔊</div>
              {:else if modeId === 'number-sort'}
                <div class="preview-mini"><div class="ball">7</div></div>
              {:else if modeId === 'fractions-visual'}
                <div class="preview-mini fraction"><div class="slice"></div></div>
              {:else if modeId === 'place-value'}
                <div class="preview-mini">🍎</div>
              {:else if modeId === 'multiplication-grid'}
                <div class="preview-mini grid-icon"></div>
              {:else if modeId === 'long-division'}
                <div class="preview-mini">🐸</div>
              {:else if modeId === 'decimals-grid'}
                <div class="preview-mini dec-grid"></div>
              {:else if modeId === 'geometry-angles'}
                <div class="preview-mini">⭐</div>
              {:else if modeId === 'pemdas-tree'}
                <div class="preview-mini">(+)</div>
              {/if}
            </div>
            
            <div class="card-details">
              <h4>{meta.title}</h4>
              <p>{progress.label}</p>
              <div class="card-progress-bar">
                <div class="card-progress-fill" style="width: {progress.percent}%; background: {meta.border};"></div>
              </div>
            </div>
          </button>
        {/each}
      {/each}
    </div>
  </main>
</div>

{#if showGridModal}
  <GridModal onClose={() => showGridModal = false} />
{/if}

<style>
  .bento-dashboard {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media(min-width: 900px) {
    .bento-dashboard {
      grid-template-columns: 300px 1fr;
      align-items: flex-start;
    }
  }

  /* SIDEBAR */
  .bento-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .bento-panel {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .astrid-panel {
    align-items: center;
    text-align: center;
  }

  .speech-bubble p {
    font-size: 0.95rem;
    color: var(--color-text);
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .recommended-play-btn {
    width: 100%;
    font-size: 0.9rem;
    padding: 0.6rem 1rem;
  }

  .panel-title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
  }

  .metric-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  .metric-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .metric-label {
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }

  .metric-val {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .metric-row-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  .metric-label-row {
    display: flex;
    justify-content: space-between;
  }

  .mini-progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 4px;
    transition: width 1s ease-out;
  }

  /* MAIN CONTENT */
  .bento-main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .hero-panel {
    padding: 0;
    overflow: hidden;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* BENTO GAMES GRID */
  .bento-games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    grid-auto-rows: 160px;
    grid-auto-flow: dense;
    gap: 1.5rem;
  }

  .bento-game-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.5rem;
    text-align: left;
    border: 2px solid transparent;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  
  .bento-game-card.hero-tile {
    grid-column: span 2;
    grid-row: span 2;
  }

  .bento-game-card.wide-tile {
    grid-column: span 2;
    grid-row: span 1;
  }

  /* Responsive: On very small screens, force single column */
  @media(max-width: 600px) {
    .bento-games-grid {
      grid-template-columns: 1fr;
      grid-auto-rows: auto;
    }
    .bento-game-card.hero-tile,
    .bento-game-card.wide-tile {
      grid-column: span 1;
      grid-row: span 1;
      min-height: 160px;
    }
  }

  .bento-game-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    border-color: var(--card-color);
  }

  .recommended {
    border-color: var(--card-color);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8) inset, 0 8px 25px rgba(0, 0, 0, 0.05);
  }

  .smart-pick-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--card-color);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-bottom-left-radius: var(--r-md);
  }

  .card-icon-area {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .card-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0; /* allows truncation */
  }

  .card-details h4 {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-details p {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(0,0,0,0.05);
    border-radius: 2px;
    margin-top: 0.2rem;
  }

  .card-progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  /* Mini Previews */
  .preview-mini {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--color-text);
  }
  .preview-mini.fraction .slice {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: conic-gradient(var(--color-text) 0% 75%, transparent 75% 100%);
    border: 2px solid var(--color-text);
  }
  .preview-mini.grid-icon {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-text);
    background: linear-gradient(90deg, transparent 45%, var(--color-text) 45%, var(--color-text) 55%, transparent 55%),
                linear-gradient(0deg, transparent 45%, var(--color-text) 45%, var(--color-text) 55%, transparent 55%);
  }
  .preview-mini.dec-grid {
    width: 20px;
    height: 20px;
    border: 1px solid var(--color-text);
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
  }
  .ball {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
  }

  /* Modern Web Guidance: Scroll-driven animations */
  @media (prefers-reduced-motion: no-preference) {
    @supports ((animation-timeline: view()) and (animation-range: entry)) {
      @keyframes slide-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .bento-game-card {
        animation: slide-up linear both;
        animation-timeline: view();
        animation-range: entry 10% cover 30%;
      }
    }
  }
</style>
