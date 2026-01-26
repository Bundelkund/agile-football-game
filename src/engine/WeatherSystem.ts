/**
 * Weather System - Applies weather modifiers to play outcomes
 */

import type { Weather, PlayType } from './types';
import type { PlayOutcome } from './StatGenerator';

export interface WeatherModifiers {
  passAccuracy: number;    // Multiplier for pass success (0.8 = -20%)
  runEfficiency: number;   // Multiplier for run yards
  kickDistance: number;    // Multiplier for punts/FGs
}

/**
 * Get weather modifiers for a given weather condition
 */
export function getWeatherModifiers(weather: Weather): WeatherModifiers {
  switch (weather) {
    case 'clear':
      return { passAccuracy: 1.0, runEfficiency: 1.0, kickDistance: 1.0 };
    case 'rain':
      return { passAccuracy: 0.8, runEfficiency: 0.9, kickDistance: 0.85 };
    case 'snow':
      return { passAccuracy: 0.7, runEfficiency: 0.8, kickDistance: 0.75 };
    case 'wind':
      return { passAccuracy: 0.85, runEfficiency: 1.0, kickDistance: 0.7 };
    case 'fog':
      return { passAccuracy: 0.75, runEfficiency: 0.95, kickDistance: 0.9 };
    case 'hot':
      return { passAccuracy: 0.95, runEfficiency: 0.95, kickDistance: 1.05 };
    default:
      return { passAccuracy: 1.0, runEfficiency: 1.0, kickDistance: 1.0 };
  }
}

/**
 * Apply weather modifiers to a play outcome
 */
export function applyWeatherModifiers(
  outcome: PlayOutcome,
  playType: PlayType,
  weather: Weather
): PlayOutcome {
  const modifiers = getWeatherModifiers(weather);

  // Apply modifiers based on play type
  if (playType === 'short_pass' || playType === 'long_pass') {
    return {
      ...outcome,
      yards: Math.floor(outcome.yards * modifiers.passAccuracy),
    };
  }

  if (playType === 'run') {
    return {
      ...outcome,
      yards: Math.floor(outcome.yards * modifiers.runEfficiency),
    };
  }

  if (playType === 'punt' || playType === 'field_goal') {
    return {
      ...outcome,
      yards: Math.floor(outcome.yards * modifiers.kickDistance),
    };
  }

  return outcome;
}

/**
 * Get weather impact description
 */
export function getWeatherImpact(weather: Weather, playType: PlayType): string | undefined {
  const modifiers = getWeatherModifiers(weather);

  if (weather === 'clear' || weather === 'hot') {
    return undefined; // No significant impact
  }

  if (playType === 'short_pass' || playType === 'long_pass') {
    const impact = Math.round((1 - modifiers.passAccuracy) * 100);
    return `${getWeatherEmoji(weather)} Wetter-Einfluss: ${getWeatherName(weather)} (-${impact}% Pass-Genauigkeit)`;
  }

  if (playType === 'run') {
    const impact = Math.round((1 - modifiers.runEfficiency) * 100);
    return `${getWeatherEmoji(weather)} Wetter-Einfluss: ${getWeatherName(weather)} (-${impact}% Laufeffizienz)`;
  }

  if (playType === 'punt' || playType === 'field_goal') {
    const impact = Math.round((1 - modifiers.kickDistance) * 100);
    return `${getWeatherEmoji(weather)} Wetter-Einfluss: ${getWeatherName(weather)} (-${impact}% Kick-Distanz)`;
  }

  return undefined;
}

function getWeatherEmoji(weather: Weather): string {
  switch (weather) {
    case 'rain': return '🌧️';
    case 'snow': return '❄️';
    case 'wind': return '💨';
    case 'fog': return '🌫️';
    case 'hot': return '☀️';
    default: return '☀️';
  }
}

function getWeatherName(weather: Weather): string {
  switch (weather) {
    case 'rain': return 'Regen';
    case 'snow': return 'Schnee';
    case 'wind': return 'Wind';
    case 'fog': return 'Nebel';
    case 'hot': return 'Hitze';
    default: return 'Klar';
  }
}
