/**
 * Infernal Mobs Bedrock - Ninja Modifier
 * Teleports upon taking damage (15s cooldown) with an explosion at origin, cancels hit and reflects up to 10 damage
 */

import { DAMAGE_GUARDS } from "../core/constants.js";
import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { getConfig } from "../storage/worldConfig.js";
import { findTeleportDestinationWithTarget } from "../systems/teleportSystem.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";
import { setDamageGuard } from "../util/guards.js";
import { logDebug } from "../util/log.js";

const COOLDOWN_TICKS = 300; // 15 seconds

function randomizeNinjaLocation(origin) {
  return {
    x: origin.x + (Math.random() * 2 - 1),
    y: origin.y + (Math.random() * 0.4 - 0.2),
    z: origin.z + (Math.random() * 0.4 - 0.2)
  };
}

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
    const destination = findTeleportDestinationWithTarget(victim, attacker);
    if (destination) {
      // Cancel incoming hit in beforeEvent
      context.cancel = true;

      // Queue deferred mutations outside restricted execution mode
      if (!context.pendingActions) context.pendingActions = [];
      const originalDamage = context.originalDamage ?? context.damage;

      context.pendingActions.push(() => {
        if (!isEntityValid(victim) || !isEntityAlive(victim)) return;
        try {
          victim.teleport(destination);
          victim.dimension.playSound("random.explode", startLoc, {
            volume: 1.0,
            pitch: 1.0
          });
          const originLoc = {
            x: startLoc.x,
            y: startLoc.y + 1,
            z: startLoc.z
          };
          victim.dimension.spawnParticle("minecraft:explosion_particle", randomizeNinjaLocation(originLoc));
          victim.dimension.spawnParticle("minecraft:explosion_particle", randomizeNinjaLocation(originLoc));
        } catch {}

        const config = getConfig();
        const maxDmg = config.maxDamage ?? 10.0;
        const reflected = Math.min(originalDamage, maxDmg);

        if (reflected > 0 && isEntityValid(attacker) && isEntityAlive(attacker)) {
          logDebug("ninja", `Ninja deferred teleport executed, reflecting ${reflected} to ${attacker.id}`);
          setDamageGuard(attacker.id, DAMAGE_GUARDS.NINJA_REFLECT, tick);
          try {
            attacker.applyDamage(reflected, {
              cause: "entityAttack",
              damagingEntity: victim
            });
          } catch {}
        }
      });
    }
  }
};

registerModifierHandler("ninja", NinjaHandler);
