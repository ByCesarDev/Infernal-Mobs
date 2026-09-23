/**
 * Infernal Mobs Bedrock - Line of Sight and Sky Exposure Utilities
 */

import { isEntityValid } from "../util/entity.js";

/**
 * Checks if mob has clear line of sight to target
 * Uses dimension.getBlockFromRay to find any solid blocking blocks
 */
export function hasLineOfSight(mob, target, maxDistance = 20) {
  if (!isEntityValid(mob) || !isEntityValid(target)) return false;
  try {
    const dim = mob.dimension;
    if (dim.id !== target.dimension.id) return false;

    const mobLoc = mob.location;
    const targetLoc = target.location;

    // Vector from eye level of mob to target eye level
    const startPos = { x: mobLoc.x, y: mobLoc.y + 1.2, z: mobLoc.z };
    const endPos = { x: targetLoc.x, y: targetLoc.y + 1.2, z: targetLoc.z };

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const dz = endPos.z - startPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > maxDistance) return false;
    if (dist < 1e-4) return true;

    const direction = { x: dx / dist, y: dy / dist, z: dz / dist };

    const hit = dim.getBlockFromRay(startPos, direction, {
      maxDistance: dist - 0.5,
      includePassableBlocks: false,
      includeLiquidBlocks: false
    });

    // If no solid block was hit between start and target, line of sight is clear
    return !hit;
  } catch {
    // If raycast fails for boundary reasons, allow proximity fallback
    return true;
  }
}

/**
 * Checks if target entity is exposed to the sky (used by Storm)
 */
export function isExposedToSky(entity) {
  if (!isEntityValid(entity)) return false;
  try {
    const dim = entity.dimension;
    // The Nether has a bedrock ceiling, so sky exposure is never true
    if (dim.id === "minecraft:nether") return false;

    const loc = entity.location;
    const startPos = { x: loc.x, y: loc.y + 1.8, z: loc.z };

    // Raycast straight up to test for overhead blocks
    const hit = dim.getBlockFromRay(startPos, { x: 0, y: 1, z: 0 }, {
      maxDistance: 64,
      includePassableBlocks: false,
      includeLiquidBlocks: false
    });

    return !hit;
  } catch {
    return false;
  }
}
