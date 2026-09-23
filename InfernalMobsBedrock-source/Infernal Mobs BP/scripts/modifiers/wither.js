/**
 * Infernal Mobs Bedrock - Wither Modifier
 * Applies Wither for 6 seconds (120 ticks) on incoming or outgoing contact
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

function applyWither(target) {
  if (!isEntityValid(target) || !isEntityAlive(target)) return;
  try {
    target.addEffect("minecraft:wither", 120, {
      amplifier: 0,
      showParticles: true
    });
  } catch {}
}

export const WitherHandler = {
  id: "wither",

  onIncomingDamageAfter(context) {
    if (context.attacker && context.attacker.id !== context.victim.id) {
      applyWither(context.attacker);
    }
  },

  onOutgoingDamageAfter(context) {
    if (context.victim && context.victim.id !== context.attacker.id) {
      applyWither(context.victim);
    }
  }
};

registerModifierHandler("wither", WitherHandler);
