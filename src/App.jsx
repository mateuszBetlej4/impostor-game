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
  ClueInputScreen,
  ConfirmScreen,
  GuessScreen,
  HomeScreen,
  ResultScreen,
  RevealScreen,
  VoteScreen,
} from './screens/index.js';
import { HotSeatScreen } from './screens/HotSeatScreen.jsx';
import { TieDuelScreen } from './screens/TieDuelScreen.jsx';
import { YesNoQuestionScreen } from './screens/YesNoQuestionScreen.jsx';
import { WORD_BANK } from './wordBank.js';

const YES_NO_QUESTIONS = [
  'Would you usually find this indoors?',
  'Would you usually find this outdoors?',
  'Can you buy this?',
  'Is this alive?',
  'Would a child know what this is?',
  'Is this connected to food or drink?',
  'Is this bigger than a person?',
  'Would you use this every day?',
  'Is this usually expensive?',
  'Can you hold this in your hand?',
  'Is this connected to travel?',
  'Is this something people do for fun?',
];

function pickYesNoQuestion() {
  return YES_NO_QUESTIONS[Math.floor(Math.random() * YES_NO_QUESTIONS.length)];
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
  const [roundStartIndex, setRoundStartIndex] = useState(0);
  const [roleVisible, setRoleVisible] = useState(false);
  const [votingPlayerIndex, setVotingPlayerIndex] = useState(0);
  const [questionPlayerIndex, setQuestionPlayerIndex] = useState(0);
  const [hotSeatVoterIndex, setHotSeatVoterIndex] = useState(0);
  const [tieDuelClueIndex, setTieDuelClueIndex] = useState(0);
  const [tieDuelVotingIndex, setTieDuelVotingIndex] = useState(0);
  const [guessValue, setGuessValue] = useState('');
  const [clueValue, setClueValue] = useState('');
  const [hotSeatClueValue, setHotSeatClueValue] = useState('');
  const [tieDuelClueValue, setTieDuelClueValue] = useState('');
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
  const currentQuestionPlayer = round ? round.passOrder[questionPlayerIndex] : null;
  const hotSeatVoters = round ? round.passOrder.filter((player) => player !== round.hotSeatPlayer) : [];
  const currentHotSeatVoter = hotSeatVoters[hotSeatVoterIndex];
  const hotSeatRevoteVoters = round ? round.passOrder.filter((player) => player !== round.hotSeatPlayer) : [];
  const currentHotSeatRevoteVoter = hotSeatRevoteVoters[votingPlayerIndex];
  const tieDuelCandidates = round?.bonusCandidates || [];
  const tieDuelCluePlayer = tieDuelCandidates[tieDuelClueIndex];
  const tieDuelVoters = round ? getTieDuelVoters(round) : [];
  const currentTieDuelVoter = tieDuelVoters[tieDuelVotingIndex];
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
    const visibleVotes = round.hotSeatAccepted ? round.hotSeatRevoteVotes : round.votes;
    const result = countVotes(visibleVotes || {}, players);
    return { ...result, caught: Boolean(round.eliminatedPlayer && round.impostors.has(round.eliminatedPlayer)) };
  }, [players, round]);

  function getTieDuelVoters(roundSnapshot) {
    const candidates = roundSnapshot.bonusCandidates || [];
    const nonCandidates = roundSnapshot.passOrder.filter((player) => !candidates.includes(player));
    return nonCandidates.length > 0 ? nonCandidates : roundSnapshot.passOrder;
  }

  function patchSettings(patch) {
    setSettings((current) => {
      const next = { ...current, ...patch };
      if (next.hotSeatDefense) next.allowImpostorFinalGuess = false;
      return next;
    });
  }

  function confirmStart() {
    if (canStart) setScreen('confirm');
  }

  function getNextPassOrder() {
    return settings.randomisePassOrder ? shuffle(players) : rotatePassOrder(players, roundStartIndex);
  }

  function resetRoundInputs() {
    setRoleVisible(false);
    setVotingPlayerIndex(0);
    setQuestionPlayerIndex(0);
    setHotSeatVoterIndex(0);
    setTieDuelClueIndex(0);
    setTieDuelVotingIndex(0);
    setGuessValue('');
    setClueValue('');
    setHotSeatClueValue('');
    setTieDuelClueValue('');
  }

  function buildRound({ selected, passOrder, impostors }) {
    return makeRound({
      players,
      passOrder,
      category: selected.category,
      word: selected.word,
      impostorCount,
      settings,
      impostors,
      yesNoQuestion: settings.yesNoQuestionRound ? pickYesNoQuestion() : '',
    });
  }

  function startNewRound() {
    const selected = selectWord(category, usedWords, allWordBank, categoryNames);
    const passOrder = getNextPassOrder();

    setUsedWords(selected.nextUsedWords);
    setRound(buildRound({ selected, passOrder }));

    if (!settings.randomisePassOrder) {
      setRoundStartIndex((current) => (players.length ? (current + 1) % players.length : 0));
    }

    resetRoundInputs();
    setScreen('reveal');
  }

  function rerollSkippedSecret() {
    if (!round) return;

    const selected = selectWord(category, usedWords, allWordBank, categoryNames);
    setUsedWords(selected.nextUsedWords);
    setRound(buildRound({ selected, passOrder: round.passOrder, impostors: round.impostors }));

    resetRoundInputs();
    setScreen('reveal');
  }

  function submitSecretSkipVote() {
    if (!round || !currentRevealPlayer || round.impostors.has(currentRevealPlayer)) return;

    const nextSkipVotes = { ...(round.skipVotes || {}), [currentRevealPlayer]: true };
    if (Object.keys(nextSkipVotes).length >= skipVotesNeeded) {
      rerollSkippedSecret();
      return;
    }

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
    setRoundStartIndex((current) => (nextPlayers.length ? current % nextPlayers.length : 0));
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

  function nextScreenAfterClues(roundSnapshot) {
    return roundSnapshot.settings.yesNoQuestionRound ? 'yesNoQuestion' : 'vote';
  }

  function finishCurrentReveal() {
    if (!round) return;

    const nextIndex = round.revealIndex + 1;
    const revealedPlayers = [...round.revealedPlayers, currentRevealPlayer];
    const nextRound = { ...round, revealedPlayers, revealIndex: nextIndex };

    setRoleVisible(false);
    setRound(nextRound);

    if (nextIndex >= round.passOrder.length) {
      setClueValue('');
      setQuestionPlayerIndex(0);
      setScreen(round.settings.guessRounds > 0 ? 'clueInput' : nextScreenAfterClues(nextRound));
    }
  }

  function submitClue() {
    if (!round || !currentCluePlayer) return;

    const clue = normalisePlayerName(clueValue);
    if (!clue) return;

    const nextClues = [
      ...(round.clues || []),
      { round: round.clueRound, player: currentCluePlayer, clue },
    ];
    const nextPlayerIndex = (round.cluePlayerIndex || 0) + 1;
    const totalClueRounds = Number(round.settings.guessRounds || 0);

    setClueValue('');

    if (nextPlayerIndex >= round.passOrder.length) {
      if (round.clueRound >= totalClueRounds) {
        const nextRound = { ...round, clues: nextClues, cluePlayerIndex: 0 };
        setRound(nextRound);
        setQuestionPlayerIndex(0);
        setScreen(nextScreenAfterClues(nextRound));
        return;
      }

      setRound({
        ...round,
        clues: nextClues,
        clueRound: round.clueRound + 1,
        cluePlayerIndex: 0,
      });
      return;
    }

    setRound({ ...round, clues: nextClues, cluePlayerIndex: nextPlayerIndex });
  }

  function submitYesNoAnswer(answer) {
    if (!round || !currentQuestionPlayer) return;

    const nextAnswers = { ...(round.yesNoAnswers || {}), [currentQuestionPlayer]: answer };
    const nextIndex = questionPlayerIndex + 1;
    const nextRound = { ...round, yesNoAnswers: nextAnswers };

    setRound(nextRound);

    if (nextIndex >= round.passOrder.length) {
      setScreen('yesNoResults');
      return;
    }

    setQuestionPlayerIndex(nextIndex);
  }

  function continueFromQuestionResults() {
    setVotingPlayerIndex(0);
    setScreen('vote');
  }

  function finishRoundFrom(roundSnapshot, winner, updates = {}) {
    const nextRound = { ...roundSnapshot, ...updates, outcome: winner };
    setRound(nextRound);
    setScores((current) => applyRoundScore({ currentScores: current, players, round: nextRound, winner }));
    setScreen('result');
  }

  function startHotSeatFrom(roundSnapshot, player, extraUpdates = {}) {
    setRound({
      ...roundSnapshot,
      ...extraUpdates,
      hotSeatPlayer: player,
      hotSeatUsed: true,
      hotSeatFinalClue: '',
      hotSeatVotes: {},
      hotSeatAccepted: null,
      hotSeatRevoteVotes: {},
      bonusCandidates: [],
      bonusReason: '',
      bonusDuelClues: {},
      bonusVotes: {},
      bonusWinner: null,
    });
    setHotSeatClueValue('');
    setHotSeatVoterIndex(0);
    setVotingPlayerIndex(0);
    setScreen('hotSeatClue');
  }

  function resolveVotedOutFrom(roundSnapshot, votedOut, sourcePhase = 'initial', extraUpdates = {}) {
    const caught = roundSnapshot.impostors.has(votedOut);

    if (roundSnapshot.settings.hotSeatDefense && !roundSnapshot.hotSeatUsed && sourcePhase === 'initial') {
      startHotSeatFrom(roundSnapshot, votedOut, extraUpdates);
      return;
    }

    if (caught && roundSnapshot.settings.allowImpostorFinalGuess && !roundSnapshot.settings.hotSeatDefense) {
      setRound({ ...roundSnapshot, ...extraUpdates, eliminatedPlayer: votedOut });
      setScreen('guess');
      return;
    }

    finishRoundFrom(roundSnapshot, caught ? 'mob' : 'impostors', {
      ...extraUpdates,
      eliminatedPlayer: votedOut,
      resultReason: caught
        ? `${votedOut} was an impostor.`
        : `${votedOut} was MOB, so the impostors escaped.`,
    });
  }

  function startTieDuelFrom(roundSnapshot, candidates, sourcePhase, extraUpdates = {}) {
    const reason = sourcePhase === 'hot-seat-revote'
      ? 'Hot Seat revote tied. Tied players enter a Tie Duel.'
      : 'Vote tied between MOB and impostor candidates. Tied players enter a Tie Duel.';

    setRound({
      ...roundSnapshot,
      ...extraUpdates,
      bonusCandidates: candidates,
      bonusReason: reason,
      bonusDuelClues: {},
      bonusVotes: {},
      bonusWinner: null,
      bonusTieSource: sourcePhase,
    });
    setTieDuelClueIndex(0);
    setTieDuelVotingIndex(0);
    setTieDuelClueValue('');
    setScreen('tieDuelClues');
  }

  function resolveTieFrom(roundSnapshot, tiedCandidates, sourcePhase, extraUpdates = {}) {
    const tiedImpostors = tiedCandidates.filter((player) => roundSnapshot.impostors.has(player));
    const tiedMob = tiedCandidates.filter((player) => !roundSnapshot.impostors.has(player));

    if (tiedImpostors.length === 0) {
      finishRoundFrom(roundSnapshot, 'impostors', {
        ...extraUpdates,
        resultReason: 'The top tied players were all MOB. No Tie Duel needed — impostors win.',
      });
      return;
    }

    if (tiedMob.length === 0) {
      const selectedImpostor = tiedImpostors[0];
      if (roundSnapshot.settings.hotSeatDefense && !roundSnapshot.hotSeatUsed && sourcePhase === 'initial') {
        startHotSeatFrom(roundSnapshot, selectedImpostor, {
          ...extraUpdates,
          resultReason: 'All tied players were impostors. One enters the Hot Seat.',
        });
        return;
      }

      finishRoundFrom(roundSnapshot, 'mob', {
        ...extraUpdates,
        eliminatedPlayer: selectedImpostor,
        resultReason: 'The top tied players were all impostors. MOB caught an impostor.',
      });
      return;
    }

    startTieDuelFrom(roundSnapshot, tiedCandidates, sourcePhase, extraUpdates);
  }

  function handleFinalVotesFrom(roundSnapshot, votes, sourcePhase = 'initial') {
    const targetPlayers = sourcePhase === 'hot-seat-revote'
      ? roundSnapshot.passOrder.filter((player) => player !== roundSnapshot.hotSeatPlayer)
      : players;
    const result = countVotes(votes, targetPlayers);

    if (result.top.length > 1) {
      resolveTieFrom(roundSnapshot, result.top, sourcePhase);
      return;
    }

    resolveVotedOutFrom(roundSnapshot, result.top[0], sourcePhase);
  }

  function submitVote(target) {
    if (!round || !currentVotingPlayer) return;

    const nextVotes = { ...round.votes, [currentVotingPlayer]: target };
    const nextIndex = votingPlayerIndex + 1;
    const nextRound = { ...round, votes: nextVotes };

    setRound(nextRound);

    if (nextIndex >= round.passOrder.length) {
      handleFinalVotesFrom(nextRound, nextVotes, 'initial');
      return;
    }

    setVotingPlayerIndex(nextIndex);
  }

  function submitTieDuelClue() {
    if (!round || !tieDuelCluePlayer) return;

    const clue = normalisePlayerName(tieDuelClueValue);
    if (!clue) return;

    const nextClues = { ...(round.bonusDuelClues || {}), [tieDuelCluePlayer]: clue };
    const nextIndex = tieDuelClueIndex + 1;
    const nextRound = { ...round, bonusDuelClues: nextClues };

    setTieDuelClueValue('');
    setRound(nextRound);

    if (nextIndex >= round.bonusCandidates.length) {
      setTieDuelVotingIndex(0);
      setScreen('tieDuelVote');
      return;
    }

    setTieDuelClueIndex(nextIndex);
  }

  function submitTieDuelVote(target) {
    if (!round || !currentTieDuelVoter) return;

    const nextVotes = { ...(round.bonusVotes || {}), [currentTieDuelVoter]: target };
    const nextIndex = tieDuelVotingIndex + 1;
    const nextRound = { ...round, bonusVotes: nextVotes };

    setRound(nextRound);

    if (nextIndex < tieDuelVoters.length) {
      setTieDuelVotingIndex(nextIndex);
      return;
    }

    const result = countVotes(nextVotes, round.bonusCandidates);
    const selected = result.top.length === 1
      ? result.top[0]
      : result.top[Math.floor(Math.random() * result.top.length)];
    const sourcePhase = round.bonusTieSource || 'initial';

    resolveVotedOutFrom(nextRound, selected, sourcePhase, {
      bonusWinner: selected,
      resultReason: result.top.length === 1
        ? `${selected} was selected after the Tie Duel.`
        : `Tie Duel was still tied. ${selected} was randomly selected from the tied players.`,
    });
  }

  function submitHotSeatClue() {
    if (!round || !round.hotSeatPlayer) return;

    const clue = normalisePlayerName(hotSeatClueValue);
    if (!clue) return;

    setRound({ ...round, hotSeatFinalClue: clue });
    setHotSeatClueValue('');
    setHotSeatVoterIndex(0);
    setScreen('hotSeatAcceptance');
  }

  function submitHotSeatAcceptanceVote(vote) {
    if (!round || !currentHotSeatVoter) return;

    const nextVotes = { ...(round.hotSeatVotes || {}), [currentHotSeatVoter]: vote };
    const nextIndex = hotSeatVoterIndex + 1;
    const nextRound = { ...round, hotSeatVotes: nextVotes };

    setRound(nextRound);

    if (nextIndex < hotSeatVoters.length) {
      setHotSeatVoterIndex(nextIndex);
      return;
    }

    const acceptVotes = Object.values(nextVotes).filter((value) => value === 'accept').length;
    const rejectVotes = Object.values(nextVotes).filter((value) => value === 'reject').length;
    const accepted = acceptVotes > rejectVotes;

    if (!accepted) {
      resolveVotedOutFrom(
        { ...nextRound, hotSeatAccepted: false },
        round.hotSeatPlayer,
        'hot-seat-rejected',
        { resultReason: `Hot Seat defense rejected ${acceptVotes}-${rejectVotes}.` },
      );
      return;
    }

    setRound({
      ...nextRound,
      hotSeatAccepted: true,
      hotSeatRevoteVotes: {},
      resultReason: `Hot Seat defense accepted ${acceptVotes}-${rejectVotes}. Redo vote without ${round.hotSeatPlayer}.`,
    });
    setVotingPlayerIndex(0);
    setScreen('hotSeatRevote');
  }

  function submitHotSeatRevote(target) {
    if (!round || !currentHotSeatRevoteVoter) return;

    const nextVotes = { ...(round.hotSeatRevoteVotes || {}), [currentHotSeatRevoteVoter]: target };
    const nextIndex = votingPlayerIndex + 1;
    const nextRound = { ...round, hotSeatRevoteVotes: nextVotes };

    setRound(nextRound);

    if (nextIndex >= hotSeatRevoteVoters.length) {
      handleFinalVotesFrom(nextRound, nextVotes, 'hot-seat-revote');
      return;
    }

    setVotingPlayerIndex(nextIndex);
  }

  function submitImpostorGuess() {
    if (!round) return;

    const impostorWins = isCorrectSecretGuess(guessValue, round.word);
    finishRoundFrom(round, impostorWins ? 'impostors' : 'mob', {
      impostorGuess: guessValue,
      resultReason: impostorWins ? 'The impostor guessed the secret word.' : 'The final guess failed.',
    });
  }

  function skipGuess() {
    if (!round) return;

    finishRoundFrom(round, 'mob', { resultReason: 'The impostor skipped the final guess.' });
  }

  function resetGame() {
    setRound(null);
    setRoundStartIndex(0);
    resetRoundInputs();
    setScreen('home');
  }

  return (
    <main className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <section className="phone-frame">
        <Header screen={screen} onReset={resetGame} onStart={confirmStart} canStart={canStart} />

        {screen === 'home' && (
          <HomeScreen
            homeTab={homeTab}
            setHomeTab={setHomeTab}
            setupMode={setupMode}
            setSetupMode={setSetupMode}
            players={players}
            newPlayer={newPlayer}
            setNewPlayer={setNewPlayer}
            addPlayer={addPlayer}
            removePlayer={removePlayer}
            movePlayer={movePlayer}
            category={category}
            setCategory={setCategory}
            categoryNames={categoryNames}
            customSetNames={customSetNames}
            sessionPresets={SESSION_PRESETS}
            settings={settings}
            patchSettings={patchSettings}
            applyPreset={(presetKey) => patchSettings(SESSION_PRESETS[presetKey].settings)}
            impostorCount={impostorCount}
            setImpostorCount={setImpostorCount}
            canStart={canStart}
            startRound={confirmStart}
            scores={scores}
            resetScores={() => setScores({})}
            usedWordCount={usedWordCount}
            totalWords={totalWords}
            selectedWordCount={selectedWordCount}
            resetUsedWords={() => setUsedWords({})}
            customSetName={customSetName}
            setCustomSetName={setCustomSetName}
            customSetBase={customSetBase}
            setCustomSetBase={setCustomSetBase}
            customSetWords={customSetWords}
            setCustomSetWords={setCustomSetWords}
            saveCustomSet={saveCustomSet}
            deleteCustomSet={deleteCustomSet}
          />
        )}

        {screen === 'confirm' && (
          <ConfirmScreen
            players={players}
            category={category}
            selectedWordCount={selectedWordCount}
            impostorCount={impostorCount}
            settings={settings}
            totalWords={totalWords}
            usedWordCount={usedWordCount}
            onBack={() => setScreen('home')}
            onConfirm={startNewRound}
          />
        )}

        {screen === 'reveal' && round && (
          <RevealScreen
            player={currentRevealPlayer}
            roleVisible={roleVisible}
            setRoleVisible={setRoleVisible}
            isImpostor={round.impostors.has(currentRevealPlayer)}
            category={round.category}
            word={round.word}
            currentIndex={round.revealIndex}
            totalPlayers={round.passOrder.length}
            finishCurrentReveal={finishCurrentReveal}
            showCategoryToImpostor={round.settings.showCategoryToImpostor}
            submitSecretSkipVote={submitSecretSkipVote}
            hasSkipVoted={currentPlayerSkipVoted}
            skipVotesNeeded={skipVotesNeeded}
          />
        )}

        {screen === 'clueInput' && round && (
          <ClueInputScreen
            round={round}
            player={currentCluePlayer}
            clueValue={clueValue}
            setClueValue={setClueValue}
            submitClue={submitClue}
          />
        )}

        {screen === 'yesNoQuestion' && round && (
          <YesNoQuestionScreen
            mode="answer"
            round={round}
            player={currentQuestionPlayer}
            questionPlayerIndex={questionPlayerIndex}
            submitAnswer={submitYesNoAnswer}
          />
        )}

        {screen === 'yesNoResults' && round && (
          <YesNoQuestionScreen
            mode="results"
            round={round}
            continueToVote={continueFromQuestionResults}
          />
        )}

        {screen === 'vote' && round && (
          <VoteScreen
            players={players}
            currentVotingPlayer={currentVotingPlayer}
            votingPlayerIndex={votingPlayerIndex}
            totalPlayers={round.passOrder.length}
            submitVote={submitVote}
          />
        )}

        {screen === 'tieDuelClues' && round && (
          <TieDuelScreen
            mode="clues"
            round={round}
            candidate={tieDuelCluePlayer}
            clueIndex={tieDuelClueIndex}
            clueValue={tieDuelClueValue}
            setClueValue={setTieDuelClueValue}
            submitClue={submitTieDuelClue}
          />
        )}

        {screen === 'tieDuelVote' && round && (
          <TieDuelScreen
            mode="vote"
            round={round}
            voter={currentTieDuelVoter}
            voterIndex={tieDuelVotingIndex}
            totalVoters={tieDuelVoters.length}
            voteTargets={round.bonusCandidates}
            submitVote={submitTieDuelVote}
          />
        )}

        {screen === 'hotSeatClue' && round && (
          <HotSeatScreen
            mode="clue"
            round={round}
            clueValue={hotSeatClueValue}
            setClueValue={setHotSeatClueValue}
            submitClue={submitHotSeatClue}
          />
        )}

        {screen === 'hotSeatAcceptance' && round && (
          <HotSeatScreen
            mode="acceptance"
            round={round}
            voter={currentHotSeatVoter}
            voterIndex={hotSeatVoterIndex}
            totalVoters={hotSeatVoters.length}
            submitAcceptanceVote={submitHotSeatAcceptanceVote}
          />
        )}

        {screen === 'hotSeatRevote' && round && (
          <VoteScreen
            players={hotSeatRevoteVoters}
            targetPlayers={hotSeatRevoteVoters}
            currentVotingPlayer={currentHotSeatRevoteVoter}
            votingPlayerIndex={votingPlayerIndex}
            totalPlayers={hotSeatRevoteVoters.length}
            submitVote={submitHotSeatRevote}
            eyebrow="Hot Seat revote"
            title={`${currentHotSeatRevoteVoter}, who is hiding now?`}
            helperText={`${round.hotSeatPlayer} is safe and excluded from this vote.`}
          />
        )}

        {screen === 'guess' && round && (
          <GuessScreen
            impostors={[...round.impostors]}
            guessValue={guessValue}
            setGuessValue={setGuessValue}
            submitImpostorGuess={submitImpostorGuess}
            skipGuess={skipGuess}
          />
        )}
        {screen === 'result' && round && voteResult && (
          <ResultScreen round={round} voteResult={voteResult} onPlayAgain={startNewRound} onReset={resetGame} />
        )}
      </section>
    </main>
  );
}

export default App;
