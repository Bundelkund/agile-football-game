/**
 * Formation System - Provides bonuses based on formation matchups
 */

import type { OffenseFormation, DefenseFormation, PlayType } from './types';

export interface FormationBonus {
  offenseBonus: number;  // +/- percentage points
  defenseBonus: number;  // +/- percentage points
}

/**
 * Calculate formation bonuses for a play
 */
export function calculateFormationBonus(
  playType: PlayType,
  offenseFormation: OffenseFormation,
  defenseFormation: DefenseFormation
): FormationBonus {
  let offenseBonus = 0;
  let defenseBonus = 0;

  // Offense formation bonuses
  switch (offenseFormation) {
    case 'shotgun':
      if (playType === 'short_pass' || playType === 'long_pass') {
        offenseBonus += 5;
      }
      break;
    case 'i_formation':
      if (playType === 'run') {
        offenseBonus += 5;
      }
      break;
    case 'spread':
      if (playType === 'short_pass') {
        offenseBonus += 7;
      }
      break;
    case 'pistol':
      offenseBonus += 3; // Balanced, slight bonus to everything
      break;
    case 'wildcat':
      if (playType === 'run') {
        offenseBonus += 8;
      } else {
        offenseBonus -= 5; // Penalties for passing from wildcat
      }
      break;
  }

  // Defense formation bonuses
  switch (defenseFormation) {
    case '4-3':
      if (playType === 'run') {
        defenseBonus += 5;
      }
      break;
    case '3-4':
      defenseBonus += 3; // Balanced
      break;
    case 'nickel':
      if (playType === 'short_pass') {
        defenseBonus += 5;
      }
      if (playType === 'run') {
        defenseBonus -= 3; // Weaker against run
      }
      break;
    case 'dime':
      if (playType === 'long_pass') {
        defenseBonus += 7;
      }
      if (playType === 'run') {
        defenseBonus -= 5; // Very weak against run
      }
      break;
    case 'prevent':
      if (playType === 'long_pass') {
        defenseBonus += 10;
      }
      if (playType === 'short_pass' || playType === 'run') {
        defenseBonus -= 5; // Gives up short plays
      }
      break;
  }

  return { offenseBonus, defenseBonus };
}

/**
 * Get formation description
 */
export function getFormationDescription(formation: OffenseFormation | DefenseFormation): string {
  const descriptions: Record<OffenseFormation | DefenseFormation, string> = {
    shotgun: 'Shotgun (Pass-stark)',
    i_formation: 'I-Formation (Lauf-stark)',
    spread: 'Spread (Short Pass)',
    pistol: 'Pistol (Balanciert)',
    wildcat: 'Wildcat (Lauf-heavy)',
    '4-3': '4-3 Defense (Lauf-Stopp)',
    '3-4': '3-4 Defense (Balanciert)',
    nickel: 'Nickel (Pass-Verteidigung)',
    dime: 'Dime (Deep Pass-Schutz)',
    prevent: 'Prevent (Big Play-Stopp)',
  };

  return descriptions[formation] || formation;
}
