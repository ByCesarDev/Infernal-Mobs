/**
 * Infernal Mobs Bedrock - Default Configuration
 * Strict parity with Java NeoForge defaults
 */

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
  entitiesAlwaysInfernal: [],
  modsEnabled: {}
});
