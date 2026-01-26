/**
 * Description Generator - Creates narrative text for play outcomes
 */

import type {
  PlayType,
  PlayResult,
  Weather,
  OffenseFormation,
  DefenseFormation,
} from './types';
import { getWeatherImpact } from './WeatherSystem';
import { getFormationDescription } from './FormationSystem';

export interface PlayContext {
  offenseTeam: string;
  defenseTeam: string;
  playType: PlayType;
  result: PlayResult;
  yards: number;
  weather: Weather;
  offenseFormation: OffenseFormation;
  defenseFormation: DefenseFormation;
}

export interface PlayDescription {
  headline: string;      // z.B. "TOUCHDOWN!" oder "+12 Yards (Gain)"
  narrative: string;     // Ausführliche Beschreibung
  weatherNote?: string;  // z.B. "🌧️ Wetter-Einfluss: Regen (-20% Pass-Genauigkeit)"
}

/**
 * Generate play description with headline, narrative, and weather note
 */
export function generateDescription(context: PlayContext): PlayDescription {
  const headline = generateHeadline(context.result, context.yards);
  const narrative = generateNarrative(context);
  const weatherNote = generateWeatherNote(context.weather, context.playType);

  return { headline, narrative, weatherNote };
}

/**
 * Generate headline based on result
 */
function generateHeadline(result: PlayResult, yards: number): string {
  switch (result) {
    case 'touchdown':
      return 'TOUCHDOWN!';
    case 'interception':
      return 'INTERCEPTION!';
    case 'fumble':
      return 'FUMBLE!';
    case 'sack':
      return `SACK! ${yards} Yards`;
    case 'gain':
      return `+${yards} Yards (Gain)`;
    case 'loss':
      return `${yards} Yards (Loss)`;
    case 'incomplete':
      return 'Incomplete Pass';
    default:
      return 'Play Complete';
  }
}

/**
 * Generate narrative text based on play context
 */
function generateNarrative(context: PlayContext): string {
  const {
    offenseTeam,
    defenseTeam,
    playType,
    result,
    yards,
    offenseFormation,
    defenseFormation,
  } = context;

  const offenseFormName = getFormationDescription(offenseFormation);
  const defenseFormName = getFormationDescription(defenseFormation);

  // Run plays
  if (playType === 'run') {
    switch (result) {
      case 'gain':
        return `${offenseTeam} läuft mit ${offenseFormName}. Der RB findet eine Lücke und gewinnt ${yards} Yards.`;
      case 'loss':
        return `${offenseTeam} versucht einen Lauf, aber die ${defenseFormName} stoppt ihn nach ${yards} Yards Verlust.`;
      case 'fumble':
        return `Der RB verliert den Ball! ${defenseTeam} recovered den Fumble.`;
      case 'touchdown':
        return `TOUCHDOWN! ${offenseTeam} läuft ${yards} Yards in die Endzone!`;
      default:
        return `${offenseTeam} führt einen Laufspielzug aus.`;
    }
  }

  // Pass plays
  if (playType === 'short_pass' || playType === 'long_pass') {
    const passType = playType === 'long_pass' ? 'tiefen' : 'kurzen';

    switch (result) {
      case 'gain':
        return `${offenseTeam} passt aus der ${offenseFormName}. Der WR fängt den ${passType} Pass für ${yards} Yards.`;
      case 'incomplete':
        return `Der ${passType} Pass kommt nicht an. ${defenseFormName} verteidigt gut.`;
      case 'interception':
        return `INTERCEPTION! ${defenseTeam} fängt den ${passType} Pass ab!`;
      case 'sack':
        return `Der QB wird gesackt! ${defenseFormName} durchbricht die O-Line. ${yards} Yards Verlust.`;
      case 'touchdown':
        return `TOUCHDOWN! Perfekter ${passType} Pass über ${yards} Yards in die Endzone!`;
      default:
        return `${offenseTeam} versucht einen ${passType} Pass.`;
    }
  }

  // Field goal
  if (playType === 'field_goal') {
    if (result === 'gain') {
      return `FIELD GOAL! ${offenseTeam} trifft aus ${yards} Yards Distanz!`;
    }
    return `Der Field Goal Versuch aus ${yards} Yards geht daneben!`;
  }

  // Punt
  if (playType === 'punt') {
    return `${offenseTeam} puntet ${yards} Yards. Guter Kick!`;
  }

  // Kneel
  if (playType === 'kneel') {
    return `${offenseTeam} kniet ab. Zeitspiel.`;
  }

  // Spike
  if (playType === 'spike') {
    return `${offenseTeam} spikt den Ball. Uhr gestoppt.`;
  }

  return `${offenseTeam} führt einen Spielzug aus.`;
}

/**
 * Generate weather note if weather has impact
 */
export function generateWeatherNote(weather: Weather, playType: PlayType): string | undefined {
  // No note for clear or hot weather (minimal/no impact)
  if (weather === 'clear' || weather === 'hot') {
    return undefined;
  }

  return getWeatherImpact(weather, playType);
}
