import { Eye, EyeOff, Shield, Skull } from 'lucide-react';
import { getSecretStructureHint } from '../game/index.js';

export function RevealScreen({
  player,
  roleVisible,
  setRoleVisible,
  isImpostor,
  category,
  word,
  currentIndex,
  totalPlayers,
  finishCurrentReveal,
  showCategoryToImpostor,
  submitSecretSkipVote,
  hasSkipVoted,
  skipVotesNeeded,
}) {
  const structureHint = getSecretStructureHint(word);

  return (
    <div className="screen-stack reveal-layout">
      <div className="progress-pill">Reveal {currentIndex + 1} of {totalPlayers}</div>
      <section className="role-card">
        <p className="eyebrow">Pass the crown to</p>
        <h2>{player}</h2>
        {!roleVisible ? (
          <button className="hold-card" type="button" onClick={() => setRoleVisible(true)}>
            <Eye size={34} />
            <span>Tap to reveal role</span>
            <small>Keep it hidden from the MOB.</small>
          </button>
        ) : (
          <div className={`secret-card ${isImpostor ? 'is-impostor' : 'is-crew'}`}>
            {isImpostor ? <Skull size={42} /> : <Shield size={42} />}
            <p className="eyebrow">{isImpostor ? 'You are the impostor' : 'You are in the MOB'}</p>
            <h3>{isImpostor ? 'Blend in.' : word}</h3>
            {isImpostor && showCategoryToImpostor && <p>Category hint: <strong>{category}</strong></p>}
            {isImpostor && structureHint && <p>Word shape: <strong>{structureHint}</strong></p>}
            <small>
              {isImpostor
                ? 'Fake a clue, survive the vote, then guess the word if you get caught.'
                : 'Give clues that prove you know the word, but do not make it too obvious.'}
            </small>
          </div>
        )}
      </section>
      {roleVisible && !isImpostor && (
        <section className="panel-card">
          <p className="eyebrow">Secret skip vote</p>
          <h3>Bad word?</h3>
          <p className="helper-text">
            You can privately vote to skip this secret. Do not say you voted skip, because that would prove you are not the impostor.
          </p>
          <button className="secondary-action" type="button" disabled={hasSkipVoted} onClick={submitSecretSkipVote}>
            {hasSkipVoted ? 'Skip vote recorded' : 'Vote to skip word'}
          </button>
          <small className="helper-text">Skip passes at {skipVotesNeeded} hidden vote{skipVotesNeeded > 1 ? 's' : ''}.</small>
        </section>
      )}
      {roleVisible && (
        <button className="primary-action" type="button" onClick={finishCurrentReveal}>
          <EyeOff size={20} /> Hide & Pass On
        </button>
      )}
    </div>
  );
}
