import { RotateCcw } from 'lucide-react';
import { MOB_LOGO_SRC } from '../logoData.js';

const SCREEN_LABELS = {
  confirm: 'Briefing',
  reveal: 'Reveal',
  clueInput: 'Clue',
  yesNoQuestion: 'Question',
  yesNoResults: 'Answers',
  vote: 'Vote',
  tieDuelClues: 'Tie duel',
  tieDuelVote: 'Tie duel',
  hotSeatClue: 'Hot seat',
  hotSeatAcceptance: 'Defense',
  hotSeatRevote: 'Revote',
  bonusVote: 'Tie break',
  guess: 'Final guess',
  result: 'Result',
};

export function Header({ screen, onReset, onStart, canStart }) {
  const isSetup = screen === 'home';

  return (
    <header className="app-header game-hud-header">
      <div className="brand-lockup">
        <img className="crest-mark crest-image" src={MOB_LOGO_SRC} alt="A$AP MOB FC crest" />
        <div>
          <p className="eyebrow">A$AP MOB</p>
          <h1>MOB Impostor</h1>
        </div>
      </div>
      <div className="header-actions">
        {isSetup ? (
          <button className="header-start" type="button" disabled={!canStart} onClick={onStart}>
            Start
          </button>
        ) : (
          <>
            <span className="header-stage-badge">{SCREEN_LABELS[screen] || 'Game'}</span>
            <button className="icon-button" type="button" onClick={onReset} aria-label="Reset game">
              <RotateCcw size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
