export function GuessScreen({ impostors, guessValue, setGuessValue, submitImpostorGuess, skipGuess }) {
  return (
    <div className="screen-stack">
      <section className="hero-card compact-hero guess-hero">
        <p className="eyebrow">Final chance</p>
        <h2>{impostors.join(', ')}, guess the secret word.</h2>
        <p className="hero-copy">A correct guess steals the round for the impostor team.</p>
      </section>
      <section className="panel-card">
        <label>
          <span>Secret word guess</span>
          <input
            value={guessValue}
            onChange={(event) => setGuessValue(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') submitImpostorGuess(); }}
            placeholder="Type the word"
            autoFocus
          />
        </label>
      </section>
      <div className="action-grid">
        <button className="secondary-action" type="button" onClick={skipGuess}>Skip guess</button>
        <button className="primary-action" type="button" onClick={submitImpostorGuess} disabled={!guessValue.trim()}>
          Submit guess
        </button>
      </div>
    </div>
  );
}
