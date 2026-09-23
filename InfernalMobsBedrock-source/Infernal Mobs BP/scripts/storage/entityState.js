/**
 * Infernal Mobs Bedrock - Entity Persistent State Management (Schema v2)
 */

import { PROPERTIES, SCHEMA_VERSION } from "../core/constants.js";
import { isEntityValid } from "../util/entity.js";
import { logError } from "../util/log.js";

/**
 * Reads the schema v2 infernal state from the entity
 * @param {import("@minecraft/server").Entity} entity
 * @returns {object|null}
 */
export function getInfernalState(entity) {
  if (!isEntityValid(entity)) return null;
  try {
    const raw = entity.getDynamicProperty(PROPERTIES.state);
    if (typeof raw !== "string" || !raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.isInfernal) {
      return parsed;
    }
  } catch (error) {
    logError("entityState", `Failed reading infernal state on ${entity?.id}`, error);
  }
  return null;
}

/**
 * Writes the schema v2 infernal state to the entity
 * @param {import("@minecraft/server").Entity} entity
 * @param {object} state
 */
export function setInfernalState(entity, state) {
  if (!isEntityValid(entity)) return false;
  try {
    state.schema = SCHEMA_VERSION;
    state.initialized = true;
    state.isInfernal = true;
    entity.setDynamicProperty(PROPERTIES.state, JSON.stringify(state));
    entity.setDynamicProperty(PROPERTIES.processed, true);
    return true;
  } catch (error) {
    logError("entityState", `Failed setting infernal state on ${entity?.id}`, error);
    return false;
  }
}

/**
 * Checks whether the entity is an active infernal mob
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
export function isInfernal(entity) {
  if (!isEntityValid(entity)) return false;
  const state = getInfernalState(entity);
  return Boolean(state && state.isInfernal);
}

/**
 * Checks whether the entity has already been evaluated for infernal spawning
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
export function isEntityProcessed(entity) {
  if (!isEntityValid(entity)) return true;
  try {
    const processed = entity.getDynamicProperty(PROPERTIES.processed);
    if (processed) return true;
    const state = entity.getDynamicProperty(PROPERTIES.state);
    return Boolean(state);
  } catch {
    return true;
  }
}

/**
 * Marks an entity as evaluated and non-infernal, preventing repeated rolls
 * @param {import("@minecraft/server").Entity} entity
 */
export function markProcessedNonInfernal(entity) {
  if (!isEntityValid(entity)) return;
  try {
    entity.setDynamicProperty(PROPERTIES.processed, true);
  } catch (error) {
    logError("entityState", `Failed marking non-infernal on ${entity?.id}`, error);
  }
}

/**
 * Updates a specific cooldown inside persistent state
 * @param {import("@minecraft/server").Entity} entity
 * @param {string} abilityKey
 * @param {number} nextAllowedTick
 */
export function setPersistentCooldown(entity, abilityKey, nextAllowedTick) {
  const state = getInfernalState(entity);
  if (!state) return;
  if (!state.cooldowns) state.cooldowns = {};
  state.cooldowns[abilityKey] = nextAllowedTick;
  setInfernalState(entity, state);
}

/**
 * Completely clears infernal dynamic properties from an entity
 * @param {import("@minecraft/server").Entity} entity
 */
export function clearInfernalState(entity) {
  if (!isEntityValid(entity)) return;
  try {
    entity.setDynamicProperty(PROPERTIES.state, undefined);
    entity.setDynamicProperty(PROPERTIES.processed, undefined);
  } catch (error) {
    logError("entityState", `Failed clearing infernal state on ${entity?.id}`, error);
  }
}
