/**
 * Infernal Mobs Bedrock - Modifier Definitions & Handler Registry
 */

const modifierHandlers = new Map();

/**
 * Registers handler hooks for a modifier ID
 * @param {string} id Modifier ID in lowercase
 * @param {object} handler Handler implementation with optional hooks
 */
export function registerModifierHandler(id, handler) {
  modifierHandlers.set(id.toLowerCase(), handler);
}

/**
 * Retrieves the registered handler for a modifier ID
 * @param {string} id
 * @returns {object|null}
 */
export function getModifierHandler(id) {
  return modifierHandlers.get(id.toLowerCase()) ?? null;
}

/**
 * Returns all registered modifier handlers
 */
export function getAllModifierHandlers() {
  return modifierHandlers;
}
