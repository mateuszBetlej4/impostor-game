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
