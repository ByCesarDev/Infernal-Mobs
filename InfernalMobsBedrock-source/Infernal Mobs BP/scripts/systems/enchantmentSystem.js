/**
 * Infernal Mobs Bedrock - Enchantment System
 * Scales enchantment strength and count dynamically based on infernal mob strength
 */

import { EnchantmentTypes } from "@minecraft/server";
import { pickRandom, randomInt } from "../util/random.js";
import { logError } from "../util/log.js";

const COMMON_ENCHANTMENT_IDS = Object.freeze([
  "protection",
  "fire_protection",
  "blast_protection",
  "projectile_protection",
  "unbreaking",
  "thorns",
  "feather_falling",
  "respiration",
  "aqua_affinity",
  "depth_strider",
  "sharpness",
  "smite",
  "bane_of_arthropods",
  "knockback",
  "fire_aspect",
  "looting",
  "efficiency",
  "silk_touch",
  "fortune",
  "power",
  "punch",
  "flame",
  "infinity",
  "mending"
]);

/**
 * Randomly enchants an ItemStack based on the modifier count of the defeated mob
 * Parity with Java: enchantRandomly(level, itemStack, itemEnchantability, modStr)
 * @param {import("@minecraft/server").ItemStack} itemStack
 * @param {number} modifierCount
 */
export function enchantRandomly(itemStack, modifierCount) {
  if (!itemStack) return;

  try {
    const enchantable = itemStack.getComponent("minecraft:enchantable");
    if (!enchantable) return;

    // In Java: remainStr = (modStr + 1) / 2 -> results in 1 to 3 enchantments
    const modStr = Math.max(2, Math.min(12, modifierCount));
    const enchantmentRounds = Math.max(1, Math.min(3, Math.floor((modStr + 1) / 2)));

    const shuffled = [...COMMON_ENCHANTMENT_IDS].sort(() => Math.random() - 0.5);
    let appliedCount = 0;

    for (const enchId of shuffled) {
      if (appliedCount >= enchantmentRounds) break;

      try {
        const enchType = EnchantmentTypes.get(enchId);
        if (!enchType) continue;

        const maxLevel = enchType.maxLevel ?? 1;
        // Scale level according to mob strength: low tier 1..max(1, maxLevel-1), high tier up to maxLevel
        let level = 1;
        if (maxLevel > 1) {
          const powerBonus = Math.floor(modStr / 4);
          level = Math.max(1, Math.min(maxLevel, 1 + powerBonus + randomInt(0, 1)));
        }

        const candidate = { type: enchType, level };
        if (enchantable.canAddEnchantment(candidate)) {
          enchantable.addEnchantment(candidate);
          appliedCount++;
        }
      } catch {}
    }
  } catch (error) {
    logError("enchantmentSystem", "Failed applying random enchantments", error);
  }
}
