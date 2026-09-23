/**
 * Infernal Mobs Bedrock - Infernal Manager
 * Manages runtime memory cache, active entities, steady targets and cooldowns
 */

import { STEADY_TARGET_TICKS_REQUIRED } from "./constants.js";
import { getModifierHandler } from "../data/modifierDefinitions.js";
import { resolveTarget } from "./targetResolver.js";
import { getInfernalState, isInfernal, setPersistentCooldown } from "../storage/entityState.js";
import { getConfig } from "../storage/worldConfig.js";
import { isEntityAlive, isEntityValid, isPlayer } from "../util/entity.js";
import { getCurrentTick } from "./tickScheduler.js";
import { logDebug, logError } from "../util/log.js";

/**
 * Cache of currently active and tracked infernal entities
 * Key: entity.id
 * Value: {
 *   entity: Entity,
 *   state: object,
 *   lastTargetId: string|null,
 *   steadyTargetTicks: number,
 *   simulatedAir: number,
 *   sprintingState: boolean,
 *   lastSprintToggleTick: number,
 *   lastAbilityUse: Record<string, number>
 * }
 */
const activeInfernals = new Map();

/**
 * Registers an infernal entity into the active memory cache
 */
export function registerInfernal(entity, state = null) {
  if (!isEntityValid(entity)) return null;
  const infernalState = state ?? getInfernalState(entity);
  if (!infernalState) return null;

  let record = activeInfernals.get(entity.id);
  if (!record) {
    record = {
      entity,
      state: infernalState,
      lastTargetId: null,
      steadyTargetTicks: 0,
      simulatedAir: 300,
      sprintingState: false,
      lastSprintToggleTick: 0,
      lastAbilityUse: { ...(infernalState.cooldowns ?? {}) }
    };
    activeInfernals.set(entity.id, record);
    logDebug("manager", `Registered infernal ${entity.id} (${entity.typeId}) with ${infernalState.modifiers.length} mods`);
  } else {
    record.entity = entity;
    record.state = infernalState;
  }
  return record;
}

/**
 * Unregisters an infernal from memory (on death, removal or despawn)
 */
export function unregisterInfernal(entityId) {
  activeInfernals.delete(entityId);
}

/**
 * Retrieves the tracking record for an entity
 */
export function getTrackedInfernal(entityId) {
  return activeInfernals.get(entityId) ?? null;
}

/**
 * Returns all currently active infernal entities in memory
 */
export function getAllActiveInfernals() {
  return Array.from(activeInfernals.values());
}

/**
 * Checks cooldown for a modifier and updates next allowed tick if ready
 */
export function checkCooldownAndMark(entity, abilityKey, cooldownTicks, persist = false) {
  const currentTick = getCurrentTick();
  const config = getConfig();
  const scaledTicks = Math.round(cooldownTicks * (config.modCooldownFactor ?? 1.0));

  let record = activeInfernals.get(entity.id);
  if (!record) {
    record = registerInfernal(entity);
    if (!record) return false;
  }

  const nextAllowed = record.lastAbilityUse[abilityKey] ?? 0;
  if (currentTick < nextAllowed) {
    return false;
  }

  const nextTick = currentTick + scaledTicks;
  record.lastAbilityUse[abilityKey] = nextTick;

  if (persist) {
    setPersistentCooldown(entity, abilityKey, nextTick);
  }

  return true;
}

/**
 * Updates steady targeting for an infernal entity
 * Checks if the entity is targeting the same entity without interruption
 */
export function updateSteadyTarget(record, currentTarget) {
  if (!currentTarget || !isEntityValid(currentTarget)) {
    record.lastTargetId = null;
    record.steadyTargetTicks = 0;
    return false;
  }

  if (record.lastTargetId === currentTarget.id) {
    record.steadyTargetTicks++;
  } else {
    record.lastTargetId = currentTarget.id;
    record.steadyTargetTicks = 1;
    // Target changed: reset simulated air for choke
    record.simulatedAir = 300;
  }

  return record.steadyTargetTicks >= STEADY_TARGET_TICKS_REQUIRED;
}

/**
 * Prunes dead or invalid entities from cache
 */
export function pruneInactiveInfernals() {
  for (const [id, record] of activeInfernals.entries()) {
    if (!isEntityValid(record.entity) || !isEntityAlive(record.entity)) {
      activeInfernals.delete(id);
    }
  }
}

/**
 * Ticks all registered infernal mobs, resolving steady targets and executing onUpdate hooks
 * @param {number} currentTick
 */
export function tickActiveInfernals(currentTick) {
  for (const [id, record] of activeInfernals.entries()) {
    const mob = record.entity;
    if (!isEntityValid(mob) || !isEntityAlive(mob)) {
      activeInfernals.delete(id);
      continue;
    }

    const state = record.state;
    if (!state || !state.modifiers) continue;

    // Resolve target and steady status
    const target = resolveTarget(mob, 16);
    const isSteady = updateSteadyTarget(record, target);

    // Run modifier onUpdate hooks
    for (const modId of state.modifiers) {
      const handler = getModifierHandler(modId);
      if (handler && typeof handler.onUpdate === "function") {
        try {
          handler.onUpdate(mob, record, currentTick, target, isSteady);
        } catch (error) {
          logError("infernalManager", `Error in ${modId}.onUpdate`, error);
        }
      }
    }
  }
}

