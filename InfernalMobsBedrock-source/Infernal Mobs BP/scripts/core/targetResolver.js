/**
 * Infernal Mobs Bedrock - Target Resolver
 * Resolves valid attack targets, players, line of sight and steady target states
 */

import { hasLineOfSight } from "../systems/lineOfSight.js";
import { isCreativePlayer, isEntityAlive, isEntityValid, isHostile, isPlayer, isSpectatorPlayer } from "../util/entity.js";
import { distanceSquared } from "../util/vector.js";
import { getCurrentTick } from "./tickScheduler.js";
import { getRememberedCombatTarget } from "./combatMemory.js";

// Cache players by dimension ID per tick to avoid repeated C++ API calls
const cachedPlayersByDim = new Map();
let lastCacheTick = -1;

function getCachedDimensionPlayers(dimension) {
  const now = getCurrentTick();
  if (now !== lastCacheTick) {
    cachedPlayersByDim.clear();
    lastCacheTick = now;
  }

  const dimId = dimension.id;
  if (!cachedPlayersByDim.has(dimId)) {
    try {
      cachedPlayersByDim.set(dimId, dimension.getPlayers() || []);
    } catch {
      cachedPlayersByDim.set(dimId, []);
    }
  }

  return cachedPlayersByDim.get(dimId);
}

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
 * Finds the nearest eligible player within radius using tick-cached players
 */
export function getNearestPlayerTarget(mob, maxDistance = 12) {
  if (!isEntityValid(mob)) return null;

  try {
    const players = getCachedDimensionPlayers(mob.dimension);
    let nearest = null;
    let minDistanceSq = maxDistance * maxDistance;

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
 * Resolves current attack target for the mob:
 * 1. Checks remembered combat target from combat interactions (attacks and received hits)
 * 2. If no remembered target and mob is hostile (Java: instanceof Enemy):
 *    Falls back to nearest player within maxDistance with confirmed line of sight
 * @param {import("@minecraft/server").Entity} mob
 * @param {number} [maxDistance] Max engagement distance
 * @returns {import("@minecraft/server").Entity | null}
 */
export function resolveTarget(mob, maxDistance = 15) {
  if (!isEntityValid(mob)) return null;

  const currentTick = getCurrentTick();

  // 1. Check remembered combat target
  const rememberedTarget = getRememberedCombatTarget(mob.id, currentTick);
  if (rememberedTarget && isValidTarget(mob, rememberedTarget, maxDistance)) {
    return rememberedTarget;
  }

  // 2. Java Parity: only hostile mobs scan for nearby players when unaggroed
  if (!isHostile(mob)) {
    return null;
  }

  // 3. Fallback to nearest visible player within maxDistance (allowing full modifier range e.g. 12m for Alchemist/Ghastly)
  const fallbackPlayer = getNearestPlayerTarget(mob, maxDistance);
  if (fallbackPlayer && hasLineOfSight(mob, fallbackPlayer)) {
    return fallbackPlayer;
  }

  return null;
}
