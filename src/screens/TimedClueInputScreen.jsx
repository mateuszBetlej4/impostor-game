import { Send, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TurnTimer } from '../components/TurnTimer.jsx';

export function TimedClueInputScreen({ round, player, nextPlayer, clueValue, setClueValue, submitClue, skipClueTurn }) {
  const totalRounds = Math.max(1, Number(round.settings.guessRounds || 0));
  const clueNumber = (round.cluePlayerIndex || 0) + 1;
  const clues = round.clues || [];
  const turnKey = `${round.clueRound}-${round.cluePlayerIndex}`;
  const [readyKey, setReadyKey] = useState('');
  const [expiredKey, setExpiredKey] = useState('');
  const ready = readyKey === turnKey;
  const expired = expiredKey === turnKey;

  useEffect(() => {
    setReadyKey('');
    setExpiredKey('');
  }, [turnKey]);

  return (
    <div className="screen-stack">
      <div className="progress-pill">
        Round {round.clueRound}/{totalRounds} · Player {clueNumber}/{round.passOrder.length}
      </div>

      {!ready ? (
        <section className="hero-card compact-hero">
          <p className="eyebrow">Pass the phone to</p>
          <h2>{player}</h2>
          <p className="hero-copy">Timer starts only when this player is ready.</p>
          <button className="primary-action" type="button" onClick={() => setReadyKey(turnKey)}>Start clue timer</button>
        </section>
      ) : (
        <>
          <TurnTimer seconds={round.settings.discussionSeconds} timerKey={turnKey} onFinish={() => setExpiredKey(turnKey)} />

          <section className="hero-card compact-hero">
            <p className="eyebrow">Current player</p>
            <h2>{player}</h2>
            <p className="hero-copy">{expired ? `Next player: ${nextPlayer}` : 'Enter one clue.'}</p>
          </section>
        </>
      )}

      <section className="panel-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">History</p>
            <h3>Clues</h3>
          </div>
          <Trophy size={20} />
        </div>
        {clues.length === 0 ? (
          <p className="helper-text">No clues yet.</p>
        ) : (
          <div className="score-list">
            {clues.map((entry, index) => (
              <div className="score-row" key={`${entry.round}-${entry.player}-${index}`}>
                <span>R{entry.round} · {entry.player}</span>
                <strong>{entry.skipped ? 'No entry' : entry.clue}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {ready && (
        <section className="panel-card">
          <label className="guess-field">
            <span>{player} clue</span>
            <input
              value={clueValue}
              onChange={(event) => setClueValue(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !expired) submitClue(); }}
              placeholder={expired ? 'Timer ended' : 'Type a clue'}
              disabled={expired}
              autoFocus
            />
          </label>
          {expired && <p className="warning-text">Next player: {nextPlayer}</p>}
        </section>
      )}

      {ready && (expired ? (
        <button className="primary-action" type="button" onClick={skipClueTurn}>Continue</button>
      ) : (
        <button className="primary-action" type="button" disabled={!clueValue.trim()} onClick={submitClue}>
          <Send size={20} /> Save clue
        </button>
      ))}
    </div>
  );
}
