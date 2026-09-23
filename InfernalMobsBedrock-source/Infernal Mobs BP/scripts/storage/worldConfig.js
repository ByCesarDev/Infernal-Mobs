/**
 * Infernal Mobs Bedrock - World Configuration Storage
 * Persists configuration in world dynamic properties with validation
 */

import { world } from "@minecraft/server";
import { PROPERTIES } from "../core/constants.js";
import { DEFAULT_CONFIG } from "../data/defaultConfig.js";
import { logError, logInfo, setDebugLogging } from "../util/log.js";

let inMemoryConfig = { ...DEFAULT_CONFIG };

/**
 * Loads configuration from world dynamic properties or initializes defaults
 */
export function loadWorldConfig() {
  try {
    const raw = world.getDynamicProperty(PROPERTIES.worldConfig);
    if (typeof raw === "string" && raw) {
      const parsed = JSON.parse(raw);
      inMemoryConfig = { ...DEFAULT_CONFIG, ...parsed };
    } else {
      inMemoryConfig = { ...DEFAULT_CONFIG };
      saveWorldConfig();
    }
  } catch (error) {
    logError("worldConfig", "Failed loading world config, using defaults", error);
    inMemoryConfig = { ...DEFAULT_CONFIG };
  }
  setDebugLogging(inMemoryConfig.debug);
  return inMemoryConfig;
}

/**
 * Saves current in-memory configuration to world dynamic properties
 */
export function saveWorldConfig() {
  try {
    world.setDynamicProperty(PROPERTIES.worldConfig, JSON.stringify(inMemoryConfig));
    return true;
  } catch (error) {
    logError("worldConfig", "Failed saving world config", error);
    return false;
  }
}

/**
 * Returns current configuration
 */
export function getConfig() {
  return inMemoryConfig;
}

/**
 * Updates a specific configuration key if valid
 * @param {string} key
 * @param {any} value
 * @returns {{ success: boolean, message: string }}
 */
export function updateConfigOption(key, value) {
  if (!(key in DEFAULT_CONFIG)) {
    return { success: false, message: `Unknown config option: ${key}` };
  }

  // Type check and validate
  switch (key) {
    case "eliteRarity":
    case "ultraRarity":
    case "infernoRarity": {
      const num = Number(value);
      if (!Number.isInteger(num) || num < 1 || num > 1000) {
        return { success: false, message: `${key} must be an integer between 1 and 1000.` };
      }
      inMemoryConfig[key] = num;
      break;
    }
    case "modHealthFactor": {
      const num = Number(value);
      if (isNaN(num) || num <= 0 || num > 50) {
        return { success: false, message: "modHealthFactor must be a number between 0.1 and 50.0." };
      }
      inMemoryConfig[key] = num;
      break;
    }
    case "maxDamage": {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 1000) {
        return { success: false, message: "maxDamage must be a number between 0 and 1000." };
      }
      inMemoryConfig[key] = num;
      break;
    }
    case "modCooldownFactor": {
      const num = Number(value);
      if (isNaN(num) || num <= 0 || num > 10) {
        return { success: false, message: "modCooldownFactor must be between 0.1 and 10.0." };
      }
      inMemoryConfig[key] = num;
      break;
    }
    case "healthChangesDisabled":
    case "disableHealthBar":
    case "antiFarm":
    case "namesEnabled":
    case "hudEnabled":
    case "lootEnabled":
    case "xpEnabled":
    case "debug": {
      const boolVal = typeof value === "boolean" ? value : String(value).toLowerCase() === "true" || String(value) === "1" || String(value) === "on";
      inMemoryConfig[key] = boolVal;
      if (key === "debug") setDebugLogging(boolVal);
      break;
    }
    default:
      inMemoryConfig[key] = value;
      break;
  }

  const saved = saveWorldConfig();
  if (saved) {
    logInfo("worldConfig", `Updated config option ${key} to ${inMemoryConfig[key]}`);
    return { success: true, message: `Config option '${key}' set to ${inMemoryConfig[key]}` };
  }
  return { success: false, message: "Failed to persist configuration to world dynamic property." };
}

/**
 * Enables or disables a specific modifier in configuration
 */
export function setModifierEnabledConfig(modifierId, enabled) {
  const normId = modifierId.toLowerCase();
  if (!inMemoryConfig.modsEnabled) inMemoryConfig.modsEnabled = {};
  inMemoryConfig.modsEnabled[normId] = Boolean(enabled);
  saveWorldConfig();
  return true;
}

export function isModifierConfigEnabled(modifierId) {
  const normId = modifierId.toLowerCase();
  if (!inMemoryConfig.modsEnabled) return true;
  if (normId in inMemoryConfig.modsEnabled) {
    return inMemoryConfig.modsEnabled[normId] !== false;
  }
  return true;
}

/**
 * Resets configuration to default values
 */
export function resetWorldConfig() {
  inMemoryConfig = { ...DEFAULT_CONFIG, modsEnabled: {} };
  saveWorldConfig();
  setDebugLogging(inMemoryConfig.debug);
  return inMemoryConfig;
}
