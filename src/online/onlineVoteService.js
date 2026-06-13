import { getClient } from './getClient.js';
import { setOnlinePhase } from './phaseService.js';
import { calculateOnlineVoteResult as getOnlineVoteResult } from './voteResult.js';

export { submitOnlineImpostorGuess } from './onlineGuessService.js';
export { setOnlinePhase } from './phaseService.js';
export { calculateOnlineVoteResult } from './voteResult.js';

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

export async function finishOnlineVote({ session, identity, round, players, votes, allowFinalGuess }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can finish the online vote.');
  }

  const result = getOnlineVoteResult({ players, votes });
  const nextStatus = result.impostorCaught && allowFinalGuess ? 'guess' : 'results';
  const outcome = nextStatus === 'guess' ? null : result.winner;

  const roundResult = await client
    .from('online_rounds')
    .update({ outcome })
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
