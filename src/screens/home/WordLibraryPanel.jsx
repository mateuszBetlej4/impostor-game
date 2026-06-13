import { Sparkles } from 'lucide-react';

export function WordLibraryStats({ usedWordCount, totalWords, selectedWordCount, resetUsedWords }) {
  return (
    <section className="panel-card settings-card priority-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Word library</p>
          <h3>Current pool</h3>
        </div>
        <Sparkles size={20} />
      </div>
      <div className="score-row">
        <span>Words used</span>
        <strong>{usedWordCount} / {totalWords}</strong>
      </div>
      <div className="score-row">
        <span>Selected set</span>
        <strong>{selectedWordCount}</strong>
      </div>
      <button className="secondary-action" type="button" onClick={resetUsedWords}>Reset Word History</button>
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
    <section className="panel-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Custom library</p>
          <h3>Build a Set</h3>
        </div>
        <Sparkles size={20} />
      </div>
      <div className="settings-grid">
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
            rows="5"
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
