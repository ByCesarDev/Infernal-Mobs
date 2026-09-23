/**
 * Infernal Mobs Bedrock - Sapper Modifier
 * Applies Hunger for 6 seconds (120 ticks) on incoming or outgoing contact
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

function applyHunger(target) {
  if (!isEntityValid(target) || !isEntityAlive(target)) return;
  try {
    target.addEffect("minecraft:hunger", 120, {
      amplifier: 0,
      showParticles: true
    });
  } catch {}
}

export const SapperHandler = {
  id: "sapper",

  onIncomingDamageAfter(context) {
    if (context.attacker && context.attacker.id !== context.victim.id) {
      applyHunger(context.attacker);
    }
  },

  onOutgoingDamageAfter(context) {
    if (context.victim && context.victim.id !== context.attacker.id) {
      applyHunger(context.victim);
    }
  }
};

registerModifierHandler("sapper", SapperHandler);
