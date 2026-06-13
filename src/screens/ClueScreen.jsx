import { Trophy, Vote } from 'lucide-react';
import { DiscussionTimer } from '../components/index.js';

export function ClueScreen({ round, onNext }) {
  const total = Math.max(1, Number(round.settings.guessRounds || 0));
  const visiblePlayers = round.passOrder.slice(0, 8);
  const hiddenCount = Math.max(0, round.passOrder.length - visiblePlayers.length);

  return (
    <div className="screen-stack clue-screen legacy-clue-screen">
      <section className="hero-card compact-hero legacy-clue-summary">
        <p className="eyebrow">Clue round {round.clueRound} of {total}</p>
        <h2>One clue each.</h2>
        <p className="hero-copy">No repeats. No obvious giveaways. Keep the secret word hidden.</p>
      </section>
      <DiscussionTimer seconds={round.settings.discussionSeconds} timerKey={`clue-${round.clueRound}`} />
      <section className="panel-card legacy-lineup-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Order</p>
            <h3>Lineup</h3>
          </div>
          <Trophy size={20} />
        </div>
        <ol className="ordered-list compact-ordered-list">
          {visiblePlayers.map((player, index) => (
            <li key={player}>
              <span>{index + 1}</span>
              {player}
            </li>
          ))}
        </ol>
        {hiddenCount > 0 && <p className="helper-text compact-hidden-note">+{hiddenCount} more in pass order</p>}
      </section>
      <button className="primary-action" type="button" onClick={onNext}>
        <Vote size={20} /> {round.clueRound >= total ? 'Start Vote' : 'Next Clue Round'}
      </button>
    </div>
  );
}
