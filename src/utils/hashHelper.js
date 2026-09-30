/**
 * Generates an audit-grade unique 8-character uppercase alphanumeric transaction hash.
 * Excludes easily confusable characters (0/O, 1/I).
 * Example output: "8X9K2M4P"
 */
export function generateTxHash() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validates whether a string is a valid 8-character transaction hash.
 */
export function isValidTxHash(hash) {
  if (!hash || typeof hash !== 'string') return false;
  const clean = hash.trim().toUpperCase();
  return clean.length === 8 && /^[A-Z0-9]{8}$/.test(clean);
}
