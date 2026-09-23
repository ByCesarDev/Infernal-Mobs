/**
 * Infernal Mobs Bedrock - Blastoff Modifier
 * Launches target vertically into the air (Y impulse ~1.1) every 15s
 * Incompatible with Webber
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { hasLineOfSight } from "../systems/lineOfSight.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

const COOLDOWN_TICKS = 300; // 15 seconds

function triggerBlastoff(mob, target) {
  if (!isEntityValid(mob) || !isEntityValid(target) || !isEntityAlive(target)) return;

  if (checkCooldownAndMark(mob, "blastoff", COOLDOWN_TICKS)) {
    if (hasLineOfSight(mob, target)) {
      try {
        // Vertical launch impulse
        target.applyKnockback({ x: 0, z: 0 }, 1.1);

        mob.dimension.playSound("mob.slime.jump", mob.location, {
          volume: 1.0,
          pitch: 1.0
        });
      } catch {}
    }
  }
}

export const BlastoffHandler = {
  id: "blastoff",

  onIncomingDamageAfter(context) {
    if (context.attacker && context.attacker.id !== context.victim.id) {
      triggerBlastoff(context.victim, context.attacker);
    }
  },

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (isSteady && target) {
      triggerBlastoff(mob, target);
    }
  }
};

registerModifierHandler("blastoff", BlastoffHandler);
