import { Send, Trophy } from 'lucide-react';

export function ClueInputScreen({ round, player, clueValue, setClueValue, submitClue }) {
  const totalRounds = Math.max(1, Number(round.settings.guessRounds || 0));
  const clueNumber = (round.cluePlayerIndex || 0) + 1;
  const clues = round.clues || [];

  return (
    <div className="screen-stack">
      <div className="progress-pill">
        Clue round {round.clueRound} of {totalRounds} · Player {clueNumber} of {round.passOrder.length}
      </div>

      <section className="hero-card compact-hero">
        <p className="eyebrow">Pass the phone to</p>
        <h2>{player}</h2>
        <p className="hero-copy">Type one clue. Do not repeat another player's clue and do not reveal the secret word.</p>
      </section>

      <section className="panel-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Already said</p>
            <h3>Clue history</h3>
          </div>
          <Trophy size={20} />
        </div>
        {clues.length === 0 ? (
          <p className="helper-text">No clues have been entered yet.</p>
        ) : (
          <div className="score-list">
            {clues.map((entry, index) => (
              <div className="score-row" key={`${entry.round}-${entry.player}-${index}`}>
                <span>R{entry.round} · {entry.player}</span>
                <strong>{entry.clue}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel-card">
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

      <button className="primary-action" type="button" disabled={!clueValue.trim()} onClick={submitClue}>
        <Send size={20} /> Save clue & pass phone
      </button>
    </div>
  );
}
