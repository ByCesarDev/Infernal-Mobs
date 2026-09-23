/**
 * Infernal Mobs Bedrock - Darkness Modifier
 * Applies Blindness for 6 seconds (120 ticks) on incoming or outgoing direct contact
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

function applyDarkness(target) {
  if (!isEntityValid(target) || !isEntityAlive(target)) return;
  try {
    target.addEffect("minecraft:blindness", 120, {
      amplifier: 0,
      showParticles: true
    });
  } catch {}
}

export const DarknessHandler = {
  id: "darkness",

  onIncomingDamageAfter(context) {
    if (context.attacker && context.attacker.id !== context.victim.id) {
      applyDarkness(context.attacker);
    }
  },

  onOutgoingDamageAfter(context) {
    if (context.victim && context.victim.id !== context.attacker.id) {
      applyDarkness(context.victim);
    }
  }
};

registerModifierHandler("darkness", DarknessHandler);
