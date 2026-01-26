#!/usr/bin/env python3
"""
NFL Simulation Dataset Generator
Generates realistic play-by-play data based on NFL rules and statistics.

Usage:
    python generate_realistic_csv.py [--rows 12000] [--output nfl_simulation_dataset.csv]
"""

import csv
import random
import argparse
from dataclasses import dataclass
from typing import Literal, Tuple

# =============================================================================
# CONFIGURATION (based on nfl_simulation_framework.json)
# =============================================================================

TEAMS = [
    "Bills", "Chiefs", "Dolphins", "Patriots", "Steelers",  # AFC
    "49ers", "Cowboys", "Eagles", "Packers", "Rams"          # NFC
]

WEATHER_CONDITIONS = ["clear", "rain", "snow", "cold", "hot", "windy"]

PLAY_TYPES = ["run", "pass", "deep_pass", "screen", "qb_sneak", "kneel", "spike", "punt", "field_goal"]

# Stat ranges per play type
PLAY_STATS = {
    "run": {
        "yards": (-5, 15),
        "fumble_pct": 0.03,
        "results": ["gain", "loss", "fumble", "touchdown"]
    },
    "pass": {
        "yards": (-10, 30),
        "fumble_pct": 0.01,
        "int_pct": 0.04,
        "incomplete_pct": 0.35,
        "sack_pct": 0.06,
        "results": ["gain", "loss", "incomplete", "interception", "sack", "fumble", "touchdown"]
    },
    "deep_pass": {
        "yards": (-10, 50),
        "fumble_pct": 0.01,
        "int_pct": 0.08,
        "incomplete_pct": 0.55,
        "sack_pct": 0.08,
        "results": ["gain", "loss", "incomplete", "interception", "sack", "fumble", "touchdown"]
    },
    "screen": {
        "yards": (-5, 20),
        "fumble_pct": 0.02,
        "int_pct": 0.02,
        "incomplete_pct": 0.20,
        "results": ["gain", "loss", "incomplete", "interception", "fumble", "touchdown"]
    },
    "qb_sneak": {
        "yards": (-2, 3),
        "fumble_pct": 0.05,
        "results": ["gain", "loss", "fumble", "touchdown"]
    },
    "kneel": {
        "yards": (-2, -1),
        "fumble_pct": 0.0,
        "results": ["loss"]  # Always loss (time kill)
    },
    "spike": {
        "yards": (0, 0),
        "fumble_pct": 0.0,
        "results": ["incomplete"]  # Always incomplete (clock stop)
    },
    "punt": {
        "yards": (30, 50),
        "fumble_pct": 0.02,  # Return fumble
        "results": ["gain", "fumble", "touchdown"]  # Return yards, muffed punt, return TD
    },
    "field_goal": {
        "yards": (0, 0),
        "make_pct": 0.82,  # NFL average
        "results": ["gain", "loss"]  # gain = made (3 pts), loss = missed
    }
}

# Weather modifiers
WEATHER_MODIFIERS = {
    "clear": {"run": 1.0, "pass": 1.0, "fumble": 1.0, "kick": 1.0},
    "rain": {"run": 0.9, "pass": 0.8, "fumble": 1.5, "kick": 0.85},
    "snow": {"run": 0.8, "pass": 0.7, "fumble": 1.8, "kick": 0.75},
    "cold": {"run": 0.95, "pass": 0.9, "fumble": 1.2, "kick": 0.9},
    "hot": {"run": 1.0, "pass": 1.0, "fumble": 1.0, "kick": 1.0},
    "windy": {"run": 1.0, "pass": 0.75, "fumble": 1.0, "kick": 0.7},
}


@dataclass
class GameState:
    """Tracks current game state."""
    game_id: int
    quarter: int
    time_remaining: int  # seconds
    down: int
    distance: int
    yardline: int  # 0-100 (0 = own endzone, 100 = opponent endzone)
    score_offense: int
    score_defense: int
    offense_team: str
    defense_team: str
    weather: str
    play_count: int = 0


def weighted_random(min_val: int, max_val: int, center_weight: float = 0.6) -> int:
    """Generate weighted random number (more likely near center)."""
    if min_val == max_val:
        return min_val

    # Use triangular distribution for more realistic outcomes
    mode = (min_val + max_val) / 2
    value = random.triangular(min_val, max_val, mode)
    return int(round(value))


def determine_play_result(play_type: str, weather: str, yardline: int) -> Tuple[str, int, bool]:
    """
    Determine realistic play result based on type, weather, and field position.

    Returns: (result, yards_gained, is_turnover)
    """
    stats = PLAY_STATS[play_type]
    weather_mod = WEATHER_MODIFIERS[weather]

    # Special cases
    if play_type == "kneel":
        return "loss", random.randint(-2, -1), False

    if play_type == "spike":
        return "incomplete", 0, False

    if play_type == "field_goal":
        # Adjust make percentage based on distance and weather
        distance_to_goal = 100 - yardline
        base_pct = stats["make_pct"]

        # Longer kicks are harder
        if distance_to_goal > 40:
            base_pct -= 0.15
        elif distance_to_goal > 30:
            base_pct -= 0.05

        # Weather affects kicks
        adjusted_pct = base_pct * weather_mod["kick"]

        if random.random() < adjusted_pct:
            return "gain", 3, False  # Field goal made (3 points conceptually)
        else:
            return "loss", 0, False  # Missed

    if play_type == "punt":
        # Punt return
        yards = weighted_random(stats["yards"][0], stats["yards"][1])

        # Small chance of muffed punt (fumble)
        if random.random() < stats["fumble_pct"] * weather_mod["fumble"]:
            return "fumble", yards, True

        # Very rare punt return TD
        if random.random() < 0.02:
            return "touchdown", yards, False

        return "gain", yards, False

    # Running plays
    if play_type in ["run", "qb_sneak"]:
        # Check fumble first
        if random.random() < stats["fumble_pct"] * weather_mod["fumble"]:
            yards = random.randint(-5, 5)
            return "fumble", yards, True

        # Calculate yards with weather modifier
        base_yards = weighted_random(stats["yards"][0], stats["yards"][1])
        yards = int(base_yards * weather_mod["run"])

        # Check for touchdown
        if yardline + yards >= 100:
            return "touchdown", 100 - yardline, False

        if yards > 0:
            return "gain", yards, False
        else:
            return "loss", yards, False

    # Passing plays
    if play_type in ["pass", "deep_pass", "screen"]:
        # Check sack first (before pass is thrown)
        sack_pct = stats.get("sack_pct", 0)
        if random.random() < sack_pct:
            yards = random.randint(-12, -3)
            return "sack", yards, False

        # Check incomplete
        incomplete_pct = stats.get("incomplete_pct", 0) / weather_mod["pass"]
        if random.random() < incomplete_pct:
            return "incomplete", 0, False

        # Check interception
        int_pct = stats.get("int_pct", 0)
        if random.random() < int_pct:
            yards = random.randint(-10, 20)  # INT return yards
            return "interception", yards, True

        # Check fumble (after catch)
        if random.random() < stats["fumble_pct"] * weather_mod["fumble"]:
            yards = random.randint(0, 10)
            return "fumble", yards, True

        # Successful completion
        base_yards = weighted_random(stats["yards"][0], stats["yards"][1])
        yards = int(base_yards * weather_mod["pass"])

        # Ensure yards is reasonable (no negative completions unless sack)
        if yards < 0:
            yards = random.randint(1, 5)

        # Check for touchdown
        if yardline + yards >= 100:
            return "touchdown", 100 - yardline, False

        return "gain", yards, False

    # Fallback
    return "gain", 0, False


def select_play_type(game_state: GameState) -> str:
    """Select realistic play type based on game situation."""
    quarter = game_state.quarter
    time_left = game_state.time_remaining
    down = game_state.down
    distance = game_state.distance
    yardline = game_state.yardline
    score_diff = game_state.score_offense - game_state.score_defense

    # End of half/game situations
    if quarter == 4 and time_left < 120 and score_diff > 0:
        # Winning team runs out clock
        if time_left < 45:
            return "kneel"
        return random.choice(["run", "run", "kneel"])

    if quarter in [2, 4] and time_left < 30:
        # Need to stop clock
        return random.choice(["pass", "deep_pass", "spike"])

    # 4th down decisions
    if down == 4:
        if distance <= 2 and yardline >= 60:
            return "qb_sneak"  # Go for it on short yardage
        if yardline >= 65:
            return "field_goal"  # FG range
        return "punt"  # Punt it away

    # Short yardage
    if distance <= 2:
        return random.choice(["run", "run", "qb_sneak", "pass"])

    # Long yardage (3rd and long)
    if down == 3 and distance >= 8:
        return random.choice(["pass", "pass", "deep_pass", "screen"])

    # Red zone
    if yardline >= 80:
        return random.choice(["run", "pass", "pass", "screen"])

    # Normal situations - balanced
    weights = {
        "run": 35,
        "pass": 40,
        "deep_pass": 15,
        "screen": 10
    }

    plays = list(weights.keys())
    probs = [weights[p] for p in plays]
    return random.choices(plays, weights=probs)[0]


def update_game_state(state: GameState, result: str, yards: int, is_turnover: bool) -> GameState:
    """Update game state after a play."""
    state.play_count += 1

    # Time management (rough estimate)
    if result == "incomplete" or result == "spike":
        state.time_remaining -= random.randint(3, 8)
    else:
        state.time_remaining -= random.randint(25, 45)

    # Handle turnover
    if is_turnover:
        state.offense_team, state.defense_team = state.defense_team, state.offense_team
        state.score_offense, state.score_defense = state.score_defense, state.score_offense
        state.yardline = 100 - state.yardline
        state.down = 1
        state.distance = 10
        return state

    # Handle touchdown
    if result == "touchdown":
        state.score_offense += 7  # Assume PAT made
        # Kickoff - start new drive
        state.offense_team, state.defense_team = state.defense_team, state.offense_team
        state.score_offense, state.score_defense = state.score_defense, state.score_offense
        state.yardline = 25  # Touchback
        state.down = 1
        state.distance = 10
        return state

    # Handle field goal
    if result == "gain" and yards == 3:  # FG made marker
        state.score_offense += 3
        state.offense_team, state.defense_team = state.defense_team, state.offense_team
        state.score_offense, state.score_defense = state.score_defense, state.score_offense
        state.yardline = 25
        state.down = 1
        state.distance = 10
        return state

    # Handle punt
    if state.play_count > 0 and yards >= 30:  # Punt
        state.offense_team, state.defense_team = state.defense_team, state.offense_team
        state.score_offense, state.score_defense = state.score_defense, state.score_offense
        state.yardline = max(20, 100 - yards)  # New field position
        state.down = 1
        state.distance = 10
        return state

    # Normal play - update position
    state.yardline = max(1, min(99, state.yardline + yards))

    # Update downs
    if yards >= state.distance:
        state.down = 1
        state.distance = 10
    else:
        state.down += 1
        state.distance = max(1, state.distance - yards)

        # Turnover on downs
        if state.down > 4:
            state.offense_team, state.defense_team = state.defense_team, state.offense_team
            state.score_offense, state.score_defense = state.score_defense, state.score_offense
            state.yardline = 100 - state.yardline
            state.down = 1
            state.distance = 10

    # Quarter transitions
    if state.time_remaining <= 0:
        state.quarter += 1
        state.time_remaining = 900  # 15 minutes

    return state


def generate_dataset(num_rows: int = 12000) -> list:
    """Generate the full dataset."""
    rows = []
    play_id = 0
    game_id = 1

    while len(rows) < num_rows:
        # Initialize new game
        offense = random.choice(TEAMS)
        defense = random.choice(TEAMS)  # Self-play allowed
        weather = random.choice(WEATHER_CONDITIONS)

        state = GameState(
            game_id=game_id,
            quarter=1,
            time_remaining=900,
            down=1,
            distance=10,
            yardline=25,
            score_offense=0,
            score_defense=0,
            offense_team=offense,
            defense_team=defense,
            weather=weather
        )

        # Weather can change once per game (after halftime)
        weather_changed = False

        # Play the game
        while state.quarter <= 4 and len(rows) < num_rows:
            # Weather change at halftime
            if state.quarter == 3 and not weather_changed and random.random() < 0.2:
                state.weather = random.choice(WEATHER_CONDITIONS)
                weather_changed = True

            # Select and execute play
            play_type = select_play_type(state)
            result, yards, is_turnover = determine_play_result(
                play_type, state.weather, state.yardline
            )

            # Record the play
            row = {
                "game_id": state.game_id,
                "play_id": play_id,
                "offense_team": state.offense_team,
                "defense_team": state.defense_team,
                "quarter": state.quarter,
                "time_remaining_sec": max(0, state.time_remaining),
                "down": state.down,
                "distance": state.distance,
                "yardline": state.yardline,
                "score_offense": state.score_offense,
                "score_defense": state.score_defense,
                "play_type": play_type,
                "play_result": result,
                "yards_gained": yards,
                "turnover": 1 if is_turnover else 0,
                "penalty": 1 if random.random() < 0.08 else 0,  # ~8% penalty rate
                "weather": state.weather
            }
            rows.append(row)
            play_id += 1

            # Update state
            state = update_game_state(state, result, yards, is_turnover)

        game_id += 1

    return rows[:num_rows]


def main():
    parser = argparse.ArgumentParser(description="Generate realistic NFL simulation data")
    parser.add_argument("--rows", type=int, default=12000, help="Number of rows to generate")
    parser.add_argument("--output", type=str, default="nfl_simulation_dataset_realistic.csv",
                        help="Output filename")
    args = parser.parse_args()

    print(f"Generating {args.rows} plays...")
    data = generate_dataset(args.rows)

    # Write CSV
    output_path = args.output
    fieldnames = [
        "game_id", "play_id", "offense_team", "defense_team", "quarter",
        "time_remaining_sec", "down", "distance", "yardline", "score_offense",
        "score_defense", "play_type", "play_result", "yards_gained", "turnover",
        "penalty", "weather"
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"Generated {len(data)} plays across {data[-1]['game_id']} games")
    print(f"Output: {output_path}")

    # Print statistics
    from collections import Counter
    play_types = Counter(row["play_type"] for row in data)
    results = Counter(row["play_result"] for row in data)

    print("\nPlay Type Distribution:")
    for pt, count in sorted(play_types.items(), key=lambda x: -x[1]):
        print(f"  {pt}: {count} ({count/len(data)*100:.1f}%)")

    print("\nResult Distribution:")
    for r, count in sorted(results.items(), key=lambda x: -x[1]):
        print(f"  {r}: {count} ({count/len(data)*100:.1f}%)")


if __name__ == "__main__":
    main()
