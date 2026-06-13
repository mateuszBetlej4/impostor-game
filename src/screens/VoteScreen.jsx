import { useEffect, useMemo, useState } from 'react';

const VOTE_TARGETS_PER_PAGE = 8;

export function VoteScreen({
  players,
  targetPlayers,
  currentVotingPlayer,
  votingPlayerIndex,
  totalPlayers,
  submitVote,
  eyebrow = 'The MOB votes',
  title,
  helperText,
}) {
  const [page, setPage] = useState(0);
  const availableTargets = useMemo(
    () => (targetPlayers || players).filter((player) => player !== currentVotingPlayer),
    [currentVotingPlayer, players, targetPlayers],
  );
  const totalPages = Math.max(1, Math.ceil(availableTargets.length / VOTE_TARGETS_PER_PAGE));

  useEffect(() => {
    setPage(0);
  }, [votingPlayerIndex]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const startIndex = page * VOTE_TARGETS_PER_PAGE;
  const visiblePlayers = useMemo(
    () => availableTargets.slice(startIndex, startIndex + VOTE_TARGETS_PER_PAGE),
    [availableTargets, startIndex],
  );
  const firstVisible = availableTargets.length ? startIndex + 1 : 0;
  const lastVisible = Math.min(availableTargets.length, startIndex + visiblePlayers.length);

  return (
    <div className="screen-stack vote-screen-fit">
      <div className="progress-pill">Vote {votingPlayerIndex + 1} of {totalPlayers}</div>
      <section className="panel-card vote-panel compact-vote-panel">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title || `${currentVotingPlayer}, who is hiding?`}</h2>
        {helperText && <p className="helper-text">{helperText}</p>}
        <div className="vote-grid compact-target-grid">
          {visiblePlayers.map((player) => (
            <button key={player} type="button" onClick={() => submitVote(player)}>
              {player}
            </button>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="compact-pager" aria-label="Vote target pages">
            <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>Prev</button>
            <span>{firstVisible}-{lastVisible} of {availableTargets.length}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
