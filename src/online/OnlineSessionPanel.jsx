import { useEffect, useMemo, useState } from 'react';
import { WORD_BANK } from '../wordBank.js';
import { isSupabaseConfigured } from './supabaseClient.js';
import { createSession, joinSession } from './sessionService.js';
import { loadSessionSnapshot, reconnectSession, subscribeToSession } from './reconnectService.js';
import { canReconnect, clearReconnectIdentity, loadReconnectIdentity } from './reconnect.js';
import { normalizeCode } from './sessionCodes.js';
import { startOnlineRound } from './onlineRoundService.js';
import { markRoleSeen } from './onlineRevealService.js';
import { submitOnlineSecretSkipVote } from './onlineSkipService.js';
import { calculateOnlineVoteResult, finishOnlineVote, setOnlinePhase, submitOnlineImpostorGuess, submitOnlineVote } from './onlineVoteService.js';
import {
  continueOnlineAfterQuestion,
  continueOnlineTieDuelToVote,
  resolveOnlineHotSeat,
  resolveOnlineTieDuel,
  submitOnlineHotSeatClue,
  submitOnlineHotSeatVote,
  submitOnlineTieDuelClue,
  submitOnlineTieDuelVote,
  submitOnlineYesNoAnswer,
} from './onlineDramaService.js';
import './online.css';

export function OnlineSessionPanel({ defaultHostName, category, impostorCount, settings }) {
  const [hostName, setHostName] = useState(defaultHostName || 'Host');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [reconnectIdentity, setReconnectIdentity] = useState(null);
  const [onlineState, setOnlineState] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [onlineRound, setOnlineRound] = useState(null);
  const [onlineVotes, setOnlineVotes] = useState([]);
  const [onlineSkipVotes, setOnlineSkipVotes] = useState([]);
  const [onlineClues, setOnlineClues] = useState([]);
  const [onlineYesNoAnswers, setOnlineYesNoAnswers] = useState([]);
  const [onlineHotSeatVotes, setOnlineHotSeatVotes] = useState([]);
  const [onlineTieDuels, setOnlineTieDuels] = useState([]);
  const [onlineTieDuelCandidates, setOnlineTieDuelCandidates] = useState([]);
  const [onlineTieDuelVotes, setOnlineTieDuelVotes] = useState([]);
  const [roleVisible, setRoleVisible] = useState(false);
  const [guessValue, setGuessValue] = useState('');
  const [hotSeatClueValue, setHotSeatClueValue] = useState('');
  const [tieDuelClueValue, setTieDuelClueValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const connectedPlayers = useMemo(() => lobbyPlayers.filter((player) => player.connected !== false), [lobbyPlayers]);
  const currentPlayer = useMemo(() => lobbyPlayers.find((player) => player.id === onlineState?.identity?.playerId) || onlineState?.player, [lobbyPlayers, onlineState]);
  const currentSettings = onlineState?.session?.settings || settings || {};
  const initialVotes = useMemo(() => onlineVotes.filter((vote) => (vote.vote_phase || 'initial') === 'initial'), [onlineVotes]);
  const hotSeatRevotes = useMemo(() => onlineVotes.filter((vote) => vote.vote_phase === 'hot_seat_revote'), [onlineVotes]);
  const activeVotePhase = onlineState?.session?.status === 'hot_seat_revote' ? 'hot_seat_revote' : 'initial';
  const activeVotes = activeVotePhase === 'hot_seat_revote' ? hotSeatRevotes : initialVotes;
  const myVote = useMemo(() => activeVotes.find((vote) => vote.voter_player_id === onlineState?.identity?.playerId), [activeVotes, onlineState]);
  const mySkipVote = useMemo(() => onlineSkipVotes.find((vote) => vote.voter_player_id === onlineState?.identity?.playerId), [onlineSkipVotes, onlineState]);
  const votePlayers = useMemo(() => activeVotePhase === 'hot_seat_revote'
    ? connectedPlayers.filter((player) => player.id !== onlineRound?.hot_seat_player_id)
    : connectedPlayers,
  [activeVotePhase, connectedPlayers, onlineRound]);
  const voteResult = useMemo(() => calculateOnlineVoteResult({ players: votePlayers, votes: activeVotes }), [votePlayers, activeVotes]);
  const impostorNames = useMemo(() => lobbyPlayers.filter((player) => player.role === 'impostor').map((player) => player.name), [lobbyPlayers]);
  const canHostStart = Boolean(onlineState?.identity?.isHost && onlineState?.session?.status === 'lobby' && connectedPlayers.length >= 3);
  const canHostChangePhase = Boolean(onlineState?.identity?.isHost && onlineState?.session && onlineState?.session?.status !== 'lobby' && onlineState?.session?.status !== 'results' && onlineState?.session?.status !== 'guess');
  const canHostPlayAgain = Boolean(onlineState?.identity?.isHost && onlineState?.session?.status === 'results' && connectedPlayers.length >= 3);
  const allConnectedVoted = votePlayers.length > 0 && activeVotes.length >= votePlayers.length;
  const isCurrentPlayerImpostor = currentPlayer?.role === 'impostor';
  const mobPlayerCount = connectedPlayers.filter((player) => player.role !== 'impostor').length;
  const skipVotesNeeded = Math.max(1, Math.floor(mobPlayerCount / 2) + 1);
  const activeTieDuel = onlineTieDuels.find((duel) => duel.active) || onlineTieDuels[0] || null;
  const activeTieDuelCandidates = useMemo(() => activeTieDuel
    ? onlineTieDuelCandidates.filter((candidate) => candidate.tie_duel_id === activeTieDuel.id)
    : [],
  [activeTieDuel, onlineTieDuelCandidates]);
  const activeTieDuelVotes = useMemo(() => activeTieDuel
    ? onlineTieDuelVotes.filter((vote) => vote.tie_duel_id === activeTieDuel.id)
    : [],
  [activeTieDuel, onlineTieDuelVotes]);
  const tieDuelCandidateIds = activeTieDuelCandidates.map((candidate) => candidate.player_id);
  const tieDuelCandidatePlayers = connectedPlayers.filter((player) => tieDuelCandidateIds.includes(player.id));
  const tieDuelVoters = connectedPlayers.filter((player) => !tieDuelCandidateIds.includes(player.id) && player.id !== onlineRound?.hot_seat_player_id);
  const resolvedTieDuelVoters = tieDuelVoters.length > 0 ? tieDuelVoters : connectedPlayers.filter((player) => player.id !== onlineRound?.hot_seat_player_id);
  const myTieDuelCandidate = activeTieDuelCandidates.find((candidate) => candidate.player_id === currentPlayer?.id);
  const myTieDuelVote = activeTieDuelVotes.find((vote) => vote.voter_player_id === currentPlayer?.id);
  const allTieDuelCluesIn = activeTieDuelCandidates.length > 0 && activeTieDuelCandidates.every((candidate) => candidate.duel_clue);
  const allTieDuelVotesIn = resolvedTieDuelVoters.length > 0 && activeTieDuelVotes.length >= resolvedTieDuelVoters.length;
  const myYesNoAnswer = onlineYesNoAnswers.find((answer) => answer.player_id === currentPlayer?.id);
  const allYesNoAnswersIn = connectedPlayers.length > 0 && onlineYesNoAnswers.length >= connectedPlayers.length;
  const hotSeatPlayer = connectedPlayers.find((player) => player.id === onlineRound?.hot_seat_player_id);
  const isHotSeatPlayer = currentPlayer?.id === onlineRound?.hot_seat_player_id;
  const hotSeatVoters = connectedPlayers.filter((player) => player.id !== onlineRound?.hot_seat_player_id);
  const myHotSeatVote = onlineHotSeatVotes.find((vote) => vote.voter_player_id === currentPlayer?.id);
  const allHotSeatVotesIn = hotSeatVoters.length > 0 && onlineHotSeatVotes.length >= hotSeatVoters.length;

  useEffect(() => {
    const identity = loadReconnectIdentity();
    if (canReconnect(identity)) setReconnectIdentity(identity);
  }, []);

  function applySnapshot(snapshot) {
    setOnlineState((current) => current ? { ...current, session: snapshot.session } : current);
    setLobbyPlayers(snapshot.players);
    setOnlineRound(snapshot.round);
    setOnlineVotes(snapshot.votes || []);
    setOnlineSkipVotes(snapshot.skipVotes || []);
    setOnlineClues(snapshot.clues || []);
    setOnlineYesNoAnswers(snapshot.yesNoAnswers || []);
    setOnlineHotSeatVotes(snapshot.hotSeatVotes || []);
    setOnlineTieDuels(snapshot.tieDuels || []);
    setOnlineTieDuelCandidates(snapshot.tieDuelCandidates || []);
    setOnlineTieDuelVotes(snapshot.tieDuelVotes || []);
  }

  useEffect(() => {
    if (!onlineState?.session?.id || !isSupabaseConfigured) return undefined;
    let active = true;
    async function refreshLobby() {
      try {
        const snapshot = await loadSessionSnapshot(onlineState.session.id);
        if (!active) return;
        applySnapshot(snapshot);
      } catch (err) {
        if (active) setError(err.message || 'Could not refresh online lobby.');
      }
    }
    refreshLobby();
    const unsubscribe = subscribeToSession(onlineState.session.id, refreshLobby);
    return () => { active = false; unsubscribe?.(); };
  }, [onlineState?.session?.id]);

  async function run(action) {
    setBusy(true); setError('');
    try {
      const result = await action();
      setOnlineState(result);
      setReconnectIdentity(result.identity);
      const snapshot = await loadSessionSnapshot(result.session.id);
      applySnapshot(snapshot);
    } catch (err) { setError(err.message || 'Online session action failed.'); } finally { setBusy(false); }
  }

  async function refreshCurrentLobby() {
    if (!onlineState?.session?.id) return;
    const snapshot = await loadSessionSnapshot(onlineState.session.id);
    applySnapshot(snapshot);
  }

  async function hostStartOnlineRound() {
    if (!onlineState?.session || !onlineState?.identity) return;
    setBusy(true); setError('');
    try {
      const result = await startOnlineRound({ session: onlineState.session, identity: onlineState.identity, players: lobbyPlayers, wordBank: WORD_BANK });
      setOnlineRound(result.round); setOnlineVotes([]); setOnlineSkipVotes([]); setGuessValue('');
      setOnlineClues([]); setOnlineYesNoAnswers([]); setOnlineHotSeatVotes([]); setOnlineTieDuels([]); setOnlineTieDuelCandidates([]); setOnlineTieDuelVotes([]);
      setOnlineState((current) => current ? { ...current, session: result.session } : current);
      setRoleVisible(false);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not start online round.'); } finally { setBusy(false); }
  }

  async function changePhase(status) {
    if (!onlineState?.session || !onlineState?.identity) return;
    setBusy(true); setError('');
    try {
      const session = await setOnlinePhase({ session: onlineState.session, identity: onlineState.identity, status });
      setOnlineState((current) => current ? { ...current, session } : current);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not change phase.'); } finally { setBusy(false); }
  }

  async function revealMyRole() {
    if (!onlineState?.identity?.playerId || !onlineState?.identity?.playerSecret) return;
    setRoleVisible(true);
    try {
      const updated = await markRoleSeen({ playerId: onlineState.identity.playerId, playerSecret: onlineState.identity.playerSecret });
      setLobbyPlayers((current) => current.map((player) => player.id === updated.id ? updated : player));
      setOnlineState((current) => current ? { ...current, player: updated } : current);
    } catch (err) { setError(err.message || 'Could not mark role as seen.'); }
  }

  async function voteToSkipSecret() {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound || !currentPlayer || isCurrentPlayerImpostor) return;
    setBusy(true); setError('');
    try {
      const result = await submitOnlineSecretSkipVote({ session: onlineState.session, identity: onlineState.identity, round: onlineRound, players: connectedPlayers, wordBank: WORD_BANK });
      if (result.skipped) {
        setRoleVisible(false);
        setOnlineVotes([]);
        setOnlineSkipVotes([]);
        setOnlineRound(result.round);
        setOnlineState((current) => current ? { ...current, session: result.session } : current);
      }
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit skip vote.'); } finally { setBusy(false); }
  }

  async function voteForPlayer(targetPlayerId) {
    if (!onlineState?.session?.id || !onlineRound?.id || !onlineState?.identity?.playerId) return;
    setBusy(true); setError('');
    try {
      await submitOnlineVote({
        sessionId: onlineState.session.id,
        roundId: onlineRound.id,
        voterPlayerId: onlineState.identity.playerId,
        playerSecret: onlineState.identity.playerSecret,
        targetPlayerId,
        votePhase: activeVotePhase,
      });
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit vote.'); } finally { setBusy(false); }
  }

  async function hostFinishVote() {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound) return;
    setBusy(true); setError('');
    try {
      const result = await finishOnlineVote({ session: onlineState.session, identity: onlineState.identity, round: onlineRound, players: connectedPlayers, votes: onlineVotes, allowFinalGuess: currentSettings.allowImpostorFinalGuess });
      setOnlineState((current) => current ? { ...current, session: result.session } : current);
      setOnlineRound(result.round);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not finish vote.'); } finally { setBusy(false); }
  }

  async function submitGuess() {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound || !guessValue.trim()) return;
    setBusy(true); setError('');
    try {
      const result = await submitOnlineImpostorGuess({ session: onlineState.session, identity: onlineState.identity, round: onlineRound, guess: guessValue });
      setOnlineState((current) => current ? { ...current, session: result.session } : current);
      setOnlineRound(result.round);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit impostor guess.'); } finally { setBusy(false); }
  }

  async function submitQuestionAnswer(answer) {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound) return;
    setBusy(true); setError('');
    try {
      await submitOnlineYesNoAnswer({ sessionId: onlineState.session.id, roundId: onlineRound.id, playerId: onlineState.identity.playerId, playerSecret: onlineState.identity.playerSecret, answer });
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit answer.'); } finally { setBusy(false); }
  }

  async function hostContinueAfterQuestion() {
    if (!onlineState?.session || !onlineState?.identity) return;
    setBusy(true); setError('');
    try {
      const session = await continueOnlineAfterQuestion({ session: onlineState.session, identity: onlineState.identity });
      setOnlineState((current) => current ? { ...current, session } : current);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not continue to vote.'); } finally { setBusy(false); }
  }

  async function submitHotSeatClue() {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound || !hotSeatClueValue.trim()) return;
    setBusy(true); setError('');
    try {
      const result = await submitOnlineHotSeatClue({ sessionId: onlineState.session.id, round: onlineRound, playerId: onlineState.identity.playerId, playerSecret: onlineState.identity.playerSecret, clue: hotSeatClueValue });
      setHotSeatClueValue('');
      setOnlineState((current) => current ? { ...current, session: result.session } : current);
      setOnlineRound(result.round);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit Hot Seat clue.'); } finally { setBusy(false); }
  }

  async function submitHotSeatVote(vote) {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound) return;
    setBusy(true); setError('');
    try {
      await submitOnlineHotSeatVote({ sessionId: onlineState.session.id, round: onlineRound, voterPlayerId: onlineState.identity.playerId, playerSecret: onlineState.identity.playerSecret, vote });
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit Hot Seat vote.'); } finally { setBusy(false); }
  }

  async function hostResolveHotSeat() {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound) return;
    setBusy(true); setError('');
    try {
      const result = await resolveOnlineHotSeat({ session: onlineState.session, identity: onlineState.identity, round: onlineRound, players: connectedPlayers, votes: onlineHotSeatVotes });
      setOnlineState((current) => current ? { ...current, session: result.session } : current);
      setOnlineRound(result.round);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not resolve Hot Seat.'); } finally { setBusy(false); }
  }

  async function submitTieDuelClue() {
    if (!activeTieDuel || !myTieDuelCandidate || !onlineState?.identity || !tieDuelClueValue.trim()) return;
    setBusy(true); setError('');
    try {
      await submitOnlineTieDuelClue({ tieDuelId: activeTieDuel.id, playerId: onlineState.identity.playerId, playerSecret: onlineState.identity.playerSecret, clue: tieDuelClueValue });
      setTieDuelClueValue('');
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit duel clue.'); } finally { setBusy(false); }
  }

  async function hostContinueTieDuelVote() {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound) return;
    setBusy(true); setError('');
    try {
      const result = await continueOnlineTieDuelToVote({ session: onlineState.session, identity: onlineState.identity, round: onlineRound });
      setOnlineState((current) => current ? { ...current, session: result.session } : current);
      setOnlineRound(result.round);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not continue Tie Duel.'); } finally { setBusy(false); }
  }

  async function submitTieDuelVote(targetPlayerId) {
    if (!activeTieDuel || !onlineState?.identity) return;
    setBusy(true); setError('');
    try {
      await submitOnlineTieDuelVote({ tieDuelId: activeTieDuel.id, voterPlayerId: onlineState.identity.playerId, playerSecret: onlineState.identity.playerSecret, targetPlayerId });
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit duel vote.'); } finally { setBusy(false); }
  }

  async function hostResolveTieDuel() {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound || !activeTieDuel) return;
    setBusy(true); setError('');
    try {
      const result = await resolveOnlineTieDuel({ session: onlineState.session, identity: onlineState.identity, round: onlineRound, players: connectedPlayers, tieDuel: activeTieDuel, candidates: activeTieDuelCandidates, votes: activeTieDuelVotes });
      setOnlineState((current) => current ? { ...current, session: result.session } : current);
      setOnlineRound(result.round);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not resolve Tie Duel.'); } finally { setBusy(false); }
  }

  function forgetReconnect() {
    clearReconnectIdentity(); setReconnectIdentity(null); setOnlineState(null); setLobbyPlayers([]); setOnlineRound(null); setOnlineVotes([]); setOnlineSkipVotes([]); setOnlineClues([]); setOnlineYesNoAnswers([]); setOnlineHotSeatVotes([]); setOnlineTieDuels([]); setOnlineTieDuelCandidates([]); setOnlineTieDuelVotes([]); setRoleVisible(false); setGuessValue('');
  }

  async function copyCode() {
    if (!onlineState?.session?.code) return;
    try { await navigator.clipboard.writeText(onlineState.session.code); } catch { setError('Could not copy code automatically. Long press the code and copy it manually.'); }
  }

  return (
    <section className="panel-card online-panel">
      <div className="section-title-row"><div><p className="eyebrow">Online beta</p><h3>Session Code</h3></div></div>
      {!isSupabaseConfigured && <p className="warning-text online-warning">Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel to enable online sessions.</p>}

      {onlineState?.session && <div className="online-status-card"><span>Current session</span><strong>{onlineState.session.code}</strong><small>{onlineState.player?.name} · {onlineState.identity?.isHost ? 'Host' : 'Player'} · {onlineState.session.status}</small><div className="online-action-row"><button type="button" onClick={copyCode}>Copy Code</button><button type="button" className="ghost-button" onClick={() => refreshCurrentLobby().catch((err) => setError(err.message))}>Refresh</button></div></div>}

      {onlineState?.session && <div className="online-lobby-card"><div className="online-lobby-header"><span>Lobby</span><strong>{lobbyPlayers.length} player{lobbyPlayers.length === 1 ? '' : 's'}</strong></div><div className="online-player-list">{lobbyPlayers.map((player, index) => <div className="online-player-row" key={player.id}><span>{index + 1}</span><strong>{player.name}</strong><small>{player.is_host ? 'Host' : 'Player'} · {player.connected ? 'Online' : 'Away'}{player.has_seen_role ? ' · seen' : ''}</small></div>)}</div>
        {onlineState.identity?.isHost && onlineState.session.status === 'lobby' && <button className="online-start-button" type="button" disabled={busy || !canHostStart} onClick={hostStartOnlineRound}>Start Online Round</button>}
        {onlineState.identity?.isHost && onlineState.session.status === 'lobby' && !canHostStart && <p className="helper-text online-helper">Need at least 3 connected players before starting.</p>}
        {canHostChangePhase && onlineState.session.status === 'reveal' && <div className="online-action-row"><button type="button" disabled={busy} onClick={() => changePhase('clues')}>Start clues</button></div>}
        {canHostChangePhase && onlineState.session.status === 'clues' && <div className="online-action-row"><button type="button" disabled={busy} onClick={() => changePhase(currentSettings.yesNoQuestionRound ? 'question' : 'vote')}>{currentSettings.yesNoQuestionRound ? 'Question Round' : 'Vote'}</button></div>}

        {onlineState.session.status === 'reveal' && currentPlayer && <div className={`online-reveal-card ${currentPlayer.role === 'impostor' ? 'is-impostor' : 'is-mob'}`}><span>Your private role</span>{!roleVisible && !currentPlayer.has_seen_role ? <button type="button" onClick={revealMyRole}>Tap to Reveal</button> : <><strong>{currentPlayer.role === 'impostor' ? 'Impostor' : 'MOB'}</strong><small>{currentPlayer.role === 'impostor' ? 'Blend in. You do not see the secret word.' : `Secret word: ${onlineRound?.word || 'loading...'}`}</small><small>Category: {onlineRound?.category || 'loading...'}</small>{currentPlayer.role !== 'impostor' && <div className="online-skip-box"><span>Secret skip vote</span><small>Privately vote to reroll this word. Do not say you voted skip, because that clears you.</small><button type="button" disabled={busy || Boolean(mySkipVote)} onClick={voteToSkipSecret}>{mySkipVote ? 'Skip vote recorded' : 'Vote to skip word'}</button><small>Passes at {skipVotesNeeded} hidden vote{skipVotesNeeded === 1 ? '' : 's'}.</small></div>}</>}</div>}

        {onlineState.session.status === 'clues' && <div className="online-phase-card"><span>Clue phase</span><strong>Give clues</strong><small>Category: {onlineRound?.category || 'loading...'} · Host moves everyone on when ready.</small></div>}

        {onlineState.session.status === 'question' && <div className="online-vote-card"><span>Question Round</span><strong>{onlineRound?.yes_no_question || 'Question loading...'}</strong>{myYesNoAnswer ? <small>Your answer is in. Waiting for the group.</small> : <div className="online-vote-grid"><button type="button" disabled={busy} onClick={() => submitQuestionAnswer(true)}>Yes</button><button type="button" disabled={busy} onClick={() => submitQuestionAnswer(false)}>No</button></div>}<small>{onlineYesNoAnswers.length} / {connectedPlayers.length} answered</small>{onlineState.identity?.isHost && <button className="online-start-button" type="button" disabled={busy || !allYesNoAnswersIn} onClick={hostContinueAfterQuestion}>Reveal answers & vote</button>}</div>}

        {onlineState.session.status === 'vote' && <div className="online-vote-card"><span>Vote phase</span><strong>{initialVotes.length} / {connectedPlayers.length} voted</strong>{onlineYesNoAnswers.length > 0 && <div className="online-result-list">{onlineYesNoAnswers.map((answer) => { const player = connectedPlayers.find((item) => item.id === answer.player_id); return <div key={answer.id}><span>{player?.name || 'Player'}</span><strong>{answer.answer ? 'Yes' : 'No'}</strong></div>; })}</div>}{myVote ? <small>Your vote is in. Waiting for the rest of the MOB.</small> : <div className="online-vote-grid">{connectedPlayers.filter((player) => player.id !== currentPlayer?.id).map((player) => <button key={player.id} type="button" disabled={busy} onClick={() => voteForPlayer(player.id)}>{player.name}</button>)}</div>}{onlineState.identity?.isHost && <button className="online-start-button" type="button" disabled={busy || initialVotes.length === 0} onClick={hostFinishVote}>{allConnectedVoted ? 'Finish Vote' : 'Finish Early'}</button>}</div>}

        {onlineState.session.status === 'tie_duel_clues' && <div className="online-vote-card"><span>Tie Duel</span><strong>Tied players give one extra clue.</strong><div className="online-result-list">{activeTieDuelCandidates.map((candidate) => { const player = connectedPlayers.find((item) => item.id === candidate.player_id); return <div key={candidate.id}><span>{player?.name || 'Player'}</span><strong>{candidate.duel_clue || 'Waiting'}</strong></div>; })}</div>{myTieDuelCandidate && !myTieDuelCandidate.duel_clue ? <><input value={tieDuelClueValue} onChange={(event) => setTieDuelClueValue(event.target.value)} placeholder="One clue word" /><button type="button" disabled={busy || !tieDuelClueValue.trim()} onClick={submitTieDuelClue}>Submit Duel Clue</button></> : <small>{myTieDuelCandidate ? 'Your duel clue is in.' : 'Waiting for tied players.'}</small>}{onlineState.identity?.isHost && <button className="online-start-button" type="button" disabled={busy || !allTieDuelCluesIn} onClick={hostContinueTieDuelVote}>Start Duel Vote</button>}</div>}

        {onlineState.session.status === 'tie_duel_vote' && <div className="online-vote-card"><span>Tie Duel Vote</span><strong>{activeTieDuelVotes.length} / {resolvedTieDuelVoters.length} voted</strong>{myTieDuelVote ? <small>Your duel vote is in.</small> : resolvedTieDuelVoters.some((player) => player.id === currentPlayer?.id) ? <div className="online-vote-grid">{tieDuelCandidatePlayers.filter((player) => player.id !== currentPlayer?.id).map((player) => <button key={player.id} type="button" disabled={busy} onClick={() => submitTieDuelVote(player.id)}>{player.name}</button>)}</div> : <small>You are not voting in this duel.</small>}{onlineState.identity?.isHost && <button className="online-start-button" type="button" disabled={busy || !allTieDuelVotesIn} onClick={hostResolveTieDuel}>Resolve Tie Duel</button>}</div>}

        {onlineState.session.status === 'hot_seat_clue' && <div className="online-guess-card"><span>Hot Seat</span><strong>{hotSeatPlayer?.name || 'Player'} gives one final clue</strong>{isHotSeatPlayer ? <><input value={hotSeatClueValue} onChange={(event) => setHotSeatClueValue(event.target.value)} placeholder="One final clue" /><button type="button" disabled={busy || !hotSeatClueValue.trim()} onClick={submitHotSeatClue}>Submit Final Clue</button></> : <small>Waiting for the Hot Seat player.</small>}</div>}

        {onlineState.session.status === 'hot_seat_acceptance' && <div className="online-vote-card"><span>Hot Seat Defense</span><strong>{hotSeatPlayer?.name || 'Player'}: “{onlineRound?.hot_seat_final_clue || '—'}”</strong>{isHotSeatPlayer ? <small>You cannot vote on your own defense.</small> : myHotSeatVote ? <small>Your defense vote is in.</small> : <div className="online-vote-grid"><button type="button" disabled={busy} onClick={() => submitHotSeatVote('accept')}>Accept</button><button type="button" disabled={busy} onClick={() => submitHotSeatVote('reject')}>Reject</button></div>}<small>{onlineHotSeatVotes.length} / {hotSeatVoters.length} voted</small>{onlineState.identity?.isHost && <button className="online-start-button" type="button" disabled={busy || !allHotSeatVotesIn} onClick={hostResolveHotSeat}>Resolve Defense</button>}</div>}

        {onlineState.session.status === 'hot_seat_revote' && <div className="online-vote-card"><span>Hot Seat Revote</span><strong>{hotSeatRevotes.length} / {votePlayers.length} voted</strong><small>{hotSeatPlayer?.name || 'The Hot Seat player'} is safe and excluded.</small>{currentPlayer?.id === onlineRound?.hot_seat_player_id ? <small>You are excluded from this vote.</small> : myVote ? <small>Your revote is in.</small> : <div className="online-vote-grid">{votePlayers.filter((player) => player.id !== currentPlayer?.id).map((player) => <button key={player.id} type="button" disabled={busy} onClick={() => voteForPlayer(player.id)}>{player.name}</button>)}</div>}{onlineState.identity?.isHost && <button className="online-start-button" type="button" disabled={busy || hotSeatRevotes.length === 0} onClick={hostFinishVote}>{allConnectedVoted ? 'Finish Revote' : 'Finish Early'}</button>}</div>}

        {onlineState.session.status === 'guess' && <div className="online-guess-card"><span>Final impostor guess</span><strong>Guess the word</strong>{isCurrentPlayerImpostor ? <><input value={guessValue} onChange={(event) => setGuessValue(event.target.value)} placeholder="Type the secret word" /><button type="button" disabled={busy || !guessValue.trim()} onClick={submitGuess}>Submit Guess</button></> : <small>Impostor is guessing the secret word. Wait for results.</small>}</div>}

        {onlineState.session.status === 'results' && <div className={`online-result-card ${onlineRound?.outcome === 'mob' ? 'is-mob' : 'is-impostor'}`}><span>Results</span><strong>{onlineRound?.outcome === 'mob' ? 'MOB wins' : 'Impostor wins'}</strong>{onlineRound?.result_reason && <small>{onlineRound.result_reason}</small>}<small>Impostor: {impostorNames.join(', ') || 'loading...'}</small><small>Secret word: {onlineRound?.word || 'loading...'}</small>{onlineRound?.impostor_guess && <small>Guess: {onlineRound.impostor_guess}</small>}<div className="online-result-list">{voteResult.sorted.map((item) => <div key={item.player.id}><span>{item.player.name}</span><strong>{item.count}</strong></div>)}</div>{canHostPlayAgain && <button className="online-start-button" type="button" disabled={busy} onClick={hostStartOnlineRound}>Play Again</button>}</div>}
      </div>}

      {reconnectIdentity && !onlineState && <div className="online-status-card reconnect-card"><span>Reconnect available</span><strong>{reconnectIdentity.sessionCode}</strong><small>Return to your previous online session after a refresh or connection loss.</small><div className="online-action-row"><button type="button" disabled={busy || !isSupabaseConfigured} onClick={() => run(() => reconnectSession(reconnectIdentity))}>Reconnect</button><button type="button" className="ghost-button" onClick={forgetReconnect}>Forget</button></div></div>}
      {!onlineState?.session && <div className="online-grid"><div className="online-card"><h4>Create</h4><label><span>Host name</span><input value={hostName} onChange={(event) => setHostName(event.target.value)} placeholder="Host name" /></label><button type="button" disabled={busy || !isSupabaseConfigured || !hostName.trim()} onClick={() => run(() => createSession({ hostName: hostName.trim(), category, impostorCount, settings }))}>Create Code</button></div><div className="online-card"><h4>Join</h4><label><span>Session code</span><input inputMode="numeric" value={joinCode} onChange={(event) => setJoinCode(normalizeCode(event.target.value))} placeholder="123456" /></label><label><span>Your name</span><input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Player name" /></label><button type="button" disabled={busy || !isSupabaseConfigured || joinCode.length !== 6 || !playerName.trim()} onClick={() => run(() => joinSession({ code: joinCode, playerName: playerName.trim() }))}>Join Session</button></div></div>}
      {error && <p className="warning-text online-warning">{error}</p>}
    </section>
  );
}
