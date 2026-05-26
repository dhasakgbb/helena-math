/**
 * Helena platform learner profile — math module port.
 *
 * Cross-module contract from helena-learner-profile. Identical shape to
 * helena-spelling and helena-states. If the contract changes, mirror it
 * here. Differences from the states port: only MODE_AFFINITY and the
 * exposed globals namespace.
 */
(function () {
  'use strict';

  const PROFILE_VERSION = 1;
  const PROFILE_STORAGE_KEY = 'helena-math:profile:v1';
  const SESSION_INDEX_KEY = 'helena-math:profile:session-index:v1';
  const LAUNCH_HISTORY_MAX = 12;
  const OVERRIDE_NUDGE_THRESHOLD = 3;

  const MATH_MODES = ['times-tables', 'speed-add', 'number-sort'];

  // VARK mapping for math modes:
  //   times-tables  : read/write (text-based equations + typed answers)
  //   speed-add     : auditory (the problem is spoken; the kid types)
  //   number-sort   : visual + kinesthetic (drag numbers into bins)
  const MODE_AFFINITY = {
    'times-tables': ['read_write'],
    'speed-add': ['auditory'],
    'number-sort': ['visual', 'kinesthetic']
  };

  const FLAG_LEVELS = ['low', 'medium', 'high'];
  const PLAN_LEVELS = ['strengths', 'monitor', 'schedule'];
  const SOURCES = ['intake_quiz', 'parent_edit', 'behavioral_observation'];

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function isStr(v) { return typeof v === 'string'; }
  function isNum(v) { return typeof v === 'number' && Number.isFinite(v); }
  function inRange(v, lo, hi) { return isNum(v) && v >= lo && v <= hi; }
  function isISODate(v) { return isStr(v) && !Number.isNaN(Date.parse(v)); }

  function validate(raw) {
    if (!isObj(raw)) return { ok: false, error: 'not an object' };
    if (raw.version !== PROFILE_VERSION) return { ok: false, error: 'version must be ' + PROFILE_VERSION };
    if (!isISODate(raw.generated_at)) return { ok: false, error: 'generated_at must be ISO date' };
    if (!isISODate(raw.expires_at)) return { ok: false, error: 'expires_at must be ISO date' };
    if (!isObj(raw.preferences)) return { ok: false, error: 'preferences must be object' };
    for (const m of ['visual', 'auditory', 'read_write', 'kinesthetic']) {
      if (!inRange(raw.preferences[m], 0, 100)) return { ok: false, error: 'preferences.' + m + ' must be 0-100' };
    }
    if (!isObj(raw.flags)) return { ok: false, error: 'flags must be object' };
    for (const d of ['reading', 'writing', 'math', 'attention']) {
      if (FLAG_LEVELS.indexOf(raw.flags[d]) === -1) return { ok: false, error: 'flags.' + d + ' invalid' };
    }
    if (!isObj(raw.needs_corroboration)) return { ok: false, error: 'needs_corroboration must be object' };
    for (const d of ['reading', 'writing', 'math', 'attention']) {
      if (typeof raw.needs_corroboration[d] !== 'boolean') return { ok: false, error: 'needs_corroboration.' + d };
    }
    if (!Array.isArray(raw.strengths) || !raw.strengths.every(isStr)) return { ok: false, error: 'strengths must be array of strings' };
    if (PLAN_LEVELS.indexOf(raw.plan) === -1) return { ok: false, error: 'plan invalid' };
    if (raw.module_overrides !== undefined && !isObj(raw.module_overrides)) return { ok: false, error: 'module_overrides must be object' };
    if (SOURCES.indexOf(raw.source) === -1) return { ok: false, error: 'source invalid' };
    if (raw.child_label !== undefined && (!isStr(raw.child_label) || raw.child_label.length > 40)) return { ok: false, error: 'child_label invalid' };
    return {
      ok: true,
      profile: {
        version: raw.version,
        generated_at: raw.generated_at,
        expires_at: raw.expires_at,
        preferences: { ...raw.preferences },
        flags: { ...raw.flags },
        needs_corroboration: { ...raw.needs_corroboration },
        strengths: raw.strengths.slice(),
        plan: raw.plan,
        module_overrides: raw.module_overrides || {},
        source: raw.source,
        ...(raw.child_label ? { child_label: raw.child_label } : {})
      }
    };
  }

  function topPreference(profile) {
    if (!profile) return null;
    const entries = Object.entries(profile.preferences);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0] && entries[0][1] > 0 ? entries[0][0] : null;
  }
  function secondPreference(profile) {
    if (!profile) return null;
    const entries = Object.entries(profile.preferences);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[1] && entries[1][1] > 0 ? entries[1][0] : null;
  }
  function recommendedMathMode(profile, sessionIndex) {
    if (!profile) return null;
    const stretchTurn = sessionIndex > 0 && sessionIndex % 4 === 0;
    const target = stretchTurn ? secondPreference(profile) : topPreference(profile);
    if (!target) return null;
    for (const mode of MATH_MODES) {
      if ((MODE_AFFINITY[mode] || []).indexOf(target) !== -1) return mode;
    }
    return null;
  }
  function isProfileStale(profile, now) {
    if (!profile) return false;
    return (now || new Date()).toISOString() >= profile.expires_at;
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return null;
      const r = validate(JSON.parse(raw));
      return r.ok ? r.profile : null;
    } catch (_) { return null; }
  }
  function persist(p) {
    try { p ? localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p)) : localStorage.removeItem(PROFILE_STORAGE_KEY); }
    catch (_) {}
  }
  function loadSessionIndex() {
    const n = Number(localStorage.getItem(SESSION_INDEX_KEY) || 0);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  function persistSessionIndex(n) {
    try { localStorage.setItem(SESSION_INDEX_KEY, String(n)); } catch (_) {}
  }

  function emptyTelemetry() {
    return { followed: {}, overrode: {}, last_launches: [], last_override_streak: 0 };
  }
  function getTelemetry(p) {
    const raw = p && p.module_overrides && p.module_overrides.math;
    if (!isObj(raw)) return emptyTelemetry();
    return {
      followed: isObj(raw.followed) ? raw.followed : {},
      overrode: isObj(raw.overrode) ? raw.overrode : {},
      last_launches: Array.isArray(raw.last_launches) ? raw.last_launches.filter(isStr) : [],
      last_override_streak: isNum(raw.last_override_streak) && raw.last_override_streak >= 0 ? raw.last_override_streak : 0
    };
  }
  function setTelemetry(p, t) {
    return { ...p, module_overrides: { ...(p.module_overrides || {}), math: t } };
  }

  const subscribers = new Set();
  function notify() { for (const fn of subscribers) try { fn(); } catch (_) {} }
  function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

  let profile = loadProfile();
  let sessionIndex = loadSessionIndex();

  const profileStore = {
    get profile() { return profile; },
    get sessionIndex() { return sessionIndex; },
    get telemetry() { return profile ? getTelemetry(profile) : emptyTelemetry(); },
    get overrideNudgeVisible() {
      return profile && getTelemetry(profile).last_override_streak >= OVERRIDE_NUDGE_THRESHOLD;
    },
    importFromText(text) {
      let json;
      try { json = JSON.parse(text); }
      catch (_) { return { ok: false, error: 'invalid JSON' }; }
      const r = validate(json);
      if (!r.ok) return { ok: false, error: "Doesn't look like a Helena profile (" + r.error + ')' };
      profile = r.profile; persist(profile); notify();
      return { ok: true, profile: r.profile };
    },
    clear() { profile = null; persist(null); notify(); },
    advanceSession() { sessionIndex += 1; persistSessionIndex(sessionIndex); notify(); },
    recordLaunch(launched, recommended) {
      if (!profile) return;
      const next = getTelemetry(profile);
      const wasFollow = recommended !== null && launched === recommended;
      const bucket = wasFollow ? next.followed : next.overrode;
      bucket[launched] = (bucket[launched] || 0) + 1;
      next.last_launches = [launched, ...next.last_launches].slice(0, LAUNCH_HISTORY_MAX);
      if (recommended !== null) {
        next.last_override_streak = wasFollow ? 0 : next.last_override_streak + 1;
      }
      profile = setTelemetry(profile, next); persist(profile); notify();
    },
    clearOverrideStreak() {
      if (!profile) return;
      const next = getTelemetry(profile);
      next.last_override_streak = 0;
      profile = setTelemetry(profile, next); persist(profile); notify();
    },
    exportWithTelemetry() {
      if (!profile) return null;
      const now = new Date();
      const expires = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      return { ...profile, generated_at: now.toISOString(), expires_at: expires.toISOString(), source: 'behavioral_observation' };
    }
  };

  function tryImportProfileFromHash() {
    if (typeof window === 'undefined') return 'no-hash';
    const hash = window.location.hash;
    if (!hash || hash.indexOf('profile=') === -1) return 'no-hash';
    const params = new URLSearchParams(hash.slice(1));
    const raw = params.get('profile');
    if (!raw) return 'no-hash';
    let decoded;
    try {
      const standard = raw.replace(/-/g, '+').replace(/_/g, '/');
      const padded = standard + '==='.slice(0, (4 - (standard.length % 4)) % 4);
      decoded = decodeURIComponent(atob(padded));
    } catch (_) { return 'invalid'; }
    const r = profileStore.importFromText(decoded);
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (_) {}
    return r.ok ? 'imported' : 'invalid';
  }

  const autoImportResult = tryImportProfileFromHash();

  window.helenaProfile = {
    profileStore,
    topPreference, secondPreference, recommendedMathMode,
    isProfileStale, subscribe, autoImportResult,
    MATH_MODES, MODE_AFFINITY
  };
})();
