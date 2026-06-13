export function GuessScreen({ impostors, guessValue, setGuessValue, submitImpostorGuess, skipGuess }) {
  return (
    <div className="screen-stack guess-screen">
      <section className="hero-card compact-hero guess-hero">
        <p className="eyebrow">Final chance</p>
        <h2>{impostors.join(', ')}, guess the secret word.</h2>
        <p className="hero-copy">A correct guess steals the round for the impostor team.</p>
      </section>

      <section className="panel-card final-guess-card">
        <div className="final-guess-orb" aria-hidden="true" />
        <p className="eyebrow">Impostor last chance</p>
        <h3>Steal the win</h3>
        <p className="helper-text">Type the exact secret word or a strong partial guess.</p>
        <label className="final-guess-field">
          <span>Secret word</span>
          <div className="final-guess-input-wrap">
            <input
              value={guessValue}
              onChange={(event) => setGuessValue(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') submitImpostorGuess(); }}
              placeholder="Make your guess"
              autoFocus
            />
          </div>
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
