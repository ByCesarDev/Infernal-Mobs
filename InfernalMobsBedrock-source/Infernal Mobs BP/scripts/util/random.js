/**
 * Infernal Mobs Bedrock - Random Utility
 * Supports injectable RNG for deterministic testing
 */

let customRng = null;

export function setCustomRng(rngFn) {
  customRng = rngFn;
}

export function resetCustomRng() {
  customRng = null;
}

export function randomFloat() {
  if (typeof customRng === "function") {
    return customRng();
  }
  return Math.random();
}

/**
 * Returns an integer in range [min, max] inclusive
 */
export function randomInt(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  if (low >= high) return low;
  return Math.floor(randomFloat() * (high - low + 1)) + low;
}

/**
 * Roll 1 in N chance (0 to n - 1 === 0, exactly as Java random.nextInt(n) == 0)
 */
export function rollChance(n) {
  if (n <= 1) return true;
  return Math.floor(randomFloat() * n) === 0;
}

export function pickRandom(array) {
  if (!array || array.length === 0) return undefined;
  return array[randomInt(0, array.length - 1)];
}
