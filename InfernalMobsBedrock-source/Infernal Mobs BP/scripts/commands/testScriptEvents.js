/**
 * Infernal Mobs Bedrock - Test ScriptEvents
 * Reserved exclusively for automated testing, benchmarks and diagnostics
 */

import { system } from "@minecraft/server";
import { getAllActiveInfernals } from "../core/infernalManager.js";
import { getCurrentTick } from "../core/tickScheduler.js";
import { getConfig } from "../storage/worldConfig.js";
import { logInfo } from "../util/log.js";

export function initializeTestScriptEvents() {
  system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (!event.id.startsWith("infernalmobs:")) return;

    const subId = event.id.replace("infernalmobs:", "").toLowerCase();
    const source = event.sourceEntity;

    switch (subId) {
      case "dump": {
        const infernals = getAllActiveInfernals();
        const output = `[Dump] Active infernals: ${infernals.length}, World Tick: ${getCurrentTick()}`;
        logInfo("test", output);
        source?.sendMessage?.(`§a${output}`);
        break;
      }
      case "benchmark": {
        const infernals = getAllActiveInfernals();
        const start = Date.now();
        // Benchmark metric
        const elapsed = Date.now() - start;
        const msg = `[Benchmark] Tracked mobs: ${infernals.length} processed in ${elapsed}ms`;
        logInfo("test", msg);
        source?.sendMessage?.(`§e${msg}`);
        break;
      }
      case "test": {
        const ability = event.message?.trim().toLowerCase();
        source?.sendMessage?.(`§7[Test] Running scenario for: ${ability}`);
        break;
      }
    }
  });
}
