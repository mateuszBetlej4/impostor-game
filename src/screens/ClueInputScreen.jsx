import { Send, Trophy } from 'lucide-react';

export function ClueInputScreen({ round, player, clueValue, setClueValue, submitClue }) {
  const totalRounds = Math.max(1, Number(round.settings.guessRounds || 0));
  const clueNumber = (round.cluePlayerIndex || 0) + 1;
  const clues = round.clues || [];
  const recentClues = clues.slice(-5);

  return (
    <div className="screen-stack clue-input-screen legacy-clue-input-screen">
      <div className="progress-pill">
        Clue round {round.clueRound} of {totalRounds} · Player {clueNumber} of {round.passOrder.length}
      </div>

      <section className="hero-card compact-hero legacy-clue-summary">
        <p className="eyebrow">Pass the phone to</p>
        <h2>{player}</h2>
        <p className="hero-copy">Type one clue. Do not repeat another player's clue.</p>
      </section>

      <section className="panel-card clue-history-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Already said</p>
            <h3>Clue history</h3>
          </div>
          <Trophy size={20} />
        </div>
        {recentClues.length === 0 ? (
          <p className="helper-text">No clues have been entered yet.</p>
        ) : (
          <div className="compact-clue-list">
            {recentClues.map((entry, index) => (
              <div className="compact-clue-row" key={`${entry.round}-${entry.player}-${index}`}>
                <span>R{entry.round} · {entry.player}</span>
                <strong>{entry.clue}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel-card clue-entry-card">
        <label className="guess-field">
          <span>{player}'s clue</span>
          <input
            value={clueValue}
            onChange={(event) => setClueValue(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') submitClue(); }}
            placeholder="Type a clue"
            autoFocus
          />
        </label>
      </section>

      <button className="primary-action clue-bottom-action" type="button" disabled={!clueValue.trim()} onClick={submitClue}>
        <Send size={20} /> Save clue & pass phone
      </button>
    </div>
  );
}
