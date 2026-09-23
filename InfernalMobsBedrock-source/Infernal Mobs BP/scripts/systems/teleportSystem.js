/**
 * Infernal Mobs Bedrock - Teleport System
 * Parity with Java AbstractTeleporter.java
 */

import { distance, distanceSquared } from "../util/vector.js";
import { randomFloat, randomInt } from "../util/random.js";
import { isEntityValid } from "../util/entity.js";

/**
 * Attempts teleportation following Java AbstractTeleporter:
 * If distant (>8), try up to 5 attempts towards entity;
 * else / fallback: try up to 5 attempts randomly
 */
export function tryTeleportWithTarget(mob, targetEnt) {
  if (!isEntityValid(mob) || !isEntityValid(targetEnt)) return false;

  const dist = distance(mob.location, targetEnt.location);
  if (dist > 8) {
    for (let attempts = 0; attempts < 5; attempts++) {
      if (tryTeleportTowardsEntity(mob, targetEnt)) {
        return true;
      }
    }
  }

  for (let attempts = 0; attempts < 5; attempts++) {
    if (tryTeleportRandomly(mob)) {
      return true;
    }
  }

  return false;
}

export function tryTeleportTowardsEntity(mob, targetEnt) {
  const mobLoc = mob.location;
  const targetLoc = targetEnt.location;

  const dx = mobLoc.x - targetLoc.x;
  const dy = mobLoc.y - targetLoc.y;
  const dz = mobLoc.z - targetLoc.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 1e-4) return false;

  const normX = dx / len;
  const normY = dy / len;
  const normZ = dz / len;

  // In Java: mob.getX() + (rnd - 0.5)*8 - normX * 16
  const targetX = mobLoc.x + (randomFloat() - 0.5) * 8.0 - normX * 16.0;
  const targetY = mobLoc.y + (randomInt(0, 16) - 8) - normY * 16.0;
  const targetZ = mobLoc.z + (randomFloat() - 0.5) * 8.0 - normZ * 16.0;

  return tryTeleportTo(mob, targetX, targetY, targetZ);
}

export function tryTeleportRandomly(mob) {
  const mobLoc = mob.location;
  const targetX = mobLoc.x + (randomFloat() - 0.5) * 64.0;
  const targetY = mobLoc.y + (randomInt(0, 64) - 32);
  const targetZ = mobLoc.z + (randomFloat() - 0.5) * 64.0;

  return tryTeleportTo(mob, targetX, targetY, targetZ);
}

export function tryTeleportTo(mob, x, y, z) {
  const dim = mob.dimension;
  const blockX = Math.floor(x);
  let blockY = Math.floor(y);
  const blockZ = Math.floor(z);

  try {
    // Scan down for solid ground
    let groundFound = false;
    for (let offset = 0; offset < 16; offset++) {
      const currentY = blockY - offset;
      if (currentY < -64) break;

      const floorBlock = dim.getBlock({ x: blockX, y: currentY - 1, z: blockZ });
      const feetBlock = dim.getBlock({ x: blockX, y: currentY, z: blockZ });
      const headBlock = dim.getBlock({ x: blockX, y: currentY + 1, z: blockZ });

      if (floorBlock && floorBlock.isSolid && !floorBlock.isLiquid &&
          feetBlock && (feetBlock.isAir || !feetBlock.isSolid) && !feetBlock.isLiquid &&
          headBlock && (headBlock.isAir || !headBlock.isSolid) && !headBlock.isLiquid) {
        blockY = currentY;
        groundFound = true;
        break;
      }
    }

    if (!groundFound) return false;

    mob.teleport({ x: blockX + 0.5, y: blockY, z: blockZ + 0.5 });
    return true;
  } catch {
    return false;
  }
}
