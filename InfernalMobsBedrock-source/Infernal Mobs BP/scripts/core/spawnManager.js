/**
 * Infernal Mobs Bedrock - Spawn & Generation Manager
 * Implements exact sequential probability rolls, modifier selection, and health buffs
 */

import { SCHEMA_VERSION, TIER } from "./constants.js";
import { MODIFIER_IDS, areModifiersCompatible, isModifierAllowedOnSpecies } from "../data/incompatibilities.js";
import { MODIFIER_METADATA } from "../data/modifierNames.js";
import { getConfig, isModifierConfigEnabled } from "../storage/worldConfig.js";
import { isEntityProcessed, markProcessedNonInfernal, setInfernalState } from "../storage/entityState.js";
import { applyInfernalHealth, calculateInfernalMaxHealth } from "../systems/healthSystem.js";
import { formatShortName } from "../systems/namingSystem.js";
import { getSpeciesKey, isCreeper, isEntityAlive, isEntityValid, isHostile, isPlayer, isSpider, isTamed, safeGetHealth } from "../util/entity.js";
import { pickRandom, randomInt, rollChance } from "../util/random.js";
import { logDebug, logInfo } from "../util/log.js";
import { registerInfernal } from "./infernalManager.js";

/**
 * Checks if an entity is eligible to become an infernal mob
 */
export function isEligibleForInfernal(entity, config = null, isNaturalSpawn = false) {
  if (!isEntityValid(entity) || !isEntityAlive(entity)) return false;
  if (isPlayer(entity)) return false;

  const currentConfig = config ?? getConfig();

  // Dimension blacklist check
  const dimId = entity.dimension.id;
  if (currentConfig.dimensionBlacklist && currentConfig.dimensionBlacklist.includes(dimId)) {
    return false;
  }

  // Tamed animals are never infernal
  if (isTamed(entity)) return false;

  // Must have a health component
  const health = safeGetHealth(entity);
  if (!health) return false;

  const typeId = entity.typeId;

  // Entity type blacklist
  if (currentConfig.entityBlacklist && currentConfig.entityBlacklist.includes(typeId)) {
    return false;
  }

  // Whitelist check if populated
  if (currentConfig.entityWhitelist && currentConfig.entityWhitelist.length > 0) {
    if (!currentConfig.entityWhitelist.includes(typeId)) {
      return false;
    }
  } else if (isNaturalSpawn) {
    // Natural spawn requires hostile enemy (Java: instanceof Enemy)
    if (!isHostile(entity)) {
      return false;
    }
  }

  return true;
}

/**
 * Rolls whether a mob becomes infernal and calculates the target modifier count and rolled tier
 * Following Java's exact chained rolls:
 * 1. Elite: 1 / eliteRarity -> 2-4 mods (Rare)
 * 2. If Elite, Ultra: 1 / ultraRarity -> + 3-4 mods (total 5-8, Ultra)
 * 3. If Ultra, Infernal: 1 / infernoRarity -> + 3-4 mods (total 8-12, Infernal)
 */
export function rollInfernalSpawn(config = null) {
  const currentConfig = config ?? getConfig();

  if (!rollChance(currentConfig.eliteRarity)) {
    return { count: 0, tier: null };
  }

  let count = 2 + randomInt(0, 2); // 2 to 4 mods base
  let tier = TIER.RARE;

  if (rollChance(currentConfig.ultraRarity)) {
    count += 3 + randomInt(0, 1); // + 3 to 4 mods (total 5 to 8)
    tier = TIER.ULTRA;

    if (rollChance(currentConfig.infernoRarity)) {
      count += 3 + randomInt(0, 1); // + 3 to 4 mods (total 8 to 12)
      tier = TIER.INFERNAL;
    }
  }

  return { count, tier };
}

/**
 * Convenience wrapper returning just the target modifier count
 */
export function rollModifierCount(config = null) {
  return rollInfernalSpawn(config).count;
}

/**
 * Calculates visual tier based strictly on effective modifier count:
 * - 1 to 5: Rare
 * - 6 to 10: Ultra
 * - 11+: Infernal
 */
export function calculateVisualTier(modifierCount) {
  if (modifierCount >= 11) return TIER.INFERNAL;
  if (modifierCount >= 6) return TIER.ULTRA;
  return TIER.RARE;
}

/**
 * Selects an array of compatible modifiers for an entity
 */
export function selectModifiers(targetCount, speciesId, config = null) {
  const candidates = MODIFIER_IDS.filter((id) => isModifierConfigEnabled(id));
  const pool = [...candidates];
  const selected = [];

  while (selected.length < targetCount && pool.length > 0) {
    const index = randomInt(0, pool.length - 1);
    const candidate = pool.splice(index, 1)[0];

    // Check species ban
    if (!isModifierAllowedOnSpecies(candidate, speciesId)) {
      continue;
    }

    // Check incompatibilities with all already selected modifiers
    if (!areModifiersCompatible(candidate, selected)) {
      continue;
    }

    selected.push(candidate);
  }

  return selected;
}

/**
 * Evaluates an entity on spawn or chunk load, and creates an infernal if eligible
 */
export function processEntitySpawn(entity) {
  if (!isEntityValid(entity) || isEntityProcessed(entity)) {
    return false;
  }

  const config = getConfig();
  if (!isEligibleForInfernal(entity, config, true)) {
    markProcessedNonInfernal(entity);
    return false;
  }

  const typeId = entity.typeId;
  const isForced = config.entitiesAlwaysInfernal && config.entitiesAlwaysInfernal.includes(typeId);

  let targetModCount = 0;
  if (isForced) {
    targetModCount = 2 + randomInt(0, 2); // Guaranteed base elite
    if (rollChance(config.ultraRarity)) {
      targetModCount += 3 + randomInt(0, 1);
      if (rollChance(config.infernoRarity)) {
        targetModCount += 3 + randomInt(0, 1);
      }
    }
  } else {
    targetModCount = rollModifierCount(config);
  }

  if (targetModCount <= 0) {
    markProcessedNonInfernal(entity);
    return false;
  }

  const created = createInfernal(entity, null, null, targetModCount);
  return Boolean(created);
}

/**
 * Creates an infernal entity (either from natural spawn or forced via command)
 */
export function createInfernal(entity, forcedTier = null, forcedModifiers = null, requestedCount = 0) {
  if (!isEntityValid(entity)) return null;

  const health = safeGetHealth(entity);
  if (!health) return null;

  const species = getSpeciesKey(entity);

  let modifiers = [];
  if (forcedModifiers && Array.isArray(forcedModifiers) && forcedModifiers.length > 0) {
    modifiers = [...forcedModifiers];
  } else {
    let count = requestedCount;
    if (count <= 0) {
      if (forcedTier === TIER.INFERNAL) count = randomInt(11, 12);
      else if (forcedTier === TIER.ULTRA) count = randomInt(6, 8);
      else if (forcedTier === TIER.RARE) count = randomInt(2, 4);
      else count = 2 + randomInt(0, 2);
    }
    modifiers = selectModifiers(count, species);
  }

  if (modifiers.length === 0) {
    markProcessedNonInfernal(entity);
    return null;
  }

  const tier = forcedTier ?? calculateVisualTier(modifiers.length);
  const baseMaxHealth = health.defaultValue ?? health.effectiveMax ?? 20;
  const infernalMaxHealth = calculateInfernalMaxHealth(baseMaxHealth, modifiers.length);

  // Pick prefix and suffix from modifier metadata (Java 1:1 logic)
  const prefixIndex = randomInt(0, modifiers.length - 1);
  const prefixMod = modifiers[prefixIndex];
  const prefixMeta = MODIFIER_METADATA[prefixMod];
  const prefixText = (prefixMeta && prefixMeta.prefixes && prefixMeta.prefixes.length > 0)
    ? pickRandom(prefixMeta.prefixes)
    : prefixMod;

  let suffixMod = null;
  let suffixText = "";
  if (modifiers.length > 1) {
    const suffixIndex = (prefixIndex + 1) % modifiers.length;
    suffixMod = modifiers[suffixIndex];
    const suffixMeta = MODIFIER_METADATA[suffixMod];
    suffixText = (suffixMeta && suffixMeta.suffixes && suffixMeta.suffixes.length > 0)
      ? pickRandom(suffixMeta.suffixes)
      : "";
  }

  const state = {
    schema: SCHEMA_VERSION,
    initialized: true,
    isInfernal: true,
    modifiers,
    baseMaxHealth,
    infernalMaxHealth,
    currentHealth: infernalMaxHealth,
    tier,
    name: {
      prefixModifier: prefixMod,
      prefixText,
      suffixModifier: suffixMod,
      suffixText,
      speciesKey: species
    },
    persistent: {
      oneUpConsumed: false
    },
    cooldowns: {}
  };

  setInfernalState(entity, state);
  applyInfernalHealth(entity, infernalMaxHealth, baseMaxHealth, infernalMaxHealth);

  try {
    entity.extinguishFire(false);
  } catch {}

  registerInfernal(entity, state);
  const currentConfig = getConfig();
  if (currentConfig.namesEnabled && isEntityValid(entity)) {
    entity.nameTag = formatShortName(state);
  }
  logInfo("spawn", `Created ${tier} infernal ${entity.typeId} (${entity.id}) with ${modifiers.length} mods: ${modifiers.join(", ")}`);

  return state;
}
