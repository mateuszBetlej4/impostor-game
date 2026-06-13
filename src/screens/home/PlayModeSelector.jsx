import { Sparkles } from 'lucide-react';

export function PlayModeSelector({ setupMode, setSetupMode }) {
  return (
    <section className="panel-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Play mode</p>
          <h3>Local or Online</h3>
        </div>
        <Sparkles size={20} />
      </div>
      <div className="setup-mode-switch">
        <button type="button" className={setupMode === 'local' ? 'selected' : ''} onClick={() => setSetupMode('local')}>
          <strong>Local</strong>
          <small>One phone pass-and-play.</small>
        </button>
        <button type="button" className={setupMode === 'online' ? 'selected' : ''} onClick={() => setSetupMode('online')}>
          <strong>Online beta</strong>
          <small>Create or join with a code.</small>
        </button>
      </div>
    </section>
  );
}
