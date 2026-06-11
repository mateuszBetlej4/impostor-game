export const DEFAULT_SETTINGS = {
  guessRounds: 1,
  clueRounds: 1,
  discussionSeconds: 60,
  showCategoryToImpostor: true,
  allowImpostorFinalGuess: true,
  randomisePassOrder: false,
  revealVotesAfterRound: true,
  pointsMobWin: 1,
  pointsImpostorWin: 2,
};

export const SESSION_PRESETS = {
  casual: {
    name: 'Casual',
    description: 'Good default for quick phone sessions.',
    settings: { guessRounds: 1, clueRounds: 1, discussionSeconds: 60, allowImpostorFinalGuess: true },
  },
  chaos: {
    name: 'Chaos',
    description: 'More clues, more guess attempts, more arguments.',
    settings: { guessRounds: 2, clueRounds: 2, discussionSeconds: 120, allowImpostorFinalGuess: true },
  },
  quickfire: {
    name: 'Quickfire',
    description: 'Fast rounds before someone overthinks it.',
    settings: { guessRounds: 0, clueRounds: 1, discussionSeconds: 30, allowImpostorFinalGuess: false },
  },
  interrogation: {
    name: 'Interrogation',
    description: 'More time to question the clues before voting.',
    settings: { guessRounds: 3, clueRounds: 3, discussionSeconds: 180, allowImpostorFinalGuess: true },
  },
};
