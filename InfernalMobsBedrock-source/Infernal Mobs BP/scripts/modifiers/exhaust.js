/**
 * Infernal Mobs Bedrock - Exhaust Modifier
 * Adds 1.0 food exhaustion point on direct incoming or outgoing contact with a player
 */

import { system } from "@minecraft/server";
import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isCreativePlayer, isEntityValid, isPlayer } from "../util/entity.js";

function applyExhaustion(target) {
  if (!isEntityValid(target) || !isPlayer(target) || isCreativePlayer(target)) return;

  system.run(() => {
    if (!isEntityValid(target)) return;
    try {
      const comp = target.getComponent("minecraft:player.exhaustion");
      if (comp) {
        const current = comp.currentValue ?? 0;
        const max = comp.effectiveMax ?? 20;
        comp.setCurrentValue(Math.min(max, current + 1.0));
      }
    } catch {}
  });
}

export const ExhaustHandler = {
  id: "exhaust",

  onIncomingDamageAfter(context) {
    if (context.attacker) {
      applyExhaustion(context.attacker);
    }
  },

  onOutgoingDamageAfter(context) {
    if (context.victim) {
      applyExhaustion(context.victim);
    }
  }
};

registerModifierHandler("exhaust", ExhaustHandler);
