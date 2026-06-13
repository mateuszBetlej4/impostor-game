export function getConnectedPlayers(players) {
  return players.filter((player) => player.connected !== false);
}

export function getConnectedMobPlayers(players) {
  return getConnectedPlayers(players).filter((player) => player.role !== 'impostor');
}

export function getSkipVotesNeeded(players) {
  return Math.max(1, Math.floor(getConnectedMobPlayers(players).length / 2) + 1);
}
