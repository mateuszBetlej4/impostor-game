import { Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PLAYERS_PER_PAGE = 6;

export function PlayerOrderEditor({ players, newPlayer, setNewPlayer, addPlayer, removePlayer, movePlayer }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(players.length / PLAYERS_PER_PAGE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const startIndex = page * PLAYERS_PER_PAGE;
  const visiblePlayers = useMemo(
    () => players.slice(startIndex, startIndex + PLAYERS_PER_PAGE),
    [players, startIndex],
  );
  const firstVisible = players.length ? startIndex + 1 : 0;
  const lastVisible = Math.min(players.length, startIndex + visiblePlayers.length);

  return (
    <section
      className="panel-card player-editor-card"
      style={{
        minHeight: 'min(500px, calc(100dvh - 250px))',
        display: 'grid',
        gridTemplateRows: 'auto auto minmax(0, 1fr) auto auto',
        gap: 10,
      }}
    >
      <div className="section-title-row player-title-row" style={{ marginBottom: 0 }}>
        <div>
          <p className="eyebrow">Phone pass order</p>
          <h3>Players</h3>
        </div>
        <Users size={20} />
      </div>

      <div className="compact-count-row">
        <span>{players.length} player{players.length === 1 ? '' : 's'}</span>
        <strong>{players.length >= 3 ? 'Ready' : 'Need 3+'}</strong>
      </div>

      <div
        className="pass-order-list"
        style={{
          alignContent: 'start',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 8,
          minWidth: 0,
        }}
      >
        {visiblePlayers.map((player, index) => {
          const absoluteIndex = startIndex + index;
          return (
            <div key={player} className="pass-order-row" style={{ minWidth: 0, minHeight: 52 }}>
              <span className="order-number" style={{ width: 36, height: 36, borderRadius: 13, fontSize: 16 }}>{absoluteIndex + 1}</span>
              <strong title={player} style={{ fontSize: 16 }}>{player}</strong>
              <div className="order-actions" style={{ flex: '0 0 auto' }}>
                <button type="button" onClick={() => movePlayer(absoluteIndex, -1)} disabled={absoluteIndex === 0}>↑</button>
                <button type="button" onClick={() => movePlayer(absoluteIndex, 1)} disabled={absoluteIndex === players.length - 1}>↓</button>
                <button type="button" className="remove-order" onClick={() => removePlayer(player)}>×</button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="compact-pager" aria-label="Player pages" style={{ alignSelf: 'end' }}>
          <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>Prev</button>
          <span>{firstVisible}-{lastVisible} of {players.length}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1}>Next</button>
        </div>
      )}

      <div className="input-row player-add-row" style={{ alignSelf: 'end', marginTop: 8 }}>
        <input
          value={newPlayer}
          onChange={(event) => setNewPlayer(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') addPlayer(); }}
          placeholder="Add player name"
        />
        <button type="button" onClick={addPlayer}>Add</button>
      </div>
    </section>
  );
}
