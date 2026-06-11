import { Eye, EyeOff, RotateCcw, Shield, Skull, Sparkles, Trophy, Users, Vote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MOB_LOGO_SRC } from './logoData.js';
import { GAME_MODES, SESSION_PRESETS, DEFAULT_SETTINGS } from './modeData.js';
import { CATEGORY_NAMES, WORD_BANK } from './wordBank.js';

const DEFAULT_PLAYERS = ['Mateusz', 'Dawid', 'Daniel', 'Fabian', 'Patryk'];
const MIN_PLAYERS = 3;
const SCORE_KEY = 'asap-mob-impostor-scoreboard-v1';

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function normalisePlayerName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function makeRound({ players, category, impostorCount, modeId, settings }) {
  const chosenCategory = category === 'Random' ? pickRandom(CATEGORY_NAMES) : category;
  const word = pickRandom(WORD_BANK[chosenCategory]);
  const passOrder = settings.randomisePassOrder ? shuffle(players) : players;
  const impostorNames = new Set(shuffle(players).slice(0, impostorCount));

  return {
    modeId,
    settings,
    passOrder,
    category: chosenCategory,
    word,
    impostors: impostorNames,
    revealIndex: 0,
    revealedPlayers: [],
    clueRound: 1,
    votes: {},
    impostorGuess: '',
    outcome: null,
  };
}

function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveScores(scores) {
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}

function App() {
  const [screen, setScreen] = useState('home');
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [newPlayer, setNewPlayer] = useState('');
  const [category, setCategory] = useState('A$AP MOB');
  const [modeId, setModeId] = useState('classic');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [impostorCount, setImpostorCount] = useState(GAME_MODES.classic.defaultImpostors);
  const [round, setRound] = useState(null);
  const [roleVisible, setRoleVisible] = useState(false);
  const [votingPlayerIndex, setVotingPlayerIndex] = useState(0);
  const [guessValue, setGuessValue] = useState('');
  const [scores, setScores] = useState(() => loadScores());

  const mode = GAME_MODES[modeId];
  const canStart = players.length >= Math.max(MIN_PLAYERS, mode.minPlayers) && impostorCount >= 1 && impostorCount < players.length;
  const currentRevealPlayer = round ? round.passOrder[round.revealIndex] : null;
  const currentVotingPlayer = round ? round.passOrder[votingPlayerIndex] : null;

  useEffect(() => {
    saveScores(scores);
  }, [scores]);

  const voteResult = useMemo(() => {
    if (!round) return null;
    const counts = players.reduce((acc, player) => ({ ...acc, [player]: 0 }), {});
    Object.values(round.votes).forEach((vote) => {
      counts[vote] = (counts[vote] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const highest = sorted[0]?.[1] ?? 0;
    const top = sorted.filter(([, count]) => count === highest).map(([name]) => name);
    const caught = top.some((name) => round.impostors.has(name));
    return { counts, sorted, top, highest, caught };
  }, [players, round]);

  function patchSettings(patch) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function changeMode(nextModeId) {
    const nextMode = GAME_MODES[nextModeId];
    setModeId(nextModeId);
    setImpostorCount((current) => Math.min(Math.max(current, nextMode.defaultImpostors), Math.min(nextMode.maxImpostors, players.length - 1)));
  }

  function applyPreset(presetKey) {
    patchSettings(SESSION_PRESETS[presetKey].settings);
  }

  function addPlayer() {
    const name = normalisePlayerName(newPlayer);
    if (!name || players.includes(name)) return;
    setPlayers((current) => [...current, name]);
    setScores((current) => ({ ...current, [name]: current[name] || 0 }));
    setNewPlayer('');
  }

  function removePlayer(name) {
    const nextPlayers = players.filter((player) => player !== name);
    setPlayers(nextPlayers);
    setImpostorCount((current) => Math.min(current, Math.max(1, nextPlayers.length - 1)));
  }

  function movePlayer(fromIndex, direction) {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= players.length) return;
    setPlayers((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function startRound() {
    if (!canStart) return;
    setRound(makeRound({ players, category, impostorCount, modeId, settings }));
    setRoleVisible(false);
    setVotingPlayerIndex(0);
    setGuessValue('');
    setScreen('reveal');
  }

  function finishCurrentReveal() {
    if (!round) return;
    const nextIndex = round.revealIndex + 1;
    setRoleVisible(false);
    if (nextIndex >= round.passOrder.length) {
      setRound({ ...round, revealedPlayers: [...round.revealedPlayers, currentRevealPlayer], revealIndex: nextIndex });
      setScreen('clues');
      return;
    }
    setRound({ ...round, revealedPlayers: [...round.revealedPlayers, currentRevealPlayer], revealIndex: nextIndex });
  }

  function nextClueRound() {
    if (!round) return;
    if (round.clueRound >= round.settings.guessRounds) {
      setScreen('vote');
      return;
    }
    setRound({ ...round, clueRound: round.clueRound + 1 });
  }

  function submitVote(target) {
    if (!round) return;
    const nextVotes = { ...round.votes, [currentVotingPlayer]: target };
    const nextIndex = votingPlayerIndex + 1;
    setRound({ ...round, votes: nextVotes });
    if (nextIndex >= round.passOrder.length) {
      const counts = Object.values(nextVotes).reduce((acc, vote) => {
        acc[vote] = (acc[vote] || 0) + 1;
        return acc;
      }, {});
      const highest = Math.max(...Object.values(counts));
      const votedOut = Object.entries(counts).filter(([, count]) => count === highest).map(([name]) => name);
      const impostorCaught = votedOut.some((name) => round.impostors.has(name));
      const canGuess = impostorCaught && round.settings.allowImpostorFinalGuess;
      setScreen(canGuess ? 'guess' : 'result');
      if (!canGuess) applyScores(impostorCaught ? 'mob' : 'impostors');
      return;
    }
    setVotingPlayerIndex(nextIndex);
  }

  function applyScores(winner) {
    if (!round) return;
    setScores((current) => {
      const next = { ...current };
      players.forEach((player) => { next[player] = next[player] || 0; });
      players.forEach((player) => {
        const isImpostor = round.impostors.has(player);
        if (winner === 'mob' && !isImpostor) next[player] += Number(round.settings.pointsMobWin);
        if (winner === 'impostors' && isImpostor) next[player] += Number(round.settings.pointsImpostorWin);
      });
      return next;
    });
  }

  function submitImpostorGuess() {
    if (!round) return;
    const guess = normalisePlayerName(guessValue).toLowerCase();
    const actual = round.word.toLowerCase();
    const impostorWins = guess === actual || (guess.length > 2 && actual.includes(guess));
    setRound({ ...round, impostorGuess: guessValue, outcome: impostorWins ? 'impostors' : 'mob' });
    applyScores(impostorWins ? 'impostors' : 'mob');
    setScreen('result');
  }

  function skipGuess() {
    if (!round) return;
    setRound({ ...round, outcome: 'mob' });
    applyScores('mob');
    setScreen('result');
  }

  function resetGame() {
    setRound(null);
    setRoleVisible(false);
    setVotingPlayerIndex(0);
    setGuessValue('');
    setScreen('home');
  }

  function playAgain() {
    setRound(makeRound({ players, category, impostorCount, modeId, settings }));
    setRoleVisible(false);
    setVotingPlayerIndex(0);
    setGuessValue('');
    setScreen('reveal');
  }

  return (
    <main className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <section className="phone-frame">
        <Header screen={screen} onReset={resetGame} />
        {screen === 'home' && (
          <HomeScreen players={players} newPlayer={newPlayer} setNewPlayer={setNewPlayer} addPlayer={addPlayer} removePlayer={removePlayer} movePlayer={movePlayer} category={category} setCategory={setCategory} modeId={modeId} changeMode={changeMode} settings={settings} patchSettings={patchSettings} applyPreset={applyPreset} impostorCount={impostorCount} setImpostorCount={setImpostorCount} canStart={canStart} startRound={startRound} scores={scores} resetScores={() => setScores({})} />
        )}
        {screen === 'reveal' && round && <RevealScreen player={currentRevealPlayer} roleVisible={roleVisible} setRoleVisible={setRoleVisible} isImpostor={round.impostors.has(currentRevealPlayer)} category={round.category} word={round.word} mode={GAME_MODES[round.modeId]} currentIndex={round.revealIndex} totalPlayers={round.passOrder.length} finishCurrentReveal={finishCurrentReveal} showCategoryToImpostor={round.settings.showCategoryToImpostor} />}
        {screen === 'clues' && round && <ClueScreen round={round} mode={GAME_MODES[round.modeId]} onNext={nextClueRound} />}
        {screen === 'vote' && round && <VoteScreen players={players} currentVotingPlayer={currentVotingPlayer} votingPlayerIndex={votingPlayerIndex} totalPlayers={round.passOrder.length} submitVote={submitVote} />}
        {screen === 'guess' && round && <GuessScreen impostors={[...round.impostors]} guessValue={guessValue} setGuessValue={setGuessValue} submitImpostorGuess={submitImpostorGuess} skipGuess={skipGuess} mode={GAME_MODES[round.modeId]} />}
        {screen === 'result' && round && voteResult && <ResultScreen round={round} mode={GAME_MODES[round.modeId]} voteResult={voteResult} onPlayAgain={playAgain} onReset={resetGame} />}
      </section>
    </main>
  );
}

function Header({ screen, onReset }) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <img className="crest-mark crest-image" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" />
        <div><p className="eyebrow">A$AP MOB</p><h1>MOB Impostor</h1></div>
      </div>
      {screen !== 'home' && <button className="icon-button" type="button" onClick={onReset} aria-label="Reset game"><RotateCcw size={18} /></button>}
    </header>
  );
}

function HomeScreen({ players, newPlayer, setNewPlayer, addPlayer, removePlayer, movePlayer, category, setCategory, modeId, changeMode, settings, patchSettings, applyPreset, impostorCount, setImpostorCount, canStart, startRound, scores, resetScores }) {
  const mode = GAME_MODES[modeId];
  const hasScores = Object.values(scores).some((score) => score > 0);
  const maxImpostors = Math.min(mode.maxImpostors, Math.max(1, players.length - 1));

  return (
    <div className="screen-stack">
      <section className="hero-card">
        <img className="hero-logo" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" />
        <p className="eyebrow">{mode.name} session</p>
        <h2>{mode.title}</h2>
        <p className="hero-copy">{mode.description}</p>
        <div className="hero-stats"><span><strong>{players.length}</strong> players</span><span><strong>{impostorCount}</strong> {mode.impostorRole}</span></div>
      </section>

      <section className="panel-card">
        <div className="section-title-row"><div><p className="eyebrow">Game mode</p><h3>Modes</h3></div><Sparkles size={20} /></div>
        <div className="mode-grid">
          {Object.values(GAME_MODES).map((item) => <button key={item.id} type="button" className={`mode-card ${modeId === item.id ? 'selected' : ''}`} onClick={() => changeMode(item.id)}><span>{item.badge}</span><strong>{item.name}</strong><small>{item.description}</small></button>)}
        </div>
      </section>

      <section className="panel-card">
        <div className="section-title-row"><div><p className="eyebrow">Session customisation</p><h3>Rules</h3></div><Trophy size={20} /></div>
        <div className="preset-row">
          {Object.entries(SESSION_PRESETS).map(([key, preset]) => <button key={key} type="button" className="preset-button" onClick={() => applyPreset(key)}><strong>{preset.name}</strong><small>{preset.description}</small></button>)}
        </div>
        <div className="settings-grid">
          <label><span>Guess / clue rounds before vote</span><select value={settings.guessRounds} onChange={(event) => patchSettings({ guessRounds: Number(event.target.value) })}>{[0, 1, 2, 3, 4].map((value) => <option key={value} value={value}>{value === 0 ? 'Skip straight to vote' : `${value} round${value > 1 ? 's' : ''}`}</option>)}</select></label>
          <label><span>Discussion timer</span><select value={settings.discussionSeconds} onChange={(event) => patchSettings({ discussionSeconds: Number(event.target.value) })}>{[0, 30, 60, 90, 120, 180].map((value) => <option key={value} value={value}>{value === 0 ? 'No timer' : `${value} seconds`}</option>)}</select></label>
          <label><span>MOB win points</span><select value={settings.pointsMobWin} onChange={(event) => patchSettings({ pointsMobWin: Number(event.target.value) })}>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Impostor win points</span><select value={settings.pointsImpostorWin} onChange={(event) => patchSettings({ pointsImpostorWin: Number(event.target.value) })}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        </div>
        <div className="toggle-list">
          <Toggle label="Show category to impostor" checked={settings.showCategoryToImpostor} onChange={(value) => patchSettings({ showCategoryToImpostor: value })} />
          <Toggle label="Impostor final guess after being caught" checked={settings.allowImpostorFinalGuess} onChange={(value) => patchSettings({ allowImpostorFinalGuess: value })} />
          <Toggle label="Randomise pass order at start" checked={settings.randomisePassOrder} onChange={(value) => patchSettings({ randomisePassOrder: value })} />
        </div>
      </section>

      <section className="panel-card">
        <div className="section-title-row"><div><p className="eyebrow">Phone pass order</p><h3>Players</h3></div><Users size={20} /></div>
        <p className="helper-text">Use ↑ and ↓ to choose exactly who gets the phone next before starting.</p>
        <div className="pass-order-list">{players.map((player, index) => <div key={player} className="pass-order-row"><span className="order-number">{index + 1}</span><strong>{player}</strong><div className="order-actions"><button type="button" onClick={() => movePlayer(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => movePlayer(index, 1)} disabled={index === players.length - 1}>↓</button><button type="button" className="remove-order" onClick={() => removePlayer(player)}>×</button></div></div>)}</div>
        <div className="input-row"><input value={newPlayer} onChange={(event) => setNewPlayer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addPlayer(); }} placeholder="Add player name" /><button type="button" onClick={addPlayer}>Add</button></div>
      </section>

      <section className="panel-card settings-card">
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="Random">Random</option>{CATEGORY_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label><span>{mode.impostorRole}s</span><select value={impostorCount} onChange={(event) => setImpostorCount(Number(event.target.value))}>{Array.from({ length: maxImpostors }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
      </section>

      {hasScores && <section className="panel-card score-card"><div className="section-title-row"><div><p className="eyebrow">Season table</p><h3>Scores</h3></div><button className="mini-button" type="button" onClick={resetScores}>Reset</button></div><div className="score-list">{Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([name]) => players.includes(name)).map(([name, score]) => <div className="score-row" key={name}><span>{name}</span><strong>{score}</strong></div>)}</div></section>}
      {!canStart && <p className="warning-text">This mode needs at least {mode.minPlayers} players, and impostors must be fewer than players.</p>}
      <button className="primary-action" type="button" disabled={!canStart} onClick={startRound}><Sparkles size={20} /> Start {mode.name} Round</button>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return <button className={`toggle-row ${checked ? 'on' : ''}`} type="button" onClick={() => onChange(!checked)}><span>{label}</span><strong>{checked ? 'On' : 'Off'}</strong></button>;
}

function RevealScreen({ player, roleVisible, setRoleVisible, isImpostor, category, word, mode, currentIndex, totalPlayers, finishCurrentReveal, showCategoryToImpostor }) {
  return <div className="screen-stack reveal-layout"><div className="progress-pill">Reveal {currentIndex + 1} of {totalPlayers}</div><section className="role-card"><p className="eyebrow">Pass the crown to</p><h2>{player}</h2>{!roleVisible ? <button className="hold-card" type="button" onClick={() => setRoleVisible(true)}><Eye size={34} /><span>Tap to reveal role</span><small>Keep it hidden from the MOB.</small></button> : <div className={`secret-card ${isImpostor ? 'is-impostor' : 'is-crew'}`}>{isImpostor ? <Skull size={42} /> : <Shield size={42} />}<p className="eyebrow">{isImpostor ? `You are the ${mode.impostorRole}` : `You are ${mode.normalRole}`}</p><h3>{isImpostor ? 'Blend in.' : word}</h3>{(!isImpostor || showCategoryToImpostor) && <p>Category: <strong>{category}</strong></p>}<small>{isImpostor ? 'Fake a clue, survive the vote, then guess the word if you get caught.' : 'Give clues that prove you know the word, but do not make it too obvious.'}</small></div>}</section>{roleVisible && <button className="primary-action" type="button" onClick={finishCurrentReveal}><EyeOff size={20} /> Hide & Pass On</button>}</div>;
}

function ClueScreen({ round, mode, onNext }) {
  const total = Math.max(0, round.settings.guessRounds);
  return <div className="screen-stack"><section className="hero-card compact-hero"><p className="eyebrow">Round {round.clueRound} of {total}</p><h2>{mode.clueTitle}</h2><p className="hero-copy">Category: <strong>{round.category}</strong>{round.settings.discussionSeconds ? ` • ${round.settings.discussionSeconds}s discussion` : ''}</p></section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Order</p><h3>Lineup</h3></div><Trophy size={20} /></div><ol className="ordered-list">{round.passOrder.map((player, index) => <li key={player}><span>{index + 1}</span>{player}</li>)}</ol></section><button className="primary-action" type="button" onClick={onNext}><Vote size={20} /> {round.clueRound >= total ? 'Start Vote' : 'Next Round'}</button></div>;
}

function VoteScreen({ players, currentVotingPlayer, votingPlayerIndex, totalPlayers, submitVote }) {
  return <div className="screen-stack"><div className="progress-pill">Vote {votingPlayerIndex + 1} of {totalPlayers}</div><section className="panel-card vote-panel"><p className="eyebrow">The MOB votes</p><h2>{currentVotingPlayer}, who is hiding?</h2><div className="vote-grid">{players.map((player) => <button key={player} type="button" onClick={() => submitVote(player)}>{player}</button>)}</div></section></div>;
}

function GuessScreen({ impostors, guessValue, setGuessValue, submitImpostorGuess, skipGuess, mode }) {
  return <div className="screen-stack"><section className="hero-card compact-hero guess-hero"><p className="eyebrow">Final chance</p><h2>{impostors.join(', ')}, {mode.guessLabel}</h2><p className="hero-copy">One correct guess steals the round.</p></section><section className="panel-card"><label className="guess-field"><span>Your guess</span><input value={guessValue} onChange={(event) => setGuessValue(event.target.value)} placeholder="Type the secret word" /></label></section><div className="action-grid"><button className="secondary-action" type="button" onClick={skipGuess}>No Guess</button><button className="primary-action" type="button" onClick={submitImpostorGuess} disabled={!guessValue.trim()}>Submit Guess</button></div></div>;
}

function ResultScreen({ round, mode, voteResult, onPlayAgain, onReset }) {
  const impostors = [...round.impostors];
  const winner = round.outcome || (voteResult.caught ? 'mob' : 'impostors');
  const title = winner === 'mob' ? 'MOB wins' : `${mode.impostorRole} wins`;
  return <div className="screen-stack"><section className={`result-card ${winner === 'mob' ? 'caught' : 'escaped'}`}><img className="result-logo" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" /><p className="eyebrow">The MOB has spoken</p><h2>{title}</h2><div className="result-facts"><div><span>{mode.impostorRole}</span><strong>{impostors.join(', ')}</strong></div><div><span>Secret word</span><strong>{round.word}</strong></div>{round.impostorGuess && <div><span>Guess</span><strong>{round.impostorGuess}</strong></div>}<div><span>Category</span><strong>{round.category}</strong></div></div></section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Votes</p><h3>Final count</h3></div><Vote size={20} /></div><div className="vote-results">{voteResult.sorted.map(([player, count]) => <div key={player} className="vote-result-row"><span>{player}</span><strong>{count}</strong></div>)}</div></section><div className="action-grid"><button className="secondary-action" type="button" onClick={onReset}>New Setup</button><button className="primary-action" type="button" onClick={onPlayAgain}>Play Again</button></div></div>;
}

export default App;
