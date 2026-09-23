/**
 * Infernal Mobs Bedrock - Alchemist Modifier
 * Throws splash potions (Slowness, Poison, Weakness, Harming) every 6s based on distance & health
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { hasLineOfSight } from "../systems/lineOfSight.js";
import { throwPotion } from "../systems/projectileSystem.js";
import { isEntityAlive, isEntityValid, safeGetHealth } from "../util/entity.js";
import { distance } from "../util/vector.js";
import { randomFloat } from "../util/random.js";

const COOLDOWN_TICKS = 120; // 6 seconds
const MIN_DISTANCE = 2.0;
const MAX_DISTANCE = 12.0;

export const AlchemistHandler = {
  id: "alchemist",

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (!isSteady || !target || !isEntityValid(target) || !isEntityAlive(target)) return;

    const dist = distance(mob.location, target.location);
    if (dist < MIN_DISTANCE || dist > MAX_DISTANCE) return;

    if (!hasLineOfSight(mob, target)) return;

    if (!checkCooldownAndMark(mob, "alchemist", COOLDOWN_TICKS)) {
      return;
    }

    // Java selection algorithm
    let potion = "harming";
    const targetHealth = safeGetHealth(target);
    const hp = targetHealth ? targetHealth.currentValue : 20;

    let hasSlowness = false;
    let hasPoison = false;
    let hasWeakness = false;
    try {
      hasSlowness = Boolean(target.getEffect("minecraft:slowness"));
      hasPoison = Boolean(target.getEffect("minecraft:poison"));
      hasWeakness = Boolean(target.getEffect("minecraft:weakness"));
    } catch {}

    if (dist >= 8.0 && !hasSlowness) {
      potion = "slowness";
    } else if (hp >= 8.0 && !hasPoison) {
      potion = "poison";
    } else if (dist <= 3.0 && !hasWeakness && randomFloat() < 0.25) {
      potion = "weakness";
    }

    throwPotion(mob, target, potion);
  }
};

registerModifierHandler("alchemist", AlchemistHandler);
