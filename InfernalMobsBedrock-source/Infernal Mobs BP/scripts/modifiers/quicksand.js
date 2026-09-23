/**
 * Infernal Mobs Bedrock - Quicksand Modifier
 * Applies Slowness I for 45 ticks every 50 ticks to steady visible target
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { hasLineOfSight } from "../systems/lineOfSight.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

const COOLDOWN_TICKS = 50;
const DURATION_TICKS = 45;

export const QuicksandHandler = {
  id: "quicksand",

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (!isSteady || !target || !isEntityValid(target) || !isEntityAlive(target)) return;

    if (checkCooldownAndMark(mob, "quicksand", COOLDOWN_TICKS)) {
      if (hasLineOfSight(mob, target)) {
        try {
          target.addEffect("minecraft:slowness", DURATION_TICKS, {
            amplifier: 0,
            showParticles: true
          });
        } catch {}
      }
    }
  }
};

registerModifierHandler("quicksand", QuicksandHandler);
