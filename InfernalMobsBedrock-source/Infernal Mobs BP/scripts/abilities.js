import { EntityComponentTypes, EquipmentSlot, system } from "@minecraft/server";
import { CONFIG, PROPERTIES } from "./config.js";
import { addEffect, choose, direction, nearestPlayer, safeDamage, safeGetHealth } from "./util.js";
import { getModifiers, hasModifier, isReady, refreshName } from "./state.js";

const DAMAGE_GUARD = new Set();

export function isGuarded(entity) {
  return DAMAGE_GUARD.has(entity.id);
}

function guardedDamage(entity, amount, attacker) {
  DAMAGE_GUARD.add(entity.id);
  safeDamage(entity, Math.max(0, amount), attacker);
  system.run(() => DAMAGE_GUARD.delete(entity.id));
}

export function onInfernalAttacks(mob, victim, damage = 2) {
  if (!mob?.isValid || !victim?.isValid) return;
  const mods = getModifiers(mob);

  if (mods.includes("Berserk")) guardedDamage(victim, Math.min(damage, CONFIG.maxBonusDamage), mob);
  if (mods.includes("LifeSteal")) healVirtual(mob, Math.max(1, damage));
  if (mods.includes("Darkness")) addEffect(victim, "minecraft:darkness", 5, 0);
  if (mods.includes("Exhaust")) addEffect(victim, "minecraft:hunger", 8, 1);
  if (mods.includes("Fiery")) try { victim.setOnFire(5, true); } catch {}
  if (mods.includes("Poisonous")) addEffect(victim, "minecraft:poison", 6, 0);
  if (mods.includes("Sapper")) addEffect(victim, "minecraft:weakness", 8, 1);
  if (mods.includes("Weakness")) addEffect(victim, "minecraft:weakness", 7, 1);
  if (mods.includes("Wither")) addEffect(victim, "minecraft:wither", 5, 0);
  if (mods.includes("Rust")) damageHeldItem(victim, 3);
}

export function onInfernalHurt(mob, attacker, damage) {
  if (!mob?.isValid) return;
  const mods = getModifiers(mob);

  if (mods.includes("Bulwark")) healVirtual(mob, damage * 0.5);
  if (attacker?.isValid && mods.includes("Vengeance")) guardedDamage(attacker, Math.max(1, damage * 0.4), mob);
  if (attacker?.isValid && mods.includes("Fiery")) try { attacker.setOnFire(4, true); } catch {}
  if (attacker?.isValid && mods.includes("Poisonous")) addEffect(attacker, "minecraft:poison", 5, 0);
  if (attacker?.isValid && mods.includes("Darkness")) addEffect(attacker, "minecraft:darkness", 4, 0);
  if (attacker?.isValid && mods.includes("Wither")) addEffect(attacker, "minecraft:wither", 4, 0);
  if (attacker?.isValid && mods.includes("Blastoff") && isReady(mob, "Blastoff", 300)) {
    try { attacker.applyImpulse({ x: 0, y: 1.7, z: 0 }); } catch {}
  }
  if (attacker?.isValid && mods.includes("Cloaking") && isReady(mob, "Cloaking", 200)) {
    addEffect(mob, "minecraft:invisibility", 7, 0);
  }
  if (attacker?.isValid && mods.includes("Ender") && isReady(mob, "Ender", 300)) teleportNear(mob, attacker, false);
  if (attacker?.isValid && mods.includes("Ninja") && isReady(mob, "Ninja", 300)) teleportNear(mob, attacker, true);
  if (attacker?.isValid && mods.includes("Sticky") && isReady(mob, "Sticky", 300)) dropHeldItem(attacker);
  if (attacker?.isValid && mods.includes("Webber") && isReady(mob, "Webber", 240)) {
    addEffect(attacker, "minecraft:slowness", 6, 3);
    addEffect(attacker, "minecraft:jump_boost", 6, 128);
  }
}

export function tickInfernal(mob) {
  if (!mob?.isValid) return;
  const mods = getModifiers(mob);
  const target = nearestPlayer(mob, CONFIG.effectRange);

  if (mods.includes("Regen") && isReady(mob, "Regen", 20)) healVirtual(mob, 1);
  if (mods.includes("Sprint")) addEffect(mob, "minecraft:speed", 2, 1);
  if (mods.includes("Unyielding")) {
    addEffect(mob, "minecraft:resistance", 2, 0);
    addEffect(mob, "minecraft:fire_resistance", 2, 0);
  }
  if (mods.includes("Quicksand") && target) addEffect(target, "minecraft:slowness", 2, 1);
  if (mods.includes("Choke") && target && isReady(mob, "Choke", 80)) {
    addEffect(target, "minecraft:nausea", 4, 0);
    guardedDamage(target, 1, mob);
  }
  if (mods.includes("Gravity") && target && isReady(mob, "Gravity", 100)) {
    try { target.applyImpulse(direction(target.location, mob.location, 0.8)); } catch {}
  }
  if (mods.includes("Alchemist") && target && isReady(mob, "Alchemist", 120)) {
    const effect = choose(["minecraft:poison", "minecraft:weakness", "minecraft:slowness", "minecraft:blindness"]);
    addEffect(target, effect, 6, 1);
  }
  if (mods.includes("Ghastly") && target && isReady(mob, "Ghastly", 120)) launchProjectile(mob, target);
  if (mods.includes("Storm") && target && isReady(mob, "Storm", 500)) {
    const dx = mob.location.x - target.location.x;
    const dy = mob.location.y - target.location.y;
    const dz = mob.location.z - target.location.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;

    if (distanceSquared > 9) {
      try { mob.dimension.spawnEntity("minecraft:lightning_bolt", target.location); } catch {}
    }
  }
  if (CONFIG.showParticles && isReady(mob, "AmbientParticle", 20)) {
    try { mob.dimension.spawnParticle("minecraft:basic_flame_particle", { x: mob.location.x, y: mob.location.y + 1, z: mob.location.z }); } catch {}
  }
  try {
    if (mob.getComponent(EntityComponentTypes.OnFire)) {
      mob.extinguishFire(false);
    }
  } catch {}
  refreshName(mob);
}

export function healVirtual(entity, amount) {
  const max = Number(entity.getDynamicProperty(PROPERTIES.virtualMaxHealth)) || 0;
  const current = Number(entity.getDynamicProperty(PROPERTIES.virtualHealth)) || 0;
  entity.setDynamicProperty(PROPERTIES.virtualHealth, Math.min(max, current + amount));
  const health = safeGetHealth(entity);
  if (health && health.currentValue < health.effectiveMax) {
    try { health.setCurrentValue(Math.min(health.effectiveMax, health.currentValue + amount)); } catch {}
  }
  refreshName(entity);
}

export function absorbVirtualDamage(entity, amount) {
  const current = Number(entity.getDynamicProperty(PROPERTIES.virtualHealth)) || 0;
  entity.setDynamicProperty(PROPERTIES.virtualHealth, Math.max(0, current - amount));
  refreshName(entity);
}

function teleportNear(mob, target, behind) {
  const view = (() => { try { return target.getViewDirection(); } catch { return { x: 1, y: 0, z: 0 }; } })();
  const distance = behind ? -2 : 2;
  const destination = {
    x: target.location.x + view.x * distance,
    y: target.location.y,
    z: target.location.z + view.z * distance
  };
  try { mob.teleport(destination, { dimension: target.dimension, checkForBlocks: true }); } catch {}
}

function launchProjectile(mob, target) {
  try {
    const projectile = mob.dimension.spawnEntity("minecraft:small_fireball", { x: mob.location.x, y: mob.location.y + 1, z: mob.location.z });
    projectile.applyImpulse(direction(projectile.location, target.location, 0.9));
  } catch {
    guardedDamage(target, 3, mob);
  }
}

function damageHeldItem(player, amount) {
  try {
    const equipment = player.getComponent(EntityComponentTypes.Equippable);
    const item = equipment?.getEquipment(EquipmentSlot.Mainhand);
    const durability = item?.getComponent("minecraft:durability");
    if (!item || !durability) return;
    durability.damage = Math.min(durability.maxDurability, durability.damage + amount);
    equipment.setEquipment(EquipmentSlot.Mainhand, durability.damage >= durability.maxDurability ? undefined : item);
  } catch {}
}

function dropHeldItem(player) {
  try {
    const equipment = player.getComponent(EntityComponentTypes.Equippable);
    const item = equipment?.getEquipment(EquipmentSlot.Mainhand);
    if (!item) return;
    player.dimension.spawnItem(item, player.location);
    equipment.setEquipment(EquipmentSlot.Mainhand, undefined);
  } catch {}
}

export function reviveOneUp(deadEntity, location, dimension, typeId, modifiers, tier) {
  if (!modifiers.includes("1UP")) return;
  try {
    const clone = dimension.spawnEntity(typeId, location);
    clone.setDynamicProperty(PROPERTIES.processed, true);
    clone.setDynamicProperty(PROPERTIES.extraLifeUsed, true);
    clone.setDynamicProperty(PROPERTIES.tier, tier);
    clone.setDynamicProperty(PROPERTIES.modifiers, modifiers.filter((id) => id !== "1UP").join("|"));
    const health = safeGetHealth(clone);
    const max = health?.effectiveMax ?? 20;
    clone.setDynamicProperty(PROPERTIES.virtualMaxHealth, max * 2);
    clone.setDynamicProperty(PROPERTIES.virtualHealth, max * 2);
    clone.setDynamicProperty(PROPERTIES.cooldowns, "{}");
    refreshName(clone);
    try { clone.dimension.spawnParticle("minecraft:totem_particle", clone.location); } catch {}
  } catch {}
}
