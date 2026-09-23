/**
 * Infernal Mobs Bedrock - Poisonous Modifier
 * Applies Poison for 6 seconds (120 ticks) on incoming or outgoing direct contact
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

function applyPoison(target) {
  if (!isEntityValid(target) || !isEntityAlive(target)) return;
  try {
    target.addEffect("minecraft:poison", 120, {
      amplifier: 0,
      showParticles: true
    });
  } catch {}
}

export const PoisonousHandler = {
  id: "poisonous",

  onIncomingDamageAfter(context) {
    if (context.attacker && context.attacker.id !== context.victim.id) {
      applyPoison(context.attacker);
    }
  },

  onOutgoingDamageAfter(context) {
    if (context.victim && context.victim.id !== context.attacker.id) {
      applyPoison(context.victim);
    }
  }
};

registerModifierHandler("poisonous", PoisonousHandler);
