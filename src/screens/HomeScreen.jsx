import { Sparkles } from 'lucide-react';
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
  sessionPresets,
  settings,
  patchSettings,
  applyPreset,
  impostorCount,
  setImpostorCount,
  canStart,
  startRound,
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
    <div className="screen-stack home-tab-layout app-fit-home">
      <div className="home-tab-content">
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
            />
            {!canStart && <p className="warning-text">You need at least 3 players, and impostors must be fewer than players.</p>}
            <button className="primary-action bottom-start" type="button" disabled={!canStart} onClick={startRound}>
              <Sparkles size={20} /> Review & Start
            </button>
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
            sessionPresets={sessionPresets}
            settings={settings}
            patchSettings={patchSettings}
            applyPreset={applyPreset}
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
