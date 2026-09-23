import { EntityComponentTypes, ItemStack, system } from "@minecraft/server";
import { CONFIG, PROPERTIES, TIER } from "./config.js";
import { LOOT } from "./data.js";
import { absorbVirtualDamage, isGuarded, onInfernalAttacks, onInfernalHurt, reviveOneUp, tickInfernal } from "./abilities.js";
import { chooseTier, getModifiers, getTier, makeInfernal } from "./state.js";
import { choose, isHostile, randomInt, safeGetHealth } from "./util.js";

const tracked = new Map();

export function considerSpawn(entity) {
  if (!entity?.isValid || !isHostile(entity)) return;
  if (CONFIG.entityBlacklist.includes(entity.typeId)) return;
  if (CONFIG.dimensionsBlacklist.includes(entity.dimension.id)) return;

  if (entity.getDynamicProperty(PROPERTIES.processed)) {
    if (entity.getDynamicProperty(PROPERTIES.tier)) tracked.set(entity.id, entity);
    return;
  }

  entity.setDynamicProperty(PROPERTIES.processed, true);
  if (randomInt(1, CONFIG.eliteRarity) !== 1) return;
  if (makeInfernal(entity)) tracked.set(entity.id, entity);
}

export function forceInfernal(entity, tier = TIER.INFERNAL, modifiers) {
  if (!entity?.isValid || !isHostile(entity)) return false;
  const made = makeInfernal(entity, tier, modifiers);
  if (made) tracked.set(entity.id, entity);
  return made;
}

export function handleBeforeHurt(event) {
  const mob = event.hurtEntity;
  if (!mob?.isValid) return;
  const cause = event.damageSource?.cause;
  if (cause === "lightning") {
    if (getTier(mob)) {
      event.cancel = true;
      system.run(() => {
        try {
          mob.extinguishFire(false);
          const block = mob.dimension.getBlock(mob.location);
          if (block && (block.typeId === "minecraft:fire" || block.typeId === "minecraft:soul_fire")) {
            block.setType("minecraft:air");
          }
        } catch {}
      });
      return;
    }

    if (isHostile(mob) && !CONFIG.entityBlacklist.includes(mob.typeId) && !CONFIG.dimensionsBlacklist.includes(mob.dimension.id)) {
      event.cancel = true;
      system.run(() => {
        try {
          mob.extinguishFire(false);
          const block = mob.dimension.getBlock(mob.location);
          if (block && (block.typeId === "minecraft:fire" || block.typeId === "minecraft:soul_fire")) {
            block.setType("minecraft:air");
          }
          forceInfernal(mob, chooseTier());
        } catch {}
      });
    }
  }
}

export function handleHurt(event) {
  const mob = event.hurtEntity;
  if (!mob?.isValid || !getTier(mob) || isGuarded(mob)) return;

  const cause = event.damageSource?.cause;
  if (cause === "lightning") {
    try { mob.extinguishFire(false); } catch {}
    return;
  }

  const damage = Math.max(0, event.damage ?? 0);
  absorbVirtualDamage(mob, damage);
  const attacker = event.damageSource?.damagingEntity;
  onInfernalHurt(mob, attacker, damage);

  const virtual = Number(mob.getDynamicProperty(PROPERTIES.virtualHealth)) || 0;
  const health = safeGetHealth(mob);
  if (virtual > 0 && health && health.currentValue <= 1) {
    try { health.setCurrentValue(Math.min(health.effectiveMax, Math.max(2, health.effectiveMax * 0.5))); } catch {}
  }
}

export function handleHit(event) {
  const attacker = event.damagingEntity;
  if (!attacker?.isValid || !getTier(attacker)) return;
  onInfernalAttacks(attacker, event.hitEntity, 2);
}

export function handleDeath(event) {
  const dead = event.deadEntity;
  const tier = getTier(dead);
  if (!tier) return;
  const modifiers = getModifiers(dead);
  const location = { ...dead.location };
  const dimension = dead.dimension;
  const typeId = dead.typeId;
  tracked.delete(dead.id);
  dropTierLoot(dimension, location, tier);
  if (!dead.getDynamicProperty(PROPERTIES.extraLifeUsed)) {
    system.run(() => reviveOneUp(dead, location, dimension, typeId, modifiers, tier));
  }
}

export function updateTracked() {
  for (const [id, entity] of tracked) {
    if (!entity?.isValid) {
      tracked.delete(id);
      continue;
    }
    tickInfernal(entity);
  }
}

export function trackLoadedEntities() {
  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    try {
      const dimension = globalThis.__infernalWorld.getDimension(dimensionId);
      for (const entity of dimension.getEntities()) considerSpawn(entity);
    } catch {}
  }
}

function dropTierLoot(dimension, location, tier) {
  const table = LOOT[tier];
  if (!table?.length) return;
  const rolls = tier === TIER.INFERNAL ? 3 : tier === TIER.ULTRA ? 2 : 1;
  for (let i = 0; i < rolls; i++) {
    const [typeId, min, max] = choose(table);
    try { dimension.spawnItem(new ItemStack(typeId, randomInt(min, max)), location); } catch {}
  }
}
