import {
  exportedProfileSchema,
  topPreference,
  secondPreference,
  isProfileStale,
  recommendedMathMode,
  decodeProfileFragment,
  type ExportedProfile
} from 'profile-schema';

const PROFILE_STORAGE_KEY = 'helena-math:profile:v1';
const SESSION_INDEX_KEY = 'helena-math:profile:session-index:v1';
const LAUNCH_HISTORY_MAX = 12;
const OVERRIDE_NUDGE_THRESHOLD = 3;

export const MATH_MODES = [
  'times-tables',
  'speed-add',
  'number-sort',
  'fractions-visual',
  'place-value',
  'multiplication-grid',
  'long-division',
  'decimals-grid',
  'geometry-angles',
  'pemdas-tree'
] as const;
export type MathMode = typeof MATH_MODES[number];

export interface MathTelemetry {
  followed: Record<string, number>;
  overrode: Record<string, number>;
  last_launches: string[];
  last_override_streak: number;
}

function emptyTelemetry(): MathTelemetry {
  return { followed: {}, overrode: {}, last_launches: [], last_override_streak: 0 };
}

function getTelemetry(p: ExportedProfile | null): MathTelemetry {
  const raw = p?.module_overrides?.math;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyTelemetry();
  const obj = raw as Record<string, any>;
  return {
    followed: (obj.followed && typeof obj.followed === 'object') ? obj.followed : {},
    overrode: (obj.overrode && typeof obj.overrode === 'object') ? obj.overrode : {},
    last_launches: Array.isArray(obj.last_launches) ? obj.last_launches.filter((s: any) => typeof s === 'string') : [],
    last_override_streak: typeof obj.last_override_streak === 'number' && obj.last_override_streak >= 0 ? obj.last_override_streak : 0
  };
}

function setTelemetry(p: ExportedProfile, t: MathTelemetry): ExportedProfile {
  return {
    ...p,
    module_overrides: {
      ...(p.module_overrides || {}),
      math: t as unknown as Record<string, unknown>
    }
  };
}

class ProfileStore {
  // Svelte 5 Runes for reactivity
  profile = $state<ExportedProfile | null>(null);
  sessionIndex = $state<number>(0);
  
  constructor() {
    this.load();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === PROFILE_STORAGE_KEY) {
          this.loadProfile();
        } else if (e.key === SESSION_INDEX_KEY) {
          this.loadSessionIndex();
        }
      });
    }
  }

  load() {
    this.loadProfile();
    this.loadSessionIndex();
  }

  private loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) {
        this.profile = null;
        return;
      }
      const parsed = JSON.parse(raw);
      const r = exportedProfileSchema.safeParse(parsed);
      this.profile = r.success ? r.data : null;
    } catch (_) {
      this.profile = null;
    }
  }

  private loadSessionIndex() {
    try {
      const n = Number(localStorage.getItem(SESSION_INDEX_KEY) || 0);
      this.sessionIndex = Number.isFinite(n) && n >= 0 ? n : 0;
    } catch (_) {
      this.sessionIndex = 0;
    }
  }

  private persist(p: ExportedProfile | null) {
    try {
      if (p) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p));
      } else {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    } catch (_) {}
  }

  private persistSessionIndex(n: number) {
    try {
      localStorage.setItem(SESSION_INDEX_KEY, String(n));
    } catch (_) {}
  }

  get telemetry(): MathTelemetry {
    return getTelemetry(this.profile);
  }

  get overrideNudgeVisible(): boolean {
    return this.profile !== null && this.telemetry.last_override_streak >= OVERRIDE_NUDGE_THRESHOLD;
  }

  get topPreference(): string | null {
    return this.profile ? topPreference(this.profile) : null;
  }

  get secondPreference(): string | null {
    return this.profile ? secondPreference(this.profile) : null;
  }

  get recommendedMathMode(): string | null {
    return this.profile ? recommendedMathMode(this.profile, this.sessionIndex) : null;
  }

  get isStale(): boolean {
    return this.profile ? isProfileStale(this.profile) : false;
  }

  importFromText(text: string): { ok: boolean; error?: string } {
    try {
      const json = JSON.parse(text);
      const r = exportedProfileSchema.safeParse(json);
      if (!r.success) {
        return { ok: false, error: r.error.issues[0]?.message ?? 'invalid profile structure' };
      }
      this.profile = r.data;
      this.persist(this.profile);
      return { ok: true };
    } catch (_) {
      return { ok: false, error: 'invalid JSON' };
    }
  }

  clear() {
    this.profile = null;
    this.persist(null);
  }

  advanceSession() {
    this.sessionIndex += 1;
    this.persistSessionIndex(this.sessionIndex);
  }

  initializeDefaultProfile() {
    const defaultProfile: ExportedProfile = {
      version: 1,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      preferences: { visual: 50, auditory: 50, read_write: 50, kinesthetic: 50 },
      flags: { reading: 'low', writing: 'low', math: 'low', attention: 'low' },
      needs_corroboration: { reading: false, writing: false, math: false, attention: false },
      strengths: [],
      plan: 'strengths',
      source: 'intake_quiz',
      child_label: 'Helena',
      module_overrides: {}
    };
    this.profile = defaultProfile;
    this.persist(this.profile);
  }

  recordTimesTableFact(a: number, b: number, timeMs?: number) {
    if (!this.profile) {
      this.initializeDefaultProfile();
    }
    const profile = this.profile!;
    const telemetry = this.telemetry;
    const mathOverrides = (profile.module_overrides?.math as any) || {};
    const facts = mathOverrides.times_tables_facts || {};
    const fluentFacts = mathOverrides.fluent_facts || {};
    const missedFacts = mathOverrides.missed_facts || {};
    let lastMastered = mathOverrides.last_mastered_table || null;

    const factKey = a < b ? `${a}x${b}` : `${b}x${a}`;

    if (a >= 2 && a <= 12) {
      facts[a] = (facts[a] || 0) + 1;
    }
    if (b >= 2 && b <= 12 && b !== a) {
      facts[b] = (facts[b] || 0) + 1;
    }

    // Check for fluency (e.g. under 3 seconds = 3000ms)
    if (timeMs !== undefined && timeMs <= 3000) {
      fluentFacts[factKey] = (fluentFacts[factKey] || 0) + 1;
    }

    // If they got it right, maybe reduce the mistake counter?
    if (missedFacts[factKey] > 0) {
      missedFacts[factKey] -= 1;
      if (missedFacts[factKey] === 0) delete missedFacts[factKey];
    }

    // Recalculate times tables mastery: fraction of tables 2s-12s (11 tables total) that have >= 5 correct facts
    const prevMasteryMap = mathOverrides.mastery || {};
    let masteredCount = 0;
    for (let f = 2; f <= 12; f++) {
      if ((facts[f] || 0) >= 5) {
        masteredCount++;
        // If we just pushed this table to 5, record it as the most recently mastered
        if ((facts[f] || 0) === 5) {
          lastMastered = f;
        }
      }
    }
    const newMastery = parseFloat((masteredCount / 11).toFixed(3));

    const nextTelemetry = {
      ...telemetry,
      ...mathOverrides,
      times_tables_facts: facts,
      fluent_facts: fluentFacts,
      missed_facts: missedFacts,
      last_mastered_table: lastMastered,
      last_session_date: new Date().toISOString(),
      mastery: {
        ...prevMasteryMap,
        'times-tables': newMastery
      }
    };

    this.profile = {
      ...profile,
      module_overrides: {
        ...(profile.module_overrides || {}),
        math: nextTelemetry as any
      }
    };
    this.persist(this.profile);
  }

  recordTimesTableMistake(a: number, b: number) {
    if (!this.profile) return;
    const profile = this.profile;
    const mathOverrides = (profile.module_overrides?.math as any) || {};
    const missedFacts = mathOverrides.missed_facts || {};

    const factKey = a < b ? `${a}x${b}` : `${b}x${a}`;
    missedFacts[factKey] = (missedFacts[factKey] || 0) + 1;

    const nextTelemetry = {
      ...mathOverrides,
      missed_facts: missedFacts,
      last_session_date: new Date().toISOString(),
    };

    this.profile = {
      ...profile,
      module_overrides: {
        ...(profile.module_overrides || {}),
        math: nextTelemetry as any
      }
    };
    this.persist(this.profile);
  }

  recordGameResult(mode: MathMode, score: number, total: number, gradeLevel: number) {
    if (!this.profile) {
      this.initializeDefaultProfile();
    }
    const profile = this.profile!;
    const telemetry = this.telemetry;
    const mathOverrides = (profile.module_overrides?.math as any) || {};

    // 1. Update Mastery
    const prevMasteryMap = mathOverrides.mastery || {};
    const oldMastery = typeof prevMasteryMap[mode] === 'number' ? prevMasteryMap[mode] : 0.0;
    const scoreRatio = score / total;
    let newMastery = parseFloat(((oldMastery * 0.7) + (scoreRatio * 0.3)).toFixed(3));

    // For times tables, we base mastery on the specific tables mastered (which is updated via recordTimesTableFact)
    if (mode === 'times-tables') {
      const facts = mathOverrides.times_tables_facts || {};
      let masteredCount = 0;
      for (let f = 2; f <= 12; f++) {
        if ((facts[f] || 0) >= 5) {
          masteredCount++;
        }
      }
      newMastery = parseFloat((masteredCount / 11).toFixed(3));
    }

    // 2. Record Scores
    const scores = mathOverrides.scores || {};
    if (!scores[mode]) scores[mode] = [];
    scores[mode].push({
      timestamp: new Date().toISOString(),
      score,
      total,
      grade: gradeLevel
    });

    // 3. Update Streak: consecutive games scoring >= 70% (length-agnostic, matches end-screen tiers)
    let streak = typeof mathOverrides.streak === 'number' ? mathOverrides.streak : 0;
    if (total > 0 && score / total >= 0.7) {
      streak += 1;
    } else {
      streak = 0;
    }

    const nextTelemetry = {
      ...telemetry,
      ...mathOverrides,
      scores,
      streak,
      mastery: {
        ...prevMasteryMap,
        [mode]: newMastery
      }
    };

    this.profile = {
      ...profile,
      module_overrides: {
        ...(profile.module_overrides || {}),
        math: nextTelemetry as any
      }
    };
    this.persist(this.profile);
  }

  recordLaunch(launched: MathMode, recommended: string | null) {
    if (!this.profile) return;
    const next = getTelemetry(this.profile);
    const wasFollow = recommended !== null && launched === recommended;
    const bucket = wasFollow ? next.followed : next.overrode;
    
    bucket[launched] = (bucket[launched] || 0) + 1;
    next.last_launches = [launched, ...next.last_launches].slice(0, LAUNCH_HISTORY_MAX);
    if (recommended !== null) {
      next.last_override_streak = wasFollow ? 0 : next.last_override_streak + 1;
    }
    this.profile = setTelemetry(this.profile, next);
    this.persist(this.profile);
  }

  clearOverrideStreak() {
    if (!this.profile) return;
    const next = getTelemetry(this.profile);
    next.last_override_streak = 0;
    this.profile = setTelemetry(this.profile, next);
    this.persist(this.profile);
  }

  exportWithTelemetry(): ExportedProfile | null {
    if (!this.profile) return null;
    const now = new Date();
    const ttlMs = 60 * 24 * 60 * 60 * 1000; // 60 days
    const expires = new Date(now.getTime() + ttlMs);
    return {
      ...this.profile,
      generated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      source: 'behavioral_observation'
    };
  }

  tryImportFromHash(): 'imported' | 'invalid' | 'no-hash' {
    if (typeof window === 'undefined') return 'no-hash';
    const hash = window.location.hash;
    if (!hash || !hash.includes('profile=')) return 'no-hash';
    const params = new URLSearchParams(hash.slice(1));
    const raw = params.get('profile');
    if (!raw) return 'no-hash';
    const decoded = decodeProfileFragment(raw);
    if (decoded === null) return 'invalid';
    const r = this.importFromText(decoded);
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (_) {}
    return r.ok ? 'imported' : 'invalid';
  }
}

export const profileStore = new ProfileStore();
