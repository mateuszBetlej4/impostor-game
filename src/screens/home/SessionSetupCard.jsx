import { Sparkles } from 'lucide-react';
import { Toggle } from '../../components/index.js';

export function SessionSetupCard({
  category,
  setCategory,
  categoryNames,
  impostorCount,
  setImpostorCount,
  maxImpostors,
  settings,
  patchSettings,
}) {
  function toggleHotSeat(value) {
    patchSettings({
      hotSeatDefense: value,
      allowImpostorFinalGuess: value ? false : true,
    });
  }

  function toggleFinalGuess(value) {
    patchSettings({
      allowImpostorFinalGuess: value,
      hotSeatDefense: value ? false : settings.hotSeatDefense,
    });
  }

  return (
    <section className="panel-card settings-card priority-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Session</p>
          <h3>Game setup</h3>
        </div>
        <Sparkles size={20} />
      </div>

      <label>
        <span>Category / set</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="Random">Random</option>
          {categoryNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>

      <div className="settings-grid">
        <label>
          <span>Impostors</span>
          <select value={impostorCount} onChange={(event) => setImpostorCount(Number(event.target.value))}>
            {Array.from({ length: maxImpostors }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Clue rounds</span>
          <select value={settings.guessRounds} onChange={(event) => patchSettings({ guessRounds: Number(event.target.value) })}>
            {[0, 1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>{value === 0 ? 'Skip' : value}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="toggle-list">
        <Toggle label="Show category to impostor" checked={settings.showCategoryToImpostor} onChange={(value) => patchSettings({ showCategoryToImpostor: value })} />
        <Toggle label="Hot Seat Defense" checked={Boolean(settings.hotSeatDefense)} onChange={toggleHotSeat} />
        <Toggle label="Impostor save chance: final guess" checked={settings.allowImpostorFinalGuess} onChange={toggleFinalGuess} />
        {settings.hotSeatDefense && <p className="warning-text">Final guess is disabled while Hot Seat Defense is active.</p>}
        <Toggle label="Yes/No Question Round" checked={Boolean(settings.yesNoQuestionRound)} onChange={(value) => patchSettings({ yesNoQuestionRound: value })} />
        <Toggle label="Randomise pass order" checked={settings.randomisePassOrder} onChange={(value) => patchSettings({ randomisePassOrder: value })} />
      </div>
    </section>
  );
}
