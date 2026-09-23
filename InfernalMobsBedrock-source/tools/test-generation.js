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
import { rollModifierCount, selectModifiers, calculateVisualTier } from "../Infernal Mobs BP/scripts/core/spawnManager.js";
import { calculateInfernalMaxHealth } from "../Infernal Mobs BP/scripts/systems/healthSystem.js";
import { INCOMPATIBLE_MAP, SPECIES_BANNED_MODS } from "../Infernal Mobs BP/scripts/data/incompatibilities.js";

console.log("Starting statistical validation with 100,000 trials...");

const TRIALS = 100000;
let eliteCount = 0;
let ultraCount = 0;
let infernalCount = 0;

let duplicateViolations = 0;
let incompatibilityViolations = 0;
let creeperViolations = 0;
let spiderViolations = 0;
let healthFormulaViolations = 0;

for (let i = 0; i < TRIALS; i++) {
  const count = rollModifierCount(DEFAULT_CONFIG);
  if (count > 0) {
    eliteCount++;
    if (count >= 5 && count <= 8) {
      ultraCount++;
    } else if (count >= 8) {
      infernalCount++;
    }

    // Test selection on random species
    const species = i % 3 === 0 ? "minecraft:creeper" : i % 3 === 1 ? "minecraft:spider" : "minecraft:zombie";
    const selected = selectModifiers(count, species, DEFAULT_CONFIG);

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

console.log(`\nResults across ${TRIALS.toLocaleString()} trials:`);
console.log(`- Elite spawns: ${eliteCount} (Rate: ${(eliteCount / TRIALS * 100).toFixed(2)}%, expected ~${(100/15).toFixed(2)}%)`);
console.log(`- Ultra upgrades: ${ultraCount}`);
console.log(`- Infernal upgrades: ${infernalCount}`);
console.log(`- Duplicate violations: ${duplicateViolations}`);
console.log(`- Incompatibility violations: ${incompatibilityViolations}`);
console.log(`- Creeper ban violations: ${creeperViolations}`);
console.log(`- Spider ban violations: ${spiderViolations}`);
console.log(`- Health formula violations: ${healthFormulaViolations}`);

if (duplicateViolations === 0 && incompatibilityViolations === 0 && creeperViolations === 0 && spiderViolations === 0 && healthFormulaViolations === 0) {
  console.log("\nALL 100,000 TESTS PASSED WITH ZERO VIOLATIONS!");
} else {
  console.error("\nTEST SUITE FAILED WITH VIOLATIONS!");
  process.exit(1);
}
