import { system, world } from "@minecraft/server";
import { CONFIG, TIER } from "./config.js";
import { forceInfernal, handleBeforeHurt, handleDeath, handleHit, handleHurt, considerSpawn, trackLoadedEntities, updateTracked } from "./manager.js";
import { isHostile } from "./util.js";

globalThis.__infernalTick = 0;
globalThis.__infernalWorld = world;

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  system.run(() => considerSpawn(entity));
});

world.afterEvents.entityLoad.subscribe(({ entity }) => {
  system.run(() => considerSpawn(entity));
});

world.beforeEvents.entityHurt.subscribe(handleBeforeHurt);
world.afterEvents.entityHurt.subscribe(handleHurt);
world.afterEvents.entityHitEntity.subscribe(handleHit);
world.afterEvents.entityDie.subscribe(handleDeath);

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "infernal:spawn" || !event.sourceEntity) return;
  const tier = normalizeTier(event.message);
  const target = findNearestHostile(event.sourceEntity);
  if (!target) {
    try { event.sourceEntity.sendMessage("§cNo hay un mob hostil cerca."); } catch {}
    return;
  }
  forceInfernal(target, tier);
  try {
    target.dimension.spawnEntity("minecraft:lightning_bolt", target.location);
    target.extinguishFire(false);
  } catch {}
  try { event.sourceEntity.sendMessage(`§aMob convertido al nivel ${tier}.`); } catch {}
});

system.runInterval(() => {
  globalThis.__infernalTick += CONFIG.updateIntervalTicks;
  updateTracked();
}, CONFIG.updateIntervalTicks);

system.runTimeout(trackLoadedEntities, 40);

function normalizeTier(message) {
  const value = String(message ?? "").trim().toLowerCase();
  if (value === TIER.ELITE || value === TIER.ULTRA) return value;
  return TIER.INFERNAL;
}

function findNearestHostile(source) {
  try {
    const entities = source.dimension.getEntities({ location: source.location, maxDistance: 12 });
    return entities
      .filter((entity) => entity.id !== source.id && isHostile(entity))
      .sort((a, b) => squared(source.location, a.location) - squared(source.location, b.location))[0];
  } catch {
    return undefined;
  }
}

function squared(a, b) {
  const x = a.x - b.x;
  const y = a.y - b.y;
  const z = a.z - b.z;
  return x * x + y * y + z * z;
}
