<script lang="ts">
  import { profileStore } from '../lib/profile.svelte';
  import { slide } from 'svelte/transition';

  let panelOpen = $state(false);
  let pasteText = $state('');
  let importError = $state<string | null>(null);

  const profile = $derived(profileStore.profile);
  const top = $derived(profileStore.topPreference);
  const stale = $derived(profileStore.isStale);
  const nudgeVisible = $derived(profileStore.overrideNudgeVisible);

  function clearProfile() {
    if (confirm('Forget the imported profile? The game goes back to default recommendations.')) {
      profileStore.clear();
      panelOpen = false;
    }
  }

  function handleImport() {
    importError = null;
    const result = profileStore.importFromText(pasteText);
    if (result.ok) {
      pasteText = '';
      panelOpen = false;
    } else {
      importError = result.error ?? 'Invalid profile';
    }
  }

  function reExport() {
    const updated = profileStore.exportWithTelemetry();
    if (!updated) return;
    const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astrid-quiz-from-math-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function buildActivityUrl() {
    const updated = profileStore.exportWithTelemetry();
    if (!updated) return '#';
    try {
      const json = JSON.stringify(updated);
      const encoded = btoa(encodeURIComponent(json));
      const safe = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return `https://helena-learner-profile.vercel.app/activity#profile=${safe}`;
    } catch (_) {
      return '#';
    }
  }

  function PREF_LABEL(pref: string | null) {
    if (!pref) return '—';
    if (pref === 'read_write') return 'reading & writing';
    return pref;
  }
</script>

<div class="profile-banner-container no-print">
  {#if nudgeVisible}
    <div class="nudge-bar" transition:slide>
      <div class="nudge-content">
        <span>💡 Your learning style preferences may have shifted. You've overridden recommendations a few times.</span>
        <div class="nudge-actions">
          <a href="https://helena-learner-profile.vercel.app/" target="_blank" rel="noopener" class="nudge-btn-primary">Re-take Quiz</a>
          <button onclick={() => profileStore.clearOverrideStreak()} class="nudge-btn-quiet">Dismiss</button>
        </div>
      </div>
    </div>
  {/if}

  <div class="banner">
    {#if profile}
      <div class="info">
        <span class="badge active">PROFILE ACTIVE</span>
        <span class="label">
          {profile.child_label ? `${profile.child_label}'s` : 'Your'} top preference: <strong>{PREF_LABEL(top)}</strong>
        </span>
        {#if stale}
          <span class="stale-label">stale</span>
        {/if}
      </div>
      <div class="actions">
        <a href={buildActivityUrl()} target="_blank" rel="noopener" class="action-link">View Activity</a>
        <button onclick={reExport} class="action-btn">Re-export</button>
        <button onclick={clearProfile} class="action-btn delete">Forget</button>
      </div>
    {:else}
      <div class="info">
        <span class="badge onboarding">NO PROFILE</span>
        <span class="label text-muted">Import a profile to customize Astrid's recommendations.</span>
      </div>
      <div class="actions">
        <a href="https://helena-learner-profile.vercel.app/" target="_blank" rel="noopener" class="action-link primary">Take Quiz</a>
        <button onclick={() => { panelOpen = !panelOpen; importError = null; }} class="action-btn">Import</button>
      </div>
    {/if}
  </div>

  {#if panelOpen}
    <div class="import-panel" transition:slide>
      <h3>Import Learner Profile JSON</h3>
      <p class="text-muted">Paste your profile JSON contents below to load Helena's configuration:</p>
      <textarea bind:value={pasteText} placeholder="{'{\n  \"version\": 1,\n  ...\n}'}"></textarea>
      {#if importError}
        <div class="error-msg">{importError}</div>
      {/if}
      <div class="panel-buttons">
        <button onclick={handleImport} class="btn-primary" disabled={!pasteText.trim()}>Load Profile</button>
        <button onclick={() => { panelOpen = false; importError = null; }} class="btn-ghost">Cancel</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .profile-banner-container {
    width: 100%;
    margin-bottom: 1.5rem;
    border-radius: var(--r-md);
    overflow: hidden;
    border: 1px solid var(--color-border);
    background: var(--color-panel);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    box-shadow: var(--glass-shadow);
  }

  .banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 1.2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  .badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }
  .badge.active {
    background: rgba(0, 255, 224, 0.15);
    color: var(--neon-cyan);
    border: 1px solid rgba(0, 255, 224, 0.2);
  }
  .badge.onboarding {
    background: rgba(157, 78, 221, 0.15);
    color: var(--neon-purple);
    border: 1px solid rgba(157, 78, 221, 0.2);
  }

  .stale-label {
    font-size: 0.7rem;
    color: var(--danger);
    border: 1px solid var(--danger);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .action-link, .action-btn {
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0.4rem 0.8rem;
    border-radius: var(--r-sm);
    color: var(--color-text-muted);
    border: 1px solid transparent;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    background: none;
  }
  .action-link:hover, .action-btn:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--color-border);
  }

  .action-link.primary {
    color: var(--color-primary);
  }
  .action-link.primary:hover {
    background: rgba(98, 154, 258, 0.1);
  }

  .action-btn.delete:hover {
    color: var(--danger);
    background: rgba(255, 23, 68, 0.05);
    border-color: rgba(255, 23, 68, 0.15);
  }

  /* Nudge Bar */
  .nudge-bar {
    background: linear-gradient(90deg, rgba(255, 208, 0, 0.1), rgba(157, 78, 221, 0.1));
    border-bottom: 1px solid var(--color-border);
    padding: 0.8rem 1.2rem;
    font-size: 0.9rem;
  }
  .nudge-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.8rem;
  }
  .nudge-actions {
    display: flex;
    gap: 0.6rem;
  }
  .nudge-btn-primary {
    background: var(--color-accent);
    color: #0b0c16;
    padding: 0.3rem 0.7rem;
    border-radius: var(--r-sm);
    font-weight: 600;
    text-decoration: none;
    font-size: 0.8rem;
  }
  .nudge-btn-quiet {
    padding: 0.3rem 0.7rem;
    font-size: 0.8rem;
    border-radius: var(--r-sm);
    border: 1px solid var(--color-border);
  }

  /* Import Panel */
  .import-panel {
    background: rgba(0, 0, 0, 0.15);
    border-top: 1px solid var(--color-border);
    padding: 1.2rem;
  }
  .import-panel h3 {
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }
  .import-panel p {
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
  }
  textarea {
    width: 100%;
    height: 100px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--color-border);
    border-radius: var(--r-sm);
    color: var(--color-text);
    padding: 0.6rem;
    font-family: monospace;
    font-size: 0.85rem;
    resize: none;
    margin-bottom: 0.8rem;
  }
  textarea:focus {
    outline: 1px solid var(--color-primary);
  }
  .error-msg {
    color: var(--danger);
    font-size: 0.85rem;
    margin-bottom: 0.8rem;
  }
  .panel-buttons {
    display: flex;
    gap: 0.8rem;
  }
</style>
