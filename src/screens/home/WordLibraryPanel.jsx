import { RotateCcw, Sparkles } from 'lucide-react';

export function WordLibraryStats({ usedWordCount, totalWords, selectedWordCount, resetUsedWords }) {
  return (
    <section className="panel-card settings-card priority-card library-stats-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Word library</p>
          <h3>Current pool</h3>
        </div>
        <Sparkles size={20} />
      </div>
      <div className="library-stat-grid">
        <div className="score-row">
          <span>Used</span>
          <strong>{usedWordCount} / {totalWords}</strong>
        </div>
        <div className="score-row">
          <span>Selected</span>
          <strong>{selectedWordCount}</strong>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
        <button
          className="secondary-action"
          type="button"
          disabled={usedWordCount === 0}
          onClick={resetUsedWords}
          style={{ width: 'min(100%, 260px)', minHeight: 50, borderRadius: 18 }}
        >
          <RotateCcw size={18} /> Reset word history
        </button>
      </div>
    </section>
  );
}

export function CustomSetBuilder({
  customSetName,
  setCustomSetName,
  customSetBase,
  setCustomSetBase,
  customSetWords,
  setCustomSetWords,
  categoryNames,
  customSetNames,
  saveCustomSet,
  deleteCustomSet,
}) {
  return (
    <section className="panel-card custom-set-builder-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Custom library</p>
          <h3>Build a Set</h3>
        </div>
        <Sparkles size={20} />
      </div>
      <div className="settings-grid custom-set-grid">
        <label>
          <span>Set name</span>
          <input value={customSetName} onChange={(event) => setCustomSetName(event.target.value)} placeholder="e.g. Le Mans Trip" />
        </label>
        <label>
          <span>Start from existing set</span>
          <select value={customSetBase} onChange={(event) => setCustomSetBase(event.target.value)}>
            <option value="Blank">Blank set</option>
            {categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label>
          <span>Add new words</span>
          <textarea
            value={customSetWords}
            onChange={(event) => setCustomSetWords(event.target.value)}
            placeholder="One word per line, or separated by commas"
            rows="4"
          />
        </label>
      </div>
      <button className="primary-action" type="button" onClick={saveCustomSet}>Save Custom Set</button>
      {customSetNames.length > 0 && (
        <div className="custom-set-list">
          {customSetNames.map((name) => (
            <div className="score-row" key={name}>
              <span>{name}</span>
              <button className="mini-button" type="button" onClick={() => deleteCustomSet(name)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
