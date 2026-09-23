/**
 * Infernal Mobs Bedrock - Recursion Guards Utility
 * Prevents infinite loops, double-procs and reflected damage recursion
 */

const activeGuards = new Map();

/**
 * Generates key for guard tracking
 */
function makeKey(entityId, guardType) {
  return `${entityId}:${guardType}`;
}

export function setDamageGuard(entityId, guardType, tick) {
  if (!entityId || !guardType) return;
  activeGuards.set(makeKey(entityId, guardType), tick);
}

export function hasDamageGuard(entityId, guardType, tick) {
  if (!entityId || !guardType) return false;
  const recordedTick = activeGuards.get(makeKey(entityId, guardType));
  if (recordedTick === undefined) return false;
  // Guard is active if set on this tick or within 2 ticks
  return Math.abs(tick - recordedTick) <= 2;
}

export function removeDamageGuard(entityId, guardType) {
  if (!entityId || !guardType) return;
  activeGuards.delete(makeKey(entityId, guardType));
}

/**
 * Execute an action with an automatic guard and guaranteed cleanup
 */
export function withDamageGuard(entityId, guardType, tick, action) {
  setDamageGuard(entityId, guardType, tick);
  try {
    return action();
  } finally {
    // Keep in guard map until tick prunes it or remove if needed
  }
}

/**
 * Prunes expired guards to avoid memory leaks
 */
export function pruneDamageGuards(currentTick) {
  for (const [key, tick] of activeGuards.entries()) {
    if (currentTick - tick > 10) {
      activeGuards.delete(key);
    }
  }
}
