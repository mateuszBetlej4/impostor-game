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

  const fieldStyle = { minWidth: 0, display: 'grid', gap: 8 };
  const selectStyle = { width: '100%', minWidth: 0 };

  return (
    <section
      className="panel-card settings-card priority-card"
      style={{
        overflow: 'visible',
        gap: 12,
      }}
    >
      <div className="section-title-row" style={{ marginBottom: 4 }}>
        <div>
          <p className="eyebrow">Session</p>
          <h3>Game setup</h3>
        </div>
        <Sparkles size={20} />
      </div>

      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
        <label style={fieldStyle}>
          <span>Category / set</span>
          <select style={selectStyle} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="Random">Random</option>
            {categoryNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 10,
            minWidth: 0,
          }}
        >
          <label style={fieldStyle}>
            <span>Impostors</span>
            <select style={selectStyle} value={impostorCount} onChange={(event) => setImpostorCount(Number(event.target.value))}>
              {Array.from({ length: maxImpostors }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Clue rounds</span>
            <select style={selectStyle} value={settings.guessRounds} onChange={(event) => patchSettings({ guessRounds: Number(event.target.value) })}>
              {[0, 1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>{value === 0 ? 'Skip' : value}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div
        className="toggle-list"
        style={{
          display: 'grid',
          gap: 8,
          minWidth: 0,
        }}
      >
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
