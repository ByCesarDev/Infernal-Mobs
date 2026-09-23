/**
 * Infernal Mobs Bedrock - Combat Memory
 * Maintains persistent combat target state for infernal mobs based on combat interactions
 */

import { isEntityAlive, isEntityValid } from "../util/entity.js";

const DEFAULT_TIMEOUT_TICKS = 300; // 15 seconds memory retention

/** @type {Map<string, { target: import("@minecraft/server").Entity, targetId: string, lastInteractionTick: number }>} */
const combatTargets = new Map();

/**
 * Records a combat interaction (infernal attacked by target, or infernal attacked target)
 * @param {string} mobId
 * @param {import("@minecraft/server").Entity} targetEntity
 * @param {number} currentTick
 */
export function recordCombatInteraction(mobId, targetEntity, currentTick) {
  if (!mobId || !isEntityValid(targetEntity) || !isEntityAlive(targetEntity)) return;

  combatTargets.set(mobId, {
    target: targetEntity,
    targetId: targetEntity.id,
    lastInteractionTick: currentTick
  });
}

/**
 * Gets the current remembered combat target if still valid and within timeout
 * @param {string} mobId
 * @param {number} currentTick
 * @param {number} [maxAgeTicks]
 * @returns {import("@minecraft/server").Entity | null}
 */
export function getRememberedCombatTarget(mobId, currentTick, maxAgeTicks = DEFAULT_TIMEOUT_TICKS) {
  const entry = combatTargets.get(mobId);
  if (!entry) return null;

  if (currentTick - entry.lastInteractionTick > maxAgeTicks) {
    combatTargets.delete(mobId);
    return null;
  }

  if (!isEntityValid(entry.target) || !isEntityAlive(entry.target)) {
    combatTargets.delete(mobId);
    return null;
  }

  return entry.target;
}

/**
 * Clears remembered combat target when a mob dies or is removed
 * @param {string} mobId
 */
export function forgetCombatTarget(mobId) {
  combatTargets.delete(mobId);
}

/**
 * Prunes stale entries from combat memory
 * @param {number} currentTick
 * @param {number} [maxAgeTicks]
 */
export function pruneCombatMemory(currentTick, maxAgeTicks = DEFAULT_TIMEOUT_TICKS) {
  for (const [mobId, entry] of combatTargets.entries()) {
    if (currentTick - entry.lastInteractionTick > maxAgeTicks || !isEntityValid(entry.target) || !isEntityAlive(entry.target)) {
      combatTargets.delete(mobId);
    }
  }
}
