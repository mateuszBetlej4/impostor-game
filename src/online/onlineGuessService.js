import { isCorrectSecretGuess } from '../game/index.js';
import { getClient } from './getClient.js';

export async function submitOnlineImpostorGuess({ session, identity, round, guess }) {
  const client = getClient();
  const impostorWins = isCorrectSecretGuess(guess, round.word);

  const roundResult = await client
    .from('online_rounds')
    .update({
      impostor_guess: guess.trim(),
      outcome: impostorWins ? 'impostors' : 'mob',
    })
    .eq('id', round.id)
    .select()
    .single();

  if (roundResult.error) throw roundResult.error;

  const sessionResult = await client
    .from('online_sessions')
    .update({ status: 'results', last_active_at: new Date().toISOString() })
    .eq('id', session.id)
    .select()
    .single();

  if (sessionResult.error) throw sessionResult.error;

  return {
    session: sessionResult.data,
    round: roundResult.data,
  };
}
