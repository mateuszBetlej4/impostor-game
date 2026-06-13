export function normalisePlayerName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

export function cleanWordsFromText(text) {
  return [...new Set(text.split(/[\n,;]+/).map((word) => normalisePlayerName(word)).filter((word) => word.length > 1))];
}
