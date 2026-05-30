<script lang="ts">
  import type { GameHelp } from '../lib/help';

  interface Props {
    help: GameHelp | null;
    glow?: string;
    autoOffer?: boolean;
    onAutoOfferHandled?: () => void;
    seenKey?: string;
  }
  let { help, glow = 'var(--glow-firefly)', autoOffer = false, onAutoOfferHandled, seenKey }: Props = $props();

  let open = $state(false);
  let level = $state<0 | 1 | 2>(1);
  let revealed = $state(1);
  let offerVisible = $state(false);
  let panelEl = $state<HTMLDivElement | null>(null);
  let buttonEl = $state<HTMLButtonElement | null>(null);

  function openAt(l: 0 | 1 | 2) {
    level = l;
    if (l === 2) revealed = 1;
    open = true;
    setTimeout(() => panelEl?.focus(), 20);
  }
  function close() {
    open = false;
    setTimeout(() => buttonEl?.focus(), 20);
  }
  function showSteps() {
    level = 2;
    revealed = 1;
  }
  function nextStep() {
    if (help && revealed < help.steps.length) revealed += 1;
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  let autoOpenDone = false;
  $effect(() => {
    if (autoOpenDone || !help || !seenKey) return;
    autoOpenDone = true; // latch: only ever consider once help first arrives
    let seen = false;
    try { seen = localStorage.getItem(seenKey) === '1'; } catch (_) {}
    if (!seen) {
      openAt(0);
      try { localStorage.setItem(seenKey, '1'); } catch (_) {}
    }
  });

  $effect(() => {
    if (autoOffer && !open) {
      offerVisible = true;
    }
  });
  function acceptOffer() {
    offerVisible = false;
    onAutoOfferHandled?.();
    openAt(1);
  }
  function dismissOffer() {
    offerVisible = false;
    onAutoOfferHandled?.();
  }
</script>

{#if help}
  <div class="astrid-help" style:--help-glow={glow}>
    {#if offerVisible}
      <div class="offer" role="status">
        <span>No worries — want a hint?</span>
        <div class="offer-actions">
          <button class="offer-yes" onclick={acceptOffer}>Yes please</button>
          <button class="offer-no" onclick={dismissOffer}>Not yet</button>
        </div>
      </div>
    {/if}

    <button
      bind:this={buttonEl}
      class="ask-btn"
      onclick={() => (open ? close() : openAt(1))}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label="Ask Astrid for help"
    >
      <span class="ask-spark" aria-hidden="true">✦</span> Stuck? Ask Astrid
    </button>

    {#if open}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        bind:this={panelEl}
        class="panel"
        role="dialog"
        aria-modal={false}
        aria-label="Astrid's help"
        tabindex="-1"
        onkeydown={onKeydown}
      >
        <button class="close" onclick={close} aria-label="Close help">×</button>

        {#if level === 0}
          <p class="panel-title">How to play</p>
          <p class="panel-body">{help.howToPlay}</p>
        {:else if level === 1}
          <p class="panel-title">Hint</p>
          <p class="panel-body">{help.hint}</p>
          {#if help.steps.length > 0}
            <button class="advance" onclick={showSteps}>Still stuck? Show me →</button>
          {/if}
        {:else}
          <p class="panel-title">Let's work it out</p>
          <ol class="steps">
            {#each help.steps.slice(0, revealed) as step}
              <li>{step}</li>
            {/each}
          </ol>
          {#if revealed < help.steps.length}
            <button class="advance" onclick={nextStep}>Next step →</button>
          {:else}
            <p class="panel-body now-you">Now you try! 🌱</p>
          {/if}
        {/if}

        <button class="howto-link" onclick={() => (level = 0)}>How do I play?</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .astrid-help { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }

  .ask-btn {
    min-height: var(--touch, 48px); padding: 0 1rem; border-radius: 999px;
    background: var(--color-panel); color: var(--color-text);
    border: 1px solid var(--color-border); font-family: var(--font-display); font-weight: 600; font-size: 0.9rem;
    cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;
    --glow-c: var(--help-glow); box-shadow: var(--glow-sm);
  }
  .ask-btn:hover { box-shadow: var(--glow-md); }
  .ask-btn:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
  .ask-spark { color: var(--help-glow); }

  .offer {
    background: var(--color-panel); border: 1px solid var(--color-border); border-radius: var(--r-md);
    padding: 0.6rem 0.8rem; --glow-c: var(--help-glow); box-shadow: var(--glow-sm);
    display: flex; flex-direction: column; gap: 0.5rem; align-items: center; max-width: 16rem; text-align: center;
    color: var(--color-text); font-size: 0.9rem;
  }
  .offer-actions { display: flex; gap: 0.5rem; }
  .offer-yes, .offer-no { min-height: var(--touch, 48px); padding: 0 0.9rem; border-radius: 999px; cursor: pointer; font-weight: 600; font-family: var(--font-display); }
  .offer-yes { background: var(--color-primary); color: oklch(20% 0.03 280); border: none; }
  .offer-no { background: transparent; color: var(--color-text-muted); border: 1px solid var(--color-border); }
  .offer-yes:focus-visible, .offer-no:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }

  .panel {
    position: absolute; top: calc(100% + 0.5rem); left: 50%; transform: translateX(-50%);
    width: min(20rem, 80vw); z-index: 30;
    background: var(--color-panel); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--color-border); border-radius: var(--r-md);
    --glow-c: var(--help-glow); box-shadow: var(--glow-lg);
    padding: 1rem 1rem 0.75rem; color: var(--color-text); text-align: left;
  }
  .panel:focus-visible { outline: none; }
  .close { position: absolute; top: 0.3rem; right: 0.3rem; width: var(--touch, 48px); height: var(--touch, 48px); background: none; border: none; color: var(--color-text-muted); font-size: 1.4rem; cursor: pointer; line-height: 1; }
  .close:focus-visible { outline: 3px solid var(--color-primary); outline-offset: -4px; border-radius: 50%; }
  .panel-title { font-family: var(--font-display); font-weight: 700; color: var(--help-glow); margin: 0 0 0.4rem; font-size: 0.95rem; }
  .panel-body { margin: 0 0 0.6rem; line-height: 1.5; font-size: 0.95rem; }
  .now-you { color: var(--color-correct); font-weight: 600; }
  .steps { margin: 0 0 0.6rem; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.35rem; line-height: 1.5; font-variant-numeric: tabular-nums lining-nums; }
  .advance { min-height: var(--touch, 48px); width: 100%; border-radius: var(--r-sm); background: transparent; border: 1px solid var(--color-border); color: var(--color-primary); font-weight: 600; font-family: var(--font-display); cursor: pointer; }
  .advance:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
  .howto-link { display: block; margin-top: 0.5rem; background: none; border: none; color: var(--color-text-muted); text-decoration: underline; font: inherit; font-size: 0.8rem; cursor: pointer; padding: 0.3rem; }

  @media (max-width: 600px) {
    .panel {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      top: auto;
      bottom: 1rem;
      width: min(22rem, calc(100vw - 1.5rem));
      max-height: 70vh;
      overflow-y: auto;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .panel { animation: help-pop 0.18s ease-out; }
    .offer { animation: help-pop 0.18s ease-out; }
    @keyframes help-pop { from { opacity: 0; transform: translateX(-50%) translateY(-4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  }
</style>
