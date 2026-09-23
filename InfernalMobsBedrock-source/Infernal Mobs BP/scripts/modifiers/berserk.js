/**
 * Infernal Mobs Bedrock - Berserk Modifier
 * Deals double outgoing attack damage (capped at maxDamage, default 10)
 * Deals original damage to itself as self-damage (guarded from recursion)
 * Banned on Creepers
 */

import { DAMAGE_GUARDS } from "../core/constants.js";
import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { getConfig } from "../storage/worldConfig.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";
import { setDamageGuard } from "../util/guards.js";

export const BerserkHandler = {
  id: "berserk",

  onOutgoingDamageBefore(context) {
    const attacker = context.attacker;
    const originalDamage = context.originalDamage;
    const tick = context.tick;

    if (!isEntityValid(attacker) || !isEntityAlive(attacker) || originalDamage <= 0) return;

    // Queue self-damage equal to original unmitigated damage to be executed outside restricted mode
    if (!context.pendingActions) context.pendingActions = [];
    context.pendingActions.push(() => {
      if (isEntityValid(attacker) && isEntityAlive(attacker)) {
        setDamageGuard(attacker.id, DAMAGE_GUARDS.BERSERK_SELF, tick);
        try {
          attacker.applyDamage(originalDamage, {
            cause: "override"
          });
        } catch {}
      }
    });

    // Double outgoing damage and clamp to maxDamage
    const config = getConfig();
    const maxDmg = config.maxDamage ?? 10.0;
    context.damage = Math.min(context.damage * 2, maxDmg);
  }
};

registerModifierHandler("berserk", BerserkHandler);
