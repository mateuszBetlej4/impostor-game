export function ConfirmScreen({
  players,
  category,
  selectedWordCount,
  impostorCount,
  settings,
  totalWords,
  usedWordCount,
  onBack,
  onConfirm,
}) {
  return (
    <div className="screen-stack">
      <section className="hero-card compact-hero confirm-card">
        <p className="eyebrow">Verify session</p>
        <h2>Ready to run this setup?</h2>
        <div className="confirm-list">
          <div>
            <span>Players</span>
            <strong>{players.length}: {players.join(', ')}</strong>
          </div>
          <div>
            <span>Category / set</span>
            <strong>{category}</strong>
          </div>
          <div>
            <span>Words in pool</span>
            <strong>{selectedWordCount} selected · {usedWordCount}/{totalWords} used</strong>
          </div>
          <div>
            <span>Impostors</span>
            <strong>{impostorCount}</strong>
          </div>
          <div>
            <span>Clue rounds before vote</span>
            <strong>{settings.guessRounds}</strong>
          </div>
          <div>
            <span>Discussion timer</span>
            <strong>{settings.discussionSeconds ? `${settings.discussionSeconds}s` : 'No timer'}</strong>
          </div>
          <div>
            <span>Category shown to impostor</span>
            <strong>{settings.showCategoryToImpostor ? 'Yes' : 'No'}</strong>
          </div>
          <div>
            <span>Final impostor guess</span>
            <strong>{settings.allowImpostorFinalGuess ? 'On' : 'Off'}</strong>
          </div>
          <div>
            <span>Pass order</span>
            <strong>{settings.randomisePassOrder ? 'Randomised' : 'Manual order'}</strong>
          </div>
        </div>
      </section>
      <div className="action-grid">
        <button className="secondary-action" type="button" onClick={onBack}>Edit Setup</button>
        <button className="primary-action" type="button" onClick={onConfirm}>Confirm & Reveal</button>
      </div>
    </div>
  );
}
