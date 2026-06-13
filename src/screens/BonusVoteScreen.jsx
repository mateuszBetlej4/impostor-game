import { DiscussionTimer } from '../components/index.js';

export function BonusVoteScreen({ round, submitBonusVote }) {
  return (
    <div className="screen-stack">
      <section className="hero-card compact-hero guess-hero">
        <p className="eyebrow">Bonus vote</p>
        <h2>Final group decision.</h2>
        <p className="hero-copy">{round.bonusReason || 'The vote was tied. Discuss and choose one final option together.'}</p>
      </section>
      <DiscussionTimer seconds={round.settings.discussionSeconds} timerKey={`bonus-${round.bonusCandidates.join('-')}`} />
      <section className="panel-card vote-panel">
        <p className="eyebrow">Choose one player</p>
        <div className="vote-grid">
          {round.bonusCandidates.map((player) => (
            <button key={player} type="button" onClick={() => submitBonusVote(player)}>
              {player}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
