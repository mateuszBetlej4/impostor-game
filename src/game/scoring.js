export function getRoundWinner({ round, voteResult }) {
  return round.outcome || (voteResult.caught ? 'mob' : 'impostors');
}

export function applyRoundScore({ currentScores, players, round, winner }) {
  const next = { ...currentScores };

  players.forEach((player) => {
    next[player] = next[player] || 0;
  });

  players.forEach((player) => {
    const isImpostor = round.impostors.has(player);

    if (winner === 'mob' && !isImpostor) {
      next[player] += Number(round.settings.pointsMobWin);
    }

    if (winner === 'impostors' && isImpostor) {
      next[player] += Number(round.settings.pointsImpostorWin);
    }
  });

  return next;
}
