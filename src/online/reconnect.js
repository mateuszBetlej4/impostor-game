const STORAGE_KEY = 'asap-mob-online-identity-v1';

export function makeId(prefix = 'id') {
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return `${prefix}_${Array.from(values).map((value) => value.toString(16).padStart(8, '0')).join('')}`;
}

export function saveReconnectIdentity(identity) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...identity,
    savedAt: new Date().toISOString(),
  }));
}

export function loadReconnectIdentity() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearReconnectIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}

export function canReconnect(identity) {
  return Boolean(identity?.sessionId && identity?.sessionCode && identity?.playerId && identity?.playerSecret);
}
