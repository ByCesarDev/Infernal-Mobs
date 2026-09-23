/**
 * Infernal Mobs Bedrock - Modifier Incompatibilities and Species Blacklists
 * Strict parity with Java NeoForge
 */

export const MODIFIER_IDS = Object.freeze([
  "1up",
  "alchemist",
  "berserk",
  "blastoff",
  "bulwark",
  "choke",
  "cloaking",
  "darkness",
  "ender",
  "exhaust",
  "fiery",
  "ghastly",
  "gravity",
  "lifesteal",
  "ninja",
  "poisonous",
  "quicksand",
  "regen",
  "rust",
  "sapper",
  "sprint",
  "sticky",
  "storm",
  "unyielding",
  "vengeance",
  "weakness",
  "webber",
  "wither"
]);

/**
 * Modifiers banned on specific mob species
 */
export const SPECIES_BANNED_MODS = Object.freeze({
  "minecraft:creeper": ["1up", "berserk", "lifesteal", "sticky"],
  "minecraft:spider": ["cloaking"],
  "minecraft:cave_spider": ["cloaking"]
});

/**
 * Symmetric pairwise incompatibilities
 */
export const INCOMPATIBLE_PAIRS = Object.freeze([
  ["blastoff", "webber"],
  ["gravity", "webber"],
  ["sticky", "storm"]
]);

/**
 * Fast lookup map for incompatibilities (bidirectional)
 */
export const INCOMPATIBLE_MAP = (() => {
  const map = {};
  for (const id of MODIFIER_IDS) {
    map[id] = new Set();
  }
  for (const [a, b] of INCOMPATIBLE_PAIRS) {
    if (map[a]) map[a].add(b);
    if (map[b]) map[b].add(a);
  }
  return map;
})();

export function areModifiersCompatible(candidate, alreadyChosen) {
  const banned = INCOMPATIBLE_MAP[candidate];
  if (!banned) return true;
  for (const picked of alreadyChosen) {
    if (banned.has(picked)) return false;
  }
  return true;
}

export function isModifierAllowedOnSpecies(modifierId, speciesKey) {
  const fullId = speciesKey.includes(":") ? speciesKey : `minecraft:${speciesKey}`;
  const bans = SPECIES_BANNED_MODS[fullId];
  if (!bans) return true;
  return !bans.includes(modifierId.toLowerCase());
}
