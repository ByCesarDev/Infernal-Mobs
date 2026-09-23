/**
 * Infernal Mobs Bedrock - Logging Utility
 */

let debugEnabled = false;
const messageHistory = new Map();

export function setDebugLogging(enabled) {
  debugEnabled = Boolean(enabled);
}

export function isDebugLogging() {
  return debugEnabled;
}

export function logDebug(category, message, ...args) {
  if (!debugEnabled) return;
  console.warn(`[InfernalMobs][DEBUG][${category}] ${message}`, ...args);
}

export function logInfo(category, message, ...args) {
  console.warn(`[InfernalMobs][INFO][${category}] ${message}`, ...args);
}

export function logError(category, message, error) {
  const errMsg = error ? ` - ${error?.message ?? error}` : "";
  console.error(`[InfernalMobs][ERROR][${category}] ${message}${errMsg}`);
}

export function logRateLimited(key, intervalMs, fn) {
  const now = Date.now();
  const lastTime = messageHistory.get(key) ?? 0;
  if (now - lastTime >= intervalMs) {
    messageHistory.set(key, now);
    fn();
  }
}
