import { pickWordFromBank, shuffle } from '../game/index.js';
import { getClient } from './getClient.js';

export async function startOnlineRound({ session, identity, players, wordBank }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can start this online round.');
  }

  const activePlayers = players.filter((player) => player.connected !== false);
  if (activePlayers.length < 3) {
    throw new Error('Online sessions need at least 3 connected players.');
  }

  await client
    .from('online_votes')
    .delete()
    .eq('session_id', session.id);

  await client
    .from('online_skip_votes')
    .delete()
    .eq('session_id', session.id);

  const impostorCount = Math.min(Number(session.impostor_count || 1), activePlayers.length - 1);
  const impostorIds = new Set(shuffle(activePlayers).slice(0, impostorCount).map((player) => player.id));
  const selected = pickWordFromBank({ category: session.category || 'Random', wordBank });

  const roundResult = await client
    .from('online_rounds')
    .insert({
      session_id: session.id,
      category: selected.category,
      word: selected.word,
      clue_round: 1,
      outcome: null,
      impostor_guess: null,
    })
    .select()
    .single();

  if (roundResult.error) throw roundResult.error;

  await Promise.all(activePlayers.map((player) => client
    .from('online_players')
    .update({
      role: impostorIds.has(player.id) ? 'impostor' : 'mob',
      can_see_word: !impostorIds.has(player.id),
      has_seen_role: false,
      vote_target: null,
    })
    .eq('id', player.id)));

  const sessionResult = await client
    .from('online_sessions')
    .update({
      status: 'reveal',
      last_active_at: new Date().toISOString(),
    })
    .eq('id', session.id)
    .eq('host_key', identity.hostSecret)
    .select()
    .single();

  if (sessionResult.error) throw sessionResult.error;

  return {
    session: sessionResult.data,
    round: roundResult.data,
  };
}
