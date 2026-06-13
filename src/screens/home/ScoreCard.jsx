export function ScoreCard({ scores, players, resetScores }) {
  const entries = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([name]) => players.includes(name));

  if (!entries.length) return null;

  return (
    <section className="panel-card score-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Season table</p>
          <h3>Scores</h3>
        </div>
        <button className="mini-button" type="button" onClick={resetScores}>Reset</button>
      </div>
      <div className="score-list">
        {entries.map(([name, score]) => (
          <div className="score-row" key={name}>
            <span>{name}</span>
            <strong>{score}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
