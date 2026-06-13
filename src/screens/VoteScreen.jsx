export function VoteScreen({ players, currentVotingPlayer, votingPlayerIndex, totalPlayers, submitVote }) {
  return (
    <div className="screen-stack">
      <div className="progress-pill">Vote {votingPlayerIndex + 1} of {totalPlayers}</div>
      <section className="panel-card vote-panel">
        <p className="eyebrow">The MOB votes</p>
        <h2>{currentVotingPlayer}, who is hiding?</h2>
        <div className="vote-grid">
          {players.map((player) => (
            <button key={player} type="button" onClick={() => submitVote(player)}>
              {player}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
