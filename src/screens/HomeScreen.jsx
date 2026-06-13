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
  const panels = {
    play: {
      eyebrow: setupMode === 'online' ? 'Online lobby' : 'Local lobby',
      title: canStart ? 'Ready to configure' : 'Build the crew',
      chips: [
        ['Players', players.length],
        ['Set', category === 'Random' ? 'Random' : category.replace('Custom: ', '')],
        ['Impostors', impostorCount],
      ],
    },
    players: {
      eyebrow: 'Roster control',
      title: players.length >= 3 ? 'Crew assembled' : 'Need more players',
      chips: [
        ['Players', players.length],
        ['Order', settings.randomisePassOrder ? 'Random' : 'Manual'],
        ['Scores', hasScores ? 'Active' : 'Clean'],
      ],
    },
    rules: {
      eyebrow: 'Rules loadout',
      title: 'Round modifiers',
      chips: [
        ['Clues', settings.guessRounds],
        ['Final guess', settings.allowImpostorFinalGuess ? 'On' : 'Off'],
        ['Hint', settings.showCategoryToImpostor ? 'On' : 'Off'],
      ],
    },
    library: {
      eyebrow: 'Word arsenal',
      title: 'Secret pool',
      chips: [
        ['Selected', selectedWordCount],
        ['Used', `${usedWordCount}/${totalWords}`],
        ['Mode', category === 'Random' ? 'Random' : 'Custom'],
      ],
    },
  };

  const current = panels[homeTab] || panels.play;

  return (
    <section className={`home-briefing-card ${canStart ? 'is-ready' : 'is-locked'}`}>
      <div className="briefing-main">
        <span>{current.eyebrow}</span>
        <strong>{current.title}</strong>
      </div>
      <div className="briefing-chip-grid">
        {current.chips.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
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
            <section className="panel-card library-actions-card">
              <p className="eyebrow">Custom words</p>
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
