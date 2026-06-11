import { supabase, isSupabaseConfigured } from './supabaseClient.js';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.');
  }
  return supabase;
}

export async function markRoleSeen({ playerId, playerSecret }) {
  const client = getClient();

  const result = await client
    .from('online_players')
    .update({ has_seen_role: true, last_seen_at: new Date().toISOString() })
    .eq('id', playerId)
    .eq('player_key', playerSecret)
    .select()
    .single();

  if (result.error) throw result.error;
  return result.data;
}
