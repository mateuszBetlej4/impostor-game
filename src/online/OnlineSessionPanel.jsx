import { useEffect, useMemo, useState } from 'react';
import { WORD_BANK } from '../wordBank.js';
import { isSupabaseConfigured } from './supabaseClient.js';
import { createSession, joinSession } from './sessionService.js';
import { loadSessionSnapshot, reconnectSession, subscribeToSession } from './reconnectService.js';
import { canReconnect, clearReconnectIdentity, loadReconnectIdentity } from './reconnect.js';
import { normalizeCode } from './sessionCodes.js';
import { startOnlineRound } from './onlineRoundService.js';
import { markRoleSeen } from './onlineRevealService.js';
import { calculateOnlineVoteResult, finishOnlineVote, setOnlinePhase, submitOnlineVote } from './onlineVoteService.js';

export function OnlineSessionPanel({ defaultHostName, category, impostorCount, settings }) {
  const [hostName, setHostName] = useState(defaultHostName || 'Host');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [reconnectIdentity, setReconnectIdentity] = useState(null);
  const [onlineState, setOnlineState] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [onlineRound, setOnlineRound] = useState(null);
  const [onlineVotes, setOnlineVotes] = useState([]);
  const [roleVisible, setRoleVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const connectedPlayers = useMemo(() => lobbyPlayers.filter((player) => player.connected !== false), [lobbyPlayers]);
  const currentPlayer = useMemo(() => lobbyPlayers.find((player) => player.id === onlineState?.identity?.playerId) || onlineState?.player, [lobbyPlayers, onlineState]);
  const myVote = useMemo(() => onlineVotes.find((vote) => vote.voter_player_id === onlineState?.identity?.playerId), [onlineVotes, onlineState]);
  const voteResult = useMemo(() => calculateOnlineVoteResult({ players: connectedPlayers, votes: onlineVotes }), [connectedPlayers, onlineVotes]);
  const impostorNames = useMemo(() => lobbyPlayers.filter((player) => player.role === 'impostor').map((player) => player.name), [lobbyPlayers]);
  const canHostStart = Boolean(onlineState?.identity?.isHost && onlineState?.session?.status === 'lobby' && connectedPlayers.length >= 3);
  const canHostChangePhase = Boolean(onlineState?.identity?.isHost && onlineState?.session && onlineState?.session?.status !== 'lobby' && onlineState?.session?.status !== 'results');
  const allConnectedVoted = connectedPlayers.length > 0 && onlineVotes.length >= connectedPlayers.length;

  useEffect(() => {
    const identity = loadReconnectIdentity();
    if (canReconnect(identity)) setReconnectIdentity(identity);
  }, []);

  useEffect(() => {
    if (!onlineState?.session?.id || !isSupabaseConfigured) return undefined;
    let active = true;

    async function refreshLobby() {
      try {
        const snapshot = await loadSessionSnapshot(onlineState.session.id);
        if (!active) return;
        setOnlineState((current) => current ? { ...current, session: snapshot.session } : current);
        setLobbyPlayers(snapshot.players);
        setOnlineRound(snapshot.round);
        setOnlineVotes(snapshot.votes || []);
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
      setLobbyPlayers(snapshot.players);
      setOnlineRound(snapshot.round);
      setOnlineVotes(snapshot.votes || []);
    } catch (err) {
      setError(err.message || 'Online session action failed.');
    } finally { setBusy(false); }
  }

  async function refreshCurrentLobby() {
    if (!onlineState?.session?.id) return;
    const snapshot = await loadSessionSnapshot(onlineState.session.id);
    setOnlineState((current) => current ? { ...current, session: snapshot.session } : current);
    setLobbyPlayers(snapshot.players);
    setOnlineRound(snapshot.round);
    setOnlineVotes(snapshot.votes || []);
  }

  async function hostStartOnlineRound() {
    if (!onlineState?.session || !onlineState?.identity) return;
    setBusy(true); setError('');
    try {
      const result = await startOnlineRound({ session: onlineState.session, identity: onlineState.identity, players: lobbyPlayers, wordBank: WORD_BANK });
      setOnlineRound(result.round);
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

  async function voteForPlayer(targetPlayerId) {
    if (!onlineState?.session?.id || !onlineRound?.id || !onlineState?.identity?.playerId) return;
    setBusy(true); setError('');
    try {
      await submitOnlineVote({ sessionId: onlineState.session.id, roundId: onlineRound.id, voterPlayerId: onlineState.identity.playerId, playerSecret: onlineState.identity.playerSecret, targetPlayerId });
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not submit vote.'); } finally { setBusy(false); }
  }

  async function hostFinishVote() {
    if (!onlineState?.session || !onlineState?.identity || !onlineRound) return;
    setBusy(true); setError('');
    try {
      const result = await finishOnlineVote({ session: onlineState.session, identity: onlineState.identity, round: onlineRound, players: connectedPlayers, votes: onlineVotes });
      setOnlineState((current) => current ? { ...current, session: result.session } : current);
      setOnlineRound(result.round);
      await refreshCurrentLobby();
    } catch (err) { setError(err.message || 'Could not finish vote.'); } finally { setBusy(false); }
  }

  function forgetReconnect() {
    clearReconnectIdentity(); setReconnectIdentity(null); setOnlineState(null); setLobbyPlayers([]); setOnlineRound(null); setOnlineVotes([]); setRoleVisible(false);
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
        {canHostChangePhase && <div className="online-action-row"><button type="button" disabled={busy} onClick={() => changePhase('clues')}>Clues</button><button type="button" disabled={busy} className="ghost-button" onClick={() => changePhase('vote')}>Vote</button></div>}

        {onlineState.session.status === 'reveal' && currentPlayer && <div className={`online-reveal-card ${currentPlayer.role === 'impostor' ? 'is-impostor' : 'is-mob'}`}><span>Your private role</span>{!roleVisible && !currentPlayer.has_seen_role ? <button type="button" onClick={revealMyRole}>Tap to Reveal</button> : <><strong>{currentPlayer.role === 'impostor' ? 'Impostor' : 'MOB'}</strong><small>{currentPlayer.role === 'impostor' ? 'Blend in. You do not see the secret word.' : `Secret word: ${onlineRound?.word || 'loading...'}`}</small><small>Category: {onlineRound?.category || 'loading...'}</small></>}</div>}
        {onlineState.session.status === 'clues' && <div className="online-phase-card"><span>Clue phase</span><strong>Give clues</strong><small>Category: {onlineRound?.category || 'loading...'} · Host can move everyone to voting when ready.</small></div>}
        {onlineState.session.status === 'vote' && <div className="online-vote-card"><span>Vote phase</span><strong>{onlineVotes.length} / {connectedPlayers.length} voted</strong>{myVote ? <small>Your vote is in. Waiting for the rest of the MOB.</small> : <div className="online-vote-grid">{connectedPlayers.filter((player) => player.id !== currentPlayer?.id).map((player) => <button key={player.id} type="button" disabled={busy} onClick={() => voteForPlayer(player.id)}>{player.name}</button>)}</div>}{onlineState.identity?.isHost && <button className="online-start-button" type="button" disabled={busy || onlineVotes.length === 0} onClick={hostFinishVote}>{allConnectedVoted ? 'Finish Vote' : 'Finish Early'}</button>}</div>}
        {onlineState.session.status === 'results' && <div className={`online-result-card ${onlineRound?.outcome === 'mob' ? 'is-mob' : 'is-impostor'}`}><span>Results</span><strong>{onlineRound?.outcome === 'mob' ? 'MOB wins' : 'Impostor wins'}</strong><small>Impostor: {impostorNames.join(', ') || 'loading...'}</small><small>Secret word: {onlineRound?.word || 'loading...'}</small><div className="online-result-list">{voteResult.sorted.map((item) => <div key={item.player.id}><span>{item.player.name}</span><strong>{item.count}</strong></div>)}</div></div>}
      </div>}

      {reconnectIdentity && !onlineState && <div className="online-status-card reconnect-card"><span>Reconnect available</span><strong>{reconnectIdentity.sessionCode}</strong><small>Return to your previous online session after a refresh or connection loss.</small><div className="online-action-row"><button type="button" disabled={busy || !isSupabaseConfigured} onClick={() => run(() => reconnectSession(reconnectIdentity))}>Reconnect</button><button type="button" className="ghost-button" onClick={forgetReconnect}>Forget</button></div></div>}

      {!onlineState?.session && <div className="online-grid"><div className="online-card"><h4>Create</h4><label><span>Host name</span><input value={hostName} onChange={(event) => setHostName(event.target.value)} placeholder="Host name" /></label><button type="button" disabled={busy || !isSupabaseConfigured || !hostName.trim()} onClick={() => run(() => createSession({ hostName: hostName.trim(), category, impostorCount, settings }))}>Create Code</button></div><div className="online-card"><h4>Join</h4><label><span>Session code</span><input inputMode="numeric" value={joinCode} onChange={(event) => setJoinCode(normalizeCode(event.target.value))} placeholder="123456" /></label><label><span>Your name</span><input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Player name" /></label><button type="button" disabled={busy || !isSupabaseConfigured || joinCode.length !== 6 || !playerName.trim()} onClick={() => run(() => joinSession({ code: joinCode, playerName: playerName.trim() }))}>Join Session</button></div></div>}
      {error && <p className="warning-text online-warning">{error}</p>}
    </section>
  );
}
