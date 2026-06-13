import { pickWordFromBank } from '../game/index.js';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.');
  }
  return supabase;
}

function skipVotesNeeded(players) {
  const mobPlayers = players.filter((player) => player.connected !== false && player.role !== 'impostor');
  return Math.max(1, Math.floor(mobPlayers.length / 2) + 1);
}

export async function submitOnlineSecretSkipVote({ session, identity, round, players, wordBank }) {
  const client = getClient();

  if (!session?.id || !round?.id || !identity?.playerId || !identity?.playerSecret) {
    throw new Error('Cannot submit skip vote without an active online round.');
  }

  const playerResult = await client
    .from('online_players')
    .select('*')
    .eq('id', identity.playerId)
    .eq('player_key', identity.playerSecret)
    .eq('session_id', session.id)
    .single();

  if (playerResult.error) throw playerResult.error;
  if (playerResult.data.role === 'impostor') {
    throw new Error('Impostors cannot vote to skip the secret word.');
  }

  const insertResult = await client
    .from('online_skip_votes')
    .upsert({
      session_id: session.id,
      round_id: round.id,
      voter_player_id: identity.playerId,
    }, { onConflict: 'round_id,voter_player_id' })
    .select()
    .single();

  if (insertResult.error) throw insertResult.error;

  const votesResult = await client
    .from('online_skip_votes')
    .select('*')
    .eq('round_id', round.id);

  if (votesResult.error) throw votesResult.error;

  const votes = votesResult.data || [];
  const threshold = skipVotesNeeded(players);

  if (votes.length < threshold) {
    return { skipped: false, votes };
  }

  const selected = pickWordFromBank({ category: session.category || 'Random', wordBank });

  await client
    .from('online_votes')
    .delete()
    .eq('session_id', session.id);

  await client
    .from('online_skip_votes')
    .delete()
    .eq('session_id', session.id);

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

  await Promise.all(players.filter((player) => player.connected !== false).map((player) => client
    .from('online_players')
    .update({
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
    .select()
    .single();

  if (sessionResult.error) throw sessionResult.error;

  return {
    skipped: true,
    votes: [],
    session: sessionResult.data,
    round: roundResult.data,
  };
}
