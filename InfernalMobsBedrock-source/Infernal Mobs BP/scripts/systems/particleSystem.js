/**
 * Infernal Mobs Bedrock - Particle System
 * Emits vanilla witch spell particle aura around active infernal mobs (Java 1:1 parity)
 */

import { getAllActiveInfernals } from "../core/infernalManager.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

/**
 * Ticks infernal mob particle aura (called every 16 ticks = ~800ms)
 * Calibrated for Bedrock's minecraft:witchspell_emitter which emits a burst of particles lasting ~0.8-1.0s.
 * Only emits if a player is within 32 blocks (matching RendererBossGlow.java distance check).
 */
export function tickInfernalAura(currentTick) {
  const activeRecords = getAllActiveInfernals();
  if (activeRecords.length === 0) return;

  for (const record of activeRecords) {
    const mob = record.entity;
    if (!isEntityValid(mob) || !isEntityAlive(mob)) continue;

    // Proximity check: only emit particles if at least one player is within 32 blocks
    try {
      const nearbyPlayers = mob.dimension.getPlayers({
        location: mob.location,
        maxDistance: 32
      });

      if (nearbyPlayers.length === 0) continue;

      // Position emitter near mob torso center with slight random deviation
      const xOffset = (Math.random() - 0.5) * 0.5;
      const yOffset = 0.5 + Math.random() * 0.8;
      const zOffset = (Math.random() - 0.5) * 0.5;

      const particleLoc = {
        x: mob.location.x + xOffset,
        y: mob.location.y + yOffset,
        z: mob.location.z + zOffset
      };

      mob.dimension.spawnParticle("minecraft:witchspell_emitter", particleLoc);
    } catch (e) {
      // In case dimension or particle spawn fails
    }
  }
}
