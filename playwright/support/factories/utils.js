export function generateULID(timestamp = Date.now()) {
  // Crockford's Base32 Alphabet (excludes I, L, O, U to avoid character ambiguity)
  const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  // 1. Encode 48-bit timestamp (10 characters)
  let timeStr = "";
  let time = timestamp;
  for (let i = 9; i >= 0; i--) {
    const mod = time % 32;
    timeStr = ENCODING[mod] + timeStr;
    time = Math.floor(time / 32);
  }

  // 2. Generate 80-bit cryptographically secure entropy (16 characters)
  let randStr = "";
  const randomBytes = new Uint8Array(16);

  // Universal crypto support (Node.js or Browser runtime)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback if crypto is unavailable
    for (let i = 0; i < 16; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  for (let i = 0; i < 16; i++) {
    randStr += ENCODING[randomBytes[i] % 32];
  }

  return timeStr + randStr;
}
