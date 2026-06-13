import { normalisePlayerName } from './playerUtils.js';
import { pickRandom } from './random.js';

export function getCategoryNames(wordBank) {
  return Object.keys(wordBank);
}

export function pickWordFromBank({ category, wordBank }) {
  const categoryNames = getCategoryNames(wordBank);
  const chosenCategory = category === 'Random' || !wordBank[category]
    ? pickRandom(categoryNames)
    : category;
  const words = wordBank[chosenCategory] || [];
  return { category: chosenCategory, word: pickRandom(words) };
}

export function getUnusedWords(category, usedWords, wordBank) {
  const used = new Set(usedWords[category] || []);
  return (wordBank[category] || []).filter((word) => !used.has(word));
}

export function getSecretStructureHint(word) {
  const parts = normalisePlayerName(word || '').split(/[\s\-/]+/).filter(Boolean);
  if (parts.length <= 1) return '';
  return `${parts.length}-word secret`;
}

export function selectWord(selectedCategory, usedWords, wordBank, categoryNames = getCategoryNames(wordBank)) {
  let category = selectedCategory;
  let nextUsedWords = { ...usedWords };

  if (selectedCategory === 'Random' || !wordBank[selectedCategory]) {
    let categoriesWithUnusedWords = categoryNames.filter((name) => getUnusedWords(name, nextUsedWords, wordBank).length > 0);
    if (categoriesWithUnusedWords.length === 0) {
      nextUsedWords = {};
      categoriesWithUnusedWords = categoryNames;
    }
    category = pickRandom(categoriesWithUnusedWords);
  }

  let availableWords = getUnusedWords(category, nextUsedWords, wordBank);
  if (availableWords.length === 0) {
    nextUsedWords = { ...nextUsedWords, [category]: [] };
    availableWords = wordBank[category] || [];
  }

  const word = pickRandom(availableWords);
  return {
    category,
    word,
    nextUsedWords: {
      ...nextUsedWords,
      [category]: [...(nextUsedWords[category] || []), word],
    },
  };
}
