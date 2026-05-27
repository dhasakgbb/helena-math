/**
 * Helena platform learner profile — math module port.
 *
 * Validators, helpers, and the fragment codec now live in the shared
 * profile-schema package (window.HelenaProfile, capital H), loaded via
 * jsDelivr in index.html. This file keeps only the per-app store:
 * localStorage I/O, cross-tab sync, telemetry, and subscribers — exposed
 * as window.helenaProfile (lowercase).
 */
(function () {
  'use strict';

  const PROFILE_STORAGE_KEY = 'helena-math:profile:v1';
  const SESSION_INDEX_KEY = 'helena-math:profile:session-index:v1';
  const LAUNCH_HISTORY_MAX = 12;
  const OVERRIDE_NUDGE_THRESHOLD = 3;

  const MATH_MODES = ['times-tables', 'speed-add', 'number-sort'];

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function isStr(v) { return typeof v === 'string'; }
  function isNum(v) { return typeof v === 'number' && Number.isFinite(v); }

  function validate(raw) {
    if (!window.HelenaProfile) return { ok: false, error: 'profile-schema package failed to load' };
    const r = window.HelenaProfile.exportedProfileSchema.safeParse(raw);
    return r.success
      ? { ok: true, profile: r.data }
      : { ok: false, error: r.error.issues[0]?.message ?? 'invalid' };
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

  // Cross-tab sync: when another tab of the same origin writes to either
  // storage key, refresh in-memory state and notify subscribers so the
  // UI updates without a manual reload.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === PROFILE_STORAGE_KEY) {
        profile = loadProfile();
        notify();
      } else if (e.key === SESSION_INDEX_KEY) {
        sessionIndex = loadSessionIndex();
        notify();
      }
    });
  }

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
      const ttlMs = (window.HelenaProfile?.PROFILE_TTL_DAYS ?? 60) * 24 * 60 * 60 * 1000;
      const expires = new Date(now.getTime() + ttlMs);
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
    if (!window.HelenaProfile) return 'invalid';
    const decoded = window.HelenaProfile.decodeProfileFragment(raw);
    if (decoded === null) return 'invalid';
    const r = profileStore.importFromText(decoded);
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (_) {}
    return r.ok ? 'imported' : 'invalid';
  }

  const autoImportResult = tryImportProfileFromHash();

  // Late-arrival profile URLs: if the user already had this tab open and
  // someone shares a #profile=… URL pasted into the same window, the URL
  // changes without a full reload — so the inline call above doesn't re-fire.
  // Listen for hashchange and re-run the import.
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      tryImportProfileFromHash();
    });
  }

  // Thin delegates so app.js can call hp.topPreference(...) etc. without
  // knowing whether they live on the per-app store or the shared package.
  function topPreference(p) { return window.HelenaProfile ? window.HelenaProfile.topPreference(p) : null; }
  function secondPreference(p) { return window.HelenaProfile ? window.HelenaProfile.secondPreference(p) : null; }
  function recommendedMathMode(p, idx) { return window.HelenaProfile ? window.HelenaProfile.recommendedMathMode(p, idx) : null; }
  function isProfileStale(p, now) { return window.HelenaProfile ? window.HelenaProfile.isProfileStale(p, now) : false; }

  window.helenaProfile = {
    profileStore,
    topPreference, secondPreference, recommendedMathMode,
    isProfileStale, subscribe, autoImportResult,
    MATH_MODES,
    get MODE_AFFINITY() { return window.HelenaProfile ? window.HelenaProfile.MODE_AFFINITY.math : {}; }
  };
})();
