import { system } from "@minecraft/server";
import { CONFIG, PROPERTIES, TIER } from "./config.js";
import { INCOMPATIBLE, MODIFIER_IDS, TIER_STYLE } from "./data.js";
import { randomInt, safeGetHealth } from "./util.js";

export function getTier(entity) {
  return entity.getDynamicProperty(PROPERTIES.tier);
}

export function getModifiers(entity) {
  const value = entity.getDynamicProperty(PROPERTIES.modifiers);
  return typeof value === "string" && value ? value.split("|") : [];
}

export function hasModifier(entity, id) {
  return getModifiers(entity).includes(id);
}

export function chooseTier() {
  let tier = TIER.ELITE;
  if (randomInt(1, CONFIG.ultraRarity) === 1) {
    tier = TIER.ULTRA;
    if (randomInt(1, CONFIG.infernalRarity) === 1) tier = TIER.INFERNAL;
  }
  return tier;
}

export function modifierCount(tier) {
  if (tier === TIER.INFERNAL) return randomInt(8, 11);
  if (tier === TIER.ULTRA) return randomInt(5, 7);
  return randomInt(2, 4);
}

export function chooseModifiers(count) {
  const disabled = new Set(CONFIG.modifiersDisabled);
  const candidates = MODIFIER_IDS.filter((id) => !disabled.has(id));
  const picked = [];
  while (picked.length < count && candidates.length) {
    const index = randomInt(0, candidates.length - 1);
    const candidate = candidates.splice(index, 1)[0];
    const bans = INCOMPATIBLE[candidate] ?? [];
    if (!picked.some((id) => bans.includes(id))) picked.push(candidate);
  }
  return picked;
}

export function makeInfernal(entity, forcedTier, forcedModifiers) {
  const health = safeGetHealth(entity);
  if (!health) return false;
  const tier = forcedTier ?? chooseTier();
  const modifiers = forcedModifiers?.length ? forcedModifiers : chooseModifiers(modifierCount(tier));
  const baseMax = health.effectiveMax ?? health.defaultValue ?? 20;
  const virtualMax = Math.round(baseMax * (1 + modifiers.length * CONFIG.healthPerModifier));
  entity.setDynamicProperty(PROPERTIES.processed, true);
  entity.setDynamicProperty(PROPERTIES.tier, tier);
  entity.setDynamicProperty(PROPERTIES.modifiers, modifiers.join("|"));
  entity.setDynamicProperty(PROPERTIES.virtualMaxHealth, virtualMax);
  entity.setDynamicProperty(PROPERTIES.virtualHealth, virtualMax);
  entity.setDynamicProperty(PROPERTIES.baseName, entity.nameTag ?? "");
  entity.setDynamicProperty(PROPERTIES.cooldowns, "{}");
  const boostAmplifier = Math.max(0, Math.min(254, Math.ceil((virtualMax - baseMax) / 4) - 1));
  try { entity.addEffect("minecraft:health_boost", 1728000, { amplifier: boostAmplifier, showParticles: false }); } catch {}
  system.run(() => {
    const boostedHealth = safeGetHealth(entity);
    try { boostedHealth?.setCurrentValue(boostedHealth.effectiveMax); } catch {}
  });
  try { entity.extinguishFire(false); } catch {}
  refreshName(entity);
  return true;
}

export function refreshName(entity) {
  const tier = getTier(entity);
  const style = TIER_STYLE[tier];
  if (!style) return;
  const modifiers = getModifiers(entity);
  const hp = Math.max(0, Math.ceil(Number(entity.getDynamicProperty(PROPERTIES.virtualHealth)) || 0));
  const max = Math.max(1, Math.ceil(Number(entity.getDynamicProperty(PROPERTIES.virtualMaxHealth)) || 1));
  const visible = modifiers.slice(0, 5);
  const remaining = modifiers.length - visible.length;
  const list = CONFIG.showModifierNames
    ? ` §7[${visible.join(" · ")}${remaining > 0 ? ` · +${remaining}` : ""}]`
    : "";
  entity.nameTag = `${style.color}${style.label}${list}\n§f${hp}§7/§f${max} ❤`;
}

export function readCooldowns(entity) {
  try { return JSON.parse(entity.getDynamicProperty(PROPERTIES.cooldowns) || "{}"); }
  catch { return {}; }
}

export function isReady(entity, ability, cooldownTicks) {
  const now = globalThis.__infernalTick ?? 0;
  const cooldowns = readCooldowns(entity);
  if ((cooldowns[ability] ?? 0) > now) return false;
  cooldowns[ability] = now + cooldownTicks;
  entity.setDynamicProperty(PROPERTIES.cooldowns, JSON.stringify(cooldowns));
  return true;
}
