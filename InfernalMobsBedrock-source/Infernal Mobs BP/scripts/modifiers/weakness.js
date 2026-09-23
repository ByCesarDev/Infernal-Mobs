/**
 * Infernal Mobs Bedrock - Weakness Modifier
 * Applies Weakness for 6 seconds (120 ticks) on incoming or outgoing contact
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

function applyWeakness(target) {
  if (!isEntityValid(target) || !isEntityAlive(target)) return;
  try {
    target.addEffect("minecraft:weakness", 120, {
      amplifier: 0,
      showParticles: true
    });
  } catch {}
}

export const WeaknessHandler = {
  id: "weakness",

  onIncomingDamageAfter(context) {
    if (context.attacker && context.attacker.id !== context.victim.id) {
      applyWeakness(context.attacker);
    }
  },

  onOutgoingDamageAfter(context) {
    if (context.victim && context.victim.id !== context.attacker.id) {
      applyWeakness(context.victim);
    }
  }
};

registerModifierHandler("weakness", WeaknessHandler);
