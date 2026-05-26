/**
 * Helena's Math Practice — three modes, profile-aware.
 *
 * Modes:
 *   times-tables  → read/write affinity; typed multiplication facts
 *   speed-add     → auditory affinity; problem spoken via Web Speech API
 *   number-sort   → visual/kinesthetic affinity; drag tiles into bins
 *
 * Profile integration is fully delegated to window.helenaProfile (see
 * profile.js). This file owns gameplay + DOM only.
 */
(function () {
  'use strict';

  // ─── DOM refs (resolved after DOMContentLoaded) ─────────────────────────
  let modeSelectionView, gameView, endView;
  let gameTitle, gameBody, gameFeedback, qIndex, qTotal, qScore;
  let backToHubBtn, endTitle, endSummary, endPlayAgainBtn, endBackBtn;
  let profileBanner;

  // ─── Game state ─────────────────────────────────────────────────────────
  const QUESTIONS_PER_ROUND = 10;
  let activeMode = null;
  let questions = [];
  let questionPos = 0;
  let score = 0;

  // ─── Boot ───────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    modeSelectionView = document.getElementById('modeSelectionView');
    gameView = document.getElementById('gameView');
    endView = document.getElementById('endView');
    gameTitle = document.getElementById('gameTitle');
    gameBody = document.getElementById('gameBody');
    gameFeedback = document.getElementById('gameFeedback');
    qIndex = document.getElementById('qIndex');
    qTotal = document.getElementById('qTotal');
    qScore = document.getElementById('qScore');
    backToHubBtn = document.getElementById('backToHubBtn');
    endTitle = document.getElementById('endTitle');
    endSummary = document.getElementById('endSummary');
    endPlayAgainBtn = document.getElementById('endPlayAgainBtn');
    endBackBtn = document.getElementById('endBackBtn');
    profileBanner = document.getElementById('profileBanner');

    backToHubBtn.addEventListener('click', exitToHub);
    endPlayAgainBtn.addEventListener('click', () => startMode(activeMode));
    endBackBtn.addEventListener('click', exitToHub);

    document.querySelectorAll('button.mode-card[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        recordLaunch(mode);
        startMode(mode);
      });
    });

    initLearnerProfile();
  });

  // ─── Learner profile integration ────────────────────────────────────────
  function initLearnerProfile() {
    if (!window.helenaProfile) return;
    const hp = window.helenaProfile;
    if (hp.autoImportResult === 'imported' || hp.autoImportResult === 'invalid') {
      showAutoToast(hp.autoImportResult);
    }
    hp.subscribe(renderProfileBanner);
    renderProfileBanner();
  }

  function recordLaunch(mode) {
    if (!window.helenaProfile) return;
    const hp = window.helenaProfile;
    const recommended = hp.recommendedMathMode(hp.profileStore.profile, hp.profileStore.sessionIndex);
    hp.profileStore.recordLaunch(mode, recommended);
    hp.profileStore.advanceSession();
  }

  function showAutoToast(kind) {
    const toast = document.createElement('div');
    toast.className = 'profile-auto-toast ' + (kind === 'imported' ? 'ok' : 'bad');
    toast.setAttribute('role', kind === 'imported' ? 'status' : 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = kind === 'imported'
      ? "Profile imported. We'll recommend a math mode that fits."
      : "A profile link was passed but couldn't be read.";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function el(tag, props, kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        if (k === 'class') node.className = props[k];
        else if (k === 'on') for (const ev in props.on) node.addEventListener(ev, props.on[ev]);
        else if (k.startsWith('aria-')) node.setAttribute(k, props[k]);
        else node[k] = props[k];
      }
    }
    if (kids) for (const c of kids) if (c != null)
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return node;
  }

  // Dismissal flag for the "no profile yet" onboarding nudge. Once the kid
  // (or parent) clicks "Not now", we keep it hidden across visits. Re-shown
  // automatically once a real profile is imported, since the no-profile
  // branch is gated on the profile being null.
  const NO_PROFILE_DISMISS_KEY = 'helena-math:onboarding:no-profile-dismissed:v1';
  function isOnboardingDismissed() {
    try { return localStorage.getItem(NO_PROFILE_DISMISS_KEY) === '1'; }
    catch (_) { return false; }
  }
  function dismissOnboarding() {
    try { localStorage.setItem(NO_PROFILE_DISMISS_KEY, '1'); } catch (_) {}
    renderProfileBanner();
  }

  function renderProfileBanner() {
    if (!profileBanner || !window.helenaProfile) return;
    const hp = window.helenaProfile;
    const profile = hp.profileStore.profile;
    while (profileBanner.firstChild) profileBanner.removeChild(profileBanner.firstChild);
    if (!profile) {
      // No profile yet → onboarding nudge unless the user dismissed it.
      if (isOnboardingDismissed()) {
        profileBanner.hidden = true;
        decorateRecommendedPip();
        return;
      }
      profileBanner.hidden = false;
      profileBanner.classList.add('profile-banner-onboard');
      profileBanner.appendChild(el('div', { class: 'profile-banner-info' }, [
        el('span', { class: 'profile-banner-badge', textContent: 'NO PROFILE' }),
        el('span', { class: 'profile-banner-text', textContent:
          'Take a 5-minute quiz so we can recommend the mode that fits how you learn.'
        })
      ]));
      profileBanner.appendChild(el('div', { class: 'profile-banner-actions' }, [
        el('a', {
          class: 'profile-banner-action profile-banner-action-primary',
          href: 'https://helena-learner-profile.vercel.app/',
          rel: 'noopener',
          textContent: 'Take the quiz'
        }),
        el('button', {
          type: 'button',
          class: 'profile-banner-action profile-banner-action-quiet',
          textContent: 'Not now',
          on: { click: dismissOnboarding }
        })
      ]));
      decorateRecommendedPip();
      return;
    }
    // Reaching here means the kid has a profile — make sure the onboarding
    // dismissal class doesn't leak into the "loaded" banner styling.
    profileBanner.classList.remove('profile-banner-onboard');
    profileBanner.hidden = false;
    const top = hp.topPreference(profile);
    const prettyTop = top === 'read_write' ? 'reading & writing' : (top || '—');
    const who = profile.child_label ? profile.child_label + "'s" : 'Your';
    const stale = hp.isProfileStale(profile);
    const nudgeVisible = hp.profileStore.overrideNudgeVisible;

    profileBanner.appendChild(el('div', { class: 'profile-banner-info' }, [
      el('span', { class: 'profile-banner-badge', textContent: 'PROFILE LOADED' }),
      el('span', { class: 'profile-banner-text' }, [
        who + ' top preference: ',
        el('strong', { textContent: prettyTop })
      ]),
      stale ? el('span', { class: 'profile-banner-stale', textContent: 'stale — consider a re-take' }) : null
    ]));
    profileBanner.appendChild(el('div', { class: 'profile-banner-actions' }, [
      el('a', { class: 'profile-banner-action', textContent: 'View activity',
        href: buildActivityUrl(), target: '_blank', rel: 'noopener',
        title: 'See your math sessions in the parent dashboard' }),
      el('button', { type: 'button', class: 'profile-banner-action', textContent: 'Re-export',
        on: { click: reExportProfile } }),
      el('button', { type: 'button', class: 'profile-banner-action profile-banner-action-quiet',
        textContent: 'Forget',
        on: { click: () => { if (confirm('Forget the imported profile?')) hp.profileStore.clear(); } }
      })
    ]));
    if (nudgeVisible) {
      profileBanner.appendChild(el('div', { class: 'profile-banner-nudge' }, [
        el('span', { textContent: 'Your preferences may have shifted. You’ve picked a non-recommended mode several times.' }),
        el('span', { style: 'display:inline-flex;gap:0.45rem;align-items:center;' }, [
          el('a', {
            href: 'https://helena-learner-profile.vercel.app/',
            target: '_blank', rel: 'noopener',
            textContent: 'Re-take intake'
          }),
          el('button', {
            type: 'button',
            class: 'profile-banner-action profile-banner-action-quiet',
            textContent: 'Not now',
            on: { click: () => hp.profileStore.clearOverrideStreak() }
          })
        ])
      ]));
    }
    decorateRecommendedPip();
  }

  function decorateRecommendedPip() {
    if (!window.helenaProfile) return;
    const hp = window.helenaProfile;
    const recommended = hp.recommendedMathMode(hp.profileStore.profile, hp.profileStore.sessionIndex);
    document.querySelectorAll('button.mode-card[data-mode]').forEach((btn) => {
      const mode = btn.getAttribute('data-mode');
      const existing = btn.querySelector('.recommended-pip');
      if (recommended && mode === recommended) {
        btn.classList.add('is-recommended');
        if (!existing) {
          const pip = document.createElement('span');
          pip.className = 'recommended-pip';
          pip.textContent = 'RECOMMENDED';
          pip.setAttribute('aria-label', 'Recommended for your profile');
          btn.appendChild(pip);
        }
      } else {
        btn.classList.remove('is-recommended');
        if (existing) existing.remove();
      }
    });
  }

  function reExportProfile() {
    if (!window.helenaProfile) return;
    const updated = window.helenaProfile.profileStore.exportWithTelemetry();
    if (!updated) return;
    const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'helena-learner-profile-from-math-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // Build a URL-safe base64 token of the augmented profile so the parent
  // can open the producer's /activity page with the data already loaded.
  // Returns '#' if there's no profile or no telemetry — the calling banner
  // is gated on a profile being present, so this should never hit '#'.
  function buildActivityUrl() {
    if (!window.helenaProfile) return '#';
    const updated = window.helenaProfile.profileStore.exportWithTelemetry();
    if (!updated) return '#';
    try {
      const json = JSON.stringify(updated);
      const encoded = btoa(encodeURIComponent(json));
      const safe = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return 'https://helena-learner-profile.vercel.app/activity#profile=' + safe;
    } catch (_) {
      return '#';
    }
  }

  // ─── Mode dispatcher ────────────────────────────────────────────────────
  function startMode(mode) {
    activeMode = mode;
    questionPos = 0;
    score = 0;
    questions = generateQuestions(mode);
    qTotal.textContent = String(QUESTIONS_PER_ROUND);
    modeSelectionView.hidden = true;
    endView.hidden = true;
    gameView.hidden = false;
    gameFeedback.textContent = '';
    gameFeedback.className = 'game-feedback';
    if (mode === 'times-tables') gameTitle.textContent = 'Times Tables';
    if (mode === 'speed-add') gameTitle.textContent = 'Speed Add';
    if (mode === 'number-sort') gameTitle.textContent = 'Number Sort';
    renderQuestion();
  }

  function exitToHub() {
    modeSelectionView.hidden = false;
    gameView.hidden = true;
    endView.hidden = true;
    activeMode = null;
  }

  function nextOrFinish() {
    questionPos += 1;
    if (questionPos >= QUESTIONS_PER_ROUND) {
      finish();
    } else {
      qIndex.textContent = String(questionPos + 1);
      gameFeedback.textContent = '';
      gameFeedback.className = 'game-feedback';
      renderQuestion();
    }
  }

  function finish() {
    gameView.hidden = true;
    endView.hidden = false;
    endTitle.textContent =
      score >= 9 ? 'Excellent!' :
      score >= 7 ? 'Strong work.' :
      score >= 5 ? 'Solid effort.' :
                   'Good try — keep going.';
    endSummary.textContent = score + ' out of ' + QUESTIONS_PER_ROUND + ' correct.';
  }

  // ─── Question generation ────────────────────────────────────────────────
  function generateQuestions(mode) {
    if (mode === 'times-tables') {
      const out = [];
      for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
        const a = 2 + Math.floor(Math.random() * 10); // 2-11
        const b = 2 + Math.floor(Math.random() * 10);
        out.push({ kind: 'tt', a, b, answer: a * b });
      }
      return out;
    }
    if (mode === 'speed-add') {
      const out = [];
      for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
        const a = 5 + Math.floor(Math.random() * 45);   // 5-49
        const b = 5 + Math.floor(Math.random() * 45);
        out.push({ kind: 'sa', a, b, answer: a + b });
      }
      return out;
    }
    if (mode === 'number-sort') {
      // Each "question" is a single number, total 10. Bins: even / odd / prime.
      // (Even+prime overlaps only at 2 — handled by giving 'prime' priority.)
      const out = [];
      const seen = new Set();
      while (out.length < QUESTIONS_PER_ROUND) {
        const n = 2 + Math.floor(Math.random() * 49); // 2-50
        if (seen.has(n)) continue;
        seen.add(n);
        const isPrime = checkPrime(n);
        const bin = isPrime ? 'prime' : (n % 2 === 0 ? 'even' : 'odd');
        out.push({ kind: 'ns', n, bin });
      }
      return out;
    }
    return [];
  }

  function checkPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
    return true;
  }

  // ─── Question rendering ─────────────────────────────────────────────────
  function renderQuestion() {
    while (gameBody.firstChild) gameBody.removeChild(gameBody.firstChild);
    qIndex.textContent = String(questionPos + 1);
    qScore.textContent = String(score);
    const q = questions[questionPos];
    if (!q) return;

    if (q.kind === 'tt') renderTimesTables(q);
    else if (q.kind === 'sa') renderSpeedAdd(q);
    else if (q.kind === 'ns') renderNumberSort(q);
  }

  function renderTimesTables(q) {
    const heading = el('div', { class: 'question-text' }, [
      el('span', { textContent: q.a + ' × ' + q.b + ' = ?' })
    ]);
    const input = el('input', {
      type: 'number',
      class: 'answer-input',
      inputmode: 'numeric',
      pattern: '[0-9]*',
      autocomplete: 'off',
      'aria-label': 'Type your answer'
    });
    const btn = el('button', {
      type: 'button',
      class: 'btn-primary',
      textContent: 'Check',
      on: { click: () => check(parseInt(input.value, 10)) }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
    gameBody.appendChild(heading);
    gameBody.appendChild(input);
    gameBody.appendChild(btn);
    setTimeout(() => input.focus(), 30);

    function check(val) {
      if (val === q.answer) {
        score += 1;
        gameFeedback.textContent = '✓ Correct';
        gameFeedback.className = 'game-feedback correct';
      } else {
        gameFeedback.textContent = 'Not quite — the answer was ' + q.answer + '.';
        gameFeedback.className = 'game-feedback wrong';
      }
      btn.disabled = true;
      input.disabled = true;
      setTimeout(nextOrFinish, 900);
    }
  }

  function renderSpeedAdd(q) {
    const prompt = q.a + ' plus ' + q.b;
    const heading = el('div', { class: 'question-text', textContent: '🎧 Listen…' });
    const audioBtn = el('button', {
      type: 'button',
      class: 'audio-button',
      textContent: 'Hear it again',
      on: { click: () => speak(prompt) }
    });
    const input = el('input', {
      type: 'number',
      class: 'answer-input',
      inputmode: 'numeric',
      pattern: '[0-9]*',
      autocomplete: 'off',
      'aria-label': 'Type the sum'
    });
    const btn = el('button', {
      type: 'button',
      class: 'btn-primary',
      textContent: 'Check',
      on: { click: () => check(parseInt(input.value, 10)) }
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
    gameBody.appendChild(heading);
    gameBody.appendChild(audioBtn);
    gameBody.appendChild(input);
    gameBody.appendChild(btn);
    setTimeout(() => {
      speak(prompt);
      input.focus();
    }, 50);

    function check(val) {
      if (val === q.answer) {
        score += 1;
        gameFeedback.textContent = '✓ Correct';
        gameFeedback.className = 'game-feedback correct';
      } else {
        gameFeedback.textContent = 'Not quite — the answer was ' + q.answer + '.';
        gameFeedback.className = 'game-feedback wrong';
      }
      btn.disabled = true;
      input.disabled = true;
      setTimeout(nextOrFinish, 900);
    }
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  function renderNumberSort(q) {
    // Use a single batch (the current question's number + 4 distractors from
    // the remaining queue) so the kid sees a few tiles and drags into bins.
    const batchNumbers = [q.n];
    let i = questionPos + 1;
    while (batchNumbers.length < 4 && i < questions.length) {
      batchNumbers.push(questions[i].n);
      i += 1;
    }

    const wrap = el('div', { class: 'sort-area' });
    const heading = el('div', { class: 'question-text', textContent: 'Drag each number to a bin' });
    wrap.appendChild(heading);

    const pool = el('div', { class: 'number-pool' });
    const bins = el('div', { class: 'bins' });
    wrap.appendChild(pool);
    wrap.appendChild(bins);

    const binDefs = [
      { key: 'even', label: 'EVEN' },
      { key: 'odd', label: 'ODD' },
      { key: 'prime', label: 'PRIME' }
    ];
    const binEls = {};
    for (const b of binDefs) {
      const binEl = el('div', { class: 'bin', dataset: { bin: b.key } }, [
        el('span', { class: 'bin-label', textContent: b.label })
      ]);
      binEl.addEventListener('dragover', (e) => { e.preventDefault(); binEl.classList.add('drag-over'); });
      binEl.addEventListener('dragleave', () => binEl.classList.remove('drag-over'));
      binEl.addEventListener('drop', (e) => {
        e.preventDefault();
        binEl.classList.remove('drag-over');
        const n = parseInt(e.dataTransfer.getData('text/plain'), 10);
        handleDrop(n, b.key, binEl);
      });
      bins.appendChild(binEl);
      binEls[b.key] = binEl;
    }

    // Touch + keyboard model: tap a tile to "pick it up", then tap a bin to
    // drop it. Keyboard: Tab focuses tiles; arrow keys move the highlight
    // across the three bins; Enter places the selected tile in the
    // highlighted bin. Drag-and-drop still works for mouse users.
    let selectedTile = null;
    let highlightedBinIdx = 0;
    const orderedBinKeys = binDefs.map((b) => b.key);
    function setBinHighlight(idx) {
      highlightedBinIdx = idx;
      orderedBinKeys.forEach((k, i) => {
        binEls[k].classList.toggle('keyboard-highlight', i === idx && !!selectedTile);
      });
    }
    function selectTile(tile) {
      if (selectedTile) selectedTile.classList.remove('selected');
      selectedTile = tile;
      tile.classList.add('selected');
      setBinHighlight(highlightedBinIdx);
    }
    for (const key of orderedBinKeys) {
      binEls[key].setAttribute('role', 'button');
      binEls[key].setAttribute('tabindex', '0');
      binEls[key].setAttribute('aria-label', 'Place number in ' + key + ' bin');
      const placeHere = () => {
        if (!selectedTile) return;
        const n = parseInt(selectedTile.dataset.n, 10);
        selectedTile = null;
        setBinHighlight(highlightedBinIdx);
        handleDrop(n, key, binEls[key]);
      };
      binEls[key].addEventListener('click', placeHere);
      binEls[key].addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); placeHere(); }
      });
    }
    for (const n of batchNumbers) {
      const isPrime = checkPrime(n);
      const correctBin = isPrime ? 'prime' : (n % 2 === 0 ? 'even' : 'odd');
      const tile = el('div', {
        class: 'number-tile',
        textContent: String(n),
        dataset: { n: String(n), bin: correctBin },
        draggable: true
      });
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('aria-label', 'Number ' + n + ', tap then tap a bin');
      tile.addEventListener('dragstart', (e) => {
        tile.classList.add('dragging');
        e.dataTransfer.setData('text/plain', String(n));
        e.dataTransfer.effectAllowed = 'move';
      });
      tile.addEventListener('dragend', () => tile.classList.remove('dragging'));
      // Tap to select (works on touch + click).
      tile.addEventListener('click', () => selectTile(tile));
      // Keyboard path: arrow keys move bin highlight, Enter drops.
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!selectedTile || selectedTile !== tile) { selectTile(tile); return; }
          const key = orderedBinKeys[highlightedBinIdx];
          selectedTile = null;
          setBinHighlight(highlightedBinIdx);
          handleDrop(n, key, binEls[key]);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (!selectedTile) selectTile(tile);
          setBinHighlight((highlightedBinIdx + 1) % orderedBinKeys.length);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!selectedTile) selectTile(tile);
          setBinHighlight((highlightedBinIdx - 1 + orderedBinKeys.length) % orderedBinKeys.length);
        }
      });
      pool.appendChild(tile);
    }
    gameBody.appendChild(wrap);

    let droppedCount = 0;
    const expected = batchNumbers.length;

    function handleDrop(n, binKey, binEl) {
      const tile = pool.querySelector('.number-tile[data-n="' + n + '"]');
      if (!tile) return;
      const correctBin = tile.dataset.bin;
      if (binKey === correctBin && binEl) {
        score += 1;
        tile.remove();
        binEl.appendChild(el('span', { class: 'number-tile', textContent: String(n) }));
        gameFeedback.textContent = '✓ ' + correctBin;
        gameFeedback.className = 'game-feedback correct';
      } else {
        gameFeedback.textContent = 'Close — ' + n + ' is ' + correctBin + '.';
        gameFeedback.className = 'game-feedback wrong';
        tile.remove();
        if (binEls[correctBin]) {
          binEls[correctBin].appendChild(el('span', { class: 'number-tile', textContent: String(n) }));
        }
      }
      qScore.textContent = String(score);
      droppedCount += 1;
      if (droppedCount >= expected) {
        // Advance past the consumed batch in the question queue.
        questionPos += expected - 1;
        setTimeout(nextOrFinish, 1100);
      }
    }
  }
})();
