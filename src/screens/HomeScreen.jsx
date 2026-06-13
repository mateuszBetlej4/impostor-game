import { useEffect, useState } from 'react';
import { OnlineSessionPanel } from '../online/OnlineSessionPanel.jsx';
import {
  CustomSetBuilder,
  PlayerOrderEditor,
  PlayModeSelector,
  RulesSettingsCard,
  ScoreCard,
  SessionSetupCard,
  WordLibraryStats,
} from './home/index.js';

function HomeBriefingCard({ homeTab, setupMode, players, category, impostorCount, settings, selectedWordCount, usedWordCount, totalWords, canStart, hasScores }) {
  const shortSet = category === 'Random' ? 'Random' : category.replace('Custom: ', '');
  const panels = {
    play: {
      eyebrow: setupMode === 'online' ? 'Online lobby' : 'Local lobby',
      title: canStart ? 'Ready' : 'Need players',
      chips: [
        ['Players', players.length],
        ['Set', shortSet],
        ['Imp.', impostorCount],
      ],
    },
    players: {
      eyebrow: 'Roster',
      title: players.length >= 3 ? 'Crew ready' : 'Need 3+',
      chips: [
        ['Players', players.length],
        ['Order', settings.randomisePassOrder ? 'Random' : 'Manual'],
        ['Scores', hasScores ? 'On' : 'Off'],
      ],
    },
    rules: {
      eyebrow: 'Rules',
      title: 'Modifiers',
      chips: [
        ['Clues', settings.guessRounds],
        ['Guess', settings.allowImpostorFinalGuess ? 'On' : 'Off'],
        ['Hint', settings.showCategoryToImpostor ? 'On' : 'Off'],
      ],
    },
    library: {
      eyebrow: 'Words',
      title: 'Pool',
      chips: [
        ['Selected', selectedWordCount],
        ['Used', `${usedWordCount}/${totalWords}`],
        ['Mode', category === 'Random' ? 'Random' : 'Custom'],
      ],
    },
  };

  const current = panels[homeTab] || panels.play;

  return (
    <section
      className={`home-briefing-card ${canStart ? 'is-ready' : 'is-locked'}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 2fr)',
        gap: 10,
        alignItems: 'stretch',
        minWidth: 0,
      }}
    >
      <div className="briefing-main" style={{ minWidth: 0 }}>
        <span>{current.eyebrow}</span>
        <strong style={{ whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 0.95 }}>{current.title}</strong>
      </div>
      <div className="briefing-chip-grid" style={{ minWidth: 0, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {current.chips.map(([label, value]) => (
          <div key={label} style={{ minWidth: 0, overflow: 'hidden' }}>
            <span>{label}</span>
            <strong title={String(value)} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeScreen({
  homeTab,
  setHomeTab,
  setupMode,
  setSetupMode,
  players,
  newPlayer,
  setNewPlayer,
  addPlayer,
  removePlayer,
  movePlayer,
  category,
  setCategory,
  categoryNames,
  customSetNames,
  settings,
  patchSettings,
  impostorCount,
  setImpostorCount,
  canStart,
  scores,
  resetScores,
  usedWordCount,
  totalWords,
  selectedWordCount,
  resetUsedWords,
  customSetName,
  setCustomSetName,
  customSetBase,
  setCustomSetBase,
  customSetWords,
  setCustomSetWords,
  saveCustomSet,
  deleteCustomSet,
}) {
  const [showSetBuilder, setShowSetBuilder] = useState(false);
  const hasScores = Object.values(scores).some((score) => score > 0);
  const maxImpostors = Math.max(1, players.length - 1);
  const hostName = players[0] || 'Host';
  const tabs = [['play', 'Play'], ['players', 'Players'], ['rules', 'Rules'], ['library', 'Library']];

  useEffect(() => {
    if (homeTab !== 'library') setShowSetBuilder(false);
  }, [homeTab]);

  function saveSetAndReturn() {
    saveCustomSet();
    setShowSetBuilder(false);
  }

  return (
    <div className={`screen-stack home-tab-layout app-fit-home home-tab-${homeTab}${showSetBuilder ? ' is-building-set' : ''}`}>
      <div className="home-tab-content">
        {!showSetBuilder && (
          <HomeBriefingCard
            homeTab={homeTab}
            setupMode={setupMode}
            players={players}
            category={category}
            impostorCount={impostorCount}
            settings={settings}
            selectedWordCount={selectedWordCount}
            usedWordCount={usedWordCount}
            totalWords={totalWords}
            canStart={canStart}
            hasScores={hasScores}
          />
        )}

        {homeTab === 'play' && (
          <>
            <PlayModeSelector setupMode={setupMode} setSetupMode={setSetupMode} />
            {setupMode === 'online' && (
              <OnlineSessionPanel defaultHostName={hostName} category={category} impostorCount={impostorCount} settings={settings} />
            )}
            <SessionSetupCard
              category={category}
              setCategory={setCategory}
              categoryNames={categoryNames}
              impostorCount={impostorCount}
              setImpostorCount={setImpostorCount}
              maxImpostors={maxImpostors}
              settings={settings}
              patchSettings={patchSettings}
            />
            {!canStart && <p className="warning-text">You need at least 3 players, and impostors must be fewer than players.</p>}
          </>
        )}

        {homeTab === 'players' && (
          <>
            <PlayerOrderEditor
              players={players}
              newPlayer={newPlayer}
              setNewPlayer={setNewPlayer}
              addPlayer={addPlayer}
              removePlayer={removePlayer}
              movePlayer={movePlayer}
            />
            {hasScores && <ScoreCard scores={scores} players={players} resetScores={resetScores} />}
          </>
        )}

        {homeTab === 'rules' && (
          <RulesSettingsCard
            settings={settings}
            patchSettings={patchSettings}
          />
        )}

        {homeTab === 'library' && !showSetBuilder && (
          <>
            <WordLibraryStats
              usedWordCount={usedWordCount}
              totalWords={totalWords}
              selectedWordCount={selectedWordCount}
              resetUsedWords={resetUsedWords}
            />
            <section className="panel-card library-actions-card" style={{ padding: 22 }}>
              <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 14 }}>Custom words</p>
              <button className="primary-action" type="button" onClick={() => setShowSetBuilder(true)}>
                Build new set
              </button>
            </section>
          </>
        )}

        {homeTab === 'library' && showSetBuilder && (
          <>
            <button className="secondary-action library-back-action" type="button" onClick={() => setShowSetBuilder(false)}>
              Back to library
            </button>
            <CustomSetBuilder
              customSetName={customSetName}
              setCustomSetName={setCustomSetName}
              customSetBase={customSetBase}
              setCustomSetBase={setCustomSetBase}
              customSetWords={customSetWords}
              setCustomSetWords={setCustomSetWords}
              categoryNames={categoryNames}
              customSetNames={customSetNames}
              saveCustomSet={saveSetAndReturn}
              deleteCustomSet={deleteCustomSet}
            />
          </>
        )}
      </div>

      <nav className="setup-bottom-nav" aria-label="Setup sections">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" className={homeTab === key ? 'active' : ''} onClick={() => setHomeTab(key)}>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
