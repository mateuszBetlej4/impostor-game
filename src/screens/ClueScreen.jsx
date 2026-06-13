import { Trophy, Vote } from 'lucide-react';
import { DiscussionTimer } from '../components/index.js';

export function ClueScreen({ round, onNext }) {
  const total = Math.max(1, Number(round.settings.guessRounds || 0));

  return (
    <div className="screen-stack">
      <section className="hero-card compact-hero">
        <p className="eyebrow">Clue round {round.clueRound} of {total}</p>
        <h2>One clue each. No repeats. No obvious giveaways.</h2>
        <p className="hero-copy">Discuss the clues, but keep the actual word secret.</p>
      </section>
      <DiscussionTimer seconds={round.settings.discussionSeconds} timerKey={`clue-${round.clueRound}`} />
      <section className="panel-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Order</p>
            <h3>Lineup</h3>
          </div>
          <Trophy size={20} />
        </div>
        <ol className="ordered-list">
          {round.passOrder.map((player, index) => (
            <li key={player}>
              <span>{index + 1}</span>
              {player}
            </li>
          ))}
        </ol>
      </section>
      <button className="primary-action" type="button" onClick={onNext}>
        <Vote size={20} /> {round.clueRound >= total ? 'Start Vote' : 'Next Clue Round'}
      </button>
    </div>
  );
}
