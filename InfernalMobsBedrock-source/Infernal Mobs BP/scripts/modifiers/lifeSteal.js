/**
 * Infernal Mobs Bedrock - LifeSteal Modifier
 * Heals the mob equal to the damage dealt on attack (cannot exceed max health)
 * Banned on Creepers
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { getInfernalState } from "../storage/entityState.js";
import { isEntityAlive, isEntityValid, safeGetHealth } from "../util/entity.js";

export const LifeStealHandler = {
  id: "lifesteal",

  onOutgoingDamageAfter(context) {
    const attacker = context.attacker;
    const damageDealt = context.damage;

    if (!isEntityValid(attacker) || !isEntityAlive(attacker) || damageDealt <= 0) return;

    try {
      const health = safeGetHealth(attacker);
      if (!health) return;

      const state = getInfernalState(attacker);
      const maxHp = state?.infernalMaxHealth ?? health.effectiveMax;
      const current = health.currentValue;

      if (current < maxHp) {
        health.setCurrentValue(Math.min(maxHp, current + damageDealt));
      }
    } catch {}
  }
};

registerModifierHandler("lifesteal", LifeStealHandler);
