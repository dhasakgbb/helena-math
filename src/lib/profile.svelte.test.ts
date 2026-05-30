import { describe, it, expect, beforeEach } from 'vitest';
import { profileStore } from './profile.svelte';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

const mockProfileJSON = {
  version: 1,
  generated_at: '2026-05-29T20:00:00Z',
  expires_at: '2026-07-29T20:00:00Z',
  preferences: {
    visual: 80,
    auditory: 40,
    read_write: 30,
    kinesthetic: 50
  },
  flags: {
    reading: 'low',
    writing: 'low',
    math: 'low',
    attention: 'low'
  },
  needs_corroboration: {
    reading: false,
    writing: false,
    math: false,
    attention: false
  },
  strengths: ['visual estimation'],
  plan: 'strengths',
  source: 'intake_quiz',
  child_label: 'Helena',
  module_overrides: {}
};

describe('profileStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    profileStore.clear();
  });

  it('starts with a null profile', () => {
    expect(profileStore.profile).toBeNull();
  });

  it('imports valid profile JSON and stores it', () => {
    const res = profileStore.importFromText(JSON.stringify(mockProfileJSON));
    expect(res.ok).toBe(true);
    expect(profileStore.profile).not.toBeNull();
    expect(profileStore.profile?.child_label).toBe('Helena');
  });

  it('fails to import invalid JSON', () => {
    const res = profileStore.importFromText('invalid json');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid JSON');
  });

  it('advances session indexes correctly', () => {
    expect(profileStore.sessionIndex).toBe(0);
    profileStore.advanceSession();
    expect(profileStore.sessionIndex).toBe(1);
  });

  it('records mode launches and updates override streaks', () => {
    profileStore.importFromText(JSON.stringify(mockProfileJSON));
    
    // Default recommended mode is number-sort for visual=80
    const rec = profileStore.recommendedMathMode;
    expect(rec).toBe('number-sort');

    // Follow the recommended launch
    profileStore.recordLaunch('number-sort', rec);
    expect(profileStore.telemetry.last_launches[0]).toBe('number-sort');
    expect(profileStore.telemetry.last_override_streak).toBe(0);

    // Override the recommended launch
    profileStore.recordLaunch('times-tables', rec);
    expect(profileStore.telemetry.last_launches[0]).toBe('times-tables');
    expect(profileStore.telemetry.last_override_streak).toBe(1);
  });

  it('tracks times table facts and calculates mastery correctly', () => {
    profileStore.importFromText(JSON.stringify(mockProfileJSON));
    // Initially times-tables has 0 mastery
    expect((profileStore.profile?.module_overrides?.math as any)?.mastery?.['times-tables']).toBeUndefined();

    // Answer 3 correct facts for 7s
    for (let i = 0; i < 3; i++) {
      profileStore.recordTimesTableFact(7, 2);
    }
    // Answers for table 7 is 3, for 2 is 3. Since they are < 5, they do not count as mastered tables.
    // Mastered count = 0. Mastery = 0.
    expect((profileStore.profile?.module_overrides?.math as any)?.times_tables_facts?.[7]).toBe(3);
    expect((profileStore.profile?.module_overrides?.math as any)?.mastery?.['times-tables']).toBe(0);

    // Answer 2 more correct facts for 7s (now 5 total, which reaches the mastering threshold)
    profileStore.recordTimesTableFact(7, 3);
    profileStore.recordTimesTableFact(7, 4);

    // Table 7 has 5 correct facts now, so 1 of 11 tables is mastered. Mastery = 1/11 = 0.091
    expect((profileStore.profile?.module_overrides?.math as any)?.times_tables_facts?.[7]).toBe(5);
    expect((profileStore.profile?.module_overrides?.math as any)?.mastery?.['times-tables']).toBe(0.091);
  });

  it('records game results and handles practice streaks', () => {
    profileStore.importFromText(JSON.stringify(mockProfileJSON));
    
    // Record a game result with high score
    profileStore.recordGameResult('speed-add', 8, 10, 4);
    expect((profileStore.profile?.module_overrides?.math as any)?.scores?.['speed-add'].length).toBe(1);
    expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(1);
    expect((profileStore.profile?.module_overrides?.math as any)?.mastery?.['speed-add']).toBe(0.24); // 0.0 * 0.7 + 0.8 * 0.3 = 0.24

    // Record another game result with high score
    profileStore.recordGameResult('speed-add', 9, 10, 4);
    expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(2);

    // Record a game result with low score, streak resets
    profileStore.recordGameResult('speed-add', 4, 10, 4);
    expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(0);
  });

  it('builds streak on a ratio, so 5-question games count', () => {
    profileStore.importFromText(JSON.stringify(mockProfileJSON));
    // 4/5 = 0.8 >= 0.7 -> streak should increment (old code required score>=7 and failed here)
    profileStore.recordGameResult('long-division', 4, 5, 4);
    expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(1);
    // 3/5 = 0.6 < 0.7 -> streak resets
    profileStore.recordGameResult('long-division', 3, 5, 4);
    expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(0);
    // 7/10 = 0.7 -> still counts for 10-question games
    profileStore.recordGameResult('speed-add', 7, 10, 4);
    expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(1);
  });

  it('serializes and parses back successfully through Zod after game events', () => {
    profileStore.importFromText(JSON.stringify(mockProfileJSON));
    profileStore.recordLaunch('speed-add', 'times-tables');
    profileStore.recordTimesTableFact(7, 8);
    profileStore.recordGameResult('speed-add', 9, 10, 4);

    const exported = profileStore.exportWithTelemetry();
    expect(exported).not.toBeNull();

    // Verify it parses cleanly through Zod schema
    const text = JSON.stringify(exported);
    const res = profileStore.importFromText(text);
    expect(res.ok).toBe(true);
    expect(profileStore.profile).not.toBeNull();
    expect((profileStore.profile?.module_overrides?.math as any)?.streak).toBe(1);
    expect((profileStore.profile?.module_overrides?.math as any)?.times_tables_facts?.[7]).toBe(1);
  });
});
