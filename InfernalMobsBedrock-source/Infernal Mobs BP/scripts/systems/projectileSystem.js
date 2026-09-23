/**
 * Infernal Mobs Bedrock - Projectile System
 * Spawns and shoots fireballs (Ghastly) and splash potions (Alchemist)
 */

import { isEntityValid } from "../util/entity.js";
import { normalize } from "../util/vector.js";
import { logError } from "../util/log.js";

/**
 * Shoots a fireball from mob towards target
 * @param {import("@minecraft/server").Entity} mob
 * @param {import("@minecraft/server").Entity} target
 */
export function shootFireball(mob, target) {
  if (!isEntityValid(mob) || !isEntityValid(target)) return false;

  try {
    const dim = mob.dimension;
    const mobLoc = mob.location;
    const targetLoc = target.location;

    const spawnPos = {
      x: mobLoc.x,
      y: mobLoc.y + 1.2,
      z: mobLoc.z
    };

    const dir = normalize({
      x: targetLoc.x - spawnPos.x,
      y: (targetLoc.y + 1.0) - spawnPos.y,
      z: targetLoc.z - spawnPos.z
    });

    // Spawn fireball entity slightly in front of the caster to avoid self-collision
    const projectile = dim.spawnEntity("minecraft:small_fireball", {
      x: spawnPos.x + dir.x * 1.5,
      y: spawnPos.y + dir.y * 1.5,
      z: spawnPos.z + dir.z * 1.5
    });

    if (projectile) {
      const projectileComp = projectile.getComponent("minecraft:projectile");
      if (projectileComp && typeof projectileComp.shoot === "function") {
        projectileComp.owner = mob;
        projectileComp.shoot(dir, { uncertainty: 1.0 });
      } else {
        projectile.applyImpulse({
          x: dir.x * 1.2,
          y: dir.y * 1.2,
          z: dir.z * 1.2
        });
      }
    }

    mob.dimension.playSound("mob.ghast.fireball", mob.location, {
      volume: 1.0,
      pitch: 1.0
    });
    return true;
  } catch (error) {
    logError("projectileSystem", "Failed shooting fireball", error);
    return false;
  }
}

/**
 * Throws an alchemist splash potion or applies targeted potion effect
 * @param {import("@minecraft/server").Entity} mob
 * @param {import("@minecraft/server").Entity} target
 * @param {string} effectType "slowness" | "poison" | "weakness" | "harming"
 */
export function throwPotion(mob, target, effectType) {
  if (!isEntityValid(mob) || !isEntityValid(target)) return false;

  try {
    mob.dimension.playSound("mob.witch.throw", mob.location, {
      volume: 1.0,
      pitch: 1.0
    });

    // Apply exact effect according to Java Potion types:
    // Slowness: 30s (600 ticks)
    // Poison: 30s (600 ticks)
    // Weakness: 60s (1200 ticks)
    // Harming: Instant damage
    switch (effectType) {
      case "slowness":
        target.addEffect("minecraft:slowness", 300, { amplifier: 0, showParticles: true });
        break;
      case "poison":
        target.addEffect("minecraft:poison", 300, { amplifier: 0, showParticles: true });
        break;
      case "weakness":
        target.addEffect("minecraft:weakness", 600, { amplifier: 0, showParticles: true });
        break;
      case "harming":
      default:
        target.addEffect("minecraft:instant_damage", 1, { amplifier: 0, showParticles: true });
        break;
    }
    return true;
  } catch (error) {
    logError("projectileSystem", "Failed throwing potion", error);
    return false;
  }
}
