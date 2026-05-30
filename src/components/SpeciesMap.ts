import type { MathMode } from '../lib/modes';

export type PlantSpecies = 'moonflower' | 'starbloom' | 'bellflower' | 'gembud';

export const SPECIES_FOR: Record<MathMode, PlantSpecies> = {
  'times-tables': 'moonflower',
  'speed-add': 'moonflower',
  'number-sort': 'starbloom',
  'geometry-angles': 'starbloom',
  'fractions-visual': 'bellflower',
  'decimals-grid': 'bellflower',
  'long-division': 'bellflower',
  'place-value': 'gembud',
  'multiplication-grid': 'gembud',
  'pemdas-tree': 'gembud',
};

export function speciesFor(mode: string): PlantSpecies {
  return (SPECIES_FOR as Record<string, PlantSpecies>)[mode] ?? 'moonflower';
}
