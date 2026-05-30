import { describe, it, expect } from 'vitest';
import { pickSmartMode } from './recommender';
import { MATH_MODES } from './modes';

describe('pickSmartMode', () => {
  it('returns the schema pick when it is among the lowest-mastery modes', () => {
    const mastery: Record<string, number> = { 'number-sort': 0, 'times-tables': 0.9 };
    expect(pickSmartMode('number-sort', mastery)).toBe('number-sort');
  });

  it('falls back to the lowest-mastery mode when the schema pick is already strong', () => {
    const mastery: Record<string, number> = {};
    for (const m of MATH_MODES) mastery[m] = 0.9;
    mastery['long-division'] = 0.1; // a mode the schema recommender never suggests
    expect(pickSmartMode('times-tables', mastery)).toBe('long-division');
  });

  it('is deterministic: ties resolve in MATH_MODES order', () => {
    const mastery: Record<string, number> = {}; // all undefined -> treated as 0
    expect(pickSmartMode(null, mastery)).toBe(MATH_MODES[0]);
  });

  it('ignores an unknown schemaPick string and uses the lowest-mastery fallback', () => {
    expect(pickSmartMode('nonexistent-mode', {})).toBe(MATH_MODES[0]);
  });
});
