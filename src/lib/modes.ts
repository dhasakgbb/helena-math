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
