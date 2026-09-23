/**
 * Infernal Mobs Bedrock - Ninja Modifier
 * Teleports upon taking damage (15s cooldown) with an explosion at origin, cancels hit and reflects up to 10 damage
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

export const NinjaHandler = {
  id: "ninja",

  onIncomingDamageBefore(context) {
    const victim = context.victim;
    const attacker = context.attacker;
    const tick = context.tick;

    if (!isEntityValid(victim) || !isEntityValid(attacker) || !isEntityAlive(attacker)) return;
    if (victim.id === attacker.id) return;

    if (!checkCooldownAndMark(victim, "ninja", COOLDOWN_TICKS)) {
      return;
    }

    const startLoc = { ...victim.location };
    const teleported = tryTeleportWithTarget(victim, attacker);
    if (teleported) {
      // Cancel incoming hit
      context.cancel = true;

      // Spawn explosion sound and particles at start position (Java parity)
      try {
        victim.dimension.playSound("random.explode", startLoc, {
          volume: 1.0,
          pitch: 1.0
        });
        victim.dimension.spawnParticle("minecraft:basic_smoke_particle", {
          x: startLoc.x,
          y: startLoc.y + 1,
          z: startLoc.z
        });
      } catch {}

      // Reflect damage capped at maxDamage
      const config = getConfig();
      const maxDmg = config.maxDamage ?? 10.0;
      const reflected = Math.min(context.damage, maxDmg);

      if (reflected > 0) {
        logDebug("ninja", `Ninja teleported, cancelling hit and reflecting ${reflected} to ${attacker.id}`);
        setDamageGuard(attacker.id, DAMAGE_GUARDS.NINJA_REFLECT, tick);
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

registerModifierHandler("ninja", NinjaHandler);
