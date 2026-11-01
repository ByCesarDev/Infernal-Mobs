/**
 * Statistical and Logic Validation Suite for Infernal Mobs Bedrock
 * Simulates 100,000 rolls and verifies:
 * 1. Elite (1/15), Ultra (1/7 of elite), Infernal (1/7 of ultra) distribution
 * 2. Strict zero modifier duplicates
 * 3. Strict zero incompatibilities (Blastoff-Webber, Gravity-Webber, Sticky-Storm)
 * 4. Strict species blacklists (Creepers: no 1UP, Berserk, LifeSteal, Sticky; Spiders: no Cloaking)
 * 5. Health formula verification: baseMaxHealth * modifierCount * modHealthFactor
 */


import { DEFAULT_CONFIG } from "../Infernal Mobs BP/scripts/data/defaultConfig.js";
import { TIER } from "../Infernal Mobs BP/scripts/core/constants.js";
import { rollInfernalSpawn, selectModifiers, calculateVisualTier, isEligibleForInfernal, rollModifierCount, processEntitySpawn, createInfernal } from "../Infernal Mobs BP/scripts/core/spawnManager.js";
import { calculateInfernalMaxHealth } from "../Infernal Mobs BP/scripts/systems/healthSystem.js";
import { MODIFIER_IDS, INCOMPATIBLE_MAP, SPECIES_BANNED_MODS } from "../Infernal Mobs BP/scripts/data/incompatibilities.js";
import { formatShortName, formatFullName, formatModifierRows, ensureStableName, buildRawFullName, buildRawModifierRows, buildRawHudMessage, formatSpeciesName, formatTitleCase } from "../Infernal Mobs BP/scripts/systems/namingSystem.js";
import {
  loadWorldConfig,
  saveWorldConfig,
  getConfig,
  resetWorldConfig,
  addAlwaysInfernalEntity,
  removeAlwaysInfernalEntity,
  getAlwaysInfernalEntities,
  setModifierEnabledConfig
} from "../Infernal Mobs BP/scripts/storage/worldConfig.js";
import { handleAlwaysCommand, handleConfigCommand, isValidEntityIdentifier } from "../Infernal Mobs BP/scripts/commands/adminCommands.js";
import { world } from "@minecraft/server";

console.log("Starting statistical validation with 100,000 trials...");

const TRIALS = 100000;
let eliteSpawns = 0;
let rareOnlyCount = 0;
let ultraCount = 0;
let infernalCount = 0;

let duplicateViolations = 0;
let incompatibilityViolations = 0;
let creeperViolations = 0;
let spiderViolations = 0;
let healthFormulaViolations = 0;

for (let i = 0; i < TRIALS; i++) {
  const roll = rollInfernalSpawn(DEFAULT_CONFIG);
  if (roll.count > 0) {
    eliteSpawns++;

    if (roll.tier === TIER.INFERNAL) {
      infernalCount++;
    } else if (roll.tier === TIER.ULTRA) {
      ultraCount++;
    } else {
      rareOnlyCount++;
    }

    // Test selection on random species
    const species = i % 3 === 0 ? "minecraft:creeper" : i % 3 === 1 ? "minecraft:spider" : "minecraft:zombie";
    const selected = selectModifiers(roll.count, species, DEFAULT_CONFIG);

    // 1. Check duplicates
    const unique = new Set(selected);
    if (unique.size !== selected.length) {
      duplicateViolations++;
    }

    // 2. Check incompatibilities
    for (let j = 0; j < selected.length; j++) {
      const a = selected[j];
      const banned = INCOMPATIBLE_MAP[a];
      for (let k = j + 1; k < selected.length; k++) {
        const b = selected[k];
        if (banned && banned.has(b)) {
          incompatibilityViolations++;
          console.error(`Incompatibility violation: ${a} and ${b}`);
        }
      }
    }

    // 3. Check species bans
    if (species === "minecraft:creeper") {
      for (const banned of SPECIES_BANNED_MODS["minecraft:creeper"]) {
        if (selected.includes(banned)) {
          creeperViolations++;
          console.error(`Creeper banned modifier violation: ${banned}`);
        }
      }
    } else if (species === "minecraft:spider") {
      for (const banned of SPECIES_BANNED_MODS["minecraft:spider"]) {
        if (selected.includes(banned)) {
          spiderViolations++;
          console.error(`Spider banned modifier violation: ${banned}`);
        }
      }
    }

    // 4. Health formula check
    const baseHealth = 20;
    const calcHealth = calculateInfernalMaxHealth(baseHealth, selected.length, DEFAULT_CONFIG);
    const expectedHealth = baseHealth * selected.length * 1.0;
    if (calcHealth !== expectedHealth) {
      healthFormulaViolations++;
    }
  }
}

const eliteRate = eliteSpawns / TRIALS;
const ultraOrAbove = ultraCount + infernalCount;
const ultraRate = eliteSpawns > 0 ? ultraOrAbove / eliteSpawns : 0;
const infernalRate = ultraOrAbove > 0 ? infernalCount / ultraOrAbove : 0;

console.log(`\nResults across ${TRIALS.toLocaleString()} trials:`);
console.log(`- Total Infernal Spawns: ${eliteSpawns} (Rate: ${(eliteRate * 100).toFixed(2)}%, expected ~6.67%)`);
console.log(`- Rare spawns: ${rareOnlyCount}`);
console.log(`- Ultra upgrades (Ultra total ${ultraOrAbove}): ${ultraCount} (Upgrade rate: ${(ultraRate * 100).toFixed(2)}%, expected ~14.29%)`);
console.log(`- Infernal upgrades: ${infernalCount} (Infernal upgrade rate: ${(infernalRate * 100).toFixed(2)}%, expected ~14.29%)`);
console.log(`- Duplicate violations: ${duplicateViolations}`);
console.log(`- Incompatibility violations: ${incompatibilityViolations}`);
console.log(`- Creeper ban violations: ${creeperViolations}`);
console.log(`- Spider ban violations: ${spiderViolations}`);
console.log(`- Health formula violations: ${healthFormulaViolations}`);

// Statistical tolerance bounds assertions
if (eliteSpawns < 6100 || eliteSpawns > 7200) {
  throw new Error(`Elite spawn rate out of statistical tolerance! Got ${eliteSpawns} (${(eliteRate * 100).toFixed(2)}%), expected ~6667 (6.67%)`);
}

if (ultraRate < 0.12 || ultraRate > 0.17) {
  throw new Error(`Ultra upgrade rate out of statistical tolerance! Got ${(ultraRate * 100).toFixed(2)}%, expected ~14.29%`);
}

if (infernalRate < 0.10 || infernalRate > 0.19) {
  throw new Error(`Infernal upgrade rate out of statistical tolerance! Got ${(infernalRate * 100).toFixed(2)}%, expected ~14.29%`);
}

// Test name stability and HUD modifier row formatting
console.log("\nVerifying name stability and HUD modifier rows...");
const testState = {
  tier: "infernal",
  modifiers: ["fiery", "storm", "regen", "darkness", "vengeance", "1up", "sprint", "sticky", "webber", "wither", "quicksand", "rust"],
  name: {
    prefixModifier: "weakness",
    prefixText: "apathetic",
    suffixModifier: "quicksand",
    suffixText: "theSlow",
    speciesKey: "zombie"
  }
};

const short1 = formatShortName(testState);
const full1 = formatFullName(testState);

for (let r = 0; r < 100; r++) {
  if (formatShortName(testState) !== short1 || formatFullName(testState) !== full1) {
    throw new Error("Name stability violation: name changed across calls!");
  }
}

// Verify shortName prefix matches fullName prefix (Title Case)
if (!full1.includes("Apathetic") || !short1.includes("Apathetic")) {
  throw new Error("Prefix mismatch violation!");
}
if (!full1.includes("The Slow")) {
  throw new Error(`Expected 'The Slow' in fullName, got: ${full1}`);
}

// Verify 12 modifiers formatting in rows of 5
const rows = formatModifierRows(testState.modifiers);
if (rows.length !== 3) {
  throw new Error(`Expected 3 modifier rows for 12 modifiers, got ${rows.length}`);
}
const rowCounts = rows.map((r) => r.split(" · ").length);
if (rowCounts[0] !== 5 || rowCounts[1] !== 5 || rowCounts[2] !== 2) {
  throw new Error(`Expected [5, 5, 2] modifiers per row, got ${JSON.stringify(rowCounts)}`);
}

// Test ensureStableName on state missing prefixText / suffixText
const legacyState = {
  tier: "ultra",
  modifiers: ["fiery", "storm", "regen"],
  name: {
    prefixModifier: "fiery",
    speciesKey: "skeleton"
  }
};
ensureStableName(legacyState);
if (!legacyState.name.prefixText || !legacyState.name.suffixText) {
  throw new Error("ensureStableName failed to populate prefixText or suffixText!");
}
const legShort = formatShortName(legacyState);
for (let r = 0; r < 50; r++) {
  if (formatShortName(legacyState) !== legShort) {
    throw new Error("Legacy name stability violation!");
  }
}
// Test multilingual RawMessage generation
const rawFull = buildRawFullName(testState);
if (!rawFull.rawtext || !rawFull.rawtext.some(c => c.translate === "infernalmobs.class.infernal")) {
  throw new Error("Raw full name missing infernal tier translation key!");
}
if (!rawFull.rawtext.some(c => c.translate === "infernalmobs.prefix.apathetic")) {
  throw new Error("Raw full name missing prefix translation key!");
}

const rawRows = buildRawModifierRows(testState.modifiers);
if (rawRows.length !== 3) {
  throw new Error(`Expected 3 raw modifier rows, got ${rawRows.length}`);
}
const firstRowTranslates = rawRows[0].rawtext.filter(c => Boolean(c.translate));
if (firstRowTranslates.length !== 5) {
  throw new Error(`Expected 5 translation keys in first raw row, got ${firstRowTranslates.length}`);
}

const rawHud = buildRawHudMessage(testState, 100, 100, DEFAULT_CONFIG, () => "████ 100/100");
if (!rawHud.rawtext || rawHud.rawtext.length < 5) {
  throw new Error("Raw HUD message invalid or missing components!");
}

// Test multi-word species formatting (e.g. redstone_cube, cave_spider, magma_cube)
if (formatSpeciesName("redstone_cube") !== "Redstone Cube") {
  throw new Error(`formatSpeciesName failed on redstone_cube: got ${formatSpeciesName("redstone_cube")}`);
}
if (formatSpeciesName("cave_spider") !== "Cave Spider") {
  throw new Error(`formatSpeciesName failed on cave_spider: got ${formatSpeciesName("cave_spider")}`);
}
if (formatSpeciesName("magma_cube") !== "Magma Cube") {
  throw new Error(`formatSpeciesName failed on magma_cube: got ${formatSpeciesName("magma_cube")}`);
}

const multiWordTestState = {
  tier: "rare",
  modifiers: ["webber"],
  name: {
    prefixText: "Webber",
    speciesKey: "redstone_cube"
  }
};
const multiShort = formatShortName(multiWordTestState);
if (!multiShort.includes("Redstone Cube") || multiShort.includes("Redstone_cube")) {
  throw new Error(`Expected 'Redstone Cube' in formatShortName, got: ${multiShort}`);
}
const multiFull = formatFullName(multiWordTestState);
if (!multiFull.includes("Redstone Cube") || multiFull.includes("Redstone_cube")) {
  throw new Error(`Expected 'Redstone Cube' in formatFullName, got: ${multiFull}`);
}

// Test formatTitleCase on various formats
if (formatTitleCase("stinging") !== "Stinging") {
  throw new Error(`formatTitleCase failed on 'stinging': got ${formatTitleCase("stinging")}`);
}
if (formatTitleCase("totally zen") !== "Totally Zen") {
  throw new Error(`formatTitleCase failed on 'totally zen': got ${formatTitleCase("totally zen")}`);
}
if (formatTitleCase("ofRecurrence") !== "Of Recurrence") {
  throw new Error(`formatTitleCase failed on 'ofRecurrence': got ${formatTitleCase("ofRecurrence")}`);
}
if (formatTitleCase("yoink") !== "Yoink") {
  throw new Error(`formatTitleCase failed on 'yoink': got ${formatTitleCase("yoink")}`);
}

// Test user screenshot case: Infernal stinging Cave Spider -> Infernal Stinging Cave Spider
const spiderState = {
  tier: "infernal",
  modifiers: ["poisonous"],
  name: {
    prefixText: "stinging",
    speciesKey: "cave_spider"
  }
};
const spiderShort = formatShortName(spiderState);
if (!spiderShort.includes("Stinging Cave Spider") || spiderShort.includes("stinging")) {
  throw new Error(`Expected 'Stinging Cave Spider' in formatShortName, got: ${spiderShort}`);
}

console.log("Name stability, multilingual RawMessage, Title Case multi-word names & 12-modifier row tests passed with zero violations!");

console.log("\nStarting Phase 8 Always Infernal feature validation suite...");

function createMockEntity({
  typeId = "minecraft:zombie",
  id = "test-1",
  isValid = true,
  health = 20,
  dimensionId = "minecraft:overworld",
  isTamed = false,
  isPlayer = false
} = {}) {
  const dynProps = new Map();
  return {
    id,
    typeId: isPlayer ? "minecraft:player" : typeId,
    isValid,
    dimension: { id: dimensionId },
    getDynamicProperty(key) {
      return dynProps.get(key);
    },
    setDynamicProperty(key, val) {
      dynProps.set(key, val);
    },
    getComponent(componentId) {
      if (componentId === "minecraft:health") {
        return {
          currentValue: health,
          defaultValue: health,
          effectiveMax: health,
          setCurrentValue: () => true
        };
      }
      if (componentId === "minecraft:tameable" && isTamed) {
        return { tamedToPlayerId: "player-1" };
      }
      return null;
    },
    extinguishFire() {}
  };
}

// 1. Unconfigured zombie retains standard 1/15 eligibility and probability
const testZombie = createMockEntity({ typeId: "minecraft:zombie" });
if (!isEligibleForInfernal(testZombie, DEFAULT_CONFIG, true)) {
  throw new Error("Test 1 failed: Standard zombie should be eligible naturally.");
}

// 2. Configured Wither, Warden, Ender Dragon always get positive modifier count (100% conversion)
const bossTypes = ["minecraft:wither", "minecraft:warden", "minecraft:ender_dragon"];
for (const bossType of bossTypes) {
  const bossConfig = {
    ...DEFAULT_CONFIG,
    entitiesAlwaysInfernal: [bossType]
  };
  const bossEntity = createMockEntity({ typeId: bossType, health: 300 });

  if (!isEligibleForInfernal(bossEntity, bossConfig, true)) {
    throw new Error(`Test 2 failed: Configured ${bossType} must be eligible despite default blacklist!`);
  }

  // Verify that rollModifierCount with guaranteed = true always returns >= 2
  for (let t = 0; t < 1000; t++) {
    const count = rollModifierCount(bossConfig, true);
    if (count < 2 || count > 12) {
      throw new Error(`Test 2 failed: Guaranteed roll returned invalid count: ${count}`);
    }
  }
}

// 3. Ultra and Infernal upgrade rates remain random for guaranteed entities
let bossRare = 0;
let bossUltra = 0;
let bossInfernal = 0;
const bossTrials = 50000;
for (let t = 0; t < bossTrials; t++) {
  const roll = rollInfernalSpawn(DEFAULT_CONFIG, true);
  if (roll.tier === TIER.INFERNAL) bossInfernal++;
  else if (roll.tier === TIER.ULTRA) bossUltra++;
  else bossRare++;
}
const bossUltraOrAbove = bossUltra + bossInfernal;
const bossUltraRate = bossUltraOrAbove / bossTrials;
const bossInfernalRate = bossInfernal / bossUltraOrAbove;
if (bossUltraRate < 0.12 || bossUltraRate > 0.17) {
  throw new Error(`Test 3 failed: Guaranteed entity Ultra upgrade rate out of bounds: ${(bossUltraRate * 100).toFixed(2)}%`);
}
if (bossInfernalRate < 0.11 || bossInfernalRate > 0.18) {
  throw new Error(`Test 3 failed: Guaranteed entity Infernal upgrade rate out of bounds: ${(bossInfernalRate * 100).toFixed(2)}%`);
}

// 4. Configured entity bypasses entityBlacklist
const witherBlacklistConfig = {
  ...DEFAULT_CONFIG,
  entityBlacklist: ["minecraft:wither", "minecraft:warden"],
  entitiesAlwaysInfernal: ["minecraft:wither"]
};
const witherEnt = createMockEntity({ typeId: "minecraft:wither", health: 300 });
if (!isEligibleForInfernal(witherEnt, witherBlacklistConfig, true)) {
  throw new Error("Test 4 failed: entitiesAlwaysInfernal must bypass entityBlacklist!");
}

// 5. Configured entity bypasses entityWhitelist
const witherWhitelistConfig = {
  ...DEFAULT_CONFIG,
  entityWhitelist: ["minecraft:zombie"],
  entitiesAlwaysInfernal: ["minecraft:wither"]
};
if (!isEligibleForInfernal(witherEnt, witherWhitelistConfig, true)) {
  throw new Error("Test 5 failed: entitiesAlwaysInfernal must bypass entityWhitelist!");
}
const skeletonEnt = createMockEntity({ typeId: "minecraft:skeleton" });
if (isEligibleForInfernal(skeletonEnt, witherWhitelistConfig, true)) {
  throw new Error("Test 5 failed: Unconfigured entity not on whitelist must remain ineligible!");
}

// 6. Dimension blacklist still rejects configured entities
const dimBlacklistConfig = {
  ...DEFAULT_CONFIG,
  dimensionBlacklist: ["minecraft:nether"],
  entitiesAlwaysInfernal: ["minecraft:wither"]
};
const netherWither = createMockEntity({ typeId: "minecraft:wither", dimensionId: "minecraft:nether", health: 300 });
if (isEligibleForInfernal(netherWither, dimBlacklistConfig, true)) {
  throw new Error("Test 6 failed: dimensionBlacklist must take priority over entitiesAlwaysInfernal!");
}

// 7. Unconfigured blacklisted entities remain rejected
const defaultWither = createMockEntity({ typeId: "minecraft:wither", health: 300 });
const defaultWarden = createMockEntity({ typeId: "minecraft:warden", health: 500 });
const defaultDragon = createMockEntity({ typeId: "minecraft:ender_dragon", health: 200 });
if (isEligibleForInfernal(defaultWither, DEFAULT_CONFIG, true)) {
  throw new Error("Test 7 failed: Unconfigured Wither must be rejected by default entityBlacklist.");
}
if (isEligibleForInfernal(defaultWarden, DEFAULT_CONFIG, true)) {
  throw new Error("Test 7 failed: Unconfigured Warden must be rejected by default entityBlacklist.");
}
if (isEligibleForInfernal(defaultDragon, DEFAULT_CONFIG, true)) {
  throw new Error("Test 7 failed: Unconfigured Ender Dragon must be rejected by default entityBlacklist.");
}

// 8. Players, tamed mobs, invalid entities, and entities without health are rejected even if in entitiesAlwaysInfernal
const forcedAllConfig = {
  ...DEFAULT_CONFIG,
  entitiesAlwaysInfernal: ["minecraft:player", "minecraft:wolf", "minecraft:zombie"]
};
const playerEnt = createMockEntity({ isPlayer: true });
const tamedWolf = createMockEntity({ typeId: "minecraft:wolf", isTamed: true });
const invalidEnt = createMockEntity({ typeId: "minecraft:zombie", isValid: false });
const noHealthEnt = { id: "no-hp", typeId: "minecraft:zombie", isValid: true, dimension: { id: "minecraft:overworld" }, getComponent: () => null };

if (isEligibleForInfernal(playerEnt, forcedAllConfig, true)) throw new Error("Test 8 failed: Players must NEVER be eligible!");
if (isEligibleForInfernal(tamedWolf, forcedAllConfig, true)) throw new Error("Test 8 failed: Tamed mobs must NEVER be eligible!");
if (isEligibleForInfernal(invalidEnt, forcedAllConfig, true)) throw new Error("Test 8 failed: Invalid entities must NEVER be eligible!");
if (isEligibleForInfernal(noHealthEnt, forcedAllConfig, true)) throw new Error("Test 8 failed: Entities without health must NEVER be eligible!");

// 9. worldConfig persistence and normalization
resetWorldConfig();
if (getAlwaysInfernalEntities().length !== 0) {
  throw new Error("Test 9 failed: resetWorldConfig must clear entitiesAlwaysInfernal!");
}

// Add entity
const add1 = addAlwaysInfernalEntity("minecraft:wither");
if (!add1.success) throw new Error("Test 9 failed: addAlwaysInfernalEntity should succeed!");
if (!getAlwaysInfernalEntities().includes("minecraft:wither")) {
  throw new Error("Test 9 failed: minecraft:wither not found in list!");
}

// Reject duplicate
const addDup = addAlwaysInfernalEntity("minecraft:wither");
if (addDup.success) throw new Error("Test 9 failed: Duplicate entity addition must be rejected!");

// Remove entity
const rem1 = removeAlwaysInfernalEntity("minecraft:wither");
if (!rem1.success) throw new Error("Test 9 failed: removeAlwaysInfernalEntity should succeed!");
if (getAlwaysInfernalEntities().includes("minecraft:wither")) {
  throw new Error("Test 9 failed: minecraft:wither should be removed!");
}

// Remove non-existent entity
const remNonExistent = removeAlwaysInfernalEntity("minecraft:wither");
if (remNonExistent.success) throw new Error("Test 9 failed: Removing non-existent entity should return failure!");

// 10. Legacy config loading with normalization and deduplication
world.setDynamicProperty("infernal:world_config", JSON.stringify({
  entitiesAlwaysInfernal: ["minecraft:Wither", "  MINECRAFT:WITHER  ", "minecraft:warden", "", 123]
}));
loadWorldConfig();
const loaded = getAlwaysInfernalEntities();
if (loaded.length !== 2 || !loaded.includes("minecraft:wither") || !loaded.includes("minecraft:warden")) {
  throw new Error(`Test 10 failed: Legacy normalization failed. Got: ${JSON.stringify(loaded)}`);
}

// Missing entitiesAlwaysInfernal in legacy config
world.setDynamicProperty("infernal:world_config", JSON.stringify({
  eliteRarity: 20
}));
loadWorldConfig();
const loadedMissing = getAlwaysInfernalEntities();
if (!Array.isArray(loadedMissing) || loadedMissing.length !== 0) {
  throw new Error("Test 10 failed: Missing entitiesAlwaysInfernal should default to empty array!");
}
resetWorldConfig();

// 11. Empty modifier pools safely handled
// Disable all modifiers temporarily
for (const mod of MODIFIER_IDS) {
  setModifierEnabledConfig(mod, false);
}
const mockVictim = createMockEntity({ typeId: "minecraft:zombie", health: 20 });
const resultWhenAllDisabled = createInfernal(mockVictim, null, null, 4);
if (resultWhenAllDisabled !== null) {
  throw new Error("Test 11 failed: createInfernal must return null when no modifiers are available!");
}
// Re-enable all modifiers
for (const mod of MODIFIER_IDS) {
  setModifierEnabledConfig(mod, true);
}

// 12. Admin command tests (handleAlwaysCommand & handleConfigCommand)
resetWorldConfig();
const mockPlayerMessages = [];
const mockPlayer = {
  sendMessage: (msg) => mockPlayerMessages.push(msg)
};
const mockOrigin = { sourceEntity: mockPlayer, initiator: mockPlayer };

// Command: list when empty
const listEmpty = handleAlwaysCommand(mockOrigin, "list");
if (!listEmpty.message.includes("No entities configured") || !listEmpty.message.includes("Total: 0")) {
  throw new Error(`Test 12 failed: Empty list format unexpected: ${listEmpty.message}`);
}

// Command: add valid
const cmdAdd = handleAlwaysCommand(mockOrigin, "add", "minecraft:wither");
if (cmdAdd.status !== 0) throw new Error("Test 12 failed: /infernalmobs:always add should succeed!");
if (!getAlwaysInfernalEntities().includes("minecraft:wither")) {
  throw new Error("Test 12 failed: Entity not in list after command!");
}

// Command: add duplicate
const cmdAddDup = handleAlwaysCommand(mockOrigin, "add", "minecraft:wither");
if (cmdAddDup.status === 0) throw new Error("Test 12 failed: Adding duplicate via command should fail!");

// Command: add without namespace (auto-prefixes minecraft:)
const cmdAddNoNs = handleAlwaysCommand(mockOrigin, "add", "warden");
if (cmdAddNoNs.status !== 0) throw new Error("Test 12 failed: Auto-prefixing namespace should succeed!");
if (!getAlwaysInfernalEntities().includes("minecraft:warden")) {
  throw new Error("Test 12 failed: minecraft:warden not found after 'warden' add!");
}

// Command: add invalid identifier
const cmdAddInvalid = handleAlwaysCommand(mockOrigin, "add", "Invalid Name With Spaces!");
if (cmdAddInvalid.status === 0) throw new Error("Test 12 failed: Invalid entity identifier should fail!");

// Command: list populated
const listPopulated = handleAlwaysCommand(mockOrigin, "list");
if (!listPopulated.message.includes("minecraft:wither") || !listPopulated.message.includes("minecraft:warden") || !listPopulated.message.includes("Total: 2 entities")) {
  throw new Error(`Test 12 failed: Populated list format unexpected: ${listPopulated.message}`);
}

// Command: config output
const configResult = handleConfigCommand();
if (!configResult.message.includes("Always Infernal Entities") || !configResult.message.includes("minecraft:wither")) {
  throw new Error(`Test 12 failed: handleConfigCommand does not show always infernal entities: ${configResult.message}`);
}

// Command: remove valid
const cmdRem = handleAlwaysCommand(mockOrigin, "remove", "minecraft:wither");
if (cmdRem.status !== 0) throw new Error("Test 12 failed: Remove via command should succeed!");
if (getAlwaysInfernalEntities().includes("minecraft:wither")) {
  throw new Error("Test 12 failed: Removed entity still present in list!");
}

// Command: remove not configured
const cmdRemNotCfg = handleAlwaysCommand(mockOrigin, "remove", "minecraft:wither");
if (cmdRemNotCfg.status === 0) throw new Error("Test 12 failed: Removing unconfigured entity via command should fail!");

resetWorldConfig();
console.log("Phase 8 Always Infernal validation suite passed with zero errors!");

if (duplicateViolations === 0 && incompatibilityViolations === 0 && creeperViolations === 0 && spiderViolations === 0 && healthFormulaViolations === 0) {
  console.log("\nALL 100,000 TESTS PASSED WITH ZERO VIOLATIONS!");
} else {
  console.error("\nTEST SUITE FAILED WITH VIOLATIONS!");
  process.exit(1);
}
