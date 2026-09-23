export const CONFIG = Object.freeze({
  eliteRarity: 15,
  ultraRarity: 7,
  infernalRarity: 7,
  healthPerModifier: 0.5,
  maxBonusDamage: 10,
  updateIntervalTicks: 10,
  effectRange: 16,
  showParticles: true,
  showModifierNames: true,
  dimensionsBlacklist: [],
  entityBlacklist: [
    "minecraft:warden",
    "minecraft:wither",
    "minecraft:ender_dragon"
  ],
  modifiersDisabled: []
});

export const TIER = Object.freeze({
  ELITE: "elite",
  ULTRA: "ultra",
  INFERNAL: "infernal"
});

export const PROPERTIES = Object.freeze({
  processed: "infernal:processed",
  tier: "infernal:tier",
  modifiers: "infernal:modifiers",
  virtualHealth: "infernal:virtual_health",
  virtualMaxHealth: "infernal:virtual_max_health",
  baseName: "infernal:base_name",
  cooldowns: "infernal:cooldowns",
  extraLifeUsed: "infernal:extra_life_used"
});
