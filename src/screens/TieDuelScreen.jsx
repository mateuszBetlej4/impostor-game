import { Send } from 'lucide-react';
import { DiscussionTimer } from '../components/index.js';

export function TieDuelScreen({
  mode,
  round,
  candidate,
  clueIndex,
  clueValue,
  setClueValue,
  submitClue,
  voter,
  voterIndex,
  totalVoters,
  voteTargets,
  submitVote,
}) {
  if (mode === 'clues') {
    return (
      <div className="screen-stack clue-input-screen legacy-clue-input-screen">
        <div className="progress-pill">Tie Duel clue {clueIndex + 1} of {round.bonusCandidates.length}</div>
        <section className="hero-card compact-hero legacy-clue-summary">
          <p className="eyebrow">Tie Duel</p>
          <h2>{candidate}</h2>
          <p className="hero-copy">The vote is tied. Each tied player gives one extra clue word.</p>
        </section>
        <section className="panel-card clue-entry-card">
          <label className="guess-field">
            <span>{candidate}'s duel clue</span>
            <input
              value={clueValue}
              onChange={(event) => setClueValue(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') submitClue(); }}
              placeholder="Type one clue"
              autoFocus
            />
          </label>
        </section>
        <button className="primary-action clue-bottom-action" type="button" disabled={!clueValue.trim()} onClick={submitClue}>
          <Send size={20} /> Save duel clue
        </button>
      </div>
    );
  }

  return (
    <div className="screen-stack bonus-vote-screen vote-screen-fit">
      <section className="hero-card compact-hero guess-hero bonus-summary-card">
        <p className="eyebrow">Tie Duel</p>
        <h2>Choose from the tied players.</h2>
        <p className="hero-copy">{round.bonusReason || 'The tied players gave one extra clue. Vote again between them.'}</p>
      </section>
      <DiscussionTimer seconds={round.settings.discussionSeconds} timerKey={`tie-duel-${round.bonusCandidates.join('-')}`} />
      <section className="panel-card vote-panel compact-vote-panel">
        <p className="eyebrow">Pass the phone to {voter}</p>
        <h2>Who seems more suspicious?</h2>
        <div className="compact-clue-list">
          {round.bonusCandidates.map((player) => (
            <div className="compact-clue-row" key={player}>
              <span>{player}</span>
              <strong>{round.bonusDuelClues?.[player] || '—'}</strong>
            </div>
          ))}
        </div>
        <div className="vote-grid compact-target-grid">
          {voteTargets.filter((player) => player !== voter).map((player) => (
            <button key={player} type="button" onClick={() => submitVote(player)}>{player}</button>
          ))}
        </div>
        <p className="helper-text">Duel vote {voterIndex + 1} of {totalVoters}</p>
      </section>
    </div>
  );
}
