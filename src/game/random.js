export function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function rotatePassOrder(items, startIndex) {
  if (!items.length) return [];
  const safeIndex = ((startIndex % items.length) + items.length) % items.length;
  return [...items.slice(safeIndex), ...items.slice(0, safeIndex)];
}

export function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}
