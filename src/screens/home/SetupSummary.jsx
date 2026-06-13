import { MOB_LOGO_SRC } from '../../logoData.js';

export function SetupSummary({ homeTab, setupMode, playerCount, category, selectedWordCount }) {
  const title = homeTab === 'play'
    ? 'Choose mode and session.'
    : homeTab === 'players'
      ? 'Set the MOB lineup.'
      : homeTab === 'rules'
        ? 'Tune the rules.'
        : 'Manage the word library.';

  return (
    <section className="hero-card setup-summary compact-setup-summary">
      <img className="hero-logo" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" />
      <p className="eyebrow">Pre-game setup</p>
      <h2>{title}</h2>
      <div className="summary-grid">
        <div>
          <span>Mode</span>
          <strong>{setupMode === 'online' ? 'Online' : 'Local'}</strong>
        </div>
        <div>
          <span>Players</span>
          <strong>{playerCount}</strong>
        </div>
        <div>
          <span>Set</span>
          <strong>{category}</strong>
        </div>
        <div>
          <span>Words</span>
          <strong>{selectedWordCount}</strong>
        </div>
      </div>
    </section>
  );
}
