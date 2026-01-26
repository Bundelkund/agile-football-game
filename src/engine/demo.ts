/**
 * Demo: Usage example for the Game Engine
 */

import {
  calculatePlayOutcome,
  applyWeatherModifiers,
  generateDescription,
  type TeamStats,
  type PlayContext,
} from './index';

// Example teams
const packers: TeamStats = { offense: 85, defense: 75 };
const bears: TeamStats = { offense: 70, defense: 80 };

// Example play
const playType = 'long_pass';
const weather = 'rain';
const offenseFormation = 'shotgun';
const defenseFormation = 'nickel';

// 1. Calculate base outcome
const baseOutcome = calculatePlayOutcome(
  playType,
  packers,
  bears,
  offenseFormation,
  defenseFormation
);

// 2. Apply weather modifiers
const finalOutcome = applyWeatherModifiers(baseOutcome, playType, weather);

// 3. Generate description
const context: PlayContext = {
  offenseTeam: 'Green Bay Packers',
  defenseTeam: 'Chicago Bears',
  playType,
  result: finalOutcome.result,
  yards: finalOutcome.yards,
  weather,
  offenseFormation,
  defenseFormation,
};

const description = generateDescription(context);

console.log('=== PLAY RESULT ===');
console.log(description.headline);
console.log(description.narrative);
if (description.weatherNote) {
  console.log(description.weatherNote);
}
console.log(`\nYards: ${finalOutcome.yards}`);

// Example outputs:
// === PLAY RESULT ===
// +18 Yards (Gain)
// Green Bay Packers passt aus der Shotgun (Pass-stark). Der WR fängt den tiefen Pass für 18 Yards.
// 🌧️ Wetter-Einfluss: Regen (-20% Pass-Genauigkeit)
//
// Yards: 18
