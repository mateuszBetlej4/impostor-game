import { normalisePlayerName } from './playerUtils.js';

export function normaliseSecretGuess(value) {
  return normalisePlayerName(value).toLowerCase();
}

export function isCorrectSecretGuess(guess, secretWord) {
  const normalisedGuess = normaliseSecretGuess(guess);
  const actual = String(secretWord || '').trim().toLowerCase();
  return normalisedGuess === actual || (normalisedGuess.length > 2 && actual.includes(normalisedGuess));
}
