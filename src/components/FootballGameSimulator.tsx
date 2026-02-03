import React, { useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import type { Weather, OffenseFormation, DefenseFormation, PlayType, PlayResult as EnginePlayResult, PlayContext, PlayDescription } from '../engine';
import { getFormationDescription, generateDescription, calculateFormationBonus, applyWeatherModifiers } from '../engine';

// TypeScript Interfaces
interface Team {
  name: string;
  offense: {
    QB: string;
    RB: string;
    WR: string;
    WR2: string;
    C: string;
    OL: string;
    TE: string;
    TE2: string;
    Blocker: string;
    Floater: string;
  };
  defense: {
    LB: string;
    Rusher: string;
    Safety: string;
    Allrounder: string;
    DB: string;
    CB: string;
  };
  score: number;
}

interface PlayResult {
  play: number;
  offensePlay: string;
  defensePlay: string;
  yards: number;
  newPosition: number;
  event: string;
  possession: string;
  offenseFormation?: OffenseFormation;
  defenseFormation?: DefenseFormation;
  description?: PlayDescription;
}

type GamePhase = 'setup' | 'playing' | 'gameOver';
type OffensePlay = 'Pass' | 'Lauf' | 'Screen Pass' | 'Play Action';
type DefensePlay = 'Blitz' | 'Zone Coverage' | 'Man Coverage' | 'Run Stuff' | 'Prevent Defense';

const FootballGameSimulator: React.FC = () => {
  // Game State
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [team1, setTeam1] = useState<Team>({
    name: 'Team 1',
    offense: {
      QB: '', RB: '', WR: '', WR2: '', C: '',
      OL: '', TE: '', TE2: '', Blocker: '', Floater: ''
    },
    defense: {
      LB: '', Rusher: '', Safety: '', Allrounder: '', DB: '', CB: ''
    },
    score: 0
  });
  const [team2, setTeam2] = useState<Team>({
    name: 'Team 2',
    offense: {
      QB: '', RB: '', WR: '', WR2: '', C: '',
      OL: '', TE: '', TE2: '', Blocker: '', Floater: ''
    },
    defense: {
      LB: '', Rusher: '', Safety: '', Allrounder: '', DB: '', CB: ''
    },
    score: 0
  });

  const [maxPlays, setMaxPlays] = useState<number>(20);
  const [coinTossWinner, setCoinTossWinner] = useState<1 | 2 | null>(null);
  const [weather, setWeather] = useState<Weather>('clear');
  const [currentPlay, setCurrentPlay] = useState<number>(0);
  const [possession, setPossession] = useState<1 | 2>(1);
  const [yardLine, setYardLine] = useState<number>(35); // 0.1: Start at 35 yards
  const [down, setDown] = useState<1 | 2 | 3 | 4>(1); // Current down (1-4)
  const [yardsToGo, setYardsToGo] = useState<number>(10); // Yards needed for first down
  const [lineOfScrimmage, setLineOfScrimmage] = useState<number>(35); // Starting position of drive
  const [history, setHistory] = useState<PlayResult[]>([]);
  const [isLastPlay, setIsLastPlay] = useState<boolean>(false); // 0.4: Last play checkbox

  const [selectedOffensePlay, setSelectedOffensePlay] = useState<OffensePlay | null>(null);
  const [selectedDefensePlay, setSelectedDefensePlay] = useState<DefensePlay | null>(null);
  const [kickMode, setKickMode] = useState<boolean>(false);
  const [offenseFormation, setOffenseFormation] = useState<OffenseFormation>('shotgun');
  const [defenseFormation, setDefenseFormation] = useState<DefenseFormation>('4-3');
  const [lastPlayDescription, setLastPlayDescription] = useState<PlayDescription | null>(null);

  const offensePlays: OffensePlay[] = ['Pass', 'Lauf', 'Screen Pass', 'Play Action'];
  const defensePlays: DefensePlay[] = ['Blitz', 'Zone Coverage', 'Man Coverage', 'Run Stuff', 'Prevent Defense'];

  // KON-42: Strategy Preview - Show possible outcomes before play execution
  const getStrategyPreview = (offense: OffensePlay | null, defense: DefensePlay | null): string | null => {
    if (!offense) return null;

    const previews: Record<OffensePlay, Record<DefensePlay | 'default', string>> = {
      'Pass': {
        'Blitz': '⚡ Hohes Risiko! 50% Big Play (15-35y) ODER 50% Sack (-5y)',
        'Zone Coverage': '✓ Solide 5-15 Yards erwartet',
        'Man Coverage': '✓ Gute Chance auf 8-23 Yards',
        'Run Stuff': '✓ Gute Chance auf 8-23 Yards',
        'Prevent Defense': '✓ Gute Chance auf 8-23 Yards',
        'default': '📊 Durchschnittlich 8-23 Yards'
      },
      'Lauf': {
        'Blitz': '🏃 GROSSER Lauf möglich! 10-22 Yards (Blitz öffnet Lücken)',
        'Zone Coverage': '✓ Solide 4-12 Yards erwartet',
        'Man Coverage': '✓ Solide 4-12 Yards erwartet',
        'Run Stuff': '⚠️ HARD COUNTER! Nur 0-4 Yards möglich',
        'Prevent Defense': '✓ Solide 4-12 Yards erwartet',
        'default': '📊 Durchschnittlich 4-12 Yards'
      },
      'Screen Pass': {
        'Blitz': '✓ Screen funktioniert gut gegen Blitz (8-20y)',
        'Zone Coverage': '✓ Solide 8-20 Yards erwartet',
        'Man Coverage': '✓ Solide 8-20 Yards erwartet',
        'Run Stuff': '✓ Solide 8-20 Yards erwartet',
        'Prevent Defense': '✓ Solide 8-20 Yards erwartet',
        'default': '📊 Durchschnittlich 8-20 Yards'
      },
      'Play Action': {
        'Blitz': '🎯 Play Action täuscht gut! 12-32 Yards möglich',
        'Zone Coverage': '🎯 Hohe Belohnung: 12-32 Yards',
        'Man Coverage': '🎯 Hohe Belohnung: 12-32 Yards',
        'Run Stuff': '🎯 Hohe Belohnung: 12-32 Yards',
        'Prevent Defense': '🎯 Hohe Belohnung: 12-32 Yards',
        'default': '📊 Durchschnittlich 12-32 Yards (High Reward)'
      }
    };

    if (defense && previews[offense][defense]) {
      return previews[offense][defense];
    }
    return previews[offense]['default'];
  };

  // Setup Phase Handlers
  const handleTeamNameChange = (team: 1 | 2, name: string) => {
    if (team === 1) {
      setTeam1({ ...team1, name });
    } else {
      setTeam2({ ...team2, name });
    }
  };

  const handleOffenseRoleChange = (team: 1 | 2, role: keyof Team['offense'], value: string) => {
    if (team === 1) {
      setTeam1({ ...team1, offense: { ...team1.offense, [role]: value } });
    } else {
      setTeam2({ ...team2, offense: { ...team2.offense, [role]: value } });
    }
  };

  const handleDefenseRoleChange = (team: 1 | 2, role: keyof Team['defense'], value: string) => {
    if (team === 1) {
      setTeam1({ ...team1, defense: { ...team1.defense, [role]: value } });
    } else {
      setTeam2({ ...team2, defense: { ...team2.defense, [role]: value } });
    }
  };

  const startGame = () => {
    if (coinTossWinner) {
      setPossession(coinTossWinner);
      setGamePhase('playing');
    }
  };

  // Type Mapping Functions
  const mapOffensePlayToPlayType = (play: OffensePlay): PlayType => {
    switch (play) {
      case 'Pass': return 'short_pass';
      case 'Lauf': return 'run';
      case 'Screen Pass': return 'short_pass';
      case 'Play Action': return 'long_pass';
      default: return 'run';
    }
  };

  const mapToEngineResult = (event: string, yards: number): EnginePlayResult => {
    if (event.includes('TOUCHDOWN')) return 'touchdown';
    if (event.includes('TURNOVER') || event.includes('Fumble')) return 'fumble';
    if (event.includes('Interception')) return 'interception';
    if (event.includes('Sack')) return 'sack';
    if (yards > 0) return 'gain';
    if (yards < 0) return 'loss';
    return 'incomplete';
  };

  // Game Logic
  const executePlay = () => {
    if (!selectedOffensePlay || !selectedDefensePlay) return;

    const offenseTeam = possession === 1 ? team1 : team2;
    const defenseTeam = possession === 1 ? team2 : team1;

    let yardsGained = 0;
    let event = '';
    let possessionChanged = false;
    let turnoverType: 'touchdown' | 'field_goal' | 'fumble' | 'interception' | 'turnover_on_downs' | null = null;

    // Simplified play resolution
    const random = Math.random();

    if (kickMode) {
      // Field Goal attempt
      const success = random > 0.3; // 70% success rate
      if (success) {
        event = `Field Goal ERFOLG! (+3 Punkte)`;
        if (possession === 1) {
          setTeam1(prev => ({ ...prev, score: prev.score + 3 }));
        } else {
          setTeam2(prev => ({ ...prev, score: prev.score + 3 }));
        }
        possessionChanged = true;
        turnoverType = 'field_goal';
      } else {
        event = `Field Goal VERFEHLT!`;
        possessionChanged = true;
        turnoverType = 'field_goal'; // Missed FG also results in kickoff
      }
      setKickMode(false);
    } else {
      // Regular play - KON-40: Workshop-tauglich mit mehr Action
      if (selectedOffensePlay === 'Pass') {
        if (selectedDefensePlay === 'Blitz') {
          // High risk/reward: 50% Big Play (15-35y), 50% Sack (-5y)
          yardsGained = random > 0.5 ? Math.floor(Math.random() * 20) + 15 : -5;
          event = yardsGained > 0 ? 'BIG PLAY! Pass trotz Blitz!' : 'Sack!';
        } else if (selectedDefensePlay === 'Zone Coverage') {
          yardsGained = Math.floor(Math.random() * 10) + 5; // 5-15y
          event = 'Passgewinn gegen Zone';
        } else {
          yardsGained = Math.floor(Math.random() * 15) + 8; // 8-23y
          event = 'Pass komplett';
        }
      } else if (selectedOffensePlay === 'Lauf') {
        if (selectedDefensePlay === 'Run Stuff') {
          yardsGained = Math.floor(Math.random() * 4); // 0-4y (hard counter)
          event = 'Lauf gestoppt';
        } else if (selectedDefensePlay === 'Blitz') {
          yardsGained = Math.floor(Math.random() * 12) + 10; // 10-22y (big run!)
          event = 'GROSSER Laufgewinn!';
        } else {
          yardsGained = Math.floor(Math.random() * 8) + 4; // 4-12y
          event = 'Solider Lauf';
        }
      } else if (selectedOffensePlay === 'Screen Pass') {
        yardsGained = Math.floor(Math.random() * 12) + 8; // 8-20y
        event = 'Screen Pass gelingt!';
      } else if (selectedOffensePlay === 'Play Action') {
        yardsGained = Math.floor(Math.random() * 20) + 12; // 12-32y (high reward)
        event = 'Play Action täuscht komplett!';
      }

      // Check for Interception/Fumble (5% chance)
      // KON-41: No turnovers in first 2 plays to avoid frustration
      if (random < 0.05 && currentPlay >= 2) {
        const isFumble = Math.random() < 0.5;
        event = isFumble ? 'TURNOVER! (Fumble)' : 'TURNOVER! (Interception)';
        possessionChanged = true;
        turnoverType = isFumble ? 'fumble' : 'interception';
        yardsGained = 0;
      }

      // Apply Formation Bonus
      const playType = mapOffensePlayToPlayType(selectedOffensePlay);
      const formationBonus = calculateFormationBonus(playType, offenseFormation, defenseFormation);
      const netBonus = formationBonus.offenseBonus - formationBonus.defenseBonus;
      // Apply as percentage modifier to yards gained
      if (yardsGained > 0 && netBonus !== 0) {
        yardsGained = Math.round(yardsGained * (1 + netBonus / 100));
      }

      // Apply Weather Modifiers
      const weatherOutcome = applyWeatherModifiers(
        { result: 'gain', yards: yardsGained },
        playType,
        weather
      );
      yardsGained = weatherOutcome.yards;
    }

    const newYardLine = Math.max(0, Math.min(100, yardLine + yardsGained));

    // Generate play description
    const playContext: PlayContext = {
      offenseTeam: offenseTeam.name,
      defenseTeam: defenseTeam.name,
      playType: mapOffensePlayToPlayType(selectedOffensePlay),
      result: mapToEngineResult(event, yardsGained),
      yards: Math.abs(yardsGained),
      weather: weather,
      offenseFormation: offenseFormation,
      defenseFormation: defenseFormation,
    };
    const description = generateDescription(playContext);
    setLastPlayDescription(description);

    // Check for Touchdown
    if (newYardLine >= 100) {
      event = 'TOUCHDOWN! (+6 Punkte)';
      if (possession === 1) {
        setTeam1(prev => ({ ...prev, score: prev.score + 6 }));
      } else {
        setTeam2(prev => ({ ...prev, score: prev.score + 6 }));
      }
      possessionChanged = true;
      turnoverType = 'touchdown';
    }

    // Down System Logic
    let newDown = down;
    let newYardsToGo = yardsToGo;
    let newLineOfScrimmage = lineOfScrimmage;
    let newYardLineValue = newYardLine;

    if (!possessionChanged) {
      // Calculate yards gained from line of scrimmage
      const yardsGainedFromLOS = newYardLine - lineOfScrimmage;

      // Check for First Down
      if (yardsGainedFromLOS >= yardsToGo) {
        // FIRST DOWN!
        event += ' | FIRST DOWN!';
        newDown = 1;
        newLineOfScrimmage = newYardLine;

        // Calculate new yards to go (goal-to-go if less than 10 yards to endzone)
        const yardsToEndzone = 100 - newYardLine;
        newYardsToGo = Math.min(10, yardsToEndzone);
      } else {
        // No First Down - increment down
        if (down < 4) {
          newDown = (down + 1) as 1 | 2 | 3 | 4;
          newYardsToGo = yardsToGo - yardsGainedFromLOS;
        } else {
          // 4th Down without First Down - Turnover on Downs
          event += ' | TURNOVER ON DOWNS!';
          possessionChanged = true;
          turnoverType = 'turnover_on_downs';
        }
      }
    }

    // Handle Possession Changes
    if (possessionChanged) {
      setPossession(possession === 1 ? 2 : 1);

      // Determine new yard line based on turnover type
      let turnoverYardLine: number;
      if (turnoverType === 'touchdown' || turnoverType === 'field_goal') {
        // After scoring: Kickoff → Touchback at 25 yards
        turnoverYardLine = 25;
        event += ' | KICKOFF - Ball an 25 Yard Linie';
      } else {
        // Fumble, Interception, Turnover on Downs - mirror position
        // Field is 0-100 from attacker's perspective
        // Team A at 70y (30y to TD) → Fumble → Team B takes over at 100-70=30y (70y to TD)
        turnoverYardLine = 100 - newYardLine;
        event += ' | BALLBESITZWECHSEL';
      }

      setYardLine(turnoverYardLine);
      setDown(1);
      setYardsToGo(10);
      setLineOfScrimmage(turnoverYardLine);
    } else {
      setYardLine(newYardLineValue);
      setDown(newDown);
      setYardsToGo(newYardsToGo);
      setLineOfScrimmage(newLineOfScrimmage);
    }

    // Update history
    // Calculate final position for display
    let finalPosition: number;
    if (possessionChanged) {
      if (turnoverType === 'touchdown' || turnoverType === 'field_goal') {
        finalPosition = 25; // Kickoff touchback
      } else {
        finalPosition = 100 - newYardLine; // Mirrored position
      }
    } else {
      finalPosition = newYardLine;
    }

    const playResult: PlayResult = {
      play: currentPlay + 1,
      offensePlay: selectedOffensePlay,
      defensePlay: selectedDefensePlay,
      yards: yardsGained,
      newPosition: finalPosition,
      event,
      possession: offenseTeam.name,
      offenseFormation,
      defenseFormation,
      description
    };
    setHistory([...history, playResult]);

    // Update play count
    const nextPlay = currentPlay + 1;
    setCurrentPlay(nextPlay);

    // 0.4: Check if game should end
    if (isLastPlay || nextPlay >= maxPlays) {
      setGamePhase('gameOver');
    }

    // Reset selections
    setSelectedOffensePlay(null);
    setSelectedDefensePlay(null);
  };

  const resetGame = () => {
    setGamePhase('setup');
    setCoinTossWinner(null);
    setWeather('clear');
    setCurrentPlay(0);
    setPossession(1);
    setYardLine(35);
    setDown(1);
    setYardsToGo(10);
    setLineOfScrimmage(35);
    setHistory([]);
    setIsLastPlay(false);
    setKickMode(false);
    setOffenseFormation('shotgun');
    setDefenseFormation('4-3');
    setLastPlayDescription(null);
    setTeam1({ ...team1, score: 0 });
    setTeam2({ ...team2, score: 0 });
  };

  const endGameEarly = () => {
    setGamePhase('gameOver');
  };

  // KON-43 + KON-48: Formation positions for visual display
  // Rotated 90 degrees: x = depth (negative = behind LOS), y = spread (vertical on field)
  // Offense is LEFT of ball, Defense is RIGHT of ball
  const getOffenseFormationPositions = (formation: OffenseFormation): Array<{x: number, y: number, label: string}> => {
    const formations: Record<OffenseFormation, Array<{x: number, y: number, label: string}>> = {
      'shotgun': [
        {x: 0, y: 0, label: 'C'},           // Center at LOS
        {x: 0, y: -12, label: 'OL'},        // Left Guard
        {x: 0, y: 12, label: 'OL'},         // Right Guard
        {x: -8, y: -35, label: 'WR'},       // Left WR (wide)
        {x: -8, y: 35, label: 'WR'},        // Right WR (wide)
        {x: -25, y: 0, label: 'QB'},        // QB in shotgun (behind center)
        {x: -25, y: 12, label: 'RB'},       // RB next to QB
      ],
      'i_formation': [
        {x: 0, y: 0, label: 'C'},
        {x: 0, y: -12, label: 'OL'},
        {x: 0, y: 12, label: 'OL'},
        {x: -8, y: -35, label: 'WR'},
        {x: -8, y: 35, label: 'WR'},
        {x: -8, y: 0, label: 'QB'},         // QB under center
        {x: -20, y: 0, label: 'FB'},        // Fullback behind QB
        {x: -32, y: 0, label: 'RB'},        // RB behind FB (I-Formation)
      ],
      'spread': [
        {x: 0, y: 0, label: 'C'},
        {x: 0, y: -12, label: 'OL'},
        {x: 0, y: 12, label: 'OL'},
        {x: -8, y: -45, label: 'WR'},       // Wide left
        {x: -8, y: -25, label: 'WR'},       // Slot left
        {x: -8, y: 25, label: 'WR'},        // Slot right
        {x: -8, y: 45, label: 'WR'},        // Wide right
        {x: -25, y: 0, label: 'QB'},
      ],
      'pistol': [
        {x: 0, y: 0, label: 'C'},
        {x: 0, y: -12, label: 'OL'},
        {x: 0, y: 12, label: 'OL'},
        {x: -8, y: -35, label: 'WR'},
        {x: -8, y: 35, label: 'WR'},
        {x: -18, y: 0, label: 'QB'},        // QB closer than shotgun
        {x: -30, y: 0, label: 'RB'},        // RB directly behind QB
      ],
      'wildcat': [
        {x: 0, y: 0, label: 'C'},
        {x: 0, y: -12, label: 'OL'},
        {x: 0, y: 12, label: 'OL'},
        {x: -8, y: -35, label: 'WR'},
        {x: -8, y: 35, label: 'WR'},
        {x: -8, y: 0, label: 'RB'},         // RB takes direct snap
        {x: -8, y: 18, label: 'WR'},        // Motion player
      ],
    };
    return formations[formation];
  };

  const getDefenseFormationPositions = (formation: DefenseFormation): Array<{x: number, y: number, label: string}> => {
    // Defense is RIGHT of ball (positive x = further from LOS toward own endzone)
    const formations: Record<DefenseFormation, Array<{x: number, y: number, label: string}>> = {
      '4-3': [
        {x: 8, y: -18, label: 'DE'},        // Defensive End
        {x: 8, y: -6, label: 'DT'},         // Defensive Tackle
        {x: 8, y: 6, label: 'DT'},
        {x: 8, y: 18, label: 'DE'},
        {x: 20, y: -12, label: 'LB'},       // Linebackers
        {x: 20, y: 0, label: 'LB'},
        {x: 20, y: 12, label: 'LB'},
        {x: 35, y: -30, label: 'CB'},       // Cornerbacks
        {x: 35, y: 30, label: 'CB'},
        {x: 45, y: 0, label: 'S'},          // Safety
      ],
      '3-4': [
        {x: 8, y: -12, label: 'DE'},
        {x: 8, y: 0, label: 'NT'},          // Nose Tackle
        {x: 8, y: 12, label: 'DE'},
        {x: 20, y: -18, label: 'LB'},       // 4 Linebackers
        {x: 20, y: -6, label: 'LB'},
        {x: 20, y: 6, label: 'LB'},
        {x: 20, y: 18, label: 'LB'},
        {x: 35, y: -30, label: 'CB'},
        {x: 35, y: 30, label: 'CB'},
        {x: 45, y: 0, label: 'S'},
      ],
      'nickel': [
        {x: 8, y: -12, label: 'DE'},
        {x: 8, y: 0, label: 'DT'},
        {x: 8, y: 12, label: 'DE'},
        {x: 20, y: -8, label: 'LB'},
        {x: 20, y: 8, label: 'LB'},
        {x: 35, y: -35, label: 'CB'},
        {x: 35, y: -15, label: 'NB'},       // Nickel back
        {x: 35, y: 15, label: 'CB'},
        {x: 35, y: 35, label: 'CB'},
        {x: 50, y: 0, label: 'S'},
      ],
      'dime': [
        {x: 8, y: -12, label: 'DE'},
        {x: 8, y: 12, label: 'DE'},
        {x: 20, y: 0, label: 'LB'},
        {x: 35, y: -35, label: 'CB'},
        {x: 35, y: -15, label: 'DB'},
        {x: 35, y: 0, label: 'DB'},
        {x: 35, y: 15, label: 'DB'},
        {x: 35, y: 35, label: 'CB'},
        {x: 50, y: -10, label: 'S'},
        {x: 50, y: 10, label: 'S'},
      ],
      'prevent': [
        {x: 8, y: -12, label: 'DE'},
        {x: 8, y: 12, label: 'DE'},
        {x: 40, y: -35, label: 'CB'},
        {x: 40, y: -15, label: 'DB'},
        {x: 40, y: 0, label: 'DB'},
        {x: 40, y: 15, label: 'DB'},
        {x: 40, y: 35, label: 'CB'},
        {x: 55, y: -12, label: 'S'},
        {x: 55, y: 0, label: 'S'},
        {x: 55, y: 12, label: 'S'},
      ],
    };
    return formations[formation];
  };

  // 0.3: SVG Field Visualization with KON-43 Formation Display
  const renderField = () => {
    const fieldWidth = 800;
    const fieldHeight = 200;
    const endzoneWidth = 60;
    const playingFieldWidth = fieldWidth - 2 * endzoneWidth;

    // Ball position (0-100 yards maps to playing field)
    const ballX = endzoneWidth + (yardLine / 100) * playingFieldWidth;
    const centerY = fieldHeight / 2;

    // Get formation positions
    const offensePositions = getOffenseFormationPositions(offenseFormation);
    const defensePositions = getDefenseFormationPositions(defenseFormation);

    return (
      <svg width={fieldWidth} height={fieldHeight} className="border border-gray-300 mx-auto">
        {/* Endzone 1 */}
        <rect x="0" y="0" width={endzoneWidth} height={fieldHeight} fill="#8B4513" />
        <text x={endzoneWidth / 2} y={fieldHeight / 2} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          END
        </text>

        {/* Playing Field */}
        <rect x={endzoneWidth} y="0" width={playingFieldWidth} height={fieldHeight} fill="#2d7a2d" />

        {/* Yard Lines (10-50 mirrored) */}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((yard) => {
          const x = endzoneWidth + (yard / 100) * playingFieldWidth;
          const label = yard <= 50 ? yard : 100 - yard;
          return (
            <g key={yard}>
              <line x1={x} y1="0" x2={x} y2={fieldHeight} stroke="white" strokeWidth="2" />
              <text x={x} y={fieldHeight / 2 + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                {label}
              </text>
            </g>
          );
        })}

        {/* 50 Yard Line (special) */}
        <line
          x1={endzoneWidth + playingFieldWidth / 2}
          y1="0"
          x2={endzoneWidth + playingFieldWidth / 2}
          y2={fieldHeight}
          stroke="yellow"
          strokeWidth="3"
        />

        {/* Endzone 2 */}
        <rect x={fieldWidth - endzoneWidth} y="0" width={endzoneWidth} height={fieldHeight} fill="#8B4513" />
        <text x={fieldWidth - endzoneWidth / 2} y={fieldHeight / 2} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          END
        </text>

        {/* KON-43 + KON-48: Offense Formation (Blue circles) - LEFT of ball */}
        {offensePositions.map((pos, idx) => {
          // x = depth (negative = behind LOS, toward own endzone)
          // y = spread (vertical position on field)
          const playerX = Math.max(endzoneWidth + 10, Math.min(fieldWidth - endzoneWidth - 10, ballX + pos.x * 1.2));
          const playerY = Math.max(12, Math.min(fieldHeight - 12, centerY + pos.y * 1.8));
          return (
            <g key={`off-${idx}`}>
              <circle cx={playerX} cy={playerY} r="7" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
              <text x={playerX} y={playerY + 3} textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
                {pos.label}
              </text>
            </g>
          );
        })}

        {/* KON-43 + KON-48: Defense Formation (Red circles) - RIGHT of ball */}
        {defensePositions.map((pos, idx) => {
          const playerX = Math.max(endzoneWidth + 10, Math.min(fieldWidth - endzoneWidth - 10, ballX + pos.x * 1.2));
          const playerY = Math.max(12, Math.min(fieldHeight - 12, centerY + pos.y * 1.8));
          return (
            <g key={`def-${idx}`}>
              <circle cx={playerX} cy={playerY} r="7" fill="#ef4444" stroke="white" strokeWidth="1.5" />
              <text x={playerX} y={playerY + 3} textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
                {pos.label}
              </text>
            </g>
          );
        })}

        {/* Ball Position (on top) */}
        <circle cx={ballX} cy={centerY} r="10" fill="orange" stroke="black" strokeWidth="2" />
        <text x={ballX} y={centerY + 4} textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">
          🏈
        </text>
      </svg>
    );
  };

  // Render Phases
  if (gamePhase === 'setup') {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-blue-900">
            ⚡ Agiles Football Spiel ⚡
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Spieleinstellungen</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Maximale Anzahl Spielzüge:</label>
              <input
                type="number"
                value={maxPlays}
                onChange={(e) => setMaxPlays(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded"
                min="1"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Wer hat den Coin Toss gewonnen?</label>
              <select
                value={coinTossWinner ?? ''}
                onChange={(e) => setCoinTossWinner(e.target.value ? Number(e.target.value) as 1 | 2 : null)}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="">-- Bitte wählen --</option>
                <option value="1">{team1.name}</option>
                <option value="2">{team2.name}</option>
              </select>
              <p className="text-sm text-gray-600 mt-2">
                Münzwurf physisch durchführen, Ergebnis hier eintragen
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Wetter:</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as Weather)}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="clear">☀️ Klar</option>
                <option value="rain">🌧️ Regen</option>
                <option value="snow">❄️ Schnee</option>
                <option value="wind">💨 Wind</option>
                <option value="fog">🌫️ Nebel</option>
                <option value="hot">🔥 Hitze</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 Setup */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Team 1</h2>
              <input
                type="text"
                value={team1.name}
                onChange={(e) => handleTeamNameChange(1, e.target.value)}
                className="w-full px-4 py-2 border rounded mb-4 font-bold"
                placeholder="Team Name"
              />

              <h3 className="text-lg font-bold mb-2">Offense (10 Rollen)</h3>
              {Object.keys(team1.offense).map((role) => (
                <input
                  key={role}
                  type="text"
                  value={team1.offense[role as keyof Team['offense']]}
                  onChange={(e) => handleOffenseRoleChange(1, role as keyof Team['offense'], e.target.value)}
                  className="w-full px-3 py-1 border rounded mb-2"
                  placeholder={role}
                />
              ))}

              <h3 className="text-lg font-bold mb-2 mt-4">Defense (6 Rollen)</h3>
              {Object.keys(team1.defense).map((role) => (
                <input
                  key={role}
                  type="text"
                  value={team1.defense[role as keyof Team['defense']]}
                  onChange={(e) => handleDefenseRoleChange(1, role as keyof Team['defense'], e.target.value)}
                  className="w-full px-3 py-1 border rounded mb-2"
                  placeholder={role}
                />
              ))}
            </div>

            {/* Team 2 Setup */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Team 2</h2>
              <input
                type="text"
                value={team2.name}
                onChange={(e) => handleTeamNameChange(2, e.target.value)}
                className="w-full px-4 py-2 border rounded mb-4 font-bold"
                placeholder="Team Name"
              />

              <h3 className="text-lg font-bold mb-2">Offense (10 Rollen)</h3>
              {Object.keys(team2.offense).map((role) => (
                <input
                  key={role}
                  type="text"
                  value={team2.offense[role as keyof Team['offense']]}
                  onChange={(e) => handleOffenseRoleChange(2, role as keyof Team['offense'], e.target.value)}
                  className="w-full px-3 py-1 border rounded mb-2"
                  placeholder={role}
                />
              ))}

              <h3 className="text-lg font-bold mb-2 mt-4">Defense (6 Rollen)</h3>
              {Object.keys(team2.defense).map((role) => (
                <input
                  key={role}
                  type="text"
                  value={team2.defense[role as keyof Team['defense']]}
                  onChange={(e) => handleDefenseRoleChange(2, role as keyof Team['defense'], e.target.value)}
                  className="w-full px-3 py-1 border rounded mb-2"
                  placeholder={role}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={startGame}
              disabled={coinTossWinner === null}
              className={`px-8 py-4 rounded-lg font-bold text-xl ${
                coinTossWinner !== null
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Spiel starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing Phase
  if (gamePhase === 'playing') {
    const offenseTeam = possession === 1 ? team1 : team2;
    const defenseTeam = possession === 1 ? team2 : team1;
    const canKick = yardLine <= 30; // Field goal range

    // Weather emoji mapping
    const weatherEmojis: Record<Weather, string> = {
      clear: '☀️',
      rain: '🌧️',
      snow: '❄️',
      wind: '💨',
      fog: '🌫️',
      hot: '🔥'
    };

    const weatherLabels: Record<Weather, string> = {
      clear: 'Klar',
      rain: 'Regen',
      snow: 'Schnee',
      wind: 'Wind',
      fog: 'Nebel',
      hot: 'Hitze'
    };

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-blue-900">
                  ⚡ Spielzug {currentPlay + 1}/{maxPlays}
                </h1>
                <p className="text-lg text-gray-700 mt-1">
                  Wetter: {weatherEmojis[weather]} {weatherLabels[weather]}
                </p>
              </div>
              <div className="flex gap-4 items-center">
                {/* 0.4: Last Play Checkbox */}
                <label className="flex items-center gap-2 text-lg font-medium">
                  <input
                    type="checkbox"
                    checked={isLastPlay}
                    onChange={(e) => setIsLastPlay(e.target.checked)}
                    className="w-5 h-5"
                  />
                  Nächster Spielzug ist der letzte
                </label>
                <button
                  onClick={endGameEarly}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Vorzeitiges Ende
                </button>
              </div>
            </div>

            {/* Score */}
            <div className="flex justify-around text-2xl font-bold">
              <div className={`text-center ${possession === 1 ? 'text-green-600' : ''}`}>
                <div className="text-lg">{team1.name}</div>
                <div className="text-4xl">{team1.score}</div>
              </div>
              <div className="text-3xl self-center">:</div>
              <div className={`text-center ${possession === 2 ? 'text-green-600' : ''}`}>
                <div className="text-lg">{team2.name}</div>
                <div className="text-4xl">{team2.score}</div>
              </div>
            </div>

            {/* Field Position & Down Info */}
            <div className="text-center mt-4">
              <p className="text-xl">
                <strong>Ballbesitz:</strong> {offenseTeam.name} (Offense) | {yardLine} Yards
              </p>
              <p className="text-lg font-bold text-blue-600">
                {down}. Down & {yardsToGo} {yardsToGo === 1 ? 'Yard' : 'Yards'} to Go
              </p>
            </div>
          </div>

          {/* 0.3: SVG Field */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-center">Spielfeld</h2>
            {renderField()}
          </div>

          {/* Play Description */}
          {lastPlayDescription && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow mb-6">
              <h3 className="text-xl font-bold mb-2">{lastPlayDescription.headline}</h3>
              <p className="text-gray-700 mb-2">{lastPlayDescription.narrative}</p>
              {lastPlayDescription.weatherNote && (
                <p className="text-sm text-blue-600">{lastPlayDescription.weatherNote}</p>
              )}
            </div>
          )}

          {/* Play Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Offense Plays */}
            <div className="bg-blue-50 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">
                {offenseTeam.name} (Offense)
              </h2>
              {kickMode ? (
                <div className="text-center">
                  <p className="text-lg mb-4">Field Goal Versuch</p>
                  <button
                    onClick={() => setKickMode(false)}
                    className="px-4 py-2 bg-gray-400 text-white rounded"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {offensePlays.map((play) => (
                      <button
                        key={play}
                        onClick={() => setSelectedOffensePlay(play)}
                        className={`w-full px-4 py-3 rounded font-bold ${
                          selectedOffensePlay === play
                            ? 'bg-blue-600 text-white'
                            : 'bg-white hover:bg-blue-100'
                        }`}
                      >
                        {play}
                      </button>
                    ))}
                  </div>
                  {/* KON-42: Strategy Preview */}
                  {selectedOffensePlay && (
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-blue-800">
                        {getStrategyPreview(selectedOffensePlay, selectedDefensePlay)}
                      </p>
                    </div>
                  )}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Formation:</label>
                    <select
                      value={offenseFormation}
                      onChange={(e) => setOffenseFormation(e.target.value as OffenseFormation)}
                      className="w-full px-4 py-2 border rounded bg-blue-50"
                    >
                      <option value="shotgun">{getFormationDescription('shotgun')}</option>
                      <option value="i_formation">{getFormationDescription('i_formation')}</option>
                      <option value="spread">{getFormationDescription('spread')}</option>
                      <option value="pistol">{getFormationDescription('pistol')}</option>
                      <option value="wildcat">{getFormationDescription('wildcat')}</option>
                    </select>
                  </div>
                  {canKick && (
                    <button
                      onClick={() => {
                        setKickMode(true);
                        setSelectedOffensePlay('Pass'); // Dummy value for execution
                      }}
                      className="w-full mt-4 px-4 py-3 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600"
                    >
                      Field Goal Versuch
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Defense Plays */}
            <div className="bg-red-50 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">
                {defenseTeam.name} (Defense)
              </h2>
              <div className="space-y-2">
                {defensePlays.map((play) => (
                  <button
                    key={play}
                    onClick={() => setSelectedDefensePlay(play)}
                    className={`w-full px-4 py-3 rounded font-bold ${
                      selectedDefensePlay === play
                        ? 'bg-red-600 text-white'
                        : 'bg-white hover:bg-red-100'
                    }`}
                  >
                    {play}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Formation:</label>
                <select
                  value={defenseFormation}
                  onChange={(e) => setDefenseFormation(e.target.value as DefenseFormation)}
                  className="w-full px-4 py-2 border rounded bg-red-50"
                >
                  <option value="4-3">{getFormationDescription('4-3')}</option>
                  <option value="3-4">{getFormationDescription('3-4')}</option>
                  <option value="nickel">{getFormationDescription('nickel')}</option>
                  <option value="dime">{getFormationDescription('dime')}</option>
                  <option value="prevent">{getFormationDescription('prevent')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Execute Button */}
          <div className="text-center mb-6">
            <button
              onClick={executePlay}
              disabled={!selectedOffensePlay || !selectedDefensePlay}
              className={`px-12 py-4 rounded-lg font-bold text-xl ${
                selectedOffensePlay && selectedDefensePlay
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Spielzug ausführen
            </button>
          </div>

          {/* History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Spielverlauf</h2>
            <div className="overflow-y-auto max-h-64">
              {history.map((play, index) => (
                <div key={index} className="border-b py-2">
                  <p className="text-sm">
                    <strong>Spielzug {play.play}:</strong> {play.possession} |
                    O: {play.offensePlay} vs D: {play.defensePlay} |
                    {play.yards > 0 ? '+' : ''}{play.yards} Yards → {play.newPosition}y |
                    <span className="text-blue-600">{play.event}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Phase
  if (gamePhase === 'gameOver') {
    const winner = team1.score > team2.score ? team1 : team2.score > team1.score ? team2 : null;

    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-4xl font-bold mb-4">Spiel beendet!</h1>

            <div className="flex justify-center gap-8 text-3xl font-bold mb-6">
              <div className="text-center">
                <div className="text-xl">{team1.name}</div>
                <div className="text-5xl">{team1.score}</div>
              </div>
              <div className="text-4xl self-center">:</div>
              <div className="text-center">
                <div className="text-xl">{team2.name}</div>
                <div className="text-5xl">{team2.score}</div>
              </div>
            </div>

            {winner ? (
              <p className="text-2xl text-green-600 font-bold mb-6">
                🏆 {winner.name} gewinnt! 🏆
              </p>
            ) : (
              <p className="text-2xl text-blue-600 font-bold mb-6">
                Unentschieden!
              </p>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Spielstatistik</h3>
              <p>Gespielte Züge: {currentPlay}</p>
              <p>Geplante Züge: {maxPlays}</p>
            </div>

            <button
              onClick={resetGame}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-xl hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-6 h-6" />
              Neues Spiel
            </button>
          </div>

          {/* Final History */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Kompletter Spielverlauf</h3>
            <div className="overflow-y-auto max-h-96 border rounded p-4">
              {history.map((play, index) => (
                <div key={index} className="border-b py-2">
                  <p className="text-sm">
                    <strong>Spielzug {play.play}:</strong> {play.possession} |
                    O: {play.offensePlay} vs D: {play.defensePlay} |
                    {play.yards > 0 ? '+' : ''}{play.yards} Yards → {play.newPosition}y |
                    <span className="text-blue-600">{play.event}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FootballGameSimulator;
