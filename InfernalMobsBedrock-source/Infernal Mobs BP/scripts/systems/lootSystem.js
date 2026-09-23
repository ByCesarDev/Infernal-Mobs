/**
 * Infernal Mobs Bedrock - Loot & Experience System
 * Exact 1:1 match with Java dropLootForEnt and dropRandomEnchantedItems
 */

import { ItemStack } from "@minecraft/server";
import { TIER } from "../core/constants.js";
import { LOOT_TABLE_ELITE, LOOT_TABLE_INFERNAL, LOOT_TABLE_ULTRA, LOOT_XP_VALUE } from "../data/lootDefinitions.js";
import { getInfernalState } from "../storage/entityState.js";
import { getConfig } from "../storage/worldConfig.js";
import { unregisterInfernal } from "../core/infernalManager.js";
import { enchantRandomly } from "./enchantmentSystem.js";
import { isEntityValid, isPlayer } from "../util/entity.js";
import { pickRandom } from "../util/random.js";
import { logDebug, logError } from "../util/log.js";

const processedDeaths = new Set();

/**
 * Handles death event of an entity, dropping bonus loot and XP if it was infernal
 * @param {import("@minecraft/server").EntityDieAfterEvent} event
 */
export function handleInfernalDeath(event) {
  const entity = event.deadEntity;
  if (!isEntityValid(entity)) return;

  const entityId = entity.id;
  if (processedDeaths.has(entityId)) return;

  const state = getInfernalState(entity);
  if (!state || !state.isInfernal) return;

  processedDeaths.add(entityId);
  unregisterInfernal(entityId);

  const config = getConfig();
  const dimension = entity.dimension;
  const location = entity.location;
  const modifiers = state.modifiers ?? [];
  const modCount = modifiers.length;
  const tier = state.tier ?? TIER.RARE;
  const killer = event.damageSource?.damagingEntity;
  const isKilledByPlayer = isPlayer(killer);

  // AntiFarm check: suppress drops if mob died to automated/environmental damage without player combat
  if (config.antiFarm && !isKilledByPlayer) {
    const cause = event.damageSource?.cause;
    const environmentalCauses = ["fall", "drowning", "suffocation", "contact", "fire", "lava", "void", "magma", "stalagmite", "starvation"];
    if (environmentalCauses.includes(cause)) {
      logDebug("lootSystem", `AntiFarm active: suppressed infernal drops for ${entityId} (cause: ${cause})`);
      return;
    }
  }

  // 1. Deliver 25 Experience points directly (if enabled)
  if (config.xpEnabled) {
    try {
      if (isKilledByPlayer) {
        killer.addExperience(25);
      } else {
        // Fallback: spawn 5 xp orbs at death location
        for (let i = 0; i < 5; i++) {
          dimension.spawnEntity("minecraft:xp_orb", location);
        }
      }
    } catch (error) {
      logError("lootSystem", "Failed delivering XP", error);
    }
  }

  // 2. Bonus Loot Drops (if enabled)
  // Exact Java parity: while (modStr > 0) { usedStr = (modStr - 5 > 0) ? 5 : modStr; enchantRandomly(item, usedStr); modStr -= 5; }
  if (config.lootEnabled) {
    try {
      let table = LOOT_TABLE_ELITE;
      if (tier === TIER.INFERNAL) {
        table = LOOT_TABLE_INFERNAL;
      } else if (tier === TIER.ULTRA) {
        table = LOOT_TABLE_ULTRA;
      }

      let modStr = modCount;
      let droppedCount = 0;

      while (modStr > 0) {
        const entry = pickRandom(table);
        if (entry) {
          try {
            const itemStack = new ItemStack(entry.itemId, entry.amount ?? 1);
            const usedStr = (modStr - 5 > 0) ? 5 : modStr;
            if (entry.enchantable) {
              enchantRandomly(itemStack, usedStr);
            }
            dimension.spawnItem(itemStack, location);
            droppedCount++;
          } catch (itemError) {
            logError("lootSystem", `Failed dropping item ${entry?.itemId}`, itemError);
          }
          modStr -= 5;
        } else {
          modStr--;
        }
      }

      logDebug("lootSystem", `Dropped ${droppedCount} bonus items and 25 XP for ${tier} mob ${entityId}`);
    } catch (error) {
      logError("lootSystem", "Failed dropping bonus loot", error);
    }
  }

  // Clean up processed deaths memory after 100 ticks
  setTimeoutCleanup(entityId);
}

function setTimeoutCleanup(entityId) {
  // Prune after delay
  if (processedDeaths.size > 200) {
    processedDeaths.clear();
  }
}
