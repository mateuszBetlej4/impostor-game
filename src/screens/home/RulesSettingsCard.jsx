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

  const fieldStyle = { minWidth: 0, display: 'grid', gap: 8 };
  const selectStyle = { width: '100%', minWidth: 0 };

  return (
    <section className="panel-card settings-card" style={{ overflow: 'visible', gap: 12 }}>
      <div className="section-title-row" style={{ marginBottom: 2 }}>
        <div>
          <p className="eyebrow">Rules</p>
          <h3>Customise</h3>
        </div>
        <Trophy size={20} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 10,
          minWidth: 0,
        }}
      >
        <label style={fieldStyle}>
          <span>Clue rounds</span>
          <select style={selectStyle} value={settings.guessRounds} onChange={(event) => patchSettings({ guessRounds: Number(event.target.value) })}>
            {[0, 1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>{value === 0 ? 'Skip' : `${value}`}</option>
            ))}
          </select>
        </label>
        <label style={fieldStyle}>
          <span>MOB points</span>
          <select style={selectStyle} value={settings.pointsMobWin} onChange={(event) => patchSettings({ pointsMobWin: Number(event.target.value) })}>
            {[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label style={{ ...fieldStyle, gridColumn: '1 / span 1' }}>
          <span>Impostor points</span>
          <select style={selectStyle} value={settings.pointsImpostorWin} onChange={(event) => patchSettings({ pointsImpostorWin: Number(event.target.value) })}>
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <div className="toggle-list" style={{ display: 'grid', gap: 8, minWidth: 0 }}>
        <Toggle
          label="Show category"
          checked={settings.showCategoryToImpostor}
          onChange={(value) => patchSettings({ showCategoryToImpostor: value })}
          tooltip="Impostors see the category but not the secret word."
        />
        <Toggle
          label="Hot Seat Defense"
          checked={Boolean(settings.hotSeatDefense)}
          onChange={toggleHotSeat}
          tooltip="The voted player gives one final clue, then the group accepts or rejects the defense."
        />
        <Toggle
          label="Final guess save chance"
          checked={settings.allowImpostorFinalGuess}
          onChange={toggleFinalGuess}
          tooltip="When Hot Seat is off, a caught impostor can save the round by guessing the secret word."
        />
        <Toggle
          label="Yes/No Question"
          checked={Boolean(settings.yesNoQuestionRound)}
          onChange={(value) => patchSettings({ yesNoQuestionRound: value })}
          tooltip="After clues, everyone privately answers the same yes/no question before voting."
        />
        <Toggle
          label="Random pass order"
          checked={settings.randomisePassOrder}
          onChange={(value) => patchSettings({ randomisePassOrder: value })}
          tooltip="Randomises the order players pass the phone during reveal and clue phases."
        />
      </div>
    </section>
  );
}
