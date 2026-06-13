import { shuffle } from './random.js';

export function makeRound({ players, passOrder, category, word, impostorCount, settings, impostors }) {
  return {
    settings,
    passOrder: passOrder || (settings.randomisePassOrder ? shuffle(players) : [...players]),
    category,
    word,
    impostors: impostors || new Set(shuffle(players).slice(0, impostorCount)),
    revealIndex: 0,
    revealedPlayers: [],
    clueRound: 1,
    cluePlayerIndex: 0,
    clues: [],
    votes: {},
    skipVotes: {},
    bonusCandidates: [],
    bonusReason: '',
    impostorGuess: '',
    outcome: null,
  };
}
