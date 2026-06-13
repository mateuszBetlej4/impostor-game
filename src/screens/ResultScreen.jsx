import { Vote } from 'lucide-react';
import { MOB_LOGO_SRC } from '../logoData.js';

export function ResultScreen({ round, voteResult, onPlayAgain, onReset }) {
  const impostors = [...round.impostors];
  const winner = round.outcome || (voteResult.caught ? 'mob' : 'impostors');
  const title = winner === 'mob' ? 'MOB wins' : 'Impostor wins';

  return (
    <div className="screen-stack">
      <section className={`result-card ${winner === 'mob' ? 'caught' : 'escaped'}`}>
        <img className="result-logo" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" />
        <p className="eyebrow">The MOB has spoken</p>
        <h2>{title}</h2>
        <div className="result-facts">
          <div>
            <span>Impostor</span>
            <strong>{impostors.join(', ')}</strong>
          </div>
          <div>
            <span>Secret word</span>
            <strong>{round.word}</strong>
          </div>
          {round.impostorGuess && (
            <div>
              <span>Guess</span>
              <strong>{round.impostorGuess}</strong>
            </div>
          )}
          <div>
            <span>Category</span>
            <strong>{round.category}</strong>
          </div>
        </div>
      </section>
      <section className="panel-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Votes</p>
            <h3>Final count</h3>
          </div>
          <Vote size={20} />
        </div>
        <div className="vote-results">
          {voteResult.sorted.map(([player, count]) => (
            <div key={player} className="vote-result-row">
              <span>{player}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="action-grid">
        <button className="secondary-action" type="button" onClick={onReset}>New Setup</button>
        <button className="primary-action" type="button" onClick={onPlayAgain}>Play Again</button>
      </div>
    </div>
  );
}
