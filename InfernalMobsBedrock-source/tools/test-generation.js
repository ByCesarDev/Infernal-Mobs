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
import { rollInfernalSpawn, selectModifiers, calculateVisualTier } from "../Infernal Mobs BP/scripts/core/spawnManager.js";
import { calculateInfernalMaxHealth } from "../Infernal Mobs BP/scripts/systems/healthSystem.js";
import { INCOMPATIBLE_MAP, SPECIES_BANNED_MODS } from "../Infernal Mobs BP/scripts/data/incompatibilities.js";
import { formatShortName, formatFullName, formatModifierRows, ensureStableName, buildRawFullName, buildRawModifierRows, buildRawHudMessage } from "../Infernal Mobs BP/scripts/systems/namingSystem.js";

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

// Verify shortName prefix matches fullName prefix
if (!full1.includes("apathetic") || !short1.includes("apathetic")) {
  throw new Error("Prefix mismatch violation!");
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

console.log("Name stability, multilingual RawMessage & 12-modifier row tests passed with zero violations!");

if (duplicateViolations === 0 && incompatibilityViolations === 0 && creeperViolations === 0 && spiderViolations === 0 && healthFormulaViolations === 0) {
  console.log("\nALL 100,000 TESTS PASSED WITH ZERO VIOLATIONS!");
} else {
  console.error("\nTEST SUITE FAILED WITH VIOLATIONS!");
  process.exit(1);
}
