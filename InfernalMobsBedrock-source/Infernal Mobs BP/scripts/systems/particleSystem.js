/**
 * Infernal Mobs Bedrock - Particle System
 * Emits vanilla witch spell particle aura around active infernal mobs (Java 1:1 parity)
 */

import { getAllActiveInfernals } from "../core/infernalManager.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

/**
 * Ticks infernal mob particle aura (called every 2 ticks = 100ms)
 * Matches RendererBossGlow.java logic:
 * Emits 1 ParticleTypes.WITCH (Bedrock: minecraft:witchspell) with random offsets around the mob
 * only if a player is within 32 blocks.
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

      // Particle spawn location matching RendererBossGlow.java:
      // x + (random - 0.5) * bbWidth
      // y + random * bbHeight - 0.25
      // z + (random - 0.5) * bbWidth
      const xOffset = (Math.random() - 0.5) * 0.8;
      const yOffset = Math.random() * 1.8 - 0.25;
      const zOffset = (Math.random() - 0.5) * 0.8;

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
