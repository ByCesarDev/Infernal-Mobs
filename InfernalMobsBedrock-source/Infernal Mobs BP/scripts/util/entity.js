/**
 * Infernal Mobs Bedrock - Entity Inspection Utility
 */

export function isEntityValid(entity) {
  if (!entity) return false;
  try {
    return Boolean(entity.isValid && entity.id);
  } catch {
    return false;
  }
}

export function isEntityAlive(entity) {
  if (!isEntityValid(entity)) return false;
  try {
    const health = entity.getComponent("minecraft:health");
    return health ? health.currentValue > 0 : true;
  } catch {
    return false;
  }
}

export function safeGetHealth(entity) {
  if (!isEntityValid(entity)) return undefined;
  try {
    return entity.getComponent("minecraft:health");
  } catch {
    return undefined;
  }
}

export function isPlayer(entity) {
  if (!isEntityValid(entity)) return false;
  return entity.typeId === "minecraft:player";
}

export function isCreativePlayer(entity) {
  if (!isPlayer(entity)) return false;
  try {
    // In Bedrock scripting, creative player check can inspect canFly or tags/gamemode
    // Player does not expose gameMode directly on stable 2.10.0, but we can check if player has tags or matches selector @s[m=creative]
    // A robust way on stable is testing player.matches({ gameMode: GameMode.creative }) if supported or command selector
    return entity.matches({ gameMode: 1 }); // GameMode.creative is 1 or 'creative'
  } catch {
    try {
      return entity.matches({ gameMode: "creative" });
    } catch {
      return false;
    }
  }
}

export function isSpectatorPlayer(entity) {
  if (!isPlayer(entity)) return false;
  try {
    return entity.matches({ gameMode: "spectator" }) || entity.matches({ gameMode: 3 });
  } catch {
    return false;
  }
}

export function isTamed(entity) {
  if (!isEntityValid(entity)) return false;
  try {
    const tameable = entity.getComponent("minecraft:tameable");
    return Boolean(tameable && tameable.tamedToPlayerId);
  } catch {
    return false;
  }
}

export function isCreeper(entity) {
  if (!isEntityValid(entity)) return false;
  return entity.typeId === "minecraft:creeper";
}

export function isSpider(entity) {
  if (!isEntityValid(entity)) return false;
  return entity.typeId === "minecraft:spider" || entity.typeId === "minecraft:cave_spider";
}

export function getSpeciesKey(entity) {
  if (!isEntityValid(entity)) return "";
  const typeId = entity.typeId ?? "";
  const parts = typeId.split(":");
  return parts.length > 1 ? parts[1] : parts[0];
}

const KNOWN_HOSTILES = new Set([
  "minecraft:zombie",
  "minecraft:skeleton",
  "minecraft:creeper",
  "minecraft:spider",
  "minecraft:cave_spider",
  "minecraft:witch",
  "minecraft:enderman",
  "minecraft:drowned",
  "minecraft:husk",
  "minecraft:stray",
  "minecraft:piglin",
  "minecraft:piglin_brute",
  "minecraft:zombified_piglin",
  "minecraft:zombie_villager",
  "minecraft:blaze",
  "minecraft:wither_skeleton",
  "minecraft:ghast",
  "minecraft:slime",
  "minecraft:magma_cube",
  "minecraft:phantom",
  "minecraft:vindicator",
  "minecraft:pillager",
  "minecraft:evoker",
  "minecraft:ravager",
  "minecraft:vex",
  "minecraft:guardian",
  "minecraft:elder_guardian",
  "minecraft:silverfish",
  "minecraft:endermite",
  "minecraft:shulker",
  "minecraft:breeze",
  "minecraft:bogged"
]);

export function isHostile(entity) {
  if (!isEntityValid(entity)) return false;
  if (KNOWN_HOSTILES.has(entity.typeId)) return true;
  // If entity has target or movement and is not player/item/passive
  try {
    if (entity.getComponent("minecraft:is_tamed")) return false;
    return Boolean(entity.target || entity.getComponent("minecraft:behavior.nearest_attackable_target"));
  } catch {
    return false;
  }
}
