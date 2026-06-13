import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/index.js';
import {
  applyRoundScore,
  cleanWordsFromText,
  countVotes,
  CUSTOM_SETS_KEY,
  DEFAULT_PLAYERS,
  isCorrectSecretGuess,
  loadJson,
  makeRound,
  MIN_PLAYERS,
  normalisePlayerName,
  rotatePassOrder,
  saveJson,
  SCORE_KEY,
  selectWord,
  shuffle,
  USED_WORDS_KEY,
} from './game/index.js';
import { DEFAULT_SETTINGS, SESSION_PRESETS } from './modeData.js';
import {
  BonusVoteScreen,
  ConfirmScreen,
  GuessScreen,
  HomeScreen,
  ResultScreen,
  RevealScreen,
  VoteScreen,
} from './screens/index.js';
import { TimedClueInputScreen } from './screens/TimedClueInputScreen.jsx';
import { WORD_BANK } from './wordBank.js';

function AppWithTimedClues() {
  const [screen, setScreen] = useState('home');
  const [homeTab, setHomeTab] = useState('play');
  const [setupMode, setSetupMode] = useState('local');
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [newPlayer, setNewPlayer] = useState('');
  const [category, setCategory] = useState('Random');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [impostorCount, setImpostorCount] = useState(1);
  const [round, setRound] = useState(null);
  const [roundStartIndex, setRoundStartIndex] = useState(0);
  const [roleVisible, setRoleVisible] = useState(false);
  const [votingPlayerIndex, setVotingPlayerIndex] = useState(0);
  const [guessValue, setGuessValue] = useState('');
  const [clueValue, setClueValue] = useState('');
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
  const currentCluePlayer = round ? round.passOrder[round.cluePlayerIndex || 0] : null;
  const currentVotingPlayer = round ? round.passOrder[votingPlayerIndex] : null;
  const nextCluePlayer = useMemo(() => {
    if (!round) return 'next player';
    const nextIndex = (round.cluePlayerIndex || 0) + 1;
    if (nextIndex < round.passOrder.length) return round.passOrder[nextIndex];
    if (round.clueRound < Number(round.settings.guessRounds || 0)) return round.passOrder[0];
    return 'the vote';
  }, [round]);
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
  function getNextPassOrder() { return settings.randomisePassOrder ? shuffle(players) : rotatePassOrder(players, roundStartIndex); }

  function startNewRound() {
    const selected = selectWord(category, usedWords, allWordBank, categoryNames);
    const passOrder = getNextPassOrder();
    setUsedWords(selected.nextUsedWords);
    setRound(makeRound({ players, passOrder, category: selected.category, word: selected.word, impostorCount, settings }));
    if (!settings.randomisePassOrder) setRoundStartIndex((current) => (players.length ? (current + 1) % players.length : 0));
    setRoleVisible(false); setVotingPlayerIndex(0); setGuessValue(''); setClueValue(''); setScreen('reveal');
  }

  function rerollSkippedSecret() {
    if (!round) return;
    const selected = selectWord(category, usedWords, allWordBank, categoryNames);
    setUsedWords(selected.nextUsedWords);
    setRound(makeRound({ players, passOrder: round.passOrder, category: selected.category, word: selected.word, impostorCount, settings, impostors: round.impostors }));
    setRoleVisible(false); setVotingPlayerIndex(0); setGuessValue(''); setClueValue(''); setScreen('reveal');
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
    setRoundStartIndex((current) => (nextPlayers.length ? current % nextPlayers.length : 0));
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
    const revealedPlayers = [...round.revealedPlayers, currentRevealPlayer];
    setRoleVisible(false);
    setRound({ ...round, revealedPlayers, revealIndex: nextIndex });
    if (nextIndex >= round.passOrder.length) { setClueValue(''); setScreen(round.settings.guessRounds > 0 ? 'clueInput' : 'vote'); }
  }

  function advanceClueTurn({ clue = '', skipped = false } = {}) {
    if (!round || !currentCluePlayer) return;
    const nextClues = [...(round.clues || []), { round: round.clueRound, player: currentCluePlayer, clue, skipped }];
    const nextPlayerIndex = (round.cluePlayerIndex || 0) + 1;
    const totalClueRounds = Number(round.settings.guessRounds || 0);
    setClueValue('');
    if (nextPlayerIndex >= round.passOrder.length) {
      if (round.clueRound >= totalClueRounds) { setRound({ ...round, clues: nextClues, cluePlayerIndex: 0 }); setScreen('vote'); return; }
      setRound({ ...round, clues: nextClues, clueRound: round.clueRound + 1, cluePlayerIndex: 0 });
      return;
    }
    setRound({ ...round, clues: nextClues, cluePlayerIndex: nextPlayerIndex });
  }

  function submitClue() {
    const clue = normalisePlayerName(clueValue);
    if (!clue) return;
    advanceClueTurn({ clue });
  }
  function skipClueTurn() { advanceClueTurn({ skipped: true }); }
  function applyScores(winner) { if (round) setScores((current) => applyRoundScore({ currentScores: current, players, round, winner })); }
  function resolveVotedOut(votedOut) {
    if (!round) return;
    const caught = round.impostors.has(votedOut);
    if (caught && round.settings.allowImpostorFinalGuess) { setScreen('guess'); return; }
    applyScores(caught ? 'mob' : 'impostors'); setScreen('result');
  }
  function handleFinalVotes(nextVotes) {
    if (!round) return;
    const result = countVotes(nextVotes, players);
    const isEveryoneTied = result.top.length === players.length;
    if (isEveryoneTied || result.top.length > 1) {
      setRound({ ...round, votes: nextVotes, bonusCandidates: result.top, bonusReason: isEveryoneTied ? 'Everybody tied. Discuss as a group and choose one final suspect.' : 'Vote tied. Discuss as a group and choose one final suspect.' });
      setScreen('bonusVote'); return;
    }
    setRound({ ...round, votes: nextVotes, bonusCandidates: [], bonusReason: '' }); resolveVotedOut(result.top[0]);
  }
  function submitVote(target) {
    if (!round) return;
    const nextVotes = { ...round.votes, [currentVotingPlayer]: target };
    const nextIndex = votingPlayerIndex + 1;
    setRound({ ...round, votes: nextVotes });
    if (nextIndex >= round.passOrder.length) { handleFinalVotes(nextVotes); return; }
    setVotingPlayerIndex(nextIndex);
  }
  function submitBonusVote(target) { if (round) { setRound({ ...round, bonusCandidates: [], bonusReason: '', bonusWinner: target }); resolveVotedOut(target); } }
  function submitImpostorGuess() {
    if (!round) return;
    const impostorWins = isCorrectSecretGuess(guessValue, round.word);
    setRound({ ...round, impostorGuess: guessValue, outcome: impostorWins ? 'impostors' : 'mob' });
    applyScores(impostorWins ? 'impostors' : 'mob'); setScreen('result');
  }
  function skipGuess() { if (round) { setRound({ ...round, outcome: 'mob' }); applyScores('mob'); setScreen('result'); } }
  function resetGame() { setRound(null); setRoundStartIndex(0); setRoleVisible(false); setVotingPlayerIndex(0); setGuessValue(''); setClueValue(''); setScreen('home'); }

  return (
    <main className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <section className="phone-frame">
        <Header screen={screen} onReset={resetGame} onStart={confirmStart} canStart={canStart} />
        {screen === 'home' && <HomeScreen homeTab={homeTab} setHomeTab={setHomeTab} setupMode={setupMode} setSetupMode={setSetupMode} players={players} newPlayer={newPlayer} setNewPlayer={setNewPlayer} addPlayer={addPlayer} removePlayer={removePlayer} movePlayer={movePlayer} category={category} setCategory={setCategory} categoryNames={categoryNames} customSetNames={customSetNames} sessionPresets={SESSION_PRESETS} settings={settings} patchSettings={patchSettings} applyPreset={(presetKey) => patchSettings(SESSION_PRESETS[presetKey].settings)} impostorCount={impostorCount} setImpostorCount={setImpostorCount} canStart={canStart} startRound={confirmStart} scores={scores} resetScores={() => setScores({})} usedWordCount={usedWordCount} totalWords={totalWords} selectedWordCount={selectedWordCount} resetUsedWords={() => setUsedWords({})} customSetName={customSetName} setCustomSetName={setCustomSetName} customSetBase={customSetBase} setCustomSetBase={setCustomSetBase} customSetWords={customSetWords} setCustomSetWords={setCustomSetWords} saveCustomSet={saveCustomSet} deleteCustomSet={deleteCustomSet} />}
        {screen === 'confirm' && <ConfirmScreen players={players} category={category} selectedWordCount={selectedWordCount} impostorCount={impostorCount} settings={settings} totalWords={totalWords} usedWordCount={usedWordCount} onBack={() => setScreen('home')} onConfirm={startNewRound} />}
        {screen === 'reveal' && round && <RevealScreen player={currentRevealPlayer} roleVisible={roleVisible} setRoleVisible={setRoleVisible} isImpostor={round.impostors.has(currentRevealPlayer)} category={round.category} word={round.word} currentIndex={round.revealIndex} totalPlayers={round.passOrder.length} finishCurrentReveal={finishCurrentReveal} showCategoryToImpostor={round.settings.showCategoryToImpostor} submitSecretSkipVote={submitSecretSkipVote} hasSkipVoted={currentPlayerSkipVoted} skipVotesNeeded={skipVotesNeeded} />}
        {screen === 'clueInput' && round && <TimedClueInputScreen round={round} player={currentCluePlayer} nextPlayer={nextCluePlayer} clueValue={clueValue} setClueValue={setClueValue} submitClue={submitClue} skipClueTurn={skipClueTurn} />}
        {screen === 'vote' && round && <VoteScreen players={players} currentVotingPlayer={currentVotingPlayer} votingPlayerIndex={votingPlayerIndex} totalPlayers={round.passOrder.length} submitVote={submitVote} />}
        {screen === 'bonusVote' && round && <BonusVoteScreen round={round} submitBonusVote={submitBonusVote} />}
        {screen === 'guess' && round && <GuessScreen impostors={[...round.impostors]} guessValue={guessValue} setGuessValue={setGuessValue} submitImpostorGuess={submitImpostorGuess} skipGuess={skipGuess} />}
        {screen === 'result' && round && voteResult && <ResultScreen round={round} voteResult={voteResult} onPlayAgain={startNewRound} onReset={resetGame} />}
      </section>
    </main>
  );
}

export default AppWithTimedClues;
