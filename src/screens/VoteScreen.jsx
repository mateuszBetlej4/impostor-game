import { useEffect, useMemo, useState } from 'react';

const VOTE_TARGETS_PER_PAGE = 8;

export function VoteScreen({ players, currentVotingPlayer, votingPlayerIndex, totalPlayers, submitVote }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(players.length / VOTE_TARGETS_PER_PAGE));

  useEffect(() => {
    setPage(0);
  }, [votingPlayerIndex]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const startIndex = page * VOTE_TARGETS_PER_PAGE;
  const visiblePlayers = useMemo(
    () => players.slice(startIndex, startIndex + VOTE_TARGETS_PER_PAGE),
    [players, startIndex],
  );
  const firstVisible = players.length ? startIndex + 1 : 0;
  const lastVisible = Math.min(players.length, startIndex + visiblePlayers.length);

  return (
    <div className="screen-stack vote-screen-fit">
      <div className="progress-pill">Vote {votingPlayerIndex + 1} of {totalPlayers}</div>
      <section className="panel-card vote-panel compact-vote-panel">
        <p className="eyebrow">The MOB votes</p>
        <h2>{currentVotingPlayer}, who is hiding?</h2>
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
            <span>{firstVisible}-{lastVisible} of {players.length}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
