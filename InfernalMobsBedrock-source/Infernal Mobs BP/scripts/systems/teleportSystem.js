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
export function findTeleportDestinationWithTarget(mob, targetEnt) {
  if (!isEntityValid(mob) || !isEntityValid(targetEnt)) return null;

  const dist = distance(mob.location, targetEnt.location);
  if (dist > 8) {
    for (let attempts = 0; attempts < 5; attempts++) {
      const dest = findTeleportDestinationTowards(mob, targetEnt);
      if (dest) return dest;
    }
  }

  for (let attempts = 0; attempts < 5; attempts++) {
    const dest = findTeleportDestinationRandomly(mob);
    if (dest) return dest;
  }

  return null;
}

export function findTeleportDestinationTowards(mob, targetEnt) {
  const mobLoc = mob.location;
  const targetLoc = targetEnt.location;

  const dx = mobLoc.x - targetLoc.x;
  const dy = mobLoc.y - targetLoc.y;
  const dz = mobLoc.z - targetLoc.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 1e-4) return null;

  const normX = dx / len;
  const normY = dy / len;
  const normZ = dz / len;

  const targetX = mobLoc.x + (randomFloat() - 0.5) * 8.0 - normX * 16.0;
  const targetY = mobLoc.y + (randomInt(0, 16) - 8) - normY * 16.0;
  const targetZ = mobLoc.z + (randomFloat() - 0.5) * 8.0 - normZ * 16.0;

  return findSafeGround(mob.dimension, targetX, targetY, targetZ);
}

export function findTeleportDestinationRandomly(mob) {
  const mobLoc = mob.location;
  const targetX = mobLoc.x + (randomFloat() - 0.5) * 64.0;
  const targetY = mobLoc.y + (randomInt(0, 64) - 32);
  const targetZ = mobLoc.z + (randomFloat() - 0.5) * 64.0;

  return findSafeGround(mob.dimension, targetX, targetY, targetZ);
}

export function findTeleportDestinationBehind(mob, targetEnt) {
  if (!isEntityValid(mob) || !isEntityValid(targetEnt)) return null;

  const targetLoc = targetEnt.location;
  let viewVec = { x: 0, z: 1 };
  try {
    const view = targetEnt.getViewDirection?.();
    if (view && (view.x !== 0 || view.z !== 0)) {
      const len = Math.sqrt(view.x * view.x + view.z * view.z);
      viewVec = { x: view.x / len, z: view.z / len };
    }
  } catch {}

  // Destination behind target by 2-3 blocks
  const targetX = targetLoc.x - viewVec.x * 2.5;
  const targetY = targetLoc.y;
  const targetZ = targetLoc.z - viewVec.z * 2.5;

  return findSafeGround(mob.dimension, targetX, targetY, targetZ);
}

export function findSafeGround(dim, x, y, z) {
  const blockX = Math.floor(x);
  let blockY = Math.floor(y);
  const blockZ = Math.floor(z);

  try {
    for (let offset = 0; offset < 16; offset++) {
      const currentY = blockY - offset;
      if (currentY < -64) break;

      const floorBlock = dim.getBlock({ x: blockX, y: currentY - 1, z: blockZ });
      const feetBlock = dim.getBlock({ x: blockX, y: currentY, z: blockZ });
      const headBlock = dim.getBlock({ x: blockX, y: currentY + 1, z: blockZ });

      if (floorBlock && floorBlock.isSolid && !floorBlock.isLiquid &&
          feetBlock && (feetBlock.isAir || !feetBlock.isSolid) && !feetBlock.isLiquid &&
          headBlock && (headBlock.isAir || !headBlock.isSolid) && !headBlock.isLiquid) {
        return { x: blockX + 0.5, y: currentY, z: blockZ + 0.5 };
      }
    }
  } catch {}

  return null;
}

export function tryTeleportWithTarget(mob, targetEnt) {
  const dest = findTeleportDestinationWithTarget(mob, targetEnt);
  if (!dest) return false;
  try {
    mob.teleport(dest);
    return true;
  } catch {
    return false;
  }
}

export function tryTeleportBehind(mob, targetEnt) {
  const dest = findTeleportDestinationBehind(mob, targetEnt);
  if (!dest) return false;
  try {
    mob.teleport(dest);
    return true;
  } catch {
    return false;
  }
}
