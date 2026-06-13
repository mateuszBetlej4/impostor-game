import { Send } from 'lucide-react';

export function HotSeatScreen({
  mode,
  round,
  clueValue,
  setClueValue,
  submitClue,
  voter,
  voterIndex,
  totalVoters,
  submitAcceptanceVote,
}) {
  if (mode === 'clue') {
    return (
      <div className="screen-stack clue-input-screen legacy-clue-input-screen">
        <section className="hero-card compact-hero legacy-clue-summary">
          <p className="eyebrow">Hot Seat</p>
          <h2>{round.hotSeatPlayer}</h2>
          <p className="hero-copy">Give one final clue word to convince the group you know the secret.</p>
        </section>
        <section className="panel-card clue-entry-card">
          <label className="guess-field">
            <span>Final clue word</span>
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
          <Send size={20} /> Save final clue
        </button>
      </div>
    );
  }

  return (
    <div className="screen-stack vote-screen-fit">
      <div className="progress-pill">Defense vote {voterIndex + 1} of {totalVoters}</div>
      <section className="hero-card compact-hero guess-hero bonus-summary-card">
        <p className="eyebrow">Hot Seat Defense</p>
        <h2>{round.hotSeatPlayer}'s final clue:</h2>
        <p className="hero-copy">“{round.hotSeatFinalClue}”</p>
      </section>
      <section className="panel-card vote-panel compact-vote-panel">
        <p className="eyebrow">Pass the phone to {voter}</p>
        <h2>Accept this defense?</h2>
        <p className="helper-text">Accept means this player is safe and excluded from the redo vote. A tie rejects the defense.</p>
        <div className="vote-grid compact-target-grid">
          <button type="button" onClick={() => submitAcceptanceVote('accept')}>Accept</button>
          <button type="button" onClick={() => submitAcceptanceVote('reject')}>Reject</button>
        </div>
      </section>
    </div>
  );
}
