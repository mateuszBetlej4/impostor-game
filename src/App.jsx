import { Eye, EyeOff, RotateCcw, Shield, Skull, Sparkles, Trophy, Users, Vote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MOB_LOGO_SRC } from './logoData.js';
import { SESSION_PRESETS, DEFAULT_SETTINGS } from './modeData.js';
import { CATEGORY_NAMES as BUILT_IN_CATEGORY_NAMES, WORD_BANK } from './wordBank.js';

const DEFAULT_PLAYERS = ['Mateusz', 'Dawid', 'Daniel', 'Fabian', 'Patryk'];
const MIN_PLAYERS = 3;
const SCORE_KEY = 'asap-mob-impostor-scoreboard-v1';
const USED_WORDS_KEY = 'asap-mob-impostor-used-words-v1';
const CUSTOM_SETS_KEY = 'asap-mob-impostor-custom-sets-v1';

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function normalisePlayerName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function cleanWordsFromText(text) {
  return [...new Set(text.split(/[\n,;]+/).map((word) => normalisePlayerName(word)).filter((word) => word.length > 1))];
}

function getUnusedWords(category, usedWords, wordBank) {
  const used = new Set(usedWords[category] || []);
  return (wordBank[category] || []).filter((word) => !used.has(word));
}

function selectWord(selectedCategory, usedWords, wordBank, categoryNames) {
  let category = selectedCategory;
  let nextUsedWords = { ...usedWords };

  if (selectedCategory === 'Random' || !wordBank[selectedCategory]) {
    let categoriesWithUnusedWords = categoryNames.filter((name) => getUnusedWords(name, nextUsedWords, wordBank).length > 0);
    if (categoriesWithUnusedWords.length === 0) {
      nextUsedWords = {};
      categoriesWithUnusedWords = categoryNames;
    }
    category = pickRandom(categoriesWithUnusedWords);
  }

  let availableWords = getUnusedWords(category, nextUsedWords, wordBank);
  if (availableWords.length === 0) {
    nextUsedWords = { ...nextUsedWords, [category]: [] };
    availableWords = wordBank[category];
  }

  const word = pickRandom(availableWords);
  return {
    category,
    word,
    nextUsedWords: {
      ...nextUsedWords,
      [category]: [...(nextUsedWords[category] || []), word],
    },
  };
}

function makeRound({ players, category, word, impostorCount, settings }) {
  return {
    settings,
    passOrder: settings.randomisePassOrder ? shuffle(players) : [...players],
    category,
    word,
    impostors: new Set(shuffle(players).slice(0, impostorCount)),
    revealIndex: 0,
    revealedPlayers: [],
    clueRound: 1,
    votes: {},
    impostorGuess: '',
    outcome: null,
  };
}

function App() {
  const [screen, setScreen] = useState('home');
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [newPlayer, setNewPlayer] = useState('');
  const [category, setCategory] = useState('Random');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [impostorCount, setImpostorCount] = useState(1);
  const [round, setRound] = useState(null);
  const [roleVisible, setRoleVisible] = useState(false);
  const [votingPlayerIndex, setVotingPlayerIndex] = useState(0);
  const [guessValue, setGuessValue] = useState('');
  const [scores, setScores] = useState(() => loadJson(SCORE_KEY, {}));
  const [usedWords, setUsedWords] = useState(() => loadJson(USED_WORDS_KEY, {}));
  const [customSets, setCustomSets] = useState(() => loadJson(CUSTOM_SETS_KEY, {}));
  const [customSetName, setCustomSetName] = useState('');
  const [customSetBase, setCustomSetBase] = useState('Blank');
  const [customSetWords, setCustomSetWords] = useState('');

  const allWordBank = useMemo(() => ({ ...WORD_BANK, ...customSets }), [customSets]);
  const categoryNames = useMemo(() => Object.keys(allWordBank), [allWordBank]);
  const customSetNames = useMemo(() => Object.keys(customSets), [customSets]);
  const canStart = players.length >= MIN_PLAYERS && impostorCount >= 1 && impostorCount < players.length && categoryNames.length > 0;
  const currentRevealPlayer = round ? round.passOrder[round.revealIndex] : null;
  const currentVotingPlayer = round ? round.passOrder[votingPlayerIndex] : null;
  const totalWords = categoryNames.reduce((sum, name) => sum + allWordBank[name].length, 0);
  const usedWordCount = Object.entries(usedWords).reduce((sum, [name, words]) => sum + (allWordBank[name] ? words.length : 0), 0);

  useEffect(() => saveJson(SCORE_KEY, scores), [scores]);
  useEffect(() => saveJson(USED_WORDS_KEY, usedWords), [usedWords]);
  useEffect(() => saveJson(CUSTOM_SETS_KEY, customSets), [customSets]);
  useEffect(() => {
    if (category !== 'Random' && !allWordBank[category]) setCategory('Random');
  }, [allWordBank, category]);

  const voteResult = useMemo(() => {
    if (!round) return null;
    const counts = players.reduce((acc, player) => ({ ...acc, [player]: 0 }), {});
    Object.values(round.votes).forEach((vote) => { counts[vote] = (counts[vote] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const highest = sorted[0]?.[1] ?? 0;
    const top = sorted.filter(([, count]) => count === highest).map(([name]) => name);
    return { counts, sorted, top, highest, caught: top.some((name) => round.impostors.has(name)) };
  }, [players, round]);

  function patchSettings(patch) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function startNewRound() {
    const selected = selectWord(category, usedWords, allWordBank, categoryNames);
    setUsedWords(selected.nextUsedWords);
    setRound(makeRound({ players, category: selected.category, word: selected.word, impostorCount, settings }));
    setRoleVisible(false);
    setVotingPlayerIndex(0);
    setGuessValue('');
    setScreen('reveal');
  }

  function startRound() {
    if (canStart) startNewRound();
  }

  function saveCustomSet() {
    const rawName = normalisePlayerName(customSetName);
    const name = rawName.startsWith('Custom:') ? rawName : `Custom: ${rawName}`;
    const baseWords = customSetBase !== 'Blank' ? allWordBank[customSetBase] || [] : [];
    const newWords = cleanWordsFromText(customSetWords);
    const finalWords = [...new Set([...baseWords, ...newWords])];
    if (!rawName || finalWords.length < 3) return;
    setCustomSets((current) => ({ ...current, [name]: finalWords }));
    setCategory(name);
    setCustomSetName('');
    setCustomSetBase('Blank');
    setCustomSetWords('');
  }

  function deleteCustomSet(name) {
    setCustomSets((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
    setUsedWords((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
    if (category === name) setCategory('Random');
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

  function finishCurrentReveal() {
    if (!round) return;
    const nextIndex = round.revealIndex + 1;
    setRoleVisible(false);
    if (nextIndex >= round.passOrder.length) {
      setRound({ ...round, revealedPlayers: [...round.revealedPlayers, currentRevealPlayer], revealIndex: nextIndex });
      setScreen(round.settings.guessRounds > 0 ? 'clues' : 'vote');
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

  function submitVote(target) {
    if (!round) return;
    const nextVotes = { ...round.votes, [currentVotingPlayer]: target };
    const nextIndex = votingPlayerIndex + 1;
    setRound({ ...round, votes: nextVotes });
    if (nextIndex >= round.passOrder.length) {
      const counts = Object.values(nextVotes).reduce((acc, vote) => { acc[vote] = (acc[vote] || 0) + 1; return acc; }, {});
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

  return (
    <main className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <section className="phone-frame">
        <Header screen={screen} onReset={resetGame} />
        {screen === 'home' && <HomeScreen players={players} newPlayer={newPlayer} setNewPlayer={setNewPlayer} addPlayer={addPlayer} removePlayer={removePlayer} movePlayer={movePlayer} category={category} setCategory={setCategory} categoryNames={categoryNames} customSetNames={customSetNames} settings={settings} patchSettings={patchSettings} applyPreset={(presetKey) => patchSettings(SESSION_PRESETS[presetKey].settings)} impostorCount={impostorCount} setImpostorCount={setImpostorCount} canStart={canStart} startRound={startRound} scores={scores} resetScores={() => setScores({})} usedWordCount={usedWordCount} totalWords={totalWords} resetUsedWords={() => setUsedWords({})} customSetName={customSetName} setCustomSetName={setCustomSetName} customSetBase={customSetBase} setCustomSetBase={setCustomSetBase} customSetWords={customSetWords} setCustomSetWords={setCustomSetWords} saveCustomSet={saveCustomSet} deleteCustomSet={deleteCustomSet} />}
        {screen === 'reveal' && round && <RevealScreen player={currentRevealPlayer} roleVisible={roleVisible} setRoleVisible={setRoleVisible} isImpostor={round.impostors.has(currentRevealPlayer)} category={round.category} word={round.word} currentIndex={round.revealIndex} totalPlayers={round.passOrder.length} finishCurrentReveal={finishCurrentReveal} showCategoryToImpostor={round.settings.showCategoryToImpostor} />}
        {screen === 'clues' && round && <ClueScreen round={round} onNext={nextClueRound} />}
        {screen === 'vote' && round && <VoteScreen players={players} currentVotingPlayer={currentVotingPlayer} votingPlayerIndex={votingPlayerIndex} totalPlayers={round.passOrder.length} submitVote={submitVote} />}
        {screen === 'guess' && round && <GuessScreen impostors={[...round.impostors]} guessValue={guessValue} setGuessValue={setGuessValue} submitImpostorGuess={submitImpostorGuess} skipGuess={skipGuess} />}
        {screen === 'result' && round && voteResult && <ResultScreen round={round} voteResult={voteResult} onPlayAgain={startNewRound} onReset={resetGame} />}
      </section>
    </main>
  );
}

function Header({ screen, onReset }) {
  return <header className="app-header"><div className="brand-lockup"><img className="crest-mark crest-image" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" /><div><p className="eyebrow">A$AP MOB</p><h1>MOB Impostor</h1></div></div>{screen !== 'home' && <button className="icon-button" type="button" onClick={onReset} aria-label="Reset game"><RotateCcw size={18} /></button>}</header>;
}

function HomeScreen({ players, newPlayer, setNewPlayer, addPlayer, removePlayer, movePlayer, category, setCategory, categoryNames, customSetNames, settings, patchSettings, applyPreset, impostorCount, setImpostorCount, canStart, startRound, scores, resetScores, usedWordCount, totalWords, resetUsedWords, customSetName, setCustomSetName, customSetBase, setCustomSetBase, customSetWords, setCustomSetWords, saveCustomSet, deleteCustomSet }) {
  const hasScores = Object.values(scores).some((score) => score > 0);
  const maxImpostors = Math.max(1, players.length - 1);

  return <div className="screen-stack"><section className="hero-card"><img className="hero-logo" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" /><p className="eyebrow">Private MOB session</p><h2>Find the snake before they steal the crown.</h2><p className="hero-copy">Library: {totalWords}+ words across {categoryNames.length} playable sets. Used words do not repeat until exhausted.</p><div className="hero-stats"><span><strong>{players.length}</strong> players</span><span><strong>{impostorCount}</strong> impostor</span></div></section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Session customisation</p><h3>Rules</h3></div><Trophy size={20} /></div><div className="preset-row">{Object.entries(SESSION_PRESETS).map(([key, preset]) => <button key={key} type="button" className="preset-button" onClick={() => applyPreset(key)}><strong>{preset.name}</strong><small>{preset.description}</small></button>)}</div><div className="settings-grid"><label><span>Clue rounds before vote</span><select value={settings.guessRounds} onChange={(event) => patchSettings({ guessRounds: Number(event.target.value) })}>{[0, 1, 2, 3, 4].map((value) => <option key={value} value={value}>{value === 0 ? 'Skip straight to vote' : `${value} round${value > 1 ? 's' : ''}`}</option>)}</select></label><label><span>Discussion timer</span><select value={settings.discussionSeconds} onChange={(event) => patchSettings({ discussionSeconds: Number(event.target.value) })}>{[0, 30, 60, 90, 120, 180].map((value) => <option key={value} value={value}>{value === 0 ? 'No timer' : `${value} seconds`}</option>)}</select></label><label><span>MOB win points</span><select value={settings.pointsMobWin} onChange={(event) => patchSettings({ pointsMobWin: Number(event.target.value) })}>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Impostor win points</span><select value={settings.pointsImpostorWin} onChange={(event) => patchSettings({ pointsImpostorWin: Number(event.target.value) })}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div><div className="toggle-list"><Toggle label="Show category to impostor" checked={settings.showCategoryToImpostor} onChange={(value) => patchSettings({ showCategoryToImpostor: value })} /><Toggle label="Impostor final guess after being caught" checked={settings.allowImpostorFinalGuess} onChange={(value) => patchSettings({ allowImpostorFinalGuess: value })} /><Toggle label="Randomise pass order at start" checked={settings.randomisePassOrder} onChange={(value) => patchSettings({ randomisePassOrder: value })} /></div></section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Custom library</p><h3>Build a Set</h3></div><Sparkles size={20} /></div><div className="settings-grid"><label><span>Set name</span><input value={customSetName} onChange={(event) => setCustomSetName(event.target.value)} placeholder="e.g. Le Mans Trip" /></label><label><span>Start from existing set</span><select value={customSetBase} onChange={(event) => setCustomSetBase(event.target.value)}><option value="Blank">Blank set</option>{categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label><span>Add new words</span><textarea value={customSetWords} onChange={(event) => setCustomSetWords(event.target.value)} placeholder="One word per line, or separated by commas" rows="5" /></label></div><button className="primary-action" type="button" onClick={saveCustomSet}>Save Custom Set</button>{customSetNames.length > 0 && <div className="custom-set-list">{customSetNames.map((name) => <div className="score-row" key={name}><span>{name}</span><button className="mini-button" type="button" onClick={() => deleteCustomSet(name)}>Delete</button></div>)}</div>}</section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Phone pass order</p><h3>Players</h3></div><Users size={20} /></div><p className="helper-text">Use ↑ and ↓ to choose exactly who gets the phone next before starting.</p><div className="pass-order-list">{players.map((player, index) => <div key={player} className="pass-order-row"><span className="order-number">{index + 1}</span><strong>{player}</strong><div className="order-actions"><button type="button" onClick={() => movePlayer(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => movePlayer(index, 1)} disabled={index === players.length - 1}>↓</button><button type="button" className="remove-order" onClick={() => removePlayer(player)}>×</button></div></div>)}</div><div className="input-row"><input value={newPlayer} onChange={(event) => setNewPlayer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addPlayer(); }} placeholder="Add player name" /><button type="button" onClick={addPlayer}>Add</button></div></section><section className="panel-card settings-card"><label><span>Category / set</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="Random">Random</option>{categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label><span>Impostors</span><select value={impostorCount} onChange={(event) => setImpostorCount(Number(event.target.value))}>{Array.from({ length: maxImpostors }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select></label><div className="score-row"><span>Words used</span><strong>{usedWordCount} / {totalWords}</strong></div><button className="secondary-action" type="button" onClick={resetUsedWords}>Reset Word History</button></section>{hasScores && <section className="panel-card score-card"><div className="section-title-row"><div><p className="eyebrow">Season table</p><h3>Scores</h3></div><button className="mini-button" type="button" onClick={resetScores}>Reset</button></div><div className="score-list">{Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([name]) => players.includes(name)).map(([name, score]) => <div className="score-row" key={name}><span>{name}</span><strong>{score}</strong></div>)}</div></section>}{!canStart && <p className="warning-text">You need at least 3 players, and impostors must be fewer than players.</p>}<button className="primary-action" type="button" disabled={!canStart} onClick={startRound}><Sparkles size={20} /> Start MOB Round</button></div>;
}

function Toggle({ label, checked, onChange }) {
  return <button className={`toggle-row ${checked ? 'on' : ''}`} type="button" onClick={() => onChange(!checked)}><span>{label}</span><strong>{checked ? 'On' : 'Off'}</strong></button>;
}

function RevealScreen({ player, roleVisible, setRoleVisible, isImpostor, category, word, currentIndex, totalPlayers, finishCurrentReveal, showCategoryToImpostor }) {
  return <div className="screen-stack reveal-layout"><div className="progress-pill">Reveal {currentIndex + 1} of {totalPlayers}</div><section className="role-card"><p className="eyebrow">Pass the crown to</p><h2>{player}</h2>{!roleVisible ? <button className="hold-card" type="button" onClick={() => setRoleVisible(true)}><Eye size={34} /><span>Tap to reveal role</span><small>Keep it hidden from the MOB.</small></button> : <div className={`secret-card ${isImpostor ? 'is-impostor' : 'is-crew'}`}>{isImpostor ? <Skull size={42} /> : <Shield size={42} />}<p className="eyebrow">{isImpostor ? 'You are the impostor' : 'You are in the MOB'}</p><h3>{isImpostor ? 'Blend in.' : word}</h3>{(!isImpostor || showCategoryToImpostor) && <p>Category: <strong>{category}</strong></p>}<small>{isImpostor ? 'Fake a clue, survive the vote, then guess the word if you get caught.' : 'Give clues that prove you know the word, but do not make it too obvious.'}</small></div>}</section>{roleVisible && <button className="primary-action" type="button" onClick={finishCurrentReveal}><EyeOff size={20} /> Hide & Pass On</button>}</div>;
}

function ClueScreen({ round, onNext }) {
  const total = Math.max(1, round.settings.guessRounds);
  return <div className="screen-stack"><section className="hero-card compact-hero"><p className="eyebrow">Clue round {round.clueRound} of {total}</p><h2>One clue each. No repeats. No obvious giveaways.</h2><p className="hero-copy">Category: <strong>{round.category}</strong>{round.settings.discussionSeconds ? ` • ${round.settings.discussionSeconds}s discussion` : ''}</p></section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Order</p><h3>Lineup</h3></div><Trophy size={20} /></div><ol className="ordered-list">{round.passOrder.map((player, index) => <li key={player}><span>{index + 1}</span>{player}</li>)}</ol></section><button className="primary-action" type="button" onClick={onNext}><Vote size={20} /> {round.clueRound >= round.settings.guessRounds ? 'Start Vote' : 'Next Round'}</button></div>;
}

function VoteScreen({ players, currentVotingPlayer, votingPlayerIndex, totalPlayers, submitVote }) {
  return <div className="screen-stack"><div className="progress-pill">Vote {votingPlayerIndex + 1} of {totalPlayers}</div><section className="panel-card vote-panel"><p className="eyebrow">The MOB votes</p><h2>{currentVotingPlayer}, who is hiding?</h2><div className="vote-grid">{players.map((player) => <button key={player} type="button" onClick={() => submitVote(player)}>{player}</button>)}</div></section></div>;
}

function GuessScreen({ impostors, guessValue, setGuessValue, submitImpostorGuess, skipGuess }) {
  return <div className="screen-stack"><section className="hero-card compact-hero guess-hero"><p className="eyebrow">Final chance</p><h2>{impostors.join(', ')}, guess the secret word to steal the win.</h2><p className="hero-copy">One correct guess steals the round.</p></section><section className="panel-card"><label className="guess-field"><span>Your guess</span><input value={guessValue} onChange={(event) => setGuessValue(event.target.value)} placeholder="Type the secret word" /></label></section><div className="action-grid"><button className="secondary-action" type="button" onClick={skipGuess}>No Guess</button><button className="primary-action" type="button" onClick={submitImpostorGuess} disabled={!guessValue.trim()}>Submit Guess</button></div></div>;
}

function ResultScreen({ round, voteResult, onPlayAgain, onReset }) {
  const impostors = [...round.impostors];
  const winner = round.outcome || (voteResult.caught ? 'mob' : 'impostors');
  const title = winner === 'mob' ? 'MOB wins' : 'Impostor wins';
  return <div className="screen-stack"><section className={`result-card ${winner === 'mob' ? 'caught' : 'escaped'}`}><img className="result-logo" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" /><p className="eyebrow">The MOB has spoken</p><h2>{title}</h2><div className="result-facts"><div><span>Impostor</span><strong>{impostors.join(', ')}</strong></div><div><span>Secret word</span><strong>{round.word}</strong></div>{round.impostorGuess && <div><span>Guess</span><strong>{round.impostorGuess}</strong></div>}<div><span>Category</span><strong>{round.category}</strong></div></div></section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Votes</p><h3>Final count</h3></div><Vote size={20} /></div><div className="vote-results">{voteResult.sorted.map(([player, count]) => <div key={player} className="vote-result-row"><span>{player}</span><strong>{count}</strong></div>)}</div></section><div className="action-grid"><button className="secondary-action" type="button" onClick={onReset}>New Setup</button><button className="primary-action" type="button" onClick={onPlayAgain}>Play Again</button></div></div>;
}

export default App;
