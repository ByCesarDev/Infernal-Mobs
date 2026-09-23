/**
 * Infernal Mobs Bedrock - Data Migrations
 * Migrates entities from legacy dynamic property formats to Schema v2
 */

import { PROPERTIES, SCHEMA_VERSION, TIER } from "../core/constants.js";
import { MODIFIER_METADATA } from "../data/modifierNames.js";
import { isEntityValid, safeGetHealth, getSpeciesKey } from "../util/entity.js";
import { logDebug, logError } from "../util/log.js";
import { setInfernalState } from "./entityState.js";

const LEGACY_KEYS = Object.freeze([
  "infernal:tier",
  "infernal:modifiers",
  "infernal:virtual_health",
  "infernal:virtual_max_health",
  "infernal:base_name",
  "infernal:cooldowns",
  "infernal:extra_life_used"
]);

/**
 * Checks if the entity contains legacy format infernal data and migrates it
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean} True if migrated, false otherwise
 */
export function migrateEntityIfNeeded(entity) {
  if (!isEntityValid(entity)) return false;

  try {
    // If it already has modern schema v2, no migration needed
    const rawState = entity.getDynamicProperty(PROPERTIES.state);
    if (typeof rawState === "string" && rawState) {
      const parsed = JSON.parse(rawState);
      if (parsed && parsed.schema === SCHEMA_VERSION) {
        return false;
      }
    }

    // Check if legacy properties exist
    const legacyModifiersRaw = entity.getDynamicProperty("infernal:modifiers");
    if (!legacyModifiersRaw || typeof legacyModifiersRaw !== "string") {
      return false;
    }

    logDebug("migration", `Migrating legacy entity ${entity.id} (${entity.typeId}) to schema v2`);

    const modifiers = legacyModifiersRaw.split("|").filter(Boolean).map((m) => m.toLowerCase());
    const modCount = modifiers.length;
    if (modCount === 0) {
      cleanLegacyProperties(entity);
      return false;
    }

    // Compute tier by modifier count
    let tier = TIER.RARE;
    if (modCount >= 11) {
      tier = TIER.INFERNAL;
    } else if (modCount >= 6) {
      tier = TIER.ULTRA;
    }

    const health = safeGetHealth(entity);
    const currentBaseMax = health ? (health.defaultValue ?? 20) : 20;
    const legacyVirtualMax = Number(entity.getDynamicProperty("infernal:virtual_max_health")) || (currentBaseMax * modCount);

    // Calculate official health: baseMaxHealth * modCount * 1.0
    const infernalMaxHealth = Math.max(currentBaseMax, Math.round(currentBaseMax * modCount));

    const extraLifeUsed = Boolean(entity.getDynamicProperty("infernal:extra_life_used"));
    let cooldowns = {};
    try {
      const cdRaw = entity.getDynamicProperty("infernal:cooldowns");
      if (typeof cdRaw === "string" && cdRaw) {
        cooldowns = JSON.parse(cdRaw);
      }
    } catch {}

    const species = getSpeciesKey(entity);
    const prefixMod = modifiers[0] ?? "";
    const prefixMeta = MODIFIER_METADATA[prefixMod];
    const prefixText = prefixMeta?.prefixes?.length > 0 ? prefixMeta.prefixes[0] : prefixMod;

    let suffixMod = null;
    let suffixText = "";
    if (modifiers.length > 1) {
      suffixMod = modifiers[1];
      const suffixMeta = MODIFIER_METADATA[suffixMod];
      suffixText = suffixMeta?.suffixes?.length > 0 ? suffixMeta.suffixes[0] : "";
    }

    const newState = {
      schema: SCHEMA_VERSION,
      initialized: true,
      isInfernal: true,
      modifiers,
      baseMaxHealth: currentBaseMax,
      infernalMaxHealth,
      tier,
      name: {
        prefixModifier: prefixMod,
        prefixText,
        suffixModifier: suffixMod,
        suffixText,
        speciesKey: species
      },
      persistent: {
        oneUpConsumed: extraLifeUsed
      },
      cooldowns
    };

    setInfernalState(entity, newState);
    cleanLegacyProperties(entity);

    logDebug("migration", `Successfully migrated entity ${entity.id} to schema v2 (${tier}, ${modCount} mods)`);
    return true;
  } catch (error) {
    logError("migration", `Error during migration of entity ${entity?.id}`, error);
    return false;
  }
}

function cleanLegacyProperties(entity) {
  for (const key of LEGACY_KEYS) {
    try {
      entity.setDynamicProperty(key, undefined);
    } catch {}
  }
}
