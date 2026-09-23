import { EntityComponentTypes, ItemStack, world } from "@minecraft/server";

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function choose(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function safeGetHealth(entity) {
  try {
    return entity.getComponent(EntityComponentTypes.Health);
  } catch {
    return undefined;
  }
}

export function isPlayer(entity) {
  return entity?.typeId === "minecraft:player";
}

export function isHostile(entity) {
  if (!entity?.isValid || isPlayer(entity)) return false;
  try {
    if (entity.matches({ families: ["monster"] })) return true;
  } catch {}
  return HOSTILE_FALLBACK.has(entity.typeId);
}

const HOSTILE_FALLBACK = new Set([
  "minecraft:blaze", "minecraft:bogged", "minecraft:breeze", "minecraft:cave_spider",
  "minecraft:creeper", "minecraft:drowned", "minecraft:elder_guardian", "minecraft:enderman",
  "minecraft:endermite", "minecraft:evocation_illager", "minecraft:ghast", "minecraft:guardian",
  "minecraft:hoglin", "minecraft:husk", "minecraft:magma_cube", "minecraft:phantom",
  "minecraft:piglin_brute", "minecraft:pillager", "minecraft:ravager", "minecraft:shulker",
  "minecraft:silverfish", "minecraft:skeleton", "minecraft:slime", "minecraft:spider",
  "minecraft:stray", "minecraft:vex", "minecraft:vindicator", "minecraft:witch",
  "minecraft:wither_skeleton", "minecraft:zoglin", "minecraft:zombie",
  "minecraft:zombie_villager", "minecraft:zombified_piglin"
]);

export function nearbyPlayers(entity, maxDistance = 16) {
  try {
    return entity.dimension.getPlayers({ location: entity.location, maxDistance });
  } catch {
    return [];
  }
}

export function nearestPlayer(entity, maxDistance = 16) {
  const players = nearbyPlayers(entity, maxDistance);
  players.sort((a, b) => distanceSquared(entity.location, a.location) - distanceSquared(entity.location, b.location));
  return players[0];
}

export function distanceSquared(a, b) {
  const x = a.x - b.x;
  const y = a.y - b.y;
  const z = a.z - b.z;
  return x * x + y * y + z * z;
}

export function direction(from, to, scale = 1) {
  const x = to.x - from.x;
  const y = to.y - from.y;
  const z = to.z - from.z;
  const length = Math.max(Math.sqrt(x * x + y * y + z * z), 0.001);
  return { x: x / length * scale, y: y / length * scale, z: z / length * scale };
}

export function addEffect(entity, effect, seconds, amplifier = 0) {
  try {
    entity.addEffect(effect, seconds * 20, { amplifier, showParticles: true });
  } catch {}
}

export function spawnItem(dimension, location, typeId, amount = 1) {
  try {
    dimension.spawnItem(new ItemStack(typeId, amount), location);
  } catch {}
}

export function safeDamage(entity, amount, damagingEntity) {
  try {
    entity.applyDamage(amount, damagingEntity ? { damagingEntity } : undefined);
  } catch {}
}

export function sendMessage(player, message) {
  try { player.sendMessage(message); } catch {}
}

export function log(message) {
  world.sendMessage(`§8[§cInfernal Mobs§8]§r ${message}`);
}
