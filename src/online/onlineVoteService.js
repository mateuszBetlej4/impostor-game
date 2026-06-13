import { getClient } from './getClient.js';
import { setOnlinePhase } from './phaseService.js';
import { calculateOnlineVoteResult as getOnlineVoteResult } from './voteResult.js';

export { submitOnlineImpostorGuess } from './onlineGuessService.js';
export { setOnlinePhase } from './phaseService.js';
export { calculateOnlineVoteResult } from './voteResult.js';

export async function submitOnlineVote({ sessionId, roundId, voterPlayerId, playerSecret, targetPlayerId, votePhase = 'initial' }) {
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
      vote_phase: votePhase,
    }, { onConflict: 'round_id,vote_phase,voter_player_id' })
    .select()
    .single();

  if (voteResult.error) throw voteResult.error;
  return voteResult.data;
}

export async function loadRoundVotes(roundId, votePhase = null) {
  const client = getClient();

  let query = client
    .from('online_votes')
    .select('*')
    .eq('round_id', roundId);

  if (votePhase) query = query.eq('vote_phase', votePhase);

  const result = await query;

  if (result.error) throw result.error;
  return result.data || [];
}

function getTieResolution({ votedOut }) {
  const hasImpostor = votedOut.some((player) => player.role === 'impostor');
  const hasMob = votedOut.some((player) => player.role !== 'impostor');

  if (!hasImpostor) {
    return {
      resolved: true,
      outcome: 'impostors',
      reason: 'The top tied players were all MOB. No Tie Duel needed — impostors win.',
      eliminatedPlayerId: null,
    };
  }

  if (!hasMob) {
    return {
      resolved: true,
      outcome: 'mob',
      reason: 'The top tied players were all impostors. MOB caught an impostor.',
      eliminatedPlayerId: votedOut[0]?.id || null,
      selectedPlayer: votedOut[0] || null,
    };
  }

  return {
    resolved: false,
    candidates: votedOut,
  };
}

export async function finishOnlineVote({ session, identity, round, players, votes, allowFinalGuess }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can finish the online vote.');
  }

  const settings = session.settings || {};
  const votePhase = round.hot_seat_accepted ? 'hot_seat_revote' : 'initial';
  const phaseVotes = votes.filter((vote) => (vote.vote_phase || 'initial') === votePhase);
  const eligiblePlayers = votePhase === 'hot_seat_revote'
    ? players.filter((player) => player.id !== round.hot_seat_player_id)
    : players;
  const result = getOnlineVoteResult({ players: eligiblePlayers, votes: phaseVotes });

  if (result.votedOut.length > 1) {
    const tie = getTieResolution({ votedOut: result.votedOut });

    if (tie.resolved) {
      if (tie.outcome === 'mob' && settings.hotSeatDefense && !round.hot_seat_used && votePhase === 'initial' && tie.selectedPlayer) {
        const roundResult = await client
          .from('online_rounds')
          .update({
            phase: 'hot_seat_clue',
            hot_seat_player_id: tie.selectedPlayer.id,
            hot_seat_used: true,
            hot_seat_final_clue: null,
            hot_seat_accepted: null,
            result_reason: 'All tied players were impostors. One enters the Hot Seat.',
          })
          .eq('id', round.id)
          .select()
          .single();

        if (roundResult.error) throw roundResult.error;
        const sessionResult = await setOnlinePhase({ session, identity, status: 'hot_seat_clue' });
        return { session: sessionResult, round: roundResult.data, result };
      }

      const roundResult = await client
        .from('online_rounds')
        .update({
          outcome: tie.outcome,
          resolved_eliminated_player_id: tie.eliminatedPlayerId,
          result_reason: tie.reason,
          phase: 'result',
        })
        .eq('id', round.id)
        .select()
        .single();

      if (roundResult.error) throw roundResult.error;
      const sessionResult = await setOnlinePhase({ session, identity, status: 'results' });
      return { session: sessionResult, round: roundResult.data, result };
    }

    const duelResult = await client
      .from('online_tie_duels')
      .insert({
        session_id: session.id,
        round_id: round.id,
        reason: votePhase === 'hot_seat_revote' ? 'hot_seat_revote_tie' : 'initial_vote_tie',
        active: true,
      })
      .select()
      .single();

    if (duelResult.error) throw duelResult.error;

    const candidatesResult = await client
      .from('online_tie_duel_candidates')
      .insert(tie.candidates.map((player) => ({ tie_duel_id: duelResult.data.id, player_id: player.id })));

    if (candidatesResult.error) throw candidatesResult.error;

    const roundResult = await client
      .from('online_rounds')
      .update({ phase: 'tie_duel_clues', result_reason: 'Vote tied between MOB and impostor candidates. Tie Duel started.' })
      .eq('id', round.id)
      .select()
      .single();

    if (roundResult.error) throw roundResult.error;
    const sessionResult = await setOnlinePhase({ session, identity, status: 'tie_duel_clues' });
    return { session: sessionResult, round: roundResult.data, result };
  }

  const votedOut = result.votedOut[0];
  const impostorCaught = votedOut?.role === 'impostor';

  if (settings.hotSeatDefense && !round.hot_seat_used && votePhase === 'initial') {
    const roundResult = await client
      .from('online_rounds')
      .update({
        phase: 'hot_seat_clue',
        hot_seat_player_id: votedOut.id,
        hot_seat_used: true,
        hot_seat_final_clue: null,
        hot_seat_accepted: null,
        result_reason: `${votedOut.name} entered the Hot Seat.`,
      })
      .eq('id', round.id)
      .select()
      .single();

    if (roundResult.error) throw roundResult.error;
    const sessionResult = await setOnlinePhase({ session, identity, status: 'hot_seat_clue' });
    return { session: sessionResult, round: roundResult.data, result };
  }

  const nextStatus = impostorCaught && allowFinalGuess && !settings.hotSeatDefense ? 'guess' : 'results';
  const outcome = nextStatus === 'guess' ? null : result.winner;

  const roundResult = await client
    .from('online_rounds')
    .update({
      outcome,
      resolved_eliminated_player_id: votedOut?.id || null,
      result_reason: votedOut
        ? (impostorCaught ? `${votedOut.name} was an impostor.` : `${votedOut.name} was MOB, so the impostors escaped.`)
        : 'No player received votes.',
      phase: 'result',
    })
    .eq('id', round.id)
    .select()
    .single();

  if (roundResult.error) throw roundResult.error;

  const sessionResult = await setOnlinePhase({ session, identity, status: nextStatus });

  return {
    session: sessionResult,
    round: roundResult.data,
    result,
  };
}
