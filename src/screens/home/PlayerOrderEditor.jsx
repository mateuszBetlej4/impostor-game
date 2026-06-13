import { Users } from 'lucide-react';

export function PlayerOrderEditor({ players, newPlayer, setNewPlayer, addPlayer, removePlayer, movePlayer }) {
  return (
    <section className="panel-card player-editor-card">
      <div className="section-title-row player-title-row">
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

      <div className="pass-order-list player-scroll-list">
        {players.map((player, index) => (
          <div key={player} className="pass-order-row player-scroll-row">
            <span className="order-number">{index + 1}</span>
            <strong title={player}>{player}</strong>
            <div className="order-actions">
              <button type="button" onClick={() => movePlayer(index, -1)} disabled={index === 0}>↑</button>
              <button type="button" onClick={() => movePlayer(index, 1)} disabled={index === players.length - 1}>↓</button>
              <button type="button" className="remove-order" onClick={() => removePlayer(player)}>×</button>
            </div>
          </div>
        ))}
      </div>

      <div className="input-row player-add-row">
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
