export function makeSessionCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function normalizeCode(value) {
  return value.replace(/\D/g, '').slice(0, 6);
}
