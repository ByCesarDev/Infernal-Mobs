/**
 * Infernal Mobs Bedrock - Regen Modifier
 * Heals 1 HP per second (20 ticks) while not at full health and not on fire
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { getInfernalState } from "../storage/entityState.js";
import { isEntityAlive, isEntityValid, safeGetHealth } from "../util/entity.js";

const COOLDOWN_TICKS = 20;

export const RegenHandler = {
  id: "regen",

  onUpdate(mob, record, currentTick) {
    if (!isEntityValid(mob) || !isEntityAlive(mob)) return;

    // Must not be burning (Java parity)
    try {
      const onFireComp = mob.getComponent("minecraft:onfire");
      if (onFireComp) return;
    } catch {}

    if (checkCooldownAndMark(mob, "regen", COOLDOWN_TICKS)) {
      const health = safeGetHealth(mob);
      if (!health) return;

      const state = getInfernalState(mob);
      const maxHp = state?.infernalMaxHealth ?? health.effectiveMax;
      const current = health.currentValue;

      if (current < maxHp) {
        try {
          health.setCurrentValue(Math.min(maxHp, current + 1));
        } catch {}
      }
    }
  }
};

registerModifierHandler("regen", RegenHandler);
