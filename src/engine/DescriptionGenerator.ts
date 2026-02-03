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

// KON-44: Helper to pick random element from array
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate narrative text based on play context
 * KON-44: Enhanced with more narrative variations and situational descriptions
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

  // KON-44: Situational qualifiers for more drama
  const bigPlayThreshold = 15;
  const isBigPlay = yards >= bigPlayThreshold;

  // Run plays with enhanced narratives
  if (playType === 'run') {
    switch (result) {
      case 'gain':
        if (isBigPlay) {
          return randomPick([
            `WAS FÜR EIN LAUF! ${offenseTeam} bricht durch die ${defenseFormName} - der RB tanzt ${yards} Yards nach vorne!`,
            `DURCHGEBROCHEN! Niemand kann ihn stoppen - ${yards} Yards Raumgewinn für ${offenseTeam}!`,
            `Die O-Line öffnet eine RIESIGE Lücke! ${yards} Yards - die Defense schaut nur hinterher!`,
            `EXPLOSIV! ${offenseTeam} aus der ${offenseFormName} - der RB sprintet ${yards} Yards nach vorne!`,
          ]);
        }
        return randomPick([
          `${offenseTeam} läuft aus der ${offenseFormName}. Der RB findet eine Lücke und gewinnt ${yards} Yards.`,
          `Solider Lauf von ${offenseTeam} - ${yards} Yards durch die Mitte.`,
          `Der RB drückt sich durch für ${yards} Yards. Harte Arbeit an der Line!`,
          `Guter Raumgewinn! ${offenseTeam} schiebt den Pile ${yards} Yards nach vorne.`,
        ]);
      case 'loss':
        return randomPick([
          `${offenseTeam} versucht einen Lauf, aber die ${defenseFormName} stoppt ihn nach ${yards} Yards Verlust.`,
          `GESTOPPT! ${defenseTeam} liest den Spielzug perfekt - ${yards} Yards Verlust!`,
          `Die Defense ist blitzschnell da! ${yards} Yards Raumverlust für ${offenseTeam}.`,
          `Kein Durchkommen! ${defenseFormName} steht wie eine Mauer.`,
        ]);
      case 'fumble':
        return randomPick([
          `Der RB verliert den Ball! ${defenseTeam} recovered den Fumble. TURNOVER!`,
          `FUMBLE! Der Ball ist frei - ${defenseTeam} schnappt ihn sich!`,
          `Ein harter Hit - der Ball springt weg! ${defenseTeam} hat ihn!`,
          `Katastrophe für ${offenseTeam}! Der Ball ist weg, ${defenseTeam} ist dran!`,
        ]);
      case 'touchdown':
        return randomPick([
          `TOUCHDOWN! ${offenseTeam} läuft ${yards} Yards in die Endzone! Die Fans rasten aus!`,
          `ER IST DURCH! ${yards} Yards zum TOUCHDOWN - niemand konnte ihn stoppen!`,
          `SECHS PUNKTE! Ein spektakulärer Lauf über ${yards} Yards zum Touchdown!`,
          `ENDZONE! ${offenseTeam} feiert - ${yards} Yards Touchdown-Run!`,
        ]);
      default:
        return `${offenseTeam} führt einen Laufspielzug aus.`;
    }
  }

  // Pass plays with enhanced narratives
  if (playType === 'short_pass' || playType === 'long_pass') {
    const passType = playType === 'long_pass' ? 'tiefen' : 'kurzen';

    switch (result) {
      case 'gain':
        if (isBigPlay) {
          return randomPick([
            `WAS EIN PASS! ${offenseTeam} findet den WR tief - ${yards} Yards BIG PLAY!`,
            `PERFEKT GEWORFEN! Der QB trifft den Receiver in Bewegung - ${yards} Yards!`,
            `Die ${defenseFormName} hatte keine Chance! ${yards} Yards Pass-Gewinn!`,
            `SPEKTAKULÄR! ${offenseTeam} aus der ${offenseFormName} - ${yards} Yards durch die Luft!`,
          ]);
        }
        return randomPick([
          `${offenseTeam} passt aus der ${offenseFormName}. Der WR fängt den ${passType} Pass für ${yards} Yards.`,
          `Guter ${passType} Pass - ${yards} Yards Raumgewinn für ${offenseTeam}.`,
          `Der QB findet seinen Receiver für ${yards} Yards. Solide Arbeit!`,
          `Pass komplett! ${yards} Yards für ${offenseTeam}.`,
        ]);
      case 'incomplete':
        return randomPick([
          `Der ${passType} Pass kommt nicht an. ${defenseFormName} verteidigt gut.`,
          `Pass fallen gelassen! Der Receiver hatte ihn fast.`,
          `Zu stark geworfen - der Ball segelt davon. Incomplete!`,
          `Die Defense ist dran! Der Pass wird abgelenkt.`,
        ]);
      case 'interception':
        return randomPick([
          `INTERCEPTION! ${defenseTeam} fängt den ${passType} Pass ab!`,
          `ABGEFANGEN! Was für ein Fehler vom QB - ${defenseTeam} hat den Ball!`,
          `Der Safety liest den Pass perfekt - INTERCEPTION für ${defenseTeam}!`,
          `TURNOVER! ${defenseTeam} klaut den Ball aus der Luft!`,
        ]);
      case 'sack':
        return randomPick([
          `Der QB wird gesackt! ${defenseFormName} durchbricht die O-Line. ${yards} Yards Verlust.`,
          `SACK! Der Blitzer kommt durch - ${yards} Yards Verlust!`,
          `Die O-Line bricht zusammen! Der QB geht zu Boden - Sack!`,
          `BRUTAL! ${defenseTeam} wirft den QB für ${yards} Yards Verlust zu Boden!`,
        ]);
      case 'touchdown':
        return randomPick([
          `TOUCHDOWN! Perfekter ${passType} Pass über ${yards} Yards in die Endzone!`,
          `ER HAT IHN! ${yards} Yards zum TOUCHDOWN - was ein Wurf!`,
          `SECHS PUNKTE! Der WR tanzt in die Endzone nach ${yards} Yards Pass!`,
          `TOUCHDOWN ${offenseTeam}! Die Verbindung QB-WR ist heute unschlagbar!`,
        ]);
      default:
        return `${offenseTeam} versucht einen ${passType} Pass.`;
    }
  }

  // Field goal with enhanced narratives
  if (playType === 'field_goal') {
    if (result === 'gain') {
      return randomPick([
        `FIELD GOAL! ${offenseTeam} trifft aus ${yards} Yards Distanz!`,
        `ER IST DRIN! 3 Punkte für ${offenseTeam} - perfekter Kick!`,
        `SPLIT THE UPRIGHTS! ${yards} Yards Field Goal - Gold wert!`,
      ]);
    }
    return randomPick([
      `Der Field Goal Versuch aus ${yards} Yards geht daneben!`,
      `VERFEHLT! Der Kick geht am Pfosten vorbei - keine Punkte!`,
      `Zu kurz! Der Field Goal Versuch erreicht die Latte nicht.`,
    ]);
  }

  // Punt
  if (playType === 'punt') {
    return randomPick([
      `${offenseTeam} puntet ${yards} Yards. Guter Kick!`,
      `Der Punter tritt einen schönen Ball - ${yards} Yards!`,
      `Punt ist raus! ${yards} Yards - gute Field Position für ${defenseTeam}.`,
    ]);
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
