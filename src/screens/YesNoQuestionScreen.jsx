export function YesNoQuestionScreen({ mode, round, player, questionPlayerIndex, submitAnswer, continueToVote }) {
  const answers = round.yesNoAnswers || {};
  const entries = round.passOrder.map((name) => [name, answers[name]]);

  if (mode === 'results') {
    return (
      <div className="screen-stack vote-screen-fit">
        <section className="hero-card compact-hero guess-hero bonus-summary-card">
          <p className="eyebrow">Question Round</p>
          <h2>Answers revealed.</h2>
          <p className="hero-copy">{round.yesNoQuestion}</p>
        </section>
        <section className="panel-card result-votes-card">
          <p className="eyebrow">Compare answers</p>
          <div className="compact-vote-list">
            {entries.map(([name, answer]) => (
              <div key={name} className="compact-vote-row">
                <span>{name}</span>
                <strong>{answer === true ? 'Yes' : answer === false ? 'No' : '—'}</strong>
              </div>
            ))}
          </div>
        </section>
        <button className="primary-action" type="button" onClick={continueToVote}>Continue to vote</button>
      </div>
    );
  }

  return (
    <div className="screen-stack vote-screen-fit">
      <div className="progress-pill">Question {questionPlayerIndex + 1} of {round.passOrder.length}</div>
      <section className="hero-card compact-hero guess-hero bonus-summary-card">
        <p className="eyebrow">Pass the phone to</p>
        <h2>{player}</h2>
        <p className="hero-copy">Answer privately. All answers will be revealed together after everyone responds.</p>
      </section>
      <section className="panel-card vote-panel compact-vote-panel">
        <p className="eyebrow">Yes/No question</p>
        <h2>{round.yesNoQuestion}</h2>
        <div className="vote-grid compact-target-grid">
          <button type="button" onClick={() => submitAnswer(true)}>Yes</button>
          <button type="button" onClick={() => submitAnswer(false)}>No</button>
        </div>
      </section>
    </div>
  );
}
