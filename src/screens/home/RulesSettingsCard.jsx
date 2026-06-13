import { Trophy } from 'lucide-react';
import { Toggle } from '../../components/index.js';

export function RulesSettingsCard({ settings, patchSettings }) {
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
    <section className="panel-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Rules</p>
          <h3>Customisation</h3>
        </div>
        <Trophy size={20} />
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
        <Toggle
          label="Show category to impostor"
          checked={settings.showCategoryToImpostor}
          onChange={(value) => patchSettings({ showCategoryToImpostor: value })}
          tooltip="When enabled, impostors see the category but not the secret word. This makes bluffing slightly easier."
        />
        <Toggle
          label="Hot Seat Defense"
          checked={Boolean(settings.hotSeatDefense)}
          onChange={toggleHotSeat}
          tooltip="Replaces the impostor final guess. The voted player gives one final clue, then the group accepts or rejects the defense."
        />
        <Toggle
          label="Impostor save chance: final guess"
          checked={settings.allowImpostorFinalGuess}
          onChange={toggleFinalGuess}
          tooltip="When Hot Seat is off, a caught impostor can still save the round by guessing the secret word."
        />
        <Toggle
          label="Yes/No Question Round"
          checked={Boolean(settings.yesNoQuestionRound)}
          onChange={(value) => patchSettings({ yesNoQuestionRound: value })}
          tooltip="After clues, everyone privately answers the same yes/no question about the secret word before voting."
        />
        <Toggle
          label="Randomise pass order at start"
          checked={settings.randomisePassOrder}
          onChange={(value) => patchSettings({ randomisePassOrder: value })}
          tooltip="Randomises the order players pass the phone during reveal and clue phases."
        />
      </div>
    </section>
  );
}
