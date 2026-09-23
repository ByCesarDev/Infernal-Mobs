/**
 * Infernal Mobs Bedrock - Particle System
 * Emits vibrant multicolored potion swirl particles around active infernal mobs (Classic Infernal Mobs identity)
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
 * Approximates bounding box width and height matching Java's entity.getBbWidth() & getBbHeight()
 * Scales dynamically using getHeadLocation() with custom geometry overrides for non-humanoids
 * @param {import("@minecraft/server").Entity} mob
 * @returns {{ width: number, height: number }}
 */
function getEntityDimensions(mob) {
  let height = 1.8;
  let width = 0.8;

  try {
    const head = mob.getHeadLocation();
    const rawHeight = Math.abs(head.y - mob.location.y);
    if (rawHeight > 0.3) {
      height = rawHeight * 1.15;
      width = Math.min(2.5, Math.max(0.6, height * 0.45));
    }
  } catch {}

  const type = mob.typeId;
  if (type.includes("ghast")) {
    width = 4.0;
    height = 4.0;
  } else if (type.includes("ravager")) {
    width = 2.0;
    height = 2.2;
  } else if (type.includes("magma_cube") || type.includes("slime")) {
    width = Math.max(0.8, height * 1.0);
  } else if (type.includes("spider")) {
    width = 1.4;
    height = 0.9;
  } else if (type.includes("ender_dragon")) {
    width = 6.0;
    height = 4.0;
  } else if (type.includes("wither")) {
    width = 1.2;
    height = 3.5;
  } else if (type.includes("iron_golem")) {
    width = 1.4;
    height = 2.7;
  }

  return { width, height };
}

/**
 * Ticks infernal mob particle aura (called every 2 ticks = 100ms)
 * Aesthetic enhancement over Java: emits 2 individual particles every 100ms (20/s) for vibrant Bedrock visual presence.
 * Emits dynamic colored mobspell swirl particles using variable.color and dynamic bounding box.
 * Uses `infernalmobs:colored_mobspell` (vanilla particle sprite sheet adapter),
 * with fallbacks to `minecraft:arrow_spell_emitter` and `minecraft:mobspell_emitter`.
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

      const { width, height } = getEntityDimensions(mob);

      // Enhanced density: 2 individual particles per emission with dynamic entity dimensions
      for (let i = 0; i < 2; i++) {
        const xOffset = (Math.random() - 0.5) * width;
        const yOffset = Math.random() * height - 0.25;
        const zOffset = (Math.random() - 0.5) * width;

        const particleLoc = {
          x: mob.location.x + xOffset,
          y: mob.location.y + yOffset,
          z: mob.location.z + zOffset
        };

        const color = getRandomInfernalColor();
        const molang = new MolangVariableMap();
        molang.setColorRGBA("variable.color", {
          red: color.red,
          green: color.green,
          blue: color.blue,
          alpha: 1.0
        });

        try {
          mob.dimension.spawnParticle("infernalmobs:colored_mobspell", particleLoc, molang);
        } catch {
          try {
            mob.dimension.spawnParticle("minecraft:arrow_spell_emitter", particleLoc, molang);
          } catch {
            mob.dimension.spawnParticle("minecraft:mobspell_emitter", particleLoc, molang);
          }
        }
      }
    } catch (e) {
      // In case dimension or particle spawn fails
    }
  }
}
