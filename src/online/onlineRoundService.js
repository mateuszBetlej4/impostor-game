import { pickWordFromBank, shuffle } from '../game/index.js';
import { getClient } from './getClient.js';
import { getConnectedPlayers } from './playerGroups.js';

const ONLINE_YES_NO_QUESTIONS = [
  'Would you usually find this indoors?',
  'Would you usually find this outdoors?',
  'Can you buy this?',
  'Is this alive?',
  'Would a child know what this is?',
  'Is this connected to food or drink?',
  'Is this bigger than a person?',
  'Would you use this every day?',
  'Is this usually expensive?',
  'Can you hold this in your hand?',
  'Is this connected to travel?',
  'Is this something people do for fun?',
];

function pickYesNoQuestion() {
  return ONLINE_YES_NO_QUESTIONS[Math.floor(Math.random() * ONLINE_YES_NO_QUESTIONS.length)];
}

async function clearPreviousRoundFlowData(client, sessionId) {
  await client.from('online_votes').delete().eq('session_id', sessionId);
  await client.from('online_skip_votes').delete().eq('session_id', sessionId);
  await client.from('online_clues').delete().eq('session_id', sessionId);
  await client.from('online_yes_no_answers').delete().eq('session_id', sessionId);
  await client.from('online_hot_seat_votes').delete().eq('session_id', sessionId);
  await client.from('online_tie_duels').delete().eq('session_id', sessionId);
}

export async function startOnlineRound({ session, identity, players, wordBank }) {
  const client = getClient();

  if (!identity?.isHost || identity.hostSecret !== session.host_key) {
    throw new Error('Only the host can start this online round.');
  }

  const activePlayers = getConnectedPlayers(players);
  if (activePlayers.length < 3) {
    throw new Error('Online sessions need at least 3 connected players.');
  }

  await clearPreviousRoundFlowData(client, session.id);

  const settings = session.settings || {};
  const impostorCount = Math.min(Number(session.impostor_count || 1), activePlayers.length - 1);
  const impostorIds = new Set(shuffle(activePlayers).slice(0, impostorCount).map((player) => player.id));
  const selected = pickWordFromBank({ category: session.category || 'Random', wordBank });

  const roundResult = await client
    .from('online_rounds')
    .insert({
      session_id: session.id,
      category: selected.category,
      word: selected.word,
      clue_round: 1,
      outcome: null,
      impostor_guess: null,
      phase: 'reveal',
      rules: {
        hotSeatDefense: Boolean(settings.hotSeatDefense),
        yesNoQuestionRound: Boolean(settings.yesNoQuestionRound),
        allowImpostorFinalGuess: Boolean(settings.allowImpostorFinalGuess) && !settings.hotSeatDefense,
      },
      yes_no_question: settings.yesNoQuestionRound ? pickYesNoQuestion() : null,
      hot_seat_player_id: null,
      hot_seat_final_clue: null,
      hot_seat_accepted: null,
      hot_seat_used: false,
      resolved_eliminated_player_id: null,
      result_reason: null,
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
