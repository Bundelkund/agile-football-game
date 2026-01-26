# NFL Simulation Data Model

> Dokumentation der Datenstrukturen für die Football-Simulation

---

## Übersicht

| Datei | Zweck | Format |
|-------|-------|--------|
| `nfl_field_training_dataset.json` | Spielfeld-Definition für KI-Training | JSON |
| `nfl_simulation_framework.json` | Spieler, Formationen, Stats | JSON |
| `nfl_simulation_dataset_12000.csv` | 12.000 simulierte Spielzüge | CSV |

---

## 1. Spielfeld-Modell (`nfl_field_training_dataset.json`)

### Koordinatensystem

```
0 -------- 50 -------- 100
│          │           │
Endzone    Midfield    Endzone
Team 1                 Team 2
```

| Parameter | Wert | Beschreibung |
|-----------|------|--------------|
| `min` | 0 | Linke Endzone |
| `midfield` | 50 | Mittellinie |
| `max` | 100 | Rechte Endzone |

### Zonen-Struktur

```
┌─────────┬────────────────────────┬────────────────────────┬─────────┐
│ Endzone │      Playzone 1        │      Playzone 2        │ Endzone │
│  (braun)│       (grün)           │       (grün)           │ (braun) │
│ Team 1  │  10  20  30  40  │50│  40  30  20  10       │ Team 2  │
└─────────┴────────────────────────┴────────────────────────┴─────────┘
```

### Nutzung im Training

- `yard_gain_calculation` - Berechnung von Yard-Gewinnen
- `field_position_mapping` - Positionsbestimmung auf dem Feld
- `touchdown_detection` - Erkennung von Touchdowns
- `zone_transition_logic` - Logik für Zonenwechsel

---

## 2. Simulation Framework (`nfl_simulation_framework.json`)

### 2.1 Player Roles

12 Positionen mit definierten Skills und Stats:

#### Offense

| Position | ID | Skills | Tracked Stats |
|----------|-----|--------|---------------|
| Quarterback | `QB` | passing, leadership, vision | pass_yards, td, int |
| Running Back | `RB` | speed, balance, vision | rush_yards, td, fumbles |
| Wide Receiver | `WR` | speed, catching, routes | rec_yards, td, drops |
| Tight End | `TE` | blocking, catching | rec_yards, td, blocks |
| Offensive Line | `OL` | blocking, strength | sacks_allowed, penalties |

#### Defense

| Position | ID | Skills | Tracked Stats |
|----------|-----|--------|---------------|
| Defensive Tackle | `DT` | strength, shed_blocks | tackles, sacks |
| Defensive End | `DE` | pass_rush, speed | sacks, pressures |
| Linebacker | `LB` | tackling, coverage | tackles, ints, sacks |
| Cornerback | `CB` | coverage, speed | ints, pb, td_allowed |
| Safety | `S` | coverage, tackling | ints, tackles |

#### Special Teams

| Position | ID | Skills | Tracked Stats |
|----------|-----|--------|---------------|
| Kicker | `K` | accuracy, power | fg_made, xp_made |
| Punter | `P` | hangtime, accuracy | punt_avg, inside20 |

---

### 2.2 Formationen

#### Offensive Formationen

| Formation | QB | RB | FB | WR | TE | OL | Verwendung |
|-----------|----|----|----|----|----|----|------------|
| **I-Formation** | 1 | 1 | 1 | 2 | 1 | 5 | Balanced, Power Run |
| **Shotgun** | 1 | 1 | - | 3 | 1 | 5 | Pass-heavy, Quick Release |
| **Spread** | 1 | 1 | - | 4 | 0 | 5 | Air Attack, 4+ Receiver |
| **GoalLine** | 1 | 2 | 1 | - | 2 | 5 | Short Yardage, Power |

#### Defensive Formationen

| Formation | DL | LB | CB | S | Verwendung |
|-----------|----|----|----|----|------------|
| **4-3** | 4 | 3 | 2 | 2 | Balanced, Standard |
| **3-4** | 3 | 4 | 2 | 2 | Versatile, Blitz-heavy |
| **Nickel** | 4 | 2 | 3 | 2 | Pass Defense, 3rd Down |
| **Dime** | 4 | 1 | 4 | 2 | Heavy Pass Defense |

---

### 2.3 Game State Templates

Vordefinierte Spielsituationen für Simulation/Training:

| State ID | Quarter | Time Left | Down | Distance | Yardline | Score Diff | Situation |
|----------|---------|-----------|------|----------|----------|------------|-----------|
| `GS001` | 1 | 15:00 | 1st | 10 | 25 | 0 | **Spielstart** |
| `GS002` | 4 | 2:00 | 4th | 5 | 45 | -3 | **Crunch Time** |
| `GS003` | 2 | 5:00 | 3rd | 8 | 70 | +7 | **Protect Lead** |
| `GS004` | 4 | 0:30 | 2nd | 12 | 20 | -6 | **Desperation** |

---

### 2.4 Stat Generators (Wahrscheinlichkeitsbereiche)

Realistische Wertebereiche für Spieler-Statistiken:

#### Quarterback (QB)

| Stat | Min | Max | Einheit |
|------|-----|-----|---------|
| `pass_yards` | 150 | 450 | yards/game |
| `td` | 0 | 5 | touchdowns |
| `int` | 0 | 4 | interceptions |
| `completion_rate` | 50% | 75% | percentage |

#### Running Back (RB)

| Stat | Min | Max | Einheit |
|------|-----|-----|---------|
| `rush_yards` | 30 | 200 | yards/game |
| `td` | 0 | 3 | touchdowns |
| `fumbles` | 0 | 2 | fumbles |

#### Wide Receiver (WR)

| Stat | Min | Max | Einheit |
|------|-----|-----|---------|
| `rec_yards` | 20 | 220 | yards/game |
| `td` | 0 | 3 | touchdowns |
| `drops` | 0 | 3 | drops |

#### Linebacker (LB)

| Stat | Min | Max | Einheit |
|------|-----|-----|---------|
| `tackles` | 3 | 15 | tackles |
| `sacks` | 0 | 3 | sacks |
| `ints` | 0 | 2 | interceptions |

#### Cornerback (CB)

| Stat | Min | Max | Einheit |
|------|-----|-----|---------|
| `ints` | 0 | 3 | interceptions |
| `pb` | 0 | 5 | pass breakups |
| `td_allowed` | 0 | 2 | touchdowns allowed |

#### Kicker (K)

| Stat | Min | Max | Einheit |
|------|-----|-----|---------|
| `fg_made` | 0 | 5 | field goals |
| `xp_made` | 0 | 6 | extra points |
| `fg_accuracy` | 70% | 95% | percentage |

---

## 3. Simulation Dataset (`nfl_simulation_dataset_12000.csv`)

### Schema

| Spalte | Typ | Beschreibung | Wertebereich |
|--------|-----|--------------|--------------|
| `game_id` | int | Spiel-ID | 1, 2, 3... |
| `play_id` | int | Eindeutige Spielzug-ID | 0, 1, 2... |
| `offense_team` | string | Angreifendes Team | 10 NFL Teams |
| `defense_team` | string | Verteidigendes Team | 10 NFL Teams |
| `quarter` | int | Viertel (1–4) | 1-4 |
| `time_remaining_sec` | int | Restzeit im Viertel (Sekunden) | 0-900 |
| `down` | int | Down (1–4) | 1-4 |
| `distance` | int | Yards bis First Down | 1-20+ |
| `yardline` | int | Feldposition (1–100) | 1-100 |
| `score_offense` | int | Punkte Offense | 0-50+ |
| `score_defense` | int | Punkte Defense | 0-50+ |
| `play_type` | string | Spielzug-Typ | siehe unten |
| `play_result` | string | Ergebnis | siehe unten |
| `yards_gained` | int | Raumgewinn/Verlust | -10 bis 60+ |
| `turnover` | bool | Ballverlust (0/1) | 0, 1 |
| `penalty` | bool | Strafe (0/1) | 0, 1 |
| `weather` | string | Wetterbedingung | siehe unten |

### Play Types

| Type | Beschreibung |
|------|--------------|
| `run` | Laufspielzug |
| `pass` | Kurzer/mittlerer Pass |
| `deep_pass` | Langer Pass (20+ yards) |
| `screen` | Screen Pass |
| `qb_sneak` | QB Sneak (kurze Distanz) |
| `kneel` | Kneel Down (Zeit abspielen) |
| `spike` | Spike (Uhr stoppen) |
| `punt` | Punt |
| `field_goal` | Field Goal Versuch |

### Play Results

| Result | Beschreibung |
|--------|--------------|
| `gain` | Positive Yards |
| `loss` | Negative Yards |
| `touchdown` | Touchdown erzielt |
| `incomplete` | Unvollständiger Pass |
| `interception` | Abgefangener Pass |
| `fumble` | Fumble (Ballverlust) |
| `sack` | QB Sack |
| `out_of_bounds` | Aus dem Spielfeld |

### Weather Conditions

| Weather | Auswirkung |
|---------|------------|
| `clear` | Keine Einschränkung |
| `rain` | Fumble-Risiko ↑, Pass-Accuracy ↓ |
| `snow` | Geschwindigkeit ↓, Fumble-Risiko ↑ |
| `cold` | Leichte Einschränkungen |
| `hot` | Ausdauer-Effekte |
| `windy` | Kick-/Pass-Accuracy ↓ |

### Teams im Dataset

- AFC: Bills, Chiefs, Dolphins, Patriots, Steelers
- NFC: 49ers, Cowboys, Eagles, Packers, Rams

---

## Bekannte Limitierungen

> **Hinweis**: Die CSV-Daten sind synthetisch generiert und enthalten unrealistische Kombinationen:

1. **Self-Play**: Teams spielen gegen sich selbst (z.B. "Cowboys vs Cowboys")
2. **Unrealistische Kombinationen**: z.B. "kneel" mit 15 yards gain
3. **Inkonsistente Ergebnisse**: Turnovers bei unmöglichen Spielzügen

Diese Daten eignen sich für **ML-Training** und **Prototyping**, nicht für realistische Simulation.

---

## Verwendung im Code

```typescript
// Beispiel: Framework laden
import framework from './Data/nfl_simulation_framework.json';

// Spieler-Rolle abrufen
const qb = framework.player_roles.find(r => r.id === 'QB');
console.log(qb.skills); // ['passing', 'leadership', 'vision']

// Stat generieren
const passYards = Math.random() *
  (framework.stat_generators.QB.pass_yards.max -
   framework.stat_generators.QB.pass_yards.min) +
  framework.stat_generators.QB.pass_yards.min;
```

---

*Dokumentation erstellt: 2026-01-26*
