export function generateULID(timestamp = Date.now()) {
  // Alfabeto Crockford's Base32 (exclui I, L, O, U para evitar ambiguidades)
  const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  // 1. Codifica os 48 bits do timestamp (10 caracteres)
  let timeStr = "";
  let time = timestamp;
  for (let i = 9; i >= 0; i--) {
    const mod = time % 32;
    timeStr = ENCODING[mod] + timeStr;
    time = Math.floor(time / 32);
  }

  // 2. Gera 80 bits de entropia criptograficamente segura (16 caracteres)
  let randStr = "";
  const randomBytes = new Uint8Array(16);

  // Suporte universal para crypto (Node.js ou Browser)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback caso crypto não esteja disponível
    for (let i = 0; i < 16; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  for (let i = 0; i < 16; i++) {
    randStr += ENCODING[randomBytes[i] % 32];
  }

  return timeStr + randStr;
}
