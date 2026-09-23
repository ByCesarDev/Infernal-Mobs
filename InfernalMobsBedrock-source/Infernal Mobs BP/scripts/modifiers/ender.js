/**
 * Infernal Mobs Bedrock - Ender Modifier
 * Teleports upon taking damage (15s cooldown), cancels the hit and reflects up to 10 damage
 */

import { DAMAGE_GUARDS } from "../core/constants.js";
import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { getConfig } from "../storage/worldConfig.js";
import { tryTeleportWithTarget } from "../systems/teleportSystem.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";
import { setDamageGuard } from "../util/guards.js";
import { logDebug } from "../util/log.js";

const COOLDOWN_TICKS = 300; // 15 seconds

export const EnderHandler = {
  id: "ender",

  onIncomingDamageBefore(context) {
    const victim = context.victim;
    const attacker = context.attacker;
    const tick = context.tick;

    if (!isEntityValid(victim) || !isEntityValid(attacker) || !isEntityAlive(attacker)) return;
    if (victim.id === attacker.id) return;

    if (!checkCooldownAndMark(victim, "ender", COOLDOWN_TICKS)) {
      return;
    }

    const teleported = tryTeleportWithTarget(victim, attacker);
    if (teleported) {
      // Cancel incoming damage
      context.cancel = true;

      // Play teleport sound at destination
      victim.dimension.playSound("mob.endermen.portal", victim.location, {
        volume: 1.0,
        pitch: 1.0
      });

      // Reflect damage capped at maxDamage
      const config = getConfig();
      const maxDmg = config.maxDamage ?? 10.0;
      const reflected = Math.min(context.damage, maxDmg);

      if (reflected > 0) {
        logDebug("ender", `Ender teleported, cancelling hit and reflecting ${reflected} to ${attacker.id}`);
        setDamageGuard(attacker.id, DAMAGE_GUARDS.ENDER_REFLECT, tick);
        try {
          attacker.applyDamage(reflected, {
            cause: "entityAttack",
            damagingEntity: victim
          });
        } catch {}
      }
    }
  }
};

registerModifierHandler("ender", EnderHandler);
