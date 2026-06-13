export function PlayModeSelector({ setupMode, setSetupMode }) {
  return (
    <section className="panel-card compact-mode-card">
      <div className="setup-mode-switch compact-mode-switch" aria-label="Play mode">
        <button type="button" className={setupMode === 'local' ? 'selected' : ''} onClick={() => setSetupMode('local')}>
          <strong>Local</strong>
          <small>One phone</small>
        </button>
        <button type="button" className={setupMode === 'online' ? 'selected' : ''} onClick={() => setSetupMode('online')}>
          <strong>Online</strong>
          <small>Code room</small>
        </button>
      </div>
    </section>
  );
}
