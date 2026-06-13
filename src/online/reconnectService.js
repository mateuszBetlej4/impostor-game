import { getClient } from './getClient.js';

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
  let skipVotes = [];
  let clues = [];
  let yesNoAnswers = [];
  let hotSeatVotes = [];
  let tieDuels = [];
  let tieDuelCandidates = [];
  let tieDuelVotes = [];

  if (roundResult.data?.id) {
    const votesResult = await client
      .from('online_votes')
      .select('*')
      .eq('round_id', roundResult.data.id);

    if (votesResult.error) throw votesResult.error;
    votes = votesResult.data || [];

    const skipVotesResult = await client
      .from('online_skip_votes')
      .select('*')
      .eq('round_id', roundResult.data.id);

    if (skipVotesResult.error) throw skipVotesResult.error;
    skipVotes = skipVotesResult.data || [];

    const cluesResult = await client
      .from('online_clues')
      .select('*')
      .eq('round_id', roundResult.data.id);

    if (cluesResult.error) throw cluesResult.error;
    clues = cluesResult.data || [];

    const yesNoResult = await client
      .from('online_yes_no_answers')
      .select('*')
      .eq('round_id', roundResult.data.id);

    if (yesNoResult.error) throw yesNoResult.error;
    yesNoAnswers = yesNoResult.data || [];

    const hotSeatResult = await client
      .from('online_hot_seat_votes')
      .select('*')
      .eq('round_id', roundResult.data.id);

    if (hotSeatResult.error) throw hotSeatResult.error;
    hotSeatVotes = hotSeatResult.data || [];

    const tieDuelResult = await client
      .from('online_tie_duels')
      .select('*')
      .eq('round_id', roundResult.data.id)
      .order('created_at', { ascending: false });

    if (tieDuelResult.error) throw tieDuelResult.error;
    tieDuels = tieDuelResult.data || [];

    const tieDuelIds = tieDuels.map((duel) => duel.id);
    if (tieDuelIds.length > 0) {
      const candidatesResult = await client
        .from('online_tie_duel_candidates')
        .select('*')
        .in('tie_duel_id', tieDuelIds);

      if (candidatesResult.error) throw candidatesResult.error;
      tieDuelCandidates = candidatesResult.data || [];

      const duelVotesResult = await client
        .from('online_tie_duel_votes')
        .select('*')
        .in('tie_duel_id', tieDuelIds);

      if (duelVotesResult.error) throw duelVotesResult.error;
      tieDuelVotes = duelVotesResult.data || [];
    }
  }

  return {
    session: sessionResult.data,
    players: playersResult.data || [],
    round: roundResult.data || null,
    votes,
    skipVotes,
    clues,
    yesNoAnswers,
    hotSeatVotes,
    tieDuels,
    tieDuelCandidates,
    tieDuelVotes,
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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_skip_votes', filter: `session_id=eq.${sessionId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_clues', filter: `session_id=eq.${sessionId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_yes_no_answers', filter: `session_id=eq.${sessionId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_hot_seat_votes', filter: `session_id=eq.${sessionId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_tie_duels', filter: `session_id=eq.${sessionId}` }, onChange)
    .subscribe();

  return () => client.removeChannel(channel);
}
