import { Trophy } from 'lucide-react';
import { Toggle } from '../../components/index.js';

export function RulesSettingsCard({ sessionPresets, settings, patchSettings, applyPreset }) {
  function toggleHotSeat(value) {
    patchSettings({
      hotSeatDefense: value,
      allowImpostorFinalGuess: value ? false : settings.allowImpostorFinalGuess,
    });
  }

  function toggleFinalGuess(value) {
    patchSettings({
      allowImpostorFinalGuess: value,
      hotSeatDefense: value ? false : settings.hotSeatDefense,
    });
  }

  return (
    <section className="panel-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Rules</p>
          <h3>Customisation</h3>
        </div>
        <Trophy size={20} />
      </div>
      <div className="preset-row">
        {Object.entries(sessionPresets).map(([key, preset]) => (
          <button key={key} type="button" className="preset-button" onClick={() => applyPreset(key)}>
            <strong>{preset.name}</strong>
            <small>{preset.description}</small>
          </button>
        ))}
      </div>
      <div className="settings-grid">
        <label>
          <span>Clue rounds before vote</span>
          <select value={settings.guessRounds} onChange={(event) => patchSettings({ guessRounds: Number(event.target.value) })}>
            {[0, 1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>{value === 0 ? 'Skip straight to vote' : `${value} round${value > 1 ? 's' : ''}`}</option>
            ))}
          </select>
        </label>
        <label>
          <span>MOB win points</span>
          <select value={settings.pointsMobWin} onChange={(event) => patchSettings({ pointsMobWin: Number(event.target.value) })}>
            {[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>Impostor win points</span>
          <select value={settings.pointsImpostorWin} onChange={(event) => patchSettings({ pointsImpostorWin: Number(event.target.value) })}>
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <div className="toggle-list">
        <Toggle label="Show category to impostor" checked={settings.showCategoryToImpostor} onChange={(value) => patchSettings({ showCategoryToImpostor: value })} />
        <Toggle label="Hot Seat Defense" checked={Boolean(settings.hotSeatDefense)} onChange={toggleHotSeat} />
        <p className="helper-text">Hot Seat replaces the impostor final guess. The voted player gives one final clue, then the group accepts or rejects the defense.</p>
        <Toggle label="Yes/No Question Round" checked={Boolean(settings.yesNoQuestionRound)} onChange={(value) => patchSettings({ yesNoQuestionRound: value })} />
        <p className="helper-text">After clues, everyone privately answers the same yes/no question about the secret word before voting.</p>
        <Toggle label="Impostor final guess after being caught" checked={settings.allowImpostorFinalGuess} onChange={toggleFinalGuess} />
        {settings.hotSeatDefense && <p className="warning-text">Final guess is disabled while Hot Seat Defense is active.</p>}
        <Toggle label="Randomise pass order at start" checked={settings.randomisePassOrder} onChange={(value) => patchSettings({ randomisePassOrder: value })} />
      </div>
    </section>
  );
}
