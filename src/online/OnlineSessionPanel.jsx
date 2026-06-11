import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from './supabaseClient.js';
import { createSession, joinSession } from './sessionService.js';
import { loadSessionSnapshot, reconnectSession, subscribeToSession } from './reconnectService.js';
import { canReconnect, clearReconnectIdentity, loadReconnectIdentity } from './reconnect.js';
import { normalizeCode } from './sessionCodes.js';

export function OnlineSessionPanel({ defaultHostName, category, impostorCount, settings }) {
  const [hostName, setHostName] = useState(defaultHostName || 'Host');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [reconnectIdentity, setReconnectIdentity] = useState(null);
  const [onlineState, setOnlineState] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
      } catch (err) {
        if (active) setError(err.message || 'Could not refresh online lobby.');
      }
    }

    refreshLobby();
    const unsubscribe = subscribeToSession(onlineState.session.id, refreshLobby);

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [onlineState?.session?.id]);

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      const result = await action();
      setOnlineState(result);
      setReconnectIdentity(result.identity);
      const snapshot = await loadSessionSnapshot(result.session.id);
      setLobbyPlayers(snapshot.players);
    } catch (err) {
      setError(err.message || 'Online session action failed.');
    } finally {
      setBusy(false);
    }
  }

  function forgetReconnect() {
    clearReconnectIdentity();
    setReconnectIdentity(null);
    setOnlineState(null);
    setLobbyPlayers([]);
  }

  async function copyCode() {
    if (!onlineState?.session?.code) return;
    try {
      await navigator.clipboard.writeText(onlineState.session.code);
    } catch {
      setError('Could not copy code automatically. Long press the code and copy it manually.');
    }
  }

  return (
    <section className="panel-card online-panel">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Online beta</p>
          <h3>Session Code</h3>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <p className="warning-text online-warning">
          Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel to enable online sessions.
        </p>
      )}

      {onlineState?.session && (
        <div className="online-status-card">
          <span>Current session</span>
          <strong>{onlineState.session.code}</strong>
          <small>{onlineState.player?.name} · {onlineState.identity?.isHost ? 'Host' : 'Player'} · {onlineState.session.status}</small>
          <div className="online-action-row">
            <button type="button" onClick={copyCode}>Copy Code</button>
            <button type="button" className="ghost-button" onClick={() => loadSessionSnapshot(onlineState.session.id).then((snapshot) => { setOnlineState((current) => current ? { ...current, session: snapshot.session } : current); setLobbyPlayers(snapshot.players); }).catch((err) => setError(err.message))}>Refresh</button>
          </div>
        </div>
      )}

      {onlineState?.session && (
        <div className="online-lobby-card">
          <div className="online-lobby-header">
            <span>Lobby</span>
            <strong>{lobbyPlayers.length} player{lobbyPlayers.length === 1 ? '' : 's'}</strong>
          </div>
          <div className="online-player-list">
            {lobbyPlayers.map((player, index) => (
              <div className="online-player-row" key={player.id}>
                <span>{index + 1}</span>
                <strong>{player.name}</strong>
                <small>{player.is_host ? 'Host' : 'Player'} · {player.connected ? 'Online' : 'Away'}</small>
              </div>
            ))}
          </div>
          {onlineState.identity?.isHost && <p className="helper-text online-helper">Host controls for online round start are next. This lobby already reconnects and updates live.</p>}
        </div>
      )}

      {reconnectIdentity && !onlineState && (
        <div className="online-status-card reconnect-card">
          <span>Reconnect available</span>
          <strong>{reconnectIdentity.sessionCode}</strong>
          <small>Return to your previous online session after a refresh or connection loss.</small>
          <div className="online-action-row">
            <button type="button" disabled={busy || !isSupabaseConfigured} onClick={() => run(() => reconnectSession(reconnectIdentity))}>Reconnect</button>
            <button type="button" className="ghost-button" onClick={forgetReconnect}>Forget</button>
          </div>
        </div>
      )}

      {!onlineState?.session && (
        <div className="online-grid">
          <div className="online-card">
            <h4>Create</h4>
            <label>
              <span>Host name</span>
              <input value={hostName} onChange={(event) => setHostName(event.target.value)} placeholder="Host name" />
            </label>
            <button type="button" disabled={busy || !isSupabaseConfigured || !hostName.trim()} onClick={() => run(() => createSession({ hostName: hostName.trim(), category, impostorCount, settings }))}>
              Create Code
            </button>
          </div>

          <div className="online-card">
            <h4>Join</h4>
            <label>
              <span>Session code</span>
              <input inputMode="numeric" value={joinCode} onChange={(event) => setJoinCode(normalizeCode(event.target.value))} placeholder="123456" />
            </label>
            <label>
              <span>Your name</span>
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Player name" />
            </label>
            <button type="button" disabled={busy || !isSupabaseConfigured || joinCode.length !== 6 || !playerName.trim()} onClick={() => run(() => joinSession({ code: joinCode, playerName: playerName.trim() }))}>
              Join Session
            </button>
          </div>
        </div>
      )}

      {error && <p className="warning-text online-warning">{error}</p>}
    </section>
  );
}
