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
      color: 'linear-gradient(135deg, rgba(255, 0, 127, 0.2), rgba(255, 0, 127, 0.05))',
      border: 'oklch(62% 0.22 340)', // Neon Pink
      glow: '0 0 15px rgba(255, 0, 127, 0.25)'
    },
    'speed-add': {
      title: 'Speed Add',
      desc: 'Listen to addition equations and type the answer fast.',
      color: 'linear-gradient(135deg, rgba(0, 255, 224, 0.2), rgba(0, 255, 224, 0.05))',
      border: 'oklch(76% 0.16 200)', // Neon Cyan
      glow: '0 0 15px rgba(0, 255, 224, 0.25)'
    },
    'number-sort': {
      title: 'Number Sort',
      desc: 'Sort numbers into Even, Odd, and Prime buckets.',
      color: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2), rgba(0, 230, 118, 0.05))',
      border: 'oklch(65% 0.2 140)', // Neon Green
      glow: '0 0 15px rgba(0, 230, 118, 0.25)'
    },
    'fractions-visual': {
      title: 'Fraction Garden',
      desc: 'Water fraction flower petals to match a target value.',
      color: 'linear-gradient(135deg, rgba(255, 142, 0, 0.2), rgba(255, 142, 0, 0.05))',
      border: 'oklch(68% 0.18 45)', // Saturated Orange
      glow: '0 0 15px rgba(255, 142, 0, 0.25)'
    },
    'place-value': {
      title: 'Place Value Orchard',
      desc: 'Collect falling apples in place value baskets.',
      color: 'linear-gradient(135deg, rgba(255, 0, 224, 0.2), rgba(255, 0, 224, 0.05))',
      border: 'oklch(60% 0.18 310)', // Vibrant Violet
      glow: '0 0 15px rgba(255, 0, 224, 0.25)'
    },
    'multiplication-grid': {
      title: 'Multiplication Grid',
      desc: 'Practice multi-digit multiplication with area grids.',
      color: 'linear-gradient(135deg, rgba(255, 213, 0, 0.2), rgba(255, 213, 0, 0.05))',
      border: 'oklch(78% 0.18 85)', // Radiant Yellow
      glow: '0 0 15px rgba(255, 213, 0, 0.25)'
    },
    'long-division': {
      title: 'Division Stones',
      desc: 'Navigate quotients step-by-step across the pond.',
      color: 'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(0, 191, 255, 0.05))',
      border: 'oklch(65% 0.18 220)', // Deep Sky Blue
      glow: '0 0 15px rgba(0, 191, 255, 0.25)'
    },
    'decimals-grid': {
      title: 'Decimal Shading',
      desc: 'Draw areas representing tenths and hundredths.',
      color: 'linear-gradient(135deg, rgba(124, 252, 0, 0.2), rgba(124, 252, 0, 0.05))',
      border: 'oklch(74% 0.16 115)', // Lime Green
      glow: '0 0 15px rgba(124, 252, 0, 0.25)'
    },
    'geometry-angles': {
      title: 'Garden Star Maps',
      desc: 'Plot (x, y) coordinates to draw glowing garden shapes.',
      color: 'linear-gradient(135deg, rgba(255, 69, 0, 0.2), rgba(255, 69, 0, 0.05))',
      border: 'oklch(62% 0.2 30)', // Red Orange
      glow: '0 0 15px rgba(255, 69, 0, 0.25)'
    },
    'pemdas-tree': {
      title: 'PEMDAS Trees',
      desc: 'Solve equations and prune trees in correct priority.',
      color: 'linear-gradient(135deg, rgba(157, 78, 221, 0.2), rgba(157, 78, 221, 0.05))',
      border: 'oklch(55% 0.18 275)', // Deep Purple
      glow: '0 0 15px rgba(157, 78, 221, 0.25)'
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
        text = `Hey ${childName}! You're only ${needed} correct ${needed === 1 ? 'answer' : 'answers'} away from mastering your ${closeTable}s table. Let's nail them! 🌸`;
      } else {
        text = `Hey ${childName}! Let's play Times Tables and grow some beautiful sprouts! 🌱`;
      }
    } else if (mode === 'speed-add') {
      text = `Hey ${childName}! Let's try Speed Add. I love reading the equations out loud for you! 🎧`;
    } else if (mode === 'number-sort') {
      text = `Hey ${childName}! Let's sort some numbers together and catch those falling leaves! 🍃`;
    } else {
      const metadata = MODES_METADATA[mode as keyof typeof MODES_METADATA];
      const title = metadata ? metadata.title : 'Math Garden';
      text = `Hi ${childName}! Let's explore the ${title} module next. It'll make our garden bloom! 🌼`;
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

<div class="hub-container animate-entrance">
  <!-- Profile Banner -->
  <ProfileBanner />

  <!-- Astrid's Speech Bubble & Mascot -->
  <div class="astrid-recommendation-card glass-panel">
    <div class="astrid-mascot-area">
      <div class="astrid-guide">
        <Mascot pose="waving" size={135} />
      </div>
      <span class="astronaut-badge">Astrid the Guide</span>
    </div>
    
    <div class="speech-bubble-column">
      <div class="speech-bubble">
        <div class="bubble-arrow"></div>
        <p class="bubble-text">{smartRecommendation.text}</p>
      </div>
      <button onclick={() => handleSelect(smartRecommendation.mode)} class="btn-primary recommended-play-btn">
        ✨ Play Smart Recommendation
      </button>
    </div>
  </div>

  <!-- Garden State Visualizer -->
  <div class="garden-container glass-panel">
    <div class="garden-metrics">
      <div class="metric-box">
        <span class="metric-label">Garden Bloomed</span>
        <span class="metric-val">{totalMasteredFlowers} / 10 Flowers</span>
      </div>
      
      <div class="metric-box">
        <span class="metric-label font-neon-orange">Practice Streak</span>
        <span class="metric-val">🔥 {practiceStreak} rounds</span>
      </div>

      <div class="metric-box fill-gauge">
        <span class="metric-label">Garden Growth</span>
        <div class="mini-progress-bar">
          <div class="progress-fill" style="width: {overallGardenPercent}%"></div>
        </div>
        <span class="metric-val percent-label">{overallGardenPercent}% Grown</span>
      </div>
    </div>

    <!-- Mount Garden SVG -->
    <GardenPlot onSelectMode={handleSelect} onPlantClick={handlePlantClick} />
  </div>

  <!-- Math Mode Selection Zones -->
  <div class="learning-zones">
    {#each CATEGORIES as category}
      <section class="zone-section">
        <div class="zone-header">
          <h2>{category.title}</h2>
          <p class="text-description">{category.desc}</p>
        </div>

        <div class="zone-grid">
          {#each category.modes as modeId}
            {@const meta = MODES_METADATA[modeId]}
            {@const isRec = recommendedMode === modeId}
            {@const progress = getModeProgress(modeId)}
            
            <button
              onclick={() => handleSelect(modeId)}
              class="mode-card"
              class:recommended={isRec}
              style="background: {meta.color}; border-color: {meta.border}; box-shadow: {meta.glow};"
            >
              {#if isRec}
                <span class="recommended-card-tag">Smart Pick</span>
              {/if}

              <!-- Gameplay Preview Box (Animated Previews) -->
              <div class="animated-preview-box" style="border-color: {meta.border};">
                {#if modeId === 'times-tables'}
                  <div class="preview-times-tables">
                    <div class="formula">6×7</div>
                    <div class="answer">42</div>
                  </div>
                {:else if modeId === 'speed-add'}
                  <div class="preview-speed-add">
                    <div class="speaker-wave">🔊</div>
                    <div class="sound-ring ri-1"></div>
                    <div class="sound-ring ri-2"></div>
                  </div>
                {:else if modeId === 'number-sort'}
                  <div class="preview-number-sort">
                    <div class="ball">7</div>
                    <div class="bucket-draw">Odd</div>
                  </div>
                {:else if modeId === 'fractions-visual'}
                  <div class="preview-fraction-garden">
                    <div class="slice s1"></div>
                    <div class="slice s2"></div>
                    <div class="slice s3"></div>
                  </div>
                {:else if modeId === 'place-value'}
                  <div class="preview-place-value">
                    <span class="gem-drop gd-1">🍎</span>
                    <span class="gem-drop gd-2">🍎</span>
                  </div>
                {:else if modeId === 'multiplication-grid'}
                  <div class="preview-multi-grid">
                    <div class="draw-rect"></div>
                  </div>
                {:else if modeId === 'long-division'}
                  <div class="preview-division-space">
                    <div class="ufo">🐸</div>
                    <div class="ray"></div>
                  </div>
                {:else if modeId === 'decimals-grid'}
                  <div class="preview-decimals-grid">
                    <div class="sh-cell c1"></div>
                    <div class="sh-cell c2"></div>
                    <div class="sh-cell c3"></div>
                  </div>
                {:else if modeId === 'geometry-angles'}
                  <div class="preview-geometry">
                    <svg viewBox="0 0 40 40" class="star-draw">
                      <line x1="20" y1="5" x2="35" y2="35" stroke="#fff" stroke-dasharray="80" stroke-dashoffset="80" />
                      <line x1="35" y1="35" x2="5" y2="35" stroke="#fff" stroke-dasharray="80" stroke-dashoffset="80" />
                      <line x1="5" y1="35" x2="20" y2="5" stroke="#fff" stroke-dasharray="80" stroke-dashoffset="80" />
                      <circle cx="20" cy="5" r="2.5" fill="#ffd000" />
                      <circle cx="35" cy="35" r="2.5" fill="#ffd000" />
                      <circle cx="5" cy="35" r="2.5" fill="#ffd000" />
                    </svg>
                  </div>
                {:else if modeId === 'pemdas-tree'}
                  <div class="preview-pemdas">
                    <div class="braces">(2+3)</div>
                    <div class="arrow">↓</div>
                    <div class="collapsed">5</div>
                  </div>
                {/if}
              </div>

              <!-- Mode Info & Details -->
              <div class="mode-info">
                <h3>{meta.title}</h3>
                <p class="description-text">{meta.desc}</p>
                
                <!-- Live Progress Display -->
                <div class="live-progress-area">
                  <span class="progress-label">{progress.label}</span>
                  <div class="card-progress-bar">
                    <div class="card-progress-fill" style="width: {progress.percent}%; background: {meta.border};"></div>
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>

{#if showGridModal}
  <GridModal onClose={() => showGridModal = false} />
{/if}

<style>
  .hub-container {
    width: 100%;
    max-width: 750px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  /* Astrid Recommendation Card */
  .astrid-recommendation-card {
    display: flex;
    align-items: center;
    gap: 2rem;
    width: 100%;
    margin: 0;
    padding: 1.5rem;
    background: linear-gradient(135deg, rgba(40, 70, 45, 0.6), rgba(20, 45, 25, 0.8));
    border-color: rgba(0, 208, 132, 0.2);
    box-shadow: 0 0 20px rgba(0, 208, 132, 0.1);
  }

  .astrid-mascot-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .astrid-guide {
    animation: float-mascot 4s ease-in-out infinite alternate;
  }
  @keyframes float-mascot {
    0% { transform: translateY(0px) rotate(-1deg); }
    100% { transform: translateY(-6px) rotate(1deg); }
  }

  .astronaut-badge {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--neon-cyan);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: rgba(0, 255, 224, 0.1);
    padding: 0.15rem 0.5rem;
    border-radius: 99px;
    border: 1px solid rgba(0, 255, 224, 0.2);
  }

  .speech-bubble-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .speech-bubble {
    position: relative;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 1rem 1.2rem;
  }

  .bubble-arrow {
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 14px;
    height: 14px;
    background: rgba(26, 24, 58, 0.85); /* Approximated panel background */
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .bubble-text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.5;
    color: #ffffff;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }

  .recommended-play-btn {
    align-self: flex-start;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    box-shadow: 0 0 15px rgba(0, 255, 224, 0.3);
    font-size: 1.05rem;
  }

  /* Garden Container & Metrics */
  .garden-container {
    width: 100%;
    margin: 0;
    padding: 1.5rem;
    background: linear-gradient(180deg, rgba(40, 70, 45, 0.5) 0%, rgba(20, 45, 25, 0.7) 100%);
    border-color: rgba(184, 115, 51, 0.15);
  }

  .garden-metrics {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .metric-box {
    flex: 1;
    min-width: 140px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 0.8rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .metric-box.fill-gauge {
    flex: 1.5;
    min-width: 180px;
  }

  .metric-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }
  .font-neon-orange {
    color: #ff9100;
  }

  .metric-val {
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
    font-family: var(--font-display);
  }

  .mini-progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin: 0.3rem 0;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--neon-purple), var(--neon-cyan));
    border-radius: 4px;
  }
  .percent-label {
    font-size: 0.9rem;
    color: var(--neon-cyan);
  }

  /* Learning Zones */
  .learning-zones {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    width: 100%;
  }

  .zone-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .zone-header h2 {
    font-size: 1.6rem;
    margin-bottom: 0.2rem;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .text-description {
    font-size: 0.95rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .zone-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.2rem;
    width: 100%;
  }

  @media (min-width: 600px) {
    .zone-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Mode Cards */
  .mode-card {
    border-radius: 20px;
    border: 2px solid transparent;
    padding: 1.2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    text-align: left;
    position: relative;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    background-color: rgba(255, 255, 255, 0.02);
    overflow: hidden;
  }

  .mode-card:hover {
    transform: translateY(-3px) scale(1.01);
    background-color: rgba(255, 255, 255, 0.05);
  }

  .mode-card.recommended {
    outline: 2px solid var(--neon-cyan);
    outline-offset: 2px;
  }

  .recommended-card-tag {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--neon-cyan);
    color: #0b0c16;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.2rem 0.8rem;
    border-bottom-left-radius: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    box-shadow: 0 2px 8px rgba(0, 255, 224, 0.3);
  }

  .mode-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .mode-info h3 {
    font-size: 1.4rem;
    margin: 0;
    color: #ffffff;
    font-family: var(--font-display);
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  }

  .description-text {
    font-size: 0.95rem;
    color: #e5e5f0 !important; /* Extremely high contrast */
    margin: 0;
    font-weight: 500;
  }

  /* Live Progress Areas */
  .live-progress-area {
    margin-top: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .progress-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--neon-cyan);
  }

  .card-progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .card-progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.4s ease;
  }

  /* Animated Preview Boxes */
  .animated-preview-box {
    width: 75px;
    height: 75px;
    border-radius: 16px;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }

  /* Preview Animations details */
  
  /* Times tables animation */
  .preview-times-tables {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-family: var(--font-display);
  }
  .preview-times-tables .formula {
    font-size: 0.9rem;
    animation: pulseFact 2s infinite ease-in-out;
  }
  .preview-times-tables .answer {
    font-size: 1.25rem;
    font-weight: 700;
    color: #ff007f;
    animation: flashAnswer 2s infinite ease-in-out;
  }
  @keyframes pulseFact {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(0.95); }
  }
  @keyframes flashAnswer {
    0%, 40% { opacity: 0; transform: scale(0.7); }
    50%, 100% { opacity: 1; transform: scale(1.1); }
  }

  /* Speed add animation */
  .preview-speed-add {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .speaker-wave {
    font-size: 1.4rem;
    z-index: 2;
    animation: pulseSpeaker 1s infinite alternate;
  }
  .sound-ring {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid #00ffe0;
    border-radius: 50%;
    animation: emitRing 1.5s infinite linear;
    opacity: 0;
  }
  .ri-2 {
    animation-delay: 0.75s;
  }
  @keyframes pulseSpeaker {
    from { transform: scale(1); }
    to { transform: scale(1.2); }
  }
  @keyframes emitRing {
    0% { width: 10px; height: 10px; opacity: 0.8; }
    100% { width: 50px; height: 50px; opacity: 0; }
  }

  /* Number sort animation */
  .preview-number-sort {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .preview-number-sort .ball {
    position: absolute;
    top: 5px;
    left: 28px;
    width: 20px;
    height: 20px;
    background: #00e676;
    border-radius: 50%;
    color: #0b0c16;
    font-weight: 800;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fallBall 2s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .preview-number-sort .bucket-draw {
    position: absolute;
    bottom: 5px;
    left: 10px;
    width: 55px;
    text-align: center;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #fff;
    background: rgba(0, 230, 118, 0.2);
  }
  @keyframes fallBall {
    0% { transform: translateY(0); opacity: 0; }
    10% { opacity: 1; }
    70%, 100% { transform: translateY(30px); opacity: 0; }
  }

  /* Fraction garden */
  .preview-fraction-garden {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    overflow: hidden;
    animation: spinFraction 4s infinite linear;
  }
  .preview-fraction-garden .slice {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #ff8e00;
    clip-path: polygon(50% 50%, 50% 0, 100% 0, 100% 50%);
    opacity: 0.8;
  }
  .preview-fraction-garden .s2 {
    transform: rotate(90deg);
  }
  .preview-fraction-garden .s3 {
    transform: rotate(180deg);
    background: rgba(255,255,255,0.05);
  }
  @keyframes spinFraction {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Place value cosmos */
  .preview-place-value {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .gem-drop {
    position: absolute;
    font-size: 0.95rem;
    animation: gemRain 2.5s infinite linear;
  }
  .gd-1 { left: 10px; animation-delay: 0s; }
  .gd-2 { left: 45px; animation-delay: 1.25s; }
  @keyframes gemRain {
    0% { transform: translateY(-10px); opacity: 0; }
    10% { opacity: 1; }
    90%, 100% { transform: translateY(65px); opacity: 0; }
  }

  /* Multiplication Grid */
  .preview-multi-grid {
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255,255,255,0.1);
    background: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 8px 8px;
    position: relative;
  }
  .draw-rect {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 0;
    height: 0;
    background: rgba(255, 208, 0, 0.4);
    border: 1.5px solid #ffd000;
    animation: scaleGridRect 3s infinite alternate ease-in-out;
  }
  @keyframes scaleGridRect {
    0% { width: 0; height: 0; }
    100% { width: 24px; height: 24px; }
  }

  /* Long Division */
  .preview-division-space {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ufo {
    font-size: 1.4rem;
    z-index: 2;
    animation: floatUFO 2s infinite alternate ease-in-out;
  }
  .ray {
    position: absolute;
    top: 40px;
    width: 16px;
    height: 0;
    background: linear-gradient(180deg, rgba(0, 191, 255, 0.6), transparent);
    animation: shootRay 2s infinite alternate ease-in-out;
  }
  @keyframes floatUFO {
    from { transform: translateY(-5px); }
    to { transform: translateY(5px); }
  }
  @keyframes shootRay {
    0%, 30% { height: 0; }
    100% { height: 35px; }
  }

  /* Decimal shading */
  .preview-decimals-grid {
    display: grid;
    grid-template-columns: repeat(3, 10px);
    gap: 3px;
  }
  .sh-cell {
    width: 10px;
    height: 10px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
  }
  .sh-cell.c1 { animation: shadeCell 3s infinite 0.2s; }
  .sh-cell.c2 { animation: shadeCell 3s infinite 0.6s; }
  .sh-cell.c3 { animation: shadeCell 3s infinite 1s; }
  @keyframes shadeCell {
    0%, 40% { background: rgba(255,255,255,0.08); }
    60%, 100% { background: #7cfc00; box-shadow: 0 0 6px #7cfc00; }
  }

  /* Geometry Constellations */
  .preview-geometry {
    width: 100%;
    height: 100%;
  }
  .star-draw {
    width: 100%;
    height: 100%;
  }
  .star-draw line {
    animation: drawConstellation 3s infinite alternate ease-in-out;
  }
  @keyframes drawConstellation {
    0%, 20% { stroke-dashoffset: 80; }
    80%, 100% { stroke-dashoffset: 0; }
  }

  /* PEMDAS */
  .preview-pemdas {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .braces {
    animation: pemdasStep1 4s infinite ease-in-out;
  }
  .preview-pemdas .arrow {
    font-size: 0.6rem;
    margin: -2px 0;
    color: #9d4edd;
  }
  .collapsed {
    color: #9d4edd;
    font-size: 0.95rem;
    animation: pemdasStep2 4s infinite ease-in-out;
  }
  @keyframes pemdasStep1 {
    0%, 30% { opacity: 1; transform: scale(1); }
    40%, 100% { opacity: 0.2; transform: scale(0.9); }
  }
  @keyframes pemdasStep2 {
    0%, 40% { opacity: 0; transform: scale(0.6); }
    50%, 100% { opacity: 1; transform: scale(1.15); }
  }

  @media (max-width: 500px) {
    .astrid-recommendation-card {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }
    .bubble-arrow {
      display: none;
    }
    .recommended-play-btn {
      align-self: center;
    }
    .mode-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    .animated-preview-box {
      align-self: center;
    }
  }

  /* Modern Web Guidance: Scroll-driven entry animations */
  @media (prefers-reduced-motion: no-preference) {
    @supports ((animation-timeline: view()) and (animation-range: entry)) {
      @keyframes pop-in {
        from {
          opacity: 0;
          transform: translateY(60px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .mode-card {
        animation: pop-in linear both;
        animation-timeline: view();
        animation-range: entry 10% cover 25%;
      }

      .zone-header {
        animation: pop-in linear both;
        animation-timeline: view();
        animation-range: entry 5% cover 15%;
      }
    }
  }
</style>
