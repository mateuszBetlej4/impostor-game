import { getClient } from './getClient.js';
import { calculateOnlineVoteResult } from './voteResult.js';

async function verifyPlayer(playerId, playerSecret) {
  const client = getClient();
  const result = await client
    .from('online_players')
    .select('*')
    .eq('id', playerId)
    .eq('player_key', playerSecret)
    .single();

  if (result.error) throw result.error;
  return result.data;
}

export async function submitOnlineYesNoAnswer({ sessionId, roundId, playerId, playerSecret, answer }) {
  const client = getClient();
  await verifyPlayer(playerId, playerSecret);

  const result = await client
    .from('online_yes_no_answers')
    .upsert({
      session_id: sessionId,
      round_id: roundId,
      player_id: playerId,
      answer,
    }, { onConflict: 'round_id,player_id' })
    .select()
    .single();

  if (result.error) throw result.error;
  return result.data;
}

export async function continueOnlineAfterQuestion({ session, identity }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can continue after the question round.');
  }

  const result = await client
    .from('online_sessions')
    .update({ status: 'vote', last_active_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('host_key', identity.hostSecret)
    .select()
    .single();

  if (result.error) throw result.error;
  return result.data;
}

export async function submitOnlineHotSeatClue({ sessionId, round, playerId, playerSecret, clue }) {
  const client = getClient();
  await verifyPlayer(playerId, playerSecret);

  if (round.hot_seat_player_id !== playerId) {
    throw new Error('Only the Hot Seat player can submit the final clue.');
  }

  const cleanClue = clue.trim();
  if (!cleanClue) throw new Error('Final clue cannot be blank.');

  const deleteExisting = await client
    .from('online_clues')
    .delete()
    .eq('round_id', round.id)
    .eq('clue_phase', 'hot_seat');

  if (deleteExisting.error) throw deleteExisting.error;

  const clueResult = await client
    .from('online_clues')
    .insert({
      session_id: sessionId,
      round_id: round.id,
      player_id: playerId,
      clue_phase: 'hot_seat',
      clue: cleanClue,
    });

  if (clueResult.error) throw clueResult.error;

  const roundResult = await client
    .from('online_rounds')
    .update({
      hot_seat_final_clue: cleanClue,
      phase: 'hot_seat_acceptance',
    })
    .eq('id', round.id)
    .select()
    .single();

  if (roundResult.error) throw roundResult.error;

  const sessionResult = await client
    .from('online_sessions')
    .update({ status: 'hot_seat_acceptance', last_active_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (sessionResult.error) throw sessionResult.error;

  return { round: roundResult.data, session: sessionResult.data };
}

export async function submitOnlineHotSeatVote({ sessionId, round, voterPlayerId, playerSecret, vote }) {
  const client = getClient();
  await verifyPlayer(voterPlayerId, playerSecret);

  if (round.hot_seat_player_id === voterPlayerId) {
    throw new Error('The Hot Seat player cannot vote on their own defense.');
  }

  const result = await client
    .from('online_hot_seat_votes')
    .upsert({
      session_id: sessionId,
      round_id: round.id,
      hot_seat_player_id: round.hot_seat_player_id,
      voter_player_id: voterPlayerId,
      vote,
    }, { onConflict: 'round_id,voter_player_id' })
    .select()
    .single();

  if (result.error) throw result.error;
  return result.data;
}

export async function resolveOnlineHotSeat({ session, identity, round, players, votes }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can resolve Hot Seat Defense.');
  }

  const acceptVotes = votes.filter((item) => item.vote === 'accept').length;
  const rejectVotes = votes.filter((item) => item.vote === 'reject').length;
  const accepted = acceptVotes > rejectVotes;
  const hotSeatPlayer = players.find((player) => player.id === round.hot_seat_player_id);
  const hotSeatWasImpostor = hotSeatPlayer?.role === 'impostor';

  if (!accepted) {
    const outcome = hotSeatWasImpostor ? 'mob' : 'impostors';
    const roundResult = await client
      .from('online_rounds')
      .update({
        hot_seat_accepted: false,
        outcome,
        resolved_eliminated_player_id: round.hot_seat_player_id,
        result_reason: `Hot Seat defense rejected ${acceptVotes}-${rejectVotes}.`,
        phase: 'result',
      })
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
    return { session: sessionResult.data, round: roundResult.data };
  }

  const roundResult = await client
    .from('online_rounds')
    .update({
      hot_seat_accepted: true,
      result_reason: `Hot Seat defense accepted ${acceptVotes}-${rejectVotes}. Redo vote without ${hotSeatPlayer?.name || 'the Hot Seat player'}.`,
      phase: 'hot_seat_revote',
    })
    .eq('id', round.id)
    .select()
    .single();

  if (roundResult.error) throw roundResult.error;

  const sessionResult = await client
    .from('online_sessions')
    .update({ status: 'hot_seat_revote', last_active_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('host_key', identity.hostSecret)
    .select()
    .single();

  if (sessionResult.error) throw sessionResult.error;
  return { session: sessionResult.data, round: roundResult.data };
}

export async function submitOnlineTieDuelClue({ tieDuelId, playerId, playerSecret, clue }) {
  const client = getClient();
  await verifyPlayer(playerId, playerSecret);

  const cleanClue = clue.trim();
  if (!cleanClue) throw new Error('Duel clue cannot be blank.');

  const result = await client
    .from('online_tie_duel_candidates')
    .update({ duel_clue: cleanClue })
    .eq('tie_duel_id', tieDuelId)
    .eq('player_id', playerId)
    .select()
    .single();

  if (result.error) throw result.error;
  return result.data;
}

export async function continueOnlineTieDuelToVote({ session, identity, round }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can continue the Tie Duel.');
  }

  const roundResult = await client
    .from('online_rounds')
    .update({ phase: 'tie_duel_vote' })
    .eq('id', round.id)
    .select()
    .single();

  if (roundResult.error) throw roundResult.error;

  const sessionResult = await client
    .from('online_sessions')
    .update({ status: 'tie_duel_vote', last_active_at: new Date().toISOString() })
    .eq('id', session.id)
    .eq('host_key', identity.hostSecret)
    .select()
    .single();

  if (sessionResult.error) throw sessionResult.error;
  return { session: sessionResult.data, round: roundResult.data };
}

export async function submitOnlineTieDuelVote({ tieDuelId, voterPlayerId, playerSecret, targetPlayerId }) {
  const client = getClient();
  await verifyPlayer(voterPlayerId, playerSecret);

  const result = await client
    .from('online_tie_duel_votes')
    .upsert({
      tie_duel_id: tieDuelId,
      voter_player_id: voterPlayerId,
      target_player_id: targetPlayerId,
    }, { onConflict: 'tie_duel_id,voter_player_id' })
    .select()
    .single();

  if (result.error) throw result.error;
  return result.data;
}

export async function resolveOnlineTieDuel({ session, identity, round, players, tieDuel, candidates, votes }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can resolve the Tie Duel.');
  }

  const candidatePlayers = candidates
    .map((candidate) => players.find((player) => player.id === candidate.player_id))
    .filter(Boolean);
  const result = calculateOnlineVoteResult({ players: candidatePlayers, votes });
  const selected = result.votedOut.length === 1
    ? result.votedOut[0]
    : result.votedOut[Math.floor(Math.random() * result.votedOut.length)];
  const selectedIsImpostor = selected?.role === 'impostor';

  const duelResult = await client
    .from('online_tie_duels')
    .update({ active: false, resolved_player_id: selected?.id || null, updated_at: new Date().toISOString() })
    .eq('id', tieDuel.id)
    .select()
    .single();

  if (duelResult.error) throw duelResult.error;

  if (selected && round.rules?.hotSeatDefense && !round.hot_seat_used && tieDuel.reason === 'initial_vote_tie') {
    const roundResult = await client
      .from('online_rounds')
      .update({
        phase: 'hot_seat_clue',
        hot_seat_player_id: selected.id,
        hot_seat_used: true,
        result_reason: `${selected.name} was selected after the Tie Duel and entered the Hot Seat.`,
      })
      .eq('id', round.id)
      .select()
      .single();

    if (roundResult.error) throw roundResult.error;

    const sessionResult = await client
      .from('online_sessions')
      .update({ status: 'hot_seat_clue', last_active_at: new Date().toISOString() })
      .eq('id', session.id)
      .eq('host_key', identity.hostSecret)
      .select()
      .single();

    if (sessionResult.error) throw sessionResult.error;
    return { session: sessionResult.data, round: roundResult.data, tieDuel: duelResult.data };
  }

  const roundResult = await client
    .from('online_rounds')
    .update({
      outcome: selectedIsImpostor ? 'mob' : 'impostors',
      resolved_eliminated_player_id: selected?.id || null,
      result_reason: selected
        ? `${selected.name} was selected after the Tie Duel.`
        : 'Tie Duel could not select a player.',
      phase: 'result',
    })
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
  return { session: sessionResult.data, round: roundResult.data, tieDuel: duelResult.data };
}
