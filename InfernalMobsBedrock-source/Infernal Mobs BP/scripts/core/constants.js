/**
 * Infernal Mobs Bedrock - Core Constants
 * Parity with AtomicStryker's Infernal Mobs (NeoForge)
 */

export const SCHEMA_VERSION = 2;

export const PROPERTIES = Object.freeze({
  state: "infernal:state",
  processed: "infernal:processed",
  playerPrefs: "infernal:prefs",
  worldConfig: "infernal:world_config"
});

export const TIER = Object.freeze({
  RARE: "rare",
  ULTRA: "ultra",
  INFERNAL: "infernal"
});

export const TIER_STYLE = Object.freeze({
  [TIER.RARE]: {
    label: "Rare",
    color: "§b",
    maxMods: 5
  },
  [TIER.ULTRA]: {
    label: "Ultra",
    color: "§e",
    maxMods: 10
  },
  [TIER.INFERNAL]: {
    label: "Infernal",
    color: "§6",
    maxMods: 15
  }
});

export const DEFAULT_CONFIG = Object.freeze({
  eliteRarity: 15,
  ultraRarity: 7,
  infernoRarity: 7,
  modHealthFactor: 1.0,
  maxDamage: 10.0,
  modCooldownFactor: 1.0,
  healthChangesDisabled: false,
  disableHealthBar: false,
  antiFarm: false,
  namesEnabled: true,
  hudEnabled: true,
  lootEnabled: true,
  xpEnabled: true,
  debug: false,
  dimensionBlacklist: [],
  entityBlacklist: [
    "minecraft:warden",
    "minecraft:wither",
    "minecraft:ender_dragon"
  ],
  entityWhitelist: [],
  entitiesAlwaysInfernal: []
});

export const TICKS_PER_SECOND = 20;

export const STEADY_TARGET_TICKS_REQUIRED = 30; // 1.5 seconds in Java

export const DAMAGE_GUARDS = Object.freeze({
  REFLECT: "reflect",
  BERSERK_SELF: "berserk_self",
  CHOKE: "choke_damage",
  NINJA_REFLECT: "ninja_reflect",
  ENDER_REFLECT: "ender_reflect",
  GHASTLY_EXPLOSION: "ghastly_explosion",
  COSMETIC_LIGHTNING: "cosmetic_lightning"
});
