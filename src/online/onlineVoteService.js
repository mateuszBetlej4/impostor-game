import { supabase, isSupabaseConfigured } from './supabaseClient.js';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.');
  }
  return supabase;
}

export async function setOnlinePhase({ session, identity, status }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can change the online phase.');
  }

  const result = await client
    .from('online_sessions')
    .update({ status, last_active_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('host_key', identity.hostSecret)
    .select()
    .single();

  if (result.error) throw result.error;
  return result.data;
}

export async function submitOnlineVote({ sessionId, roundId, voterPlayerId, playerSecret, targetPlayerId }) {
  const client = getClient();

  const playerResult = await client
    .from('online_players')
    .select('id')
    .eq('id', voterPlayerId)
    .eq('player_key', playerSecret)
    .single();

  if (playerResult.error) throw playerResult.error;

  const voteResult = await client
    .from('online_votes')
    .upsert({
      session_id: sessionId,
      round_id: roundId,
      voter_player_id: voterPlayerId,
      target_player_id: targetPlayerId,
    }, { onConflict: 'round_id,voter_player_id' })
    .select()
    .single();

  if (voteResult.error) throw voteResult.error;
  return voteResult.data;
}

export async function loadRoundVotes(roundId) {
  const client = getClient();

  const result = await client
    .from('online_votes')
    .select('*')
    .eq('round_id', roundId);

  if (result.error) throw result.error;
  return result.data || [];
}

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

export async function finishOnlineVote({ session, identity, round, players, votes }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can finish the online vote.');
  }

  const result = calculateOnlineVoteResult({ players, votes });

  const roundResult = await client
    .from('online_rounds')
    .update({ outcome: result.winner })
    .eq('id', round.id)
    .select()
    .single();

  if (roundResult.error) throw roundResult.error;

  const sessionResult = await client
    .from('online_sessions')
    .update({ status: 'results', last_active_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('host_key', identity.hostSecret)
    .select()
    .single();

  if (sessionResult.error) throw sessionResult.error;

  return {
    session: sessionResult.data,
    round: roundResult.data,
    result,
  };
}
