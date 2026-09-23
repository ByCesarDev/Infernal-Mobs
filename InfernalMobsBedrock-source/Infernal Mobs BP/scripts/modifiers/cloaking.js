/**
 * Infernal Mobs Bedrock - Cloaking Modifier
 * Applies Invisibility for 10 seconds (200 ticks) on target or on direct hit (10s cooldown)
 * Banned on Spiders and Cave Spiders
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

const COOLDOWN_TICKS = 200; // 10 seconds
const INVISIBILITY_TICKS = 200; // 10 seconds

function triggerCloaking(mob) {
  if (!isEntityValid(mob) || !isEntityAlive(mob)) return;

  if (checkCooldownAndMark(mob, "cloaking", COOLDOWN_TICKS)) {
    try {
      mob.addEffect("minecraft:invisibility", INVISIBILITY_TICKS, {
        amplifier: 0,
        showParticles: false
      });
    } catch {}
  }
}

export const CloakingHandler = {
  id: "cloaking",

  onIncomingDamageAfter(context) {
    triggerCloaking(context.victim);
  },

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (isSteady && target) {
      triggerCloaking(mob);
    }
  }
};

registerModifierHandler("cloaking", CloakingHandler);
