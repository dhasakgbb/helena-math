import { MATH_MODES, type MathMode } from './modes';

/**
 * App-side Smart Pick covering all 10 modes (the schema recommender only covers 3).
 * Honors the schema pick when it is itself in the lowest-mastery tier; otherwise
 * returns the lowest-mastery mode, ties broken by MATH_MODES order (deterministic).
 */
export function pickSmartMode(
  schemaPick: string | null, // schema's 3-mode candidate; may not be one of MATH_MODES
  mastery: Record<string, number>,
): MathMode {
  const fill = (m: string) => (typeof mastery[m] === 'number' ? mastery[m] : 0);
  let lowest: MathMode = MATH_MODES[0];
  for (const m of MATH_MODES) {
    if (fill(m) < fill(lowest)) lowest = m;
  }
  if (schemaPick && (MATH_MODES as readonly string[]).includes(schemaPick)) {
    if (fill(schemaPick) <= fill(lowest)) return schemaPick as MathMode;
  }
  return lowest;
}
