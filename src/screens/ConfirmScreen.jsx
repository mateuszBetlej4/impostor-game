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
  const playerPreview = players.slice(0, 4).join(', ');
  const extraPlayers = Math.max(0, players.length - 4);

  return (
    <div className="screen-stack confirm-screen-fit">
      <section className="panel-card confirm-card confirm-review-card">
        <div className="section-title-row confirm-title-row">
          <div>
            <p className="eyebrow">Review</p>
            <h3>Start game?</h3>
          </div>
        </div>

        <div className="confirm-primary-grid">
          <div>
            <span>Players</span>
            <strong>{players.length}</strong>
          </div>
          <div>
            <span>Impostors</span>
            <strong>{impostorCount}</strong>
          </div>
          <div>
            <span>Clue rounds</span>
            <strong>{settings.guessRounds}</strong>
          </div>
          <div>
            <span>Timer</span>
            <strong>{settings.discussionSeconds ? `${settings.discussionSeconds}s` : 'Off'}</strong>
          </div>
        </div>

        <div className="confirm-compact-list">
          <div>
            <span>Set</span>
            <strong>{category}</strong>
          </div>
          <div>
            <span>Words</span>
            <strong>{selectedWordCount} selected · {usedWordCount}/{totalWords} used</strong>
          </div>
          <div>
            <span>Pass order</span>
            <strong>{settings.randomisePassOrder ? 'Random' : 'Manual'}</strong>
          </div>
          <div>
            <span>Players preview</span>
            <strong>{playerPreview}{extraPlayers ? ` +${extraPlayers}` : ''}</strong>
          </div>
        </div>
      </section>

      <div className="action-grid confirm-action-grid">
        <button className="secondary-action" type="button" onClick={onBack}>Edit Setup</button>
        <button className="primary-action" type="button" onClick={onConfirm}>Confirm & Reveal</button>
      </div>
    </div>
  );
}
