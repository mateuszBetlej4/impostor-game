import { Vote } from 'lucide-react';

export function ResultScreen({ round, voteResult, onPlayAgain, onReset }) {
  const impostors = [...round.impostors];
  const winner = round.outcome || (voteResult.caught ? 'mob' : 'impostors');
  const title = winner === 'mob' ? 'MOB wins' : 'Impostor wins';
  const topVotes = voteResult.sorted.slice(0, 5);

  return (
    <div className="screen-stack result-screen-fit">
      <section className={`panel-card result-summary-card ${winner === 'mob' ? 'caught' : 'escaped'}`}>
        <p className="eyebrow">Result</p>
        <h2>{title}</h2>
        <div className="result-stat-grid">
          <div>
            <span>Impostor</span>
            <strong>{impostors.join(', ')}</strong>
          </div>
          <div>
            <span>Secret</span>
            <strong>{round.word}</strong>
          </div>
          <div>
            <span>Set</span>
            <strong>{round.category}</strong>
          </div>
          <div>
            <span>Guess</span>
            <strong>{round.impostorGuess || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="panel-card result-votes-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Votes</p>
            <h3>Final count</h3>
          </div>
          <Vote size={18} />
        </div>
        <div className="compact-vote-list">
          {topVotes.map(([player, count]) => (
            <div key={player} className="compact-vote-row">
              <span>{player}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="action-grid result-action-grid">
        <button className="secondary-action" type="button" onClick={onReset}>New Setup</button>
        <button className="primary-action" type="button" onClick={onPlayAgain}>Play Again</button>
      </div>
    </div>
  );
}
