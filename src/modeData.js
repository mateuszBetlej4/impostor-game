export const DEFAULT_SETTINGS = {
  guessRounds: 1,
  clueRounds: 1,
  showCategoryToImpostor: true,
  allowImpostorFinalGuess: true,
  hotSeatDefense: false,
  yesNoQuestionRound: false,
  randomisePassOrder: false,
  revealVotesAfterRound: true,
  pointsMobWin: 1,
  pointsImpostorWin: 2,
};

export const SESSION_PRESETS = {
  casual: {
    name: 'Casual',
    description: 'Good default for quick phone sessions.',
    settings: {
      guessRounds: 1,
      clueRounds: 1,
      allowImpostorFinalGuess: true,
      hotSeatDefense: false,
      yesNoQuestionRound: false,
    },
  },
  drama: {
    name: 'Drama',
    description: 'Hot Seat defense with a question before voting.',
    settings: {
      guessRounds: 1,
      clueRounds: 1,
      allowImpostorFinalGuess: false,
      hotSeatDefense: true,
      yesNoQuestionRound: true,
    },
  },
  chaos: {
    name: 'Chaos',
    description: 'More clues, more questions, more arguments.',
    settings: {
      guessRounds: 2,
      clueRounds: 2,
      allowImpostorFinalGuess: false,
      hotSeatDefense: true,
      yesNoQuestionRound: true,
    },
  },
  quickfire: {
    name: 'Quickfire',
    description: 'Fast rounds before someone overthinks it.',
    settings: {
      guessRounds: 0,
      clueRounds: 1,
      allowImpostorFinalGuess: false,
      hotSeatDefense: false,
      yesNoQuestionRound: false,
    },
  },
  interrogation: {
    name: 'Interrogation',
    description: 'More time to question the clues before voting.',
    settings: {
      guessRounds: 3,
      clueRounds: 3,
      allowImpostorFinalGuess: false,
      hotSeatDefense: true,
      yesNoQuestionRound: true,
    },
  },
};
