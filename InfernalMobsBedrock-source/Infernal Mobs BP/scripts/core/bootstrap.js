/**
 * Infernal Mobs Bedrock - Bootstrap
 * Orchestrates module initialization, event routing, custom commands, and tick scheduling
 */

// Import all 28 modifier modules to register their handlers
import "../modifiers/oneUp.js";
import "../modifiers/alchemist.js";
import "../modifiers/berserk.js";
import "../modifiers/blastoff.js";
import "../modifiers/bulwark.js";
import "../modifiers/choke.js";
import "../modifiers/cloaking.js";
import "../modifiers/darkness.js";
import "../modifiers/ender.js";
import "../modifiers/exhaust.js";
import "../modifiers/fiery.js";
import "../modifiers/ghastly.js";
import "../modifiers/gravity.js";
import "../modifiers/lifeSteal.js";
import "../modifiers/ninja.js";
import "../modifiers/poisonous.js";
import "../modifiers/quicksand.js";
import "../modifiers/regen.js";
import "../modifiers/rust.js";
import "../modifiers/sapper.js";
import "../modifiers/sprint.js";
import "../modifiers/sticky.js";
import "../modifiers/storm.js";
import "../modifiers/unyielding.js";
import "../modifiers/vengeance.js";
import "../modifiers/weakness.js";
import "../modifiers/webber.js";
import "../modifiers/wither.js";

import { system } from "@minecraft/server";
import { registerCustomCommands } from "../commands/registerCommands.js";
import { initializeTestScriptEvents } from "../commands/testScriptEvents.js";
import { initializeEventRouter } from "./eventRouter.js";
import { pruneInactiveInfernals, tickActiveInfernals } from "./infernalManager.js";
import { registerRecurringTask, startTickScheduler } from "./tickScheduler.js";
import { tickHudSystem } from "../systems/hudSystem.js";
import { tickInfernalAura } from "../systems/particleSystem.js";
import { loadWorldConfig } from "../storage/worldConfig.js";
import { logInfo } from "../util/log.js";

export function initializeInfernalMobs() {
  logInfo("bootstrap", "Initializing Infernal Mobs Bedrock...");

  // 1. Custom commands registration (startup event)
  registerCustomCommands();

  // 2. Load world configuration (deferred to first tick to avoid early execution privilege error)
  system.run(() => {
    loadWorldConfig();
  });

  // 3. Event listeners
  initializeEventRouter();
  initializeTestScriptEvents();

  // 4. Recurring tasks
  // Modifiers update loop every tick for steady target processing and abilities
  registerRecurringTask("activeInfernals", 1, (tick) => {
    tickActiveInfernals(tick);
  });

  // Infernal aura particles every 16 ticks (~0.8s, calibrated for Bedrock's witchspell_emitter burst duration)
  registerRecurringTask("infernalAura", 16, (tick) => {
    tickInfernalAura(tick);
  });

  // HUD updates 4 times per second (every 5 ticks)
  registerRecurringTask("hudDisplay", 5, (tick) => {
    tickHudSystem(tick);
  });

  // Prune dead/unloaded infernals every 100 ticks (5 seconds)
  registerRecurringTask("cachePruning", 100, () => {
    pruneInactiveInfernals();
  });

  // 5. Start main scheduler loop
  startTickScheduler();

  logInfo("bootstrap", "Infernal Mobs Bedrock initialization complete.");
}
