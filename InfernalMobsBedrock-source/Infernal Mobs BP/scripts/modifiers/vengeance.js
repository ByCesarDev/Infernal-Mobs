/**
 * Infernal Mobs Bedrock - Vengeance Modifier
 * Reflects half of incoming damage (minimum 1, maximum 10) back to attacker
 * Uses recursion guards to prevent infinite reflection loops
 */

import { DAMAGE_GUARDS } from "../core/constants.js";
import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { getConfig } from "../storage/worldConfig.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";
import { setDamageGuard } from "../util/guards.js";
import { logDebug } from "../util/log.js";

export const VengeanceHandler = {
  id: "vengeance",

  onIncomingDamageAfter(context) {
    const victim = context.victim;
    const attacker = context.attacker;
    const damage = context.damage;
    const tick = context.tick;

    if (!isEntityValid(victim) || !isEntityValid(attacker) || !isEntityAlive(attacker)) return;
    if (victim.id === attacker.id) return;

    const config = getConfig();
    const maxDmg = config.maxDamage ?? 10.0;
    const reflected = Math.min(Math.max(damage / 2, 1), maxDmg);

    if (reflected > 0) {
      logDebug("vengeance", `Reflecting ${reflected} damage from ${victim.id} to ${attacker.id}`);
      setDamageGuard(attacker.id, DAMAGE_GUARDS.REFLECT, tick);
      try {
        attacker.applyDamage(reflected, {
          cause: "thorns",
          damagingEntity: victim
        });
      } catch {}
    }
  }
};

registerModifierHandler("vengeance", VengeanceHandler);
