import { supabase, isSupabaseConfigured } from './supabaseClient.js';

export function getClient(message = 'Supabase is not configured yet.') {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(message);
  }
  return supabase;
}
