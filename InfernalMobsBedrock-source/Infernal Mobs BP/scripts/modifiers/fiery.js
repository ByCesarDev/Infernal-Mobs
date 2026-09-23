/**
 * Infernal Mobs Bedrock - Fiery Modifier
 * Sets target on fire for 3s (60 ticks) on contact; extinguishes self when struck
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

function setOnFire(target, seconds = 3) {
  if (!isEntityValid(target) || !isEntityAlive(target)) return;
  try {
    target.setOnFire(seconds, true);
  } catch {}
}

export const FieryHandler = {
  id: "fiery",

  onIncomingDamageAfter(context) {
    // Extinguish the infernal mob's own fire when struck (Java parity)
    if (isEntityValid(context.victim)) {
      try {
        context.victim.extinguishFire(false);
      } catch {}
    }

    if (context.attacker && context.attacker.id !== context.victim.id) {
      setOnFire(context.attacker, 3);
    }
  },

  onOutgoingDamageAfter(context) {
    if (context.victim && context.victim.id !== context.attacker.id) {
      setOnFire(context.victim, 3);
    }
  }
};

registerModifierHandler("fiery", FieryHandler);
