/**
 * Infernal Mobs Bedrock - Target Resolver
 * Resolves valid attack targets, players, line of sight and steady target states
 */

import { hasLineOfSight } from "../systems/lineOfSight.js";
import { isCreativePlayer, isEntityAlive, isEntityValid, isPlayer, isSpectatorPlayer } from "../util/entity.js";
import { distance, distanceSquared } from "../util/vector.js";

/**
 * Validates whether a target candidate is legally attackable by an infernal mob
 */
export function isValidTarget(mob, target, maxDistance = 20) {
  if (!isEntityValid(mob) || !isEntityValid(target)) return false;
  if (mob.id === target.id) return false;
  if (!isEntityAlive(target)) return false;
  if (mob.dimension.id !== target.dimension.id) return false;

  // Creative and Spectator players are excluded
  if (isCreativePlayer(target) || isSpectatorPlayer(target)) return false;

  const distSq = distanceSquared(mob.location, target.location);
  if (distSq > maxDistance * maxDistance) return false;

  return true;
}

/**
 * Finds the nearest eligible player within radius
 */
export function getNearestPlayerTarget(mob, maxDistance = 12) {
  if (!isEntityValid(mob)) return null;

  try {
    const players = mob.dimension.getPlayers({
      location: mob.location,
      maxDistance
    });

    let nearest = null;
    let minDistanceSq = Infinity;

    for (const player of players) {
      if (!isValidTarget(mob, player, maxDistance)) continue;
      const distSq = distanceSquared(mob.location, player.location);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearest = player;
      }
    }

    return nearest;
  } catch {
    return null;
  }
}

/**
 * Resolves current attack target for the mob (either mob.target or nearest player)
 */
export function resolveTarget(mob, maxDistance = 15) {
  if (!isEntityValid(mob)) return null;

  let target = null;
  try {
    target = mob.target;
  } catch {}

  if (target && isValidTarget(mob, target, maxDistance)) {
    return target;
  }

  return getNearestPlayerTarget(mob, maxDistance);
}
