import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { makeId, saveReconnectIdentity } from './reconnect.js';
import { makeSessionCode, normalizeCode } from './sessionCodes.js';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

export async function createSession({ hostName, category, impostorCount, settings }) {
  const client = getClient();
  const code = makeSessionCode();
  const hostKey = makeId('host');
  const playerKey = makeId('player');

  const sessionResult = await client
    .from('online_sessions')
    .insert({ code, status: 'lobby', host_key: hostKey, category, impostor_count: impostorCount, settings })
    .select()
    .single();

  if (sessionResult.error) throw sessionResult.error;

  const playerResult = await client
    .from('online_players')
    .insert({ session_id: sessionResult.data.id, name: hostName, player_key: playerKey, is_host: true, order_index: 0, connected: true })
    .select()
    .single();

  if (playerResult.error) throw playerResult.error;

  const identity = {
    sessionId: sessionResult.data.id,
    sessionCode: code,
    playerId: playerResult.data.id,
    playerSecret: playerKey,
    hostSecret: hostKey,
    isHost: true,
  };

  saveReconnectIdentity(identity);
  return { session: sessionResult.data, player: playerResult.data, identity };
}

export async function joinSession({ code, playerName }) {
  const client = getClient();
  const cleanCode = normalizeCode(code);
  const playerKey = makeId('player');

  const sessionResult = await client
    .from('online_sessions')
    .select('*')
    .eq('code', cleanCode)
    .in('status', ['lobby', 'confirm'])
    .single();

  if (sessionResult.error) throw sessionResult.error;

  const countResult = await client
    .from('online_players')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionResult.data.id);

  const playerResult = await client
    .from('online_players')
    .insert({ session_id: sessionResult.data.id, name: playerName, player_key: playerKey, is_host: false, order_index: countResult.count || 0, connected: true })
    .select()
    .single();

  if (playerResult.error) throw playerResult.error;

  const identity = {
    sessionId: sessionResult.data.id,
    sessionCode: sessionResult.data.code,
    playerId: playerResult.data.id,
    playerSecret: playerKey,
    isHost: false,
  };

  saveReconnectIdentity(identity);
  return { session: sessionResult.data, player: playerResult.data, identity };
}
