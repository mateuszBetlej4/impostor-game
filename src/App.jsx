import { Eye, EyeOff, RotateCcw, Shield, Skull, Sparkles, Trophy, Users, Vote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MOB_LOGO_SRC } from './logoData.js';
import { SESSION_PRESETS, DEFAULT_SETTINGS } from './modeData.js';
import { WORD_BANK } from './wordBank.js';
import { OnlineSessionPanel } from './online/OnlineSessionPanel.jsx';

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

function getSecretStructureHint(word) {
  const parts = normalisePlayerName(word || '').split(/[\s\-/]+/).filter(Boolean);
  if (parts.length <= 1) return '';
  return `${parts.length}-word secret`;
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
    availableWords = wordBank[category] || [];
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

function makeRound({ players, category, word, impostorCount, settings, impostors }) {
  return {
    settings,
    passOrder: settings.randomisePassOrder ? shuffle(players) : [...players],
    category,
    word,
    impostors: impostors || new Set(shuffle(players).slice(0, impostorCount)),
    revealIndex: 0,
    revealedPlayers: [],
    clueRound: 1,
    votes: {},
    skipVotes: {},
    bonusCandidates: [],
    bonusReason: '',
    impostorGuess: '',
    outcome: null,
  };
}

function countVotes(votes, players) {
  const counts = players.reduce((acc, player) => ({ ...acc, [player]: 0 }), {});
  Object.values(votes).forEach((vote) => { counts[vote] = (counts[vote] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const highest = sorted[0]?.[1] ?? 0;
  const top = sorted.filter(([, count]) => count === highest).map(([name]) => name);
  return { counts, sorted, top, highest, caught: false };
}

function App() {
  const [screen, setScreen] = useState('home');
  const [homeTab, setHomeTab] = useState('play');
  const [setupMode, setSetupMode] = useState('local');
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
  const selectedWordCount = category === 'Random' ? totalWords : (allWordBank[category]?.length || 0);
  const skipVotesNeeded = round ? Math.max(1, Math.floor((players.length - round.impostors.size) / 2) + 1) : 1;
  const currentPlayerSkipVoted = Boolean(round?.skipVotes?.[currentRevealPlayer]);

  useEffect(() => saveJson(SCORE_KEY, scores), [scores]);
  useEffect(() => saveJson(USED_WORDS_KEY, usedWords), [usedWords]);
  useEffect(() => saveJson(CUSTOM_SETS_KEY, customSets), [customSets]);
  useEffect(() => {
    if (category !== 'Random' && !allWordBank[category]) setCategory('Random');
  }, [allWordBank, category]);

  const voteResult = useMemo(() => {
    if (!round) return null;
    const result = countVotes(round.votes, players);
    return { ...result, caught: result.top.some((name) => round.impostors.has(name)) };
  }, [players, round]);

  function patchSettings(patch) { setSettings((current) => ({ ...current, ...patch })); }
  function confirmStart() { if (canStart) setScreen('confirm'); }

  function startNewRound() {
    const selected = selectWord(category, usedWords, allWordBank, categoryNames);
    setUsedWords(selected.nextUsedWords);
    setRound(makeRound({ players, category: selected.category, word: selected.word, impostorCount, settings }));
    setRoleVisible(false); setVotingPlayerIndex(0); setGuessValue(''); setScreen('reveal');
  }

  function rerollSkippedSecret() {
    if (!round) return;
    const selected = selectWord(category, usedWords, allWordBank, categoryNames);
    setUsedWords(selected.nextUsedWords);
    setRound(makeRound({ players, category: selected.category, word: selected.word, impostorCount, settings, impostors: round.impostors }));
    setRoleVisible(false); setVotingPlayerIndex(0); setGuessValue(''); setScreen('reveal');
  }

  function submitSecretSkipVote() {
    if (!round || !currentRevealPlayer || round.impostors.has(currentRevealPlayer)) return;
    const nextSkipVotes = { ...(round.skipVotes || {}), [currentRevealPlayer]: true };
    if (Object.keys(nextSkipVotes).length >= skipVotesNeeded) { rerollSkippedSecret(); return; }
    setRound({ ...round, skipVotes: nextSkipVotes });
  }

  function saveCustomSet() {
    const rawName = normalisePlayerName(customSetName);
    const name = rawName.startsWith('Custom:') ? rawName : `Custom: ${rawName}`;
    const baseWords = customSetBase !== 'Blank' ? allWordBank[customSetBase] || [] : [];
    const newWords = cleanWordsFromText(customSetWords);
    const finalWords = [...new Set([...baseWords, ...newWords])];
    if (!rawName || finalWords.length < 3) return;
    setCustomSets((current) => ({ ...current, [name]: finalWords }));
    setCategory(name); setCustomSetName(''); setCustomSetBase('Blank'); setCustomSetWords('');
  }

  function deleteCustomSet(name) {
    setCustomSets((current) => { const next = { ...current }; delete next[name]; return next; });
    setUsedWords((current) => { const next = { ...current }; delete next[name]; return next; });
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
    setPlayers((current) => { const next = [...current]; const [moved] = next.splice(fromIndex, 1); next.splice(toIndex, 0, moved); return next; });
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
    if (round.clueRound >= Number(round.settings.guessRounds || 0)) { setScreen('vote'); return; }
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

  function resolveVotedOut(votedOut) {
    if (!round) return;
    const caught = round.impostors.has(votedOut);
    if (caught && round.settings.allowImpostorFinalGuess) { setScreen('guess'); return; }
    applyScores(caught ? 'mob' : 'impostors');
    setScreen('result');
  }

  function handleFinalVotes(nextVotes) {
    if (!round) return;
    const result = countVotes(nextVotes, players);
    const isEveryoneTied = result.top.length === players.length;
    if (isEveryoneTied || result.top.length > 1) {
      setRound({ ...round, votes: nextVotes, bonusCandidates: result.top, bonusReason: isEveryoneTied ? 'Everybody tied. Discuss as a group and choose one final suspect.' : 'Vote tied. Discuss as a group and choose one final suspect.' });
      setScreen('bonusVote'); return;
    }
    setRound({ ...round, votes: nextVotes, bonusCandidates: [], bonusReason: '' });
    resolveVotedOut(result.top[0]);
  }

  function submitVote(target) {
    if (!round) return;
    const nextVotes = { ...round.votes, [currentVotingPlayer]: target };
    const nextIndex = votingPlayerIndex + 1;
    setRound({ ...round, votes: nextVotes });
    if (nextIndex >= round.passOrder.length) { handleFinalVotes(nextVotes); return; }
    setVotingPlayerIndex(nextIndex);
  }

  function submitBonusVote(target) { if (!round) return; setRound({ ...round, bonusCandidates: [], bonusReason: '', bonusWinner: target }); resolveVotedOut(target); }
  function submitImpostorGuess() { if (!round) return; const guess = normalisePlayerName(guessValue).toLowerCase(); const actual = round.word.toLowerCase(); const impostorWins = guess === actual || (guess.length > 2 && actual.includes(guess)); setRound({ ...round, impostorGuess: guessValue, outcome: impostorWins ? 'impostors' : 'mob' }); applyScores(impostorWins ? 'impostors' : 'mob'); setScreen('result'); }
  function skipGuess() { if (!round) return; setRound({ ...round, outcome: 'mob' }); applyScores('mob'); setScreen('result'); }
  function resetGame() { setRound(null); setRoleVisible(false); setVotingPlayerIndex(0); setGuessValue(''); setScreen('home'); }

  return (
    <main className="app-shell">
      <div className="orb orb-one" /><div className="orb orb-two" />
      <section className="phone-frame">
        <Header screen={screen} onReset={resetGame} onStart={confirmStart} canStart={canStart} />
        {screen === 'home' && <HomeScreen homeTab={homeTab} setHomeTab={setHomeTab} setupMode={setupMode} setSetupMode={setSetupMode} players={players} newPlayer={newPlayer} setNewPlayer={setNewPlayer} addPlayer={addPlayer} removePlayer={removePlayer} movePlayer={movePlayer} category={category} setCategory={setCategory} categoryNames={categoryNames} customSetNames={customSetNames} settings={settings} patchSettings={patchSettings} applyPreset={(presetKey) => patchSettings(SESSION_PRESETS[presetKey].settings)} impostorCount={impostorCount} setImpostorCount={setImpostorCount} canStart={canStart} startRound={confirmStart} scores={scores} resetScores={() => setScores({})} usedWordCount={usedWordCount} totalWords={totalWords} selectedWordCount={selectedWordCount} resetUsedWords={() => setUsedWords({})} customSetName={customSetName} setCustomSetName={setCustomSetName} customSetBase={customSetBase} setCustomSetBase={setCustomSetBase} customSetWords={customSetWords} setCustomSetWords={setCustomSetWords} saveCustomSet={saveCustomSet} deleteCustomSet={deleteCustomSet} />}
        {screen === 'confirm' && <ConfirmScreen players={players} category={category} selectedWordCount={selectedWordCount} impostorCount={impostorCount} settings={settings} totalWords={totalWords} usedWordCount={usedWordCount} onBack={() => setScreen('home')} onConfirm={startNewRound} />}
        {screen === 'reveal' && round && <RevealScreen player={currentRevealPlayer} roleVisible={roleVisible} setRoleVisible={setRoleVisible} isImpostor={round.impostors.has(currentRevealPlayer)} category={round.category} word={round.word} currentIndex={round.revealIndex} totalPlayers={round.passOrder.length} finishCurrentReveal={finishCurrentReveal} showCategoryToImpostor={round.settings.showCategoryToImpostor} submitSecretSkipVote={submitSecretSkipVote} hasSkipVoted={currentPlayerSkipVoted} skipVotesNeeded={skipVotesNeeded} />}
        {screen === 'clues' && round && <ClueScreen round={round} onNext={nextClueRound} />}
        {screen === 'vote' && round && <VoteScreen players={players} currentVotingPlayer={currentVotingPlayer} votingPlayerIndex={votingPlayerIndex} totalPlayers={round.passOrder.length} submitVote={submitVote} />}
        {screen === 'bonusVote' && round && <BonusVoteScreen round={round} submitBonusVote={submitBonusVote} />}
        {screen === 'guess' && round && <GuessScreen impostors={[...round.impostors]} guessValue={guessValue} setGuessValue={setGuessValue} submitImpostorGuess={submitImpostorGuess} skipGuess={skipGuess} />}
        {screen === 'result' && round && voteResult && <ResultScreen round={round} voteResult={voteResult} onPlayAgain={startNewRound} onReset={resetGame} />}
      </section>
    </main>
  );
}

function Header({ screen, onReset, onStart, canStart }) {
  return <header className="app-header"><div className="brand-lockup"><img className="crest-mark crest-image" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" /><div><p className="eyebrow">A$AP MOB</p><h1>MOB Impostor</h1></div></div><div className="header-actions">{screen === 'home' && <button className="header-start" type="button" disabled={!canStart} onClick={onStart}>Start</button>}{screen !== 'home' && <button className="icon-button" type="button" onClick={onReset} aria-label="Reset game"><RotateCcw size={18} /></button>}</div></header>;
}

function HomeScreen({ homeTab, setHomeTab, setupMode, setSetupMode, players, newPlayer, setNewPlayer, addPlayer, removePlayer, movePlayer, category, setCategory, categoryNames, customSetNames, settings, patchSettings, applyPreset, impostorCount, setImpostorCount, canStart, startRound, scores, resetScores, usedWordCount, totalWords, selectedWordCount, resetUsedWords, customSetName, setCustomSetName, customSetBase, setCustomSetBase, customSetWords, setCustomSetWords, saveCustomSet, deleteCustomSet }) {
  const hasScores = Object.values(scores).some((score) => score > 0);
  const maxImpostors = Math.max(1, players.length - 1);
  const hostName = players[0] || 'Host';
  const tabs = [['play', 'Play'], ['players', 'Players'], ['rules', 'Rules'], ['library', 'Library']];

  return <div className="screen-stack home-tab-layout"><section className="hero-card setup-summary compact-setup-summary"><img className="hero-logo" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" /><p className="eyebrow">Pre-game setup</p><h2>{homeTab === 'play' ? 'Choose mode and session.' : homeTab === 'players' ? 'Set the MOB lineup.' : homeTab === 'rules' ? 'Tune the rules.' : 'Manage the word library.'}</h2><div className="summary-grid"><div><span>Mode</span><strong>{setupMode === 'online' ? 'Online' : 'Local'}</strong></div><div><span>Players</span><strong>{players.length}</strong></div><div><span>Set</span><strong>{category}</strong></div><div><span>Words</span><strong>{selectedWordCount}</strong></div></div></section>
    <div className="home-tab-content">
      {homeTab === 'play' && <><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Play mode</p><h3>Local or Online</h3></div><Sparkles size={20} /></div><div className="setup-mode-switch"><button type="button" className={setupMode === 'local' ? 'selected' : ''} onClick={() => setSetupMode('local')}><strong>Local</strong><small>One phone pass-and-play.</small></button><button type="button" className={setupMode === 'online' ? 'selected' : ''} onClick={() => setSetupMode('online')}><strong>Online beta</strong><small>Create or join with a code.</small></button></div></section>{setupMode === 'online' && <OnlineSessionPanel defaultHostName={hostName} category={category} impostorCount={impostorCount} settings={settings} />}<section className="panel-card settings-card priority-card"><div className="section-title-row"><div><p className="eyebrow">Session</p><h3>Game setup</h3></div><Sparkles size={20} /></div><label><span>Category / set</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="Random">Random</option>{categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label><span>Impostors</span><select value={impostorCount} onChange={(event) => setImpostorCount(Number(event.target.value))}>{Array.from({ length: maxImpostors }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select></label></section>{!canStart && <p className="warning-text">You need at least 3 players, and impostors must be fewer than players.</p>}<button className="primary-action bottom-start" type="button" disabled={!canStart} onClick={startRound}><Sparkles size={20} /> Review & Start</button></>}
      {homeTab === 'players' && <><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Phone pass order</p><h3>Players</h3></div><Users size={20} /></div><p className="helper-text">Add players and reorder exactly who gets the phone next.</p><div className="pass-order-list">{players.map((player, index) => <div key={player} className="pass-order-row"><span className="order-number">{index + 1}</span><strong>{player}</strong><div className="order-actions"><button type="button" onClick={() => movePlayer(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => movePlayer(index, 1)} disabled={index === players.length - 1}>↓</button><button type="button" className="remove-order" onClick={() => removePlayer(player)}>×</button></div></div>)}</div><div className="input-row"><input value={newPlayer} onChange={(event) => setNewPlayer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addPlayer(); }} placeholder="Add player name" /><button type="button" onClick={addPlayer}>Add</button></div></section>{hasScores && <section className="panel-card score-card"><div className="section-title-row"><div><p className="eyebrow">Season table</p><h3>Scores</h3></div><button className="mini-button" type="button" onClick={resetScores}>Reset</button></div><div className="score-list">{Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([name]) => players.includes(name)).map(([name, score]) => <div className="score-row" key={name}><span>{name}</span><strong>{score}</strong></div>)}</div></section>}</>}
      {homeTab === 'rules' && <section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Rules</p><h3>Customisation</h3></div><Trophy size={20} /></div><div className="preset-row">{Object.entries(SESSION_PRESETS).map(([key, preset]) => <button key={key} type="button" className="preset-button" onClick={() => applyPreset(key)}><strong>{preset.name}</strong><small>{preset.description}</small></button>)}</div><div className="settings-grid"><label><span>Clue rounds before vote</span><select value={settings.guessRounds} onChange={(event) => patchSettings({ guessRounds: Number(event.target.value) })}>{[0, 1, 2, 3, 4].map((value) => <option key={value} value={value}>{value === 0 ? 'Skip straight to vote' : `${value} round${value > 1 ? 's' : ''}`}</option>)}</select></label><label><span>Discussion timer</span><select value={settings.discussionSeconds} onChange={(event) => patchSettings({ discussionSeconds: Number(event.target.value) })}>{[0, 30, 60, 90, 120, 180].map((value) => <option key={value} value={value}>{value === 0 ? 'No timer' : `${value} seconds`}</option>)}</select></label><label><span>MOB win points</span><select value={settings.pointsMobWin} onChange={(event) => patchSettings({ pointsMobWin: Number(event.target.value) })}>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span>Impostor win points</span><select value={settings.pointsImpostorWin} onChange={(event) => patchSettings({ pointsImpostorWin: Number(event.target.value) })}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div><div className="toggle-list"><Toggle label="Show category to impostor" checked={settings.showCategoryToImpostor} onChange={(value) => patchSettings({ showCategoryToImpostor: value })} /><Toggle label="Impostor final guess after being caught" checked={settings.allowImpostorFinalGuess} onChange={(value) => patchSettings({ allowImpostorFinalGuess: value })} /><Toggle label="Randomise pass order at start" checked={settings.randomisePassOrder} onChange={(value) => patchSettings({ randomisePassOrder: value })} /></div></section>}
      {homeTab === 'library' && <><section className="panel-card settings-card priority-card"><div className="section-title-row"><div><p className="eyebrow">Word library</p><h3>Current pool</h3></div><Sparkles size={20} /></div><div className="score-row"><span>Words used</span><strong>{usedWordCount} / {totalWords}</strong></div><div className="score-row"><span>Selected set</span><strong>{selectedWordCount}</strong></div><button className="secondary-action" type="button" onClick={resetUsedWords}>Reset Word History</button></section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Custom library</p><h3>Build a Set</h3></div><Sparkles size={20} /></div><div className="settings-grid"><label><span>Set name</span><input value={customSetName} onChange={(event) => setCustomSetName(event.target.value)} placeholder="e.g. Le Mans Trip" /></label><label><span>Start from existing set</span><select value={customSetBase} onChange={(event) => setCustomSetBase(event.target.value)}><option value="Blank">Blank set</option>{categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label><span>Add new words</span><textarea value={customSetWords} onChange={(event) => setCustomSetWords(event.target.value)} placeholder="One word per line, or separated by commas" rows="5" /></label></div><button className="primary-action" type="button" onClick={saveCustomSet}>Save Custom Set</button>{customSetNames.length > 0 && <div className="custom-set-list">{customSetNames.map((name) => <div className="score-row" key={name}><span>{name}</span><button className="mini-button" type="button" onClick={() => deleteCustomSet(name)}>Delete</button></div>)}</div>}</section></>}
    </div>
    <nav className="setup-bottom-nav" aria-label="Setup sections">{tabs.map(([key, label]) => <button key={key} type="button" className={homeTab === key ? 'active' : ''} onClick={() => setHomeTab(key)}>{label}</button>)}</nav>
  </div>;
}

function ConfirmScreen({ players, category, selectedWordCount, impostorCount, settings, totalWords, usedWordCount, onBack, onConfirm }) {
  return <div className="screen-stack"><section className="hero-card compact-hero confirm-card"><p className="eyebrow">Verify session</p><h2>Ready to run this setup?</h2><div className="confirm-list"><div><span>Players</span><strong>{players.length}: {players.join(', ')}</strong></div><div><span>Category / set</span><strong>{category}</strong></div><div><span>Words in pool</span><strong>{selectedWordCount} selected · {usedWordCount}/{totalWords} used</strong></div><div><span>Impostors</span><strong>{impostorCount}</strong></div><div><span>Clue rounds before vote</span><strong>{settings.guessRounds}</strong></div><div><span>Discussion timer</span><strong>{settings.discussionSeconds ? `${settings.discussionSeconds}s` : 'No timer'}</strong></div><div><span>Category shown to impostor</span><strong>{settings.showCategoryToImpostor ? 'Yes' : 'No'}</strong></div><div><span>Final impostor guess</span><strong>{settings.allowImpostorFinalGuess ? 'On' : 'Off'}</strong></div><div><span>Pass order</span><strong>{settings.randomisePassOrder ? 'Randomised' : 'Manual order'}</strong></div></div></section><div className="action-grid"><button className="secondary-action" type="button" onClick={onBack}>Edit Setup</button><button className="primary-action" type="button" onClick={onConfirm}>Confirm & Reveal</button></div></div>;
}

function Toggle({ label, checked, onChange }) { return <button className={`toggle-row ${checked ? 'on' : ''}`} type="button" onClick={() => onChange(!checked)}><span>{label}</span><strong>{checked ? 'On' : 'Off'}</strong></button>; }

function RevealScreen({ player, roleVisible, setRoleVisible, isImpostor, category, word, currentIndex, totalPlayers, finishCurrentReveal, showCategoryToImpostor, submitSecretSkipVote, hasSkipVoted, skipVotesNeeded }) {
  const structureHint = getSecretStructureHint(word);
  return <div className="screen-stack reveal-layout"><div className="progress-pill">Reveal {currentIndex + 1} of {totalPlayers}</div><section className="role-card"><p className="eyebrow">Pass the crown to</p><h2>{player}</h2>{!roleVisible ? <button className="hold-card" type="button" onClick={() => setRoleVisible(true)}><Eye size={34} /><span>Tap to reveal role</span><small>Keep it hidden from the MOB.</small></button> : <div className={`secret-card ${isImpostor ? 'is-impostor' : 'is-crew'}`}>{isImpostor ? <Skull size={42} /> : <Shield size={42} />}<p className="eyebrow">{isImpostor ? 'You are the impostor' : 'You are in the MOB'}</p><h3>{isImpostor ? 'Blend in.' : word}</h3>{isImpostor && showCategoryToImpostor && <p>Category hint: <strong>{category}</strong></p>}{isImpostor && structureHint && <p>Word shape: <strong>{structureHint}</strong></p>}<small>{isImpostor ? 'Fake a clue, survive the vote, then guess the word if you get caught.' : 'Give clues that prove you know the word, but do not make it too obvious.'}</small></div>}</section>{roleVisible && !isImpostor && <section className="panel-card"><p className="eyebrow">Secret skip vote</p><h3>Bad word?</h3><p className="helper-text">You can privately vote to skip this secret. Do not say you voted skip, because that would prove you are not the impostor.</p><button className="secondary-action" type="button" disabled={hasSkipVoted} onClick={submitSecretSkipVote}>{hasSkipVoted ? 'Skip vote recorded' : 'Vote to skip word'}</button><small className="helper-text">Skip passes at {skipVotesNeeded} hidden vote{skipVotesNeeded > 1 ? 's' : ''}.</small></section>}{roleVisible && <button className="primary-action" type="button" onClick={finishCurrentReveal}><EyeOff size={20} /> Hide & Pass On</button>}</div>;
}

function DiscussionTimer({ seconds, timerKey }) {
  const [left, setLeft] = useState(Number(seconds || 0));
  useEffect(() => { setLeft(Number(seconds || 0)); if (!seconds) return undefined; const timer = window.setInterval(() => setLeft((current) => Math.max(0, current - 1)), 1000); return () => window.clearInterval(timer); }, [seconds, timerKey]);
  if (!seconds) return null;
  return <div className={`progress-pill ${left === 0 ? 'timer-ended' : ''}`}>Discussion timer: {left}s</div>;
}

function ClueScreen({ round, onNext }) { const total = Math.max(1, Number(round.settings.guessRounds || 0)); return <div className="screen-stack"><section className="hero-card compact-hero"><p className="eyebrow">Clue round {round.clueRound} of {total}</p><h2>One clue each. No repeats. No obvious giveaways.</h2><p className="hero-copy">Discuss the clues, but keep the actual word secret.</p></section><DiscussionTimer seconds={round.settings.discussionSeconds} timerKey={`clue-${round.clueRound}`} /><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Order</p><h3>Lineup</h3></div><Trophy size={20} /></div><ol className="ordered-list">{round.passOrder.map((player, index) => <li key={player}><span>{index + 1}</span>{player}</li>)}</ol></section><button className="primary-action" type="button" onClick={onNext}><Vote size={20} /> {round.clueRound >= total ? 'Start Vote' : 'Next Clue Round'}</button></div>; }
function VoteScreen({ players, currentVotingPlayer, votingPlayerIndex, totalPlayers, submitVote }) { return <div className="screen-stack"><div className="progress-pill">Vote {votingPlayerIndex + 1} of {totalPlayers}</div><section className="panel-card vote-panel"><p className="eyebrow">The MOB votes</p><h2>{currentVotingPlayer}, who is hiding?</h2><div className="vote-grid">{players.map((player) => <button key={player} type="button" onClick={() => submitVote(player)}>{player}</button>)}</div></section></div>; }
function BonusVoteScreen({ round, submitBonusVote }) { return <div className="screen-stack"><section className="hero-card compact-hero guess-hero"><p className="eyebrow">Bonus vote</p><h2>Final group decision.</h2><p className="hero-copy">{round.bonusReason || 'The vote was tied. Discuss and choose one final suspect together.'}</p></section><DiscussionTimer seconds={round.settings.discussionSeconds} timerKey={`bonus-${round.bonusCandidates.join('-')}`} /><section className="panel-card vote-panel"><p className="eyebrow">Choose one suspect</p><h2>Group vote</h2><div className="vote-grid">{round.bonusCandidates.map((player) => <button key={player} type="button" onClick={() => submitBonusVote(player)}>{player}</button>)}</div></section></div>; }
function GuessScreen({ impostors, guessValue, setGuessValue, submitImpostorGuess, skipGuess }) { return <div className="screen-stack"><section className="hero-card compact-hero guess-hero"><p className="eyebrow">Final chance</p><h2>{impostors.join(', ')}, guess the secret word to steal the win.</h2><p className="hero-copy">One correct guess steals the round.</p></section><section className="panel-card"><label className="guess-field"><span>Your guess</span><input value={guessValue} onChange={(event) => setGuessValue(event.target.value)} placeholder="Type the secret word" /></label></section><div className="action-grid"><button className="secondary-action" type="button" onClick={skipGuess}>No Guess</button><button className="primary-action" type="button" onClick={submitImpostorGuess} disabled={!guessValue.trim()}>Submit Guess</button></div></div>; }
function ResultScreen({ round, voteResult, onPlayAgain, onReset }) { const impostors = [...round.impostors]; const winner = round.outcome || (voteResult.caught ? 'mob' : 'impostors'); const title = winner === 'mob' ? 'MOB wins' : 'Impostor wins'; return <div className="screen-stack"><section className={`result-card ${winner === 'mob' ? 'caught' : 'escaped'}`}><img className="result-logo" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" /><p className="eyebrow">The MOB has spoken</p><h2>{title}</h2><div className="result-facts"><div><span>Impostor</span><strong>{impostors.join(', ')}</strong></div><div><span>Secret word</span><strong>{round.word}</strong></div>{round.impostorGuess && <div><span>Guess</span><strong>{round.impostorGuess}</strong></div>}<div><span>Category</span><strong>{round.category}</strong></div></div></section><section className="panel-card"><div className="section-title-row"><div><p className="eyebrow">Votes</p><h3>Final count</h3></div><Vote size={20} /></div><div className="vote-results">{voteResult.sorted.map(([player, count]) => <div key={player} className="vote-result-row"><span>{player}</span><strong>{count}</strong></div>)}</div></section><div className="action-grid"><button className="secondary-action" type="button" onClick={onReset}>New Setup</button><button className="primary-action" type="button" onClick={onPlayAgain}>Play Again</button></div></div>; }

export default App;
