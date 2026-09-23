/**
 * Infernal Mobs Bedrock - Particle System
 * Emits vibrant multicolored vanilla particles around active infernal mobs (Classic Infernal Mobs identity)
 */

import { MolangVariableMap } from "@minecraft/server";
import { getAllActiveInfernals } from "../core/infernalManager.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

/**
 * Curated high-saturation color palette matching the iconic classic Infernal Mobs aura:
 * Red, Orange, Yellow, Green, Cyan, Blue, Purple, Pink
 */
const INFERNAL_COLORS = [
  { red: 1.00, green: 0.15, blue: 0.20 }, // Red
  { red: 1.00, green: 0.45, blue: 0.05 }, // Orange
  { red: 1.00, green: 0.90, blue: 0.10 }, // Yellow
  { red: 0.30, green: 1.00, blue: 0.20 }, // Green
  { red: 0.10, green: 0.75, blue: 1.00 }, // Cyan
  { red: 0.20, green: 0.35, blue: 1.00 }, // Blue
  { red: 0.65, green: 0.15, blue: 1.00 }, // Purple
  { red: 1.00, green: 0.15, blue: 0.75 }  // Pink
];

function getRandomInfernalColor() {
  return INFERNAL_COLORS[Math.floor(Math.random() * INFERNAL_COLORS.length)];
}

/**
 * Ticks infernal mob particle aura (called every 2 ticks = 100ms)
 * Matches RendererBossGlow.java rate: 1 individual particle every 100ms.
 * Uses vanilla `minecraft:colored_flame_particle` with dynamic MolangVariableMap coloring.
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

      const molang = new MolangVariableMap();
      molang.setColorRGB("variable.color", getRandomInfernalColor());

      mob.dimension.spawnParticle("minecraft:colored_flame_particle", particleLoc, molang);
    } catch (e) {
      // In case dimension or particle spawn fails
    }
  }
}
