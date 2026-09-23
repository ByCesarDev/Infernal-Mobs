/**
 * Infernal Mobs Bedrock - Projectile System
 * Spawns and shoots fireballs (Ghastly) and splash potions (Alchemist)
 */

import { isCreativePlayer, isEntityAlive, isEntityValid, isSpectatorPlayer } from "../util/entity.js";
import { distance, normalize } from "../util/vector.js";
import { getCurrentTick } from "../core/tickScheduler.js";
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

    // Spawn large fireball entity (Ghast fireball, explosion power 1 in Java)
    const projectile = dim.spawnEntity("minecraft:fireball", {
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

const SPLASH_RADIUS = 4.125; // Java ThrownSplashPotion exact splash radius

/**
 * @typedef {Object} TrackedPotion
 * @property {import("@minecraft/server").Entity} entity
 * @property {import("@minecraft/server").Dimension} dimension
 * @property {string} effectType
 * @property {string} ownerId
 * @property {{ x: number, y: number, z: number }} lastLocation
 * @property {number} spawnTick
 * @property {number} maxLifeTicks
 */

/** @type {TrackedPotion[]} */
const activePotions = [];

/**
 * Ticks all tracked splash potions in flight.
 * When a potion impacts a block or entity, Bedrock invalidates the entity.
 * We detect this collision and trigger the splash effect at its impact location.
 * @param {number} currentTick
 */
export function tickActiveProjectiles(currentTick) {
  if (activePotions.length === 0) return;

  for (let i = activePotions.length - 1; i >= 0; i--) {
    const item = activePotions[i];

    // Check if potion entity collided with block/entity and shattered
    if (!item.entity || !isEntityValid(item.entity)) {
      explodeSplashPotion(item.dimension, item.lastLocation, item.effectType, item.ownerId);
      activePotions.splice(i, 1);
      continue;
    }

    // Still flying: update last known coordinates
    try {
      const loc = item.entity.location;
      item.lastLocation = { x: loc.x, y: loc.y, z: loc.z };
    } catch {
      explodeSplashPotion(item.dimension, item.lastLocation, item.effectType, item.ownerId);
      activePotions.splice(i, 1);
      continue;
    }

    // Safety timeout: max 80 ticks (4 seconds) of flight
    if (currentTick - item.spawnTick > item.maxLifeTicks) {
      try {
        explodeSplashPotion(item.dimension, item.lastLocation, item.effectType, item.ownerId);
        item.entity.remove();
      } catch {}
      activePotions.splice(i, 1);
    }
  }
}

/**
 * Explodes splash potion at impact location with sound, particles, and distance-based area effects
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {{ x: number, y: number, z: number }} location
 * @param {string} effectType
 * @param {string} ownerId
 */
function explodeSplashPotion(dimension, location, effectType, ownerId) {
  if (!dimension || !location) return;

  // Sound effects
  try {
    dimension.playSound("potion.splash", location, { volume: 1.0, pitch: 1.0 });
  } catch {
    try {
      dimension.playSound("random.glass", location, { volume: 1.0, pitch: 1.0 });
    } catch {}
  }

  // Visual particles
  try {
    dimension.spawnParticle("minecraft:potion_splash_particle", location);
  } catch {}

  // Area of effect query
  try {
    const nearbyEntities = dimension.getEntities({
      location,
      maxDistance: SPLASH_RADIUS
    });

    for (const victim of nearbyEntities) {
      if (!isEntityValid(victim) || !isEntityAlive(victim)) continue;
      // Do not debuff the thrower mob
      if (victim.id === ownerId) continue;
      // Immune players
      if (isCreativePlayer(victim) || isSpectatorPlayer(victim)) continue;

      const dist = distance(location, victim.location);
      if (dist > SPLASH_RADIUS) continue;

      // Distance falloff: Java formula factor = 1.0 - (dist / radius), clamped [0.2, 1.0]
      const factor = Math.max(0.2, Math.min(1.0, 1.0 - (dist / SPLASH_RADIUS)));

      switch (effectType) {
        case "slowness":
          victim.addEffect("minecraft:slowness", Math.round(600 * factor), { amplifier: 0, showParticles: true });
          break;
        case "poison":
          victim.addEffect("minecraft:poison", Math.round(600 * factor), { amplifier: 0, showParticles: true });
          break;
        case "weakness":
          victim.addEffect("minecraft:weakness", Math.round(1200 * factor), { amplifier: 0, showParticles: true });
          break;
        case "harming":
        default: {
          // Java Potions.HARMING: base 6 magic damage scaled continuously by splash falloff factor
          const magicDamage = Math.max(1, Math.round(6.0 * factor));
          try {
            victim.applyDamage(magicDamage, { cause: "magic" });
          } catch {
            victim.addEffect("minecraft:instant_damage", 1, { amplifier: 0, showParticles: true });
          }
          break;
        }
      }
    }
  } catch (error) {
    logError("projectileSystem", "Error in explodeSplashPotion", error);
  }
}

/**
 * Throws an alchemist splash potion towards target.
 * Launches a tracked physical projectile; effects are applied on impact with distance falloff.
 * Exact Java parity:
 * - Slowness: up to 30s (600 ticks)
 * - Poison: up to 30s (600 ticks)
 * - Weakness: up to 60s (1200 ticks)
 * - Harming: Instant damage
 * @param {import("@minecraft/server").Entity} mob
 * @param {import("@minecraft/server").Entity} target
 * @param {string} effectType "slowness" | "poison" | "weakness" | "harming"
 */
export function throwPotion(mob, target, effectType) {
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
      y: (targetLoc.y + 0.5) - spawnPos.y,
      z: targetLoc.z - spawnPos.z
    });

    const potionEntity = dim.spawnEntity("minecraft:splash_potion", {
      x: spawnPos.x + dir.x * 0.8,
      y: spawnPos.y + dir.y * 0.8 + 0.2,
      z: spawnPos.z + dir.z * 0.8
    });

    if (potionEntity) {
      potionEntity.applyImpulse({
        x: dir.x * 0.9,
        y: dir.y * 0.9 + 0.25,
        z: dir.z * 0.9
      });

      activePotions.push({
        entity: potionEntity,
        dimension: dim,
        effectType,
        ownerId: mob.id,
        lastLocation: { ...potionEntity.location },
        spawnTick: getCurrentTick(),
        maxLifeTicks: 80
      });
    }

    mob.dimension.playSound("mob.witch.throw", mob.location, {
      volume: 1.0,
      pitch: 1.0
    });

    return true;
  } catch (error) {
    logError("projectileSystem", "Failed throwing potion", error);
    return false;
  }
}
