import { supabase, isSupabaseConfigured } from './supabaseClient.js';

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.');
  }
  return supabase;
}

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickWord({ category, wordBank }) {
  const categoryNames = Object.keys(wordBank);
  const chosenCategory = category === 'Random' || !wordBank[category]
    ? categoryNames[Math.floor(Math.random() * categoryNames.length)]
    : category;
  const words = wordBank[chosenCategory] || [];
  const word = words[Math.floor(Math.random() * words.length)];
  return { category: chosenCategory, word };
}

export async function startOnlineRound({ session, identity, players, wordBank }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can start this online round.');
  }

  const activePlayers = players.filter((player) => player.connected !== false);
  if (activePlayers.length < 3) {
    throw new Error('Online sessions need at least 3 connected players.');
  }

  const impostorCount = Math.min(Number(session.impostor_count || 1), activePlayers.length - 1);
  const impostorIds = new Set(shuffle(activePlayers).slice(0, impostorCount).map((player) => player.id));
  const selected = pickWord({ category: session.category || 'Random', wordBank });

  const roundResult = await client
    .from('online_rounds')
    .insert({
      session_id: session.id,
      category: selected.category,
      word: selected.word,
      clue_round: 1,
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
