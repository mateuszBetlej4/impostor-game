export function countVotes(votes, players) {
  const counts = players.reduce((acc, player) => ({ ...acc, [player]: 0 }), {});
  Object.values(votes).forEach((vote) => { counts[vote] = (counts[vote] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const highest = sorted[0]?.[1] ?? 0;
  const top = sorted.filter(([, count]) => count === highest).map(([name]) => name);
  return { counts, sorted, top, highest, caught: false };
}
