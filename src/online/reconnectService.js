import { supabase, isSupabaseConfigured } from './supabaseClient.js';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.');
  }
  return supabase;
}

export async function reconnectSession(identity) {
  const client = getClient();

  const sessionResult = await client
    .from('online_sessions')
    .select('*')
    .eq('id', identity.sessionId)
    .eq('code', identity.sessionCode)
    .single();

  if (sessionResult.error) throw sessionResult.error;

  const playerResult = await client
    .from('online_players')
    .update({ connected: true, last_seen_at: new Date().toISOString() })
    .eq('id', identity.playerId)
    .eq('player_key', identity.playerSecret)
    .select()
    .single();

  if (playerResult.error) throw playerResult.error;

  return { session: sessionResult.data, player: playerResult.data, identity };
}

export async function loadSessionSnapshot(sessionId) {
  const client = getClient();

  const sessionResult = await client
    .from('online_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionResult.error) throw sessionResult.error;

  const playersResult = await client
    .from('online_players')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })
    .order('joined_at', { ascending: true });

  if (playersResult.error) throw playersResult.error;

  const roundResult = await client
    .from('online_rounds')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundResult.error) throw roundResult.error;

  let votes = [];
  if (roundResult.data?.id) {
    const votesResult = await client
      .from('online_votes')
      .select('*')
      .eq('round_id', roundResult.data.id);

    if (votesResult.error) throw votesResult.error;
    votes = votesResult.data || [];
  }

  return {
    session: sessionResult.data,
    players: playersResult.data || [],
    round: roundResult.data || null,
    votes,
  };
}

export function subscribeToSession(sessionId, onChange) {
  const client = getClient();
  const channel = client
    .channel(`session-${sessionId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_sessions', filter: `id=eq.${sessionId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_players', filter: `session_id=eq.${sessionId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_rounds', filter: `session_id=eq.${sessionId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_votes', filter: `session_id=eq.${sessionId}` }, onChange)
    .subscribe();

  return () => client.removeChannel(channel);
}
