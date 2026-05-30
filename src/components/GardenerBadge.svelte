<script lang="ts">
  // GardenerBadge — collapsed profile & settings sheet for the Moonlit Garden hub.
  import { profileStore } from "../lib/profile.svelte";

  // ── Sheet open state ──────────────────────────────────────────────────────
  let sheetOpen = $state(false);

  // ── Import sub-panel state ────────────────────────────────────────────────
  let importOpen = $state(false);
  let pasteText = $state("");
  let importError = $state<string | null>(null);

  // ── Derived store values ──────────────────────────────────────────────────
  const profile = $derived(profileStore.profile);
  const top = $derived(profileStore.topPreference);
  const stale = $derived(profileStore.isStale);
  const nudgeVisible = $derived(profileStore.overrideNudgeVisible);

  // Indicator dot: visible when parent action is needed
  const showIndicator = $derived(stale || nudgeVisible);

  // ── Focus references ──────────────────────────────────────────────────────
  let badgeEl = $state<HTMLButtonElement | null>(null);
  let closeEl = $state<HTMLButtonElement | null>(null);

  // ── Open / close ──────────────────────────────────────────────────────────
  function openSheet() {
    sheetOpen = true;
    // Let the DOM render before stealing focus
    setTimeout(() => closeEl?.focus(), 30);
  }

  function closeSheet() {
    sheetOpen = false;
    importOpen = false;
    importError = null;
    pasteText = "";
    setTimeout(() => badgeEl?.focus(), 30);
  }

  function handleBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains("gb-backdrop")) {
      closeSheet();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") closeSheet();
  }

  // ── Profile controls ─────────────────────────────────────────────────────
  function clearProfile() {
    if (confirm("Forget the imported profile? The game goes back to default recommendations.")) {
      profileStore.clear();
      closeSheet();
    }
  }

  function handleImport() {
    importError = null;
    const result = profileStore.importFromText(pasteText);
    if (result.ok) {
      pasteText = "";
      importOpen = false;
    } else {
      importError = result.error ?? "Invalid profile";
    }
  }

  function reExport() {
    const updated = profileStore.exportWithTelemetry();
    if (!updated) return;
    const blob = new Blob([JSON.stringify(updated, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astrid-quiz-from-math-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function buildActivityUrl(): string {
    const updated = profileStore.exportWithTelemetry();
    if (!updated) return "#";
    try {
      const json = JSON.stringify(updated);
      const encoded = btoa(encodeURIComponent(json));
      const safe = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      return `https://helena-learner-profile.vercel.app/activity#profile=${safe}`;
    } catch (_) {
      return "#";
    }
  }

  function dismissNudge() {
    profileStore.clearOverrideStreak();
  }

  function PREF_LABEL(pref: string | null): string {
    if (!pref) return "—";
    if (pref === "read_write") return "reading & writing";
    return pref;
  }
</script>

<!-- ── Badge trigger ─────────────────────────────────────────────────────── -->
<button
  bind:this={badgeEl}
  class="gb-badge no-print"
  class:gb-badge--alert={showIndicator}
  aria-label="Profile & settings"
  aria-haspopup="dialog"
  aria-expanded={sheetOpen}
  onclick={openSheet}
>
  <!-- Gardener icon: simple leaf/seedling SVG -->
  <svg class="gb-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M12 21V12M12 12C12 12 7 10 5 5c4 0 7 3 7 7zM12 12C12 12 17 10 19 5c-4 0-7 3-7 7z"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  {#if showIndicator}
    <span class="gb-dot" aria-hidden="true"></span>
  {/if}
</button>

<!-- ── Sheet + backdrop ───────────────────────────────────────────────────── -->
{#if sheetOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="gb-backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
  ></div>

  <div
    class="gb-sheet"
    role="dialog"
    aria-modal="true"
    aria-label="Profile & settings"
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    <!-- Header row -->
    <div class="gb-sheet-header">
      <h2 class="gb-sheet-title">Gardener's Corner</h2>
      <button
        bind:this={closeEl}
        class="gb-close"
        aria-label="Close settings"
        onclick={closeSheet}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- ── Profile status ──────────────────────────────────────────────── -->
    <section class="gb-section">
      {#if profile}
        <div class="gb-status-row">
          <span class="gb-chip gb-chip--active">PROFILE ACTIVE</span>
          <span class="gb-status-label">
            {profile.child_label ? `${profile.child_label}'s` : "Your"} top preference:
            <strong>{PREF_LABEL(top)}</strong>
          </span>
          {#if stale}
            <span class="gb-stale">STALE</span>
          {/if}
        </div>
      {:else}
        <div class="gb-status-row">
          <span class="gb-chip gb-chip--none">NO PROFILE</span>
          <span class="gb-status-label gb-muted">Import a profile to personalise Astrid's recommendations.</span>
        </div>
      {/if}
    </section>

    <!-- ── Override-streak nudge bar ──────────────────────────────────── -->
    {#if nudgeVisible}
      <div class="gb-nudge">
        <p class="gb-nudge-text">
          💡 Your learning style may have shifted — you've overridden recommendations a few times.
        </p>
        <div class="gb-nudge-actions">
          <a
            href="https://helena-learner-profile.vercel.app/"
            target="_blank"
            rel="noopener"
            class="gb-btn gb-btn--primary"
          >Re-take Quiz</a>
          <button class="gb-btn gb-btn--quiet" onclick={dismissNudge}>Got it</button>
        </div>
      </div>
    {/if}

    <!-- ── Main action buttons ─────────────────────────────────────────── -->
    <section class="gb-section gb-actions">
      {#if profile}
        <a
          href={buildActivityUrl()}
          target="_blank"
          rel="noopener"
          class="gb-action-link"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View Activity
        </a>
        <button class="gb-action-btn" onclick={reExport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Re-export
        </button>
        <button
          class="gb-action-btn gb-action-btn--ghost"
          onclick={() => { importOpen = !importOpen; importError = null; }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Import
        </button>
        <button class="gb-action-btn gb-action-btn--danger" onclick={clearProfile}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Forget
        </button>
      {:else}
        <a
          href="https://helena-learner-profile.vercel.app/"
          target="_blank"
          rel="noopener"
          class="gb-action-link gb-action-link--primary"
        >
          Take Quiz
        </a>
        <button
          class="gb-action-btn"
          onclick={() => { importOpen = !importOpen; importError = null; }}
        >
          Import Profile
        </button>
      {/if}
    </section>

    <!-- ── Import sub-panel ────────────────────────────────────────────── -->
    {#if importOpen}
      <div class="gb-import-panel">
        <h3 class="gb-import-heading">Import Learner Profile JSON</h3>
        <p class="gb-muted gb-import-hint">Paste your profile JSON to load Helena's configuration:</p>
        <textarea
          class="gb-textarea"
          bind:value={pasteText}
          placeholder={"{\n  \"version\": 1,\n  ...\n}"}
          rows="5"
          spellcheck={false}
        ></textarea>
        {#if importError}
          <p class="gb-error" role="alert">{importError}</p>
        {/if}
        <div class="gb-import-actions">
          <button
            class="btn-primary gb-import-submit"
            onclick={handleImport}
            disabled={!pasteText.trim()}
          >Load Profile</button>
          <button
            class="btn-ghost gb-import-cancel"
            onclick={() => { importOpen = false; importError = null; pasteText = ""; }}
          >Cancel</button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* ── Badge ─────────────────────────────────────────────────────────────── */
  .gb-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-panel);
    border: 1.5px solid var(--color-border);
    color: var(--color-text-muted);
    cursor: pointer;
    /* Compose glow using the scale tokens */
    --glow-c: var(--glow-moonflower);
    transition: color 0.2s, border-color 0.2s, box-shadow 0.2s;
  }

  .gb-badge:hover,
  .gb-badge:focus-visible {
    color: var(--glow-moonflower);
    border-color: var(--glow-moonflower);
    box-shadow: var(--glow-sm);
    outline: none;
  }

  .gb-badge--alert {
    border-color: var(--color-primary);
    --glow-c: var(--color-primary);
    box-shadow: var(--glow-sm);
  }

  .gb-icon {
    width: 22px;
    height: 22px;
    color: inherit;
    flex-shrink: 0;
  }

  /* Indicator dot */
  .gb-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid var(--color-bg);
    box-shadow: 0 0 6px var(--color-primary);
  }

  @media (prefers-reduced-motion: no-preference) {
    .gb-dot {
      animation: dot-pulse 2.4s ease-in-out infinite;
    }

    @keyframes dot-pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 4px var(--color-primary); }
      50% { opacity: 0.55; box-shadow: 0 0 12px var(--color-primary); }
    }
  }

  /* ── Backdrop ───────────────────────────────────────────────────────────── */
  .gb-backdrop {
    position: fixed;
    inset: 0;
    background: oklch(10% 0.04 280 / 0.55);
    z-index: 900;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  @media (prefers-reduced-motion: no-preference) {
    .gb-backdrop {
      animation: backdrop-in 0.2s ease forwards;
    }

    @keyframes backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  }

  /* ── Sheet ──────────────────────────────────────────────────────────────── */
  .gb-sheet {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(400px, 94vw);
    z-index: 901;
    background: oklch(27% 0.06 275 / 0.92);
    backdrop-filter: blur(24px) saturate(1.4);
    -webkit-backdrop-filter: blur(24px) saturate(1.4);
    border-left: 1px solid var(--color-border);
    box-shadow: -8px 0 40px oklch(10% 0.04 280 / 0.5);
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  @media (prefers-reduced-motion: no-preference) {
    .gb-sheet {
      animation: sheet-slide-in 0.28s cubic-bezier(0.32, 0, 0.15, 1) forwards;
    }

    @keyframes sheet-slide-in {
      from { transform: translateX(100%); opacity: 0.6; }
      to   { transform: translateX(0);    opacity: 1;   }
    }
  }

  /* ── Sheet header ───────────────────────────────────────────────────────── */
  .gb-sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.4rem 1rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .gb-sheet-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .gb-close {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--color-text-muted);
    transition: color 0.15s, background 0.15s;
    flex-shrink: 0;
  }
  .gb-close svg { width: 18px; height: 18px; }
  .gb-close:hover { color: var(--color-text); background: rgba(255, 255, 255, 0.06); }
  .gb-close:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    color: var(--color-text);
  }

  /* ── Sections ───────────────────────────────────────────────────────────── */
  .gb-section {
    padding: 1.1rem 1.4rem;
    border-bottom: 1px solid var(--color-border);
  }

  /* ── Profile status row ─────────────────────────────────────────────────── */
  .gb-status-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .gb-chip {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .gb-chip--active {
    background: oklch(92% 0.10 200 / 0.14);
    color: var(--glow-moonflower);
    border: 1px solid oklch(92% 0.10 200 / 0.25);
  }
  .gb-chip--none {
    background: oklch(75% 0.18 350 / 0.12);
    color: var(--glow-blossom);
    border: 1px solid oklch(75% 0.18 350 / 0.2);
  }

  .gb-status-label {
    font-size: 0.88rem;
    color: var(--color-text);
  }
  .gb-muted {
    color: var(--color-text-muted);
  }

  .gb-stale {
    font-size: 0.68rem;
    color: var(--color-retry);
    border: 1px solid var(--color-retry);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  /* ── Nudge bar ──────────────────────────────────────────────────────────── */
  .gb-nudge {
    padding: 1rem 1.4rem;
    background: linear-gradient(135deg, oklch(82% 0.15 75 / 0.08), oklch(75% 0.18 350 / 0.08));
    border-bottom: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .gb-nudge-text {
    font-size: 0.88rem;
    color: var(--color-text);
    margin: 0;
    line-height: 1.5;
  }

  .gb-nudge-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .gb-btn {
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.35rem 0.8rem;
    border-radius: var(--r-sm);
    border: none;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: opacity 0.15s;
    font-family: inherit;
  }
  .gb-btn:hover { opacity: 0.82; }

  .gb-btn--primary {
    background: var(--color-primary);
    color: oklch(20% 0.04 280);
  }
  .gb-btn--quiet {
    background: transparent;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }
  .gb-btn--quiet:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.05);
  }

  /* ── Action buttons ─────────────────────────────────────────────────────── */
  .gb-actions {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .gb-action-link,
  .gb-action-btn {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    padding: 0.65rem 0.75rem;
    border-radius: var(--r-sm);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    transition: color 0.15s, background 0.15s;
  }
  .gb-action-link:hover,
  .gb-action-btn:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.05);
  }
  .gb-action-link:focus-visible,
  .gb-action-btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  .gb-action-link svg,
  .gb-action-btn svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    opacity: 0.7;
  }

  .gb-action-link--primary {
    color: var(--color-primary);
  }
  .gb-action-link--primary:hover {
    background: oklch(82% 0.15 75 / 0.08);
    color: var(--color-primary-strong);
  }

  .gb-action-btn--danger:hover {
    color: var(--color-retry);
    background: oklch(82% 0.15 75 / 0.06);
  }

  /* ── Import panel ───────────────────────────────────────────────────────── */
  .gb-import-panel {
    padding: 1.1rem 1.4rem 1.4rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  @media (prefers-reduced-motion: no-preference) {
    .gb-import-panel {
      animation: import-panel-in 0.2s ease forwards;
    }

    @keyframes import-panel-in {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  }

  .gb-import-heading {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .gb-import-hint {
    font-size: 0.85rem;
    margin: 0;
    line-height: 1.4;
  }

  .gb-textarea {
    width: 100%;
    background: oklch(18% 0.04 275 / 0.7);
    border: 1px solid var(--color-border);
    border-radius: var(--r-sm);
    color: var(--color-text);
    padding: 0.6rem 0.75rem;
    font-family: monospace;
    font-size: 0.82rem;
    resize: vertical;
    min-height: 96px;
    line-height: 1.45;
  }
  .gb-textarea:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    border-color: var(--color-primary);
  }

  .gb-error {
    color: var(--color-retry);
    font-size: 0.85rem;
    margin: 0;
  }

  .gb-import-actions {
    display: flex;
    gap: 0.7rem;
    flex-wrap: wrap;
  }

  /* Tighten global btn-primary/btn-ghost when inside the sheet */
  .gb-import-submit {
    font-size: 0.9rem;
    padding: 0.55rem 1.2rem;
  }
  .gb-import-cancel {
    font-size: 0.9rem;
    padding: 0.55rem 1.2rem;
  }
</style>
