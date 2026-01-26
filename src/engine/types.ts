/**
 * Core game engine types for American Football simulation
 */

export type PlayType =
  | 'run'
  | 'short_pass'
  | 'long_pass'
  | 'field_goal'
  | 'punt'
  | 'kneel'
  | 'spike';

export type PlayResult =
  | 'gain'
  | 'loss'
  | 'incomplete'
  | 'interception'
  | 'fumble'
  | 'sack'
  | 'touchdown';

export type Weather =
  | 'clear'
  | 'rain'
  | 'snow'
  | 'wind'
  | 'fog'
  | 'hot';

export type OffenseFormation =
  | 'shotgun'
  | 'i_formation'
  | 'spread'
  | 'pistol'
  | 'wildcat';

export type DefenseFormation =
  | '4-3'
  | '3-4'
  | 'nickel'
  | 'dime'
  | 'prevent';

/**
 * Team stats for offense and defense
 */
export interface TeamStats {
  offense: number;  // 0-100
  defense: number;  // 0-100
}

/**
 * Game state
 */
export interface GameState {
  homeTeam: {
    name: string;
    stats: TeamStats;
    score: number;
  };
  awayTeam: {
    name: string;
    stats: TeamStats;
    score: number;
  };
  possession: 'home' | 'away';
  down: 1 | 2 | 3 | 4;
  yardsToGo: number;
  yardLine: number;
  quarter: 1 | 2 | 3 | 4;
  timeRemaining: number;
  weather: Weather;
}
