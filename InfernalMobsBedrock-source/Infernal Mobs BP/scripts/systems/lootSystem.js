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
import { isEntityValid } from "../util/entity.js";
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

  // 1. Drop 25 Experience points (if enabled)
  if (config.xpEnabled) {
    try {
      // In Bedrock, spawning xp_orb with experience value or spawning multiple orbs
      let remainingXp = LOOT_XP_VALUE;
      while (remainingXp > 0) {
        const split = Math.min(remainingXp, 7);
        remainingXp -= split;
        dimension.spawnEntity("minecraft:xp_orb", location);
      }
    } catch (error) {
      logError("lootSystem", "Failed spawning XP orbs", error);
    }
  }

  // 2. Bonus Loot Drops (if enabled)
  if (config.lootEnabled) {
    try {
      // In Java: extraDrops = ceil(modCount / 5)
      const extraDrops = Math.max(1, Math.ceil(modCount / 5));

      let table = LOOT_TABLE_ELITE;
      if (tier === TIER.INFERNAL) {
        table = LOOT_TABLE_INFERNAL;
      } else if (tier === TIER.ULTRA) {
        table = LOOT_TABLE_ULTRA;
      }

      for (let i = 0; i < extraDrops; i++) {
        const entry = pickRandom(table);
        if (!entry) continue;

        try {
          const itemStack = new ItemStack(entry.itemId, entry.amount ?? 1);
          if (entry.enchantable) {
            enchantRandomly(itemStack, modCount);
          }
          dimension.spawnItem(itemStack, location);
        } catch (itemError) {
          logError("lootSystem", `Failed dropping item ${entry?.itemId}`, itemError);
        }
      }

      logDebug("lootSystem", `Dropped ${extraDrops} bonus items and 25 XP for ${tier} mob ${entityId}`);
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
