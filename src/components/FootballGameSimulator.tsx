import React, { useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';

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
}

type GamePhase = 'setup' | 'coinToss' | 'playing' | 'gameOver';
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
  const [currentPlay, setCurrentPlay] = useState<number>(0);
  const [possession, setPossession] = useState<1 | 2>(1);
  const [yardLine, setYardLine] = useState<number>(35); // 0.1: Start at 35 yards
  const [playsWithoutChange, setPlaysWithoutChange] = useState<number>(0);
  const [history, setHistory] = useState<PlayResult[]>([]);
  const [isLastPlay, setIsLastPlay] = useState<boolean>(false); // 0.4: Last play checkbox

  const [selectedOffensePlay, setSelectedOffensePlay] = useState<OffensePlay | null>(null);
  const [selectedDefensePlay, setSelectedDefensePlay] = useState<DefensePlay | null>(null);
  const [kickMode, setKickMode] = useState<boolean>(false);

  const offensePlays: OffensePlay[] = ['Pass', 'Lauf', 'Screen Pass', 'Play Action'];
  const defensePlays: DefensePlay[] = ['Blitz', 'Zone Coverage', 'Man Coverage', 'Run Stuff', 'Prevent Defense'];

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

  const startCoinToss = () => {
    setGamePhase('coinToss');
  };

  // 0.2: Coin Toss Handler
  const handleCoinTossSelection = (startingTeam: 1 | 2) => {
    setPossession(startingTeam);
    setGamePhase('playing');
  };

  // Game Logic
  const executePlay = () => {
    if (!selectedOffensePlay || !selectedDefensePlay) return;

    const offenseTeam = possession === 1 ? team1 : team2;

    let yardsGained = 0;
    let event = '';
    let possessionChanged = false;

    // Simplified play resolution
    const random = Math.random();

    if (kickMode) {
      // Field Goal attempt
      const success = random > 0.3; // 70% success rate
      if (success) {
        event = `Field Goal ERFOLG! (+3 Punkte)`;
        if (possession === 1) {
          setTeam1({ ...team1, score: team1.score + 3 });
        } else {
          setTeam2({ ...team2, score: team2.score + 3 });
        }
        possessionChanged = true;
      } else {
        event = `Field Goal VERFEHLT!`;
        possessionChanged = true;
      }
      setKickMode(false);
    } else {
      // Regular play
      if (selectedOffensePlay === 'Pass') {
        if (selectedDefensePlay === 'Blitz') {
          yardsGained = random > 0.6 ? Math.floor(Math.random() * 15) + 10 : -3;
          event = yardsGained > 0 ? 'Erfolgreicher Pass trotz Blitz!' : 'Sack!';
        } else if (selectedDefensePlay === 'Zone Coverage') {
          yardsGained = Math.floor(Math.random() * 8) + 2;
          event = 'Kurzer Passgewinn';
        } else {
          yardsGained = Math.floor(Math.random() * 12) + 3;
          event = 'Pass komplett';
        }
      } else if (selectedOffensePlay === 'Lauf') {
        if (selectedDefensePlay === 'Run Stuff') {
          yardsGained = Math.floor(Math.random() * 3);
          event = 'Lauf gestoppt';
        } else if (selectedDefensePlay === 'Blitz') {
          yardsGained = Math.floor(Math.random() * 10) + 5;
          event = 'Guter Laufgewinn!';
        } else {
          yardsGained = Math.floor(Math.random() * 6) + 2;
          event = 'Standardlauf';
        }
      } else if (selectedOffensePlay === 'Screen Pass') {
        yardsGained = Math.floor(Math.random() * 10) + 3;
        event = 'Screen Pass gelingt';
      } else if (selectedOffensePlay === 'Play Action') {
        yardsGained = Math.floor(Math.random() * 15) + 5;
        event = 'Play Action täuscht Defense';
      }

      // Check for Interception/Fumble (5% chance)
      if (random < 0.05) {
        event = 'TURNOVER! (Interception/Fumble)';
        possessionChanged = true;
        yardsGained = 0;
      }
    }

    const newYardLine = Math.max(0, Math.min(100, yardLine + yardsGained));

    // Check for Touchdown
    if (newYardLine >= 100) {
      event = 'TOUCHDOWN! (+6 Punkte)';
      if (possession === 1) {
        setTeam1({ ...team1, score: team1.score + 6 });
      } else {
        setTeam2({ ...team2, score: team2.score + 6 });
      }
      possessionChanged = true;
    }

    // 0.5: Possession change logic
    const newPlaysWithoutChange = possessionChanged ? 0 : playsWithoutChange + 1;

    // Change possession after 4 plays minimum or if forced
    if (newPlaysWithoutChange >= 4 || possessionChanged) {
      setPossession(possession === 1 ? 2 : 1);
      setYardLine(35); // 0.1: Reset to 35 yards
      setPlaysWithoutChange(0);
      event += ' | BALLBESITZWECHSEL';
    } else {
      setYardLine(newYardLine);
      setPlaysWithoutChange(newPlaysWithoutChange);
    }

    // Update history
    const playResult: PlayResult = {
      play: currentPlay + 1,
      offensePlay: selectedOffensePlay,
      defensePlay: selectedDefensePlay,
      yards: yardsGained,
      newPosition: possessionChanged ? 35 : newYardLine,
      event,
      possession: offenseTeam.name
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
    setCurrentPlay(0);
    setPossession(1);
    setYardLine(35);
    setPlaysWithoutChange(0);
    setHistory([]);
    setIsLastPlay(false);
    setKickMode(false);
    setTeam1({ ...team1, score: 0 });
    setTeam2({ ...team2, score: 0 });
  };

  const endGameEarly = () => {
    setGamePhase('gameOver');
  };

  // 0.3: SVG Field Visualization
  const renderField = () => {
    const fieldWidth = 800;
    const fieldHeight = 200;
    const endzoneWidth = 60;
    const playingFieldWidth = fieldWidth - 2 * endzoneWidth;

    // Ball position (0-100 yards maps to playing field)
    const ballX = endzoneWidth + (yardLine / 100) * playingFieldWidth;

    return (
      <svg width={fieldWidth} height={fieldHeight} className="border border-gray-300 mx-auto">
        {/* Endzone 1 */}
        <rect x="0" y="0" width={endzoneWidth} height={fieldHeight} fill="#8B4513" />
        <text x={endzoneWidth / 2} y={fieldHeight / 2} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          END
        </text>

        {/* Playing Field */}
        <rect x={endzoneWidth} y="0" width={playingFieldWidth} height={fieldHeight} fill="#2d7a2d" />

        {/* Yard Lines */}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((yard) => {
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

        {/* Ball Position */}
        <circle cx={ballX} cy={fieldHeight / 2} r="10" fill="orange" stroke="black" strokeWidth="2" />
        <text x={ballX} y={fieldHeight / 2 + 4} textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">
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
              onClick={startCoinToss}
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-700"
            >
              Weiter zum Coin Toss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 0.2: Coin Toss Phase
  if (gamePhase === 'coinToss') {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-blue-900">
            🪙 Coin Toss
          </h1>
          <p className="text-xl text-center mb-8">
            Welches Team startet mit Ballbesitz (Offense)?
          </p>

          <div className="flex gap-6 justify-center">
            <button
              onClick={() => handleCoinTossSelection(1)}
              className="px-8 py-6 bg-blue-600 text-white rounded-lg font-bold text-2xl hover:bg-blue-700"
            >
              {team1.name}
            </button>
            <button
              onClick={() => handleCoinTossSelection(2)}
              className="px-8 py-6 bg-red-600 text-white rounded-lg font-bold text-2xl hover:bg-red-700"
            >
              {team2.name}
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

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-blue-900">
                ⚡ Spielzug {currentPlay + 1}/{maxPlays}
              </h1>
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
              <div className={possession === 1 ? 'text-green-600' : ''}>
                {team1.name}: {team1.score}
              </div>
              <div className={possession === 2 ? 'text-green-600' : ''}>
                {team2.name}: {team2.score}
              </div>
            </div>

            {/* Field Position */}
            <div className="text-center mt-4">
              <p className="text-xl">
                <strong>Ballbesitz:</strong> {offenseTeam.name} (Offense) | {yardLine} Yards
              </p>
              <p className="text-sm text-gray-600">
                Spielzüge seit letztem Wechsel: {playsWithoutChange}
              </p>
            </div>
          </div>

          {/* 0.3: SVG Field */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-center">Spielfeld</h2>
            {renderField()}
          </div>

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

            <div className="text-3xl font-bold mb-6">
              <p>{team1.name}: {team1.score}</p>
              <p>{team2.name}: {team2.score}</p>
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
