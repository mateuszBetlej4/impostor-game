export function calculateOnlineVoteResult({ players, votes }) {
  const counts = players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {});
  votes.forEach((vote) => {
    counts[vote.target_player_id] = (counts[vote.target_player_id] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .map(([playerId, count]) => ({ player: players.find((item) => item.id === playerId), count }))
    .filter((item) => item.player)
    .sort((a, b) => b.count - a.count);

  const highest = sorted[0]?.count || 0;
  const votedOut = sorted.filter((item) => item.count === highest && highest > 0).map((item) => item.player);
  const impostorCaught = votedOut.some((player) => player.role === 'impostor');

  return {
    sorted,
    highest,
    votedOut,
    impostorCaught,
    winner: impostorCaught ? 'mob' : 'impostors',
  };
}
