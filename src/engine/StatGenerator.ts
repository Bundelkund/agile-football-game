/**
 * Stat Generator - Calculates play outcomes based on team stats
 */

import type {
  PlayType,
  PlayResult,
  TeamStats,
  OffenseFormation,
  DefenseFormation,
} from './types';
import { calculateFormationBonus } from './FormationSystem';

export interface PlayOutcome {
  result: PlayResult;
  yards: number;
}

/**
 * Calculate play outcome based on team stats and play type
 */
export function calculatePlayOutcome(
  playType: PlayType,
  offenseStats: TeamStats,
  defenseStats: TeamStats,
  offenseFormation: OffenseFormation,
  defenseFormation: DefenseFormation
): PlayOutcome {
  // Base success chance (offense vs defense)
  const offensePower = offenseStats.offense;
  const defensePower = defenseStats.defense;

  // Apply formation bonus
  const formationBonus = calculateFormationBonus(playType, offenseFormation, defenseFormation);
  const netFormationBonus = formationBonus.offenseBonus - formationBonus.defenseBonus;
  const successChance = 50 + (offensePower - defensePower) / 2 + netFormationBonus;

  const roll = Math.random() * 100;

  switch (playType) {
    case 'run':
      return calculateRunOutcome(successChance, roll);
    case 'short_pass':
      return calculatePassOutcome(successChance, roll, false);
    case 'long_pass':
      return calculatePassOutcome(successChance, roll, true);
    case 'field_goal':
      return calculateFieldGoalOutcome(successChance, roll);
    case 'punt':
      return { result: 'gain', yards: 35 + Math.floor(Math.random() * 20) };
    case 'kneel':
      return { result: 'loss', yards: -1 };
    case 'spike':
      return { result: 'incomplete', yards: 0 };
    default:
      return { result: 'incomplete', yards: 0 };
  }
}

function calculateRunOutcome(successChance: number, roll: number): PlayOutcome {
  if (roll < 5) {
    return { result: 'fumble', yards: 0 };
  }
  if (roll < 10) {
    return { result: 'touchdown', yards: 75 };
  }
  if (roll < successChance) {
    const yards = Math.floor(Math.random() * 15) + 1;
    return { result: 'gain', yards };
  }
  return { result: 'loss', yards: -(Math.floor(Math.random() * 3) + 1) };
}

function calculatePassOutcome(
  successChance: number,
  roll: number,
  isLong: boolean
): PlayOutcome {
  if (roll < 5) {
    return { result: 'interception', yards: 0 };
  }
  if (roll < 8) {
    return { result: 'sack', yards: -(Math.floor(Math.random() * 5) + 3) };
  }
  if (roll < 12 && isLong) {
    return { result: 'touchdown', yards: 60 };
  }
  if (roll < successChance - (isLong ? 15 : 0)) {
    const yards = isLong
      ? Math.floor(Math.random() * 30) + 15
      : Math.floor(Math.random() * 15) + 5;
    return { result: 'gain', yards };
  }
  return { result: 'incomplete', yards: 0 };
}

function calculateFieldGoalOutcome(
  successChance: number,
  roll: number
): PlayOutcome {
  const distance = 30 + Math.floor(Math.random() * 20);
  if (roll < successChance - distance / 2) {
    return { result: 'gain', yards: distance };
  }
  return { result: 'loss', yards: 0 };
}
