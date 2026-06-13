import { Send, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TurnTimer } from '../components/TurnTimer.jsx';

export function TimedClueInputScreen({ round, player, nextPlayer, clueValue, setClueValue, submitClue, skipClueTurn }) {
  const totalRounds = Math.max(1, Number(round.settings.guessRounds || 0));
  const clueNumber = (round.cluePlayerIndex || 0) + 1;
  const clues = round.clues || [];
  const recentClues = clues.slice(-6);
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
    <div className="screen-stack clue-screen-fit">
      <div className="clue-status-row">
        <span>Round {round.clueRound}/{totalRounds}</span>
        <strong>{clueNumber}/{round.passOrder.length}</strong>
      </div>

      {!ready ? (
        <section className="panel-card clue-player-card">
          <p className="eyebrow">Pass phone to</p>
          <h2>{player}</h2>
          <p>Enter one clue when they are ready.</p>
          <button className="primary-action" type="button" onClick={() => setReadyKey(turnKey)}>Enter clue</button>
        </section>
      ) : (
        <section className={`panel-card clue-player-card ${expired ? 'expired' : ''}`}>
          <div className="clue-live-header">
            <div>
              <p className="eyebrow">Current player</p>
              <h2>{player}</h2>
            </div>
            <TurnTimer seconds={round.settings.discussionSeconds} timerKey={turnKey} onFinish={() => setExpiredKey(turnKey)} />
          </div>
          <p>{expired ? `Time is up. Next: ${nextPlayer}` : 'Enter one clue.'}</p>
        </section>
      )}

      <section className="panel-card clue-history-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">History</p>
            <h3>Clues</h3>
          </div>
          <Trophy size={18} />
        </div>
        {recentClues.length === 0 ? (
          <p className="helper-text">No clues yet.</p>
        ) : (
          <div className="compact-clue-list">
            {recentClues.map((entry, index) => (
              <div className="compact-clue-row" key={`${entry.round}-${entry.player}-${index}`}>
                <span>R{entry.round} · {entry.player}</span>
                <strong>{entry.skipped ? 'No entry' : entry.clue}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {ready && (
        <section className="panel-card clue-entry-card">
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
          {expired && <p className="warning-text">Pass to {nextPlayer}.</p>}
        </section>
      )}

      {ready && (expired ? (
        <button className="primary-action clue-bottom-action" type="button" onClick={skipClueTurn}>Continue</button>
      ) : (
        <button className="primary-action clue-bottom-action" type="button" disabled={!clueValue.trim()} onClick={submitClue}>
          <Send size={18} /> Save clue
        </button>
      ))}
    </div>
  );
}
