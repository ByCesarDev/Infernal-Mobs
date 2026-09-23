/**
 * Infernal Mobs Bedrock - Event Router
 * Subscribes to Minecraft events and routes to respective subsystems
 */

import { system, world } from "@minecraft/server";
import { handleAfterHurt, handleBeforeHurt } from "./damagePipeline.js";
import { processEntitySpawn } from "./spawnManager.js";
import { registerInfernal, unregisterInfernal } from "./infernalManager.js";
import { migrateEntityIfNeeded } from "../storage/migrations.js";
import { getInfernalState } from "../storage/entityState.js";
import { handleInfernalDeath } from "../systems/lootSystem.js";
import { isEntityValid } from "../util/entity.js";

/**
 * Initializes all world event listeners
 */
export function initializeEventRouter() {
  // Damage events
  world.beforeEvents.entityHurt.subscribe(handleBeforeHurt);
  world.afterEvents.entityHurt.subscribe(handleAfterHurt);

  // Spawn and Load
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    system.run(() => {
      if (!isEntityValid(entity)) return;
      processEntitySpawn(entity);
    });
  });

  world.afterEvents.entityLoad.subscribe(({ entity }) => {
    system.run(() => {
      if (!isEntityValid(entity)) return;
      migrateEntityIfNeeded(entity);
      const state = getInfernalState(entity);
      if (state && state.isInfernal) {
        registerInfernal(entity, state);
      }
    });
  });

  // Death and Loot
  world.afterEvents.entityDie.subscribe((event) => {
    handleInfernalDeath(event);
  });

  // Entity removal
  world.afterEvents.entityRemove.subscribe(({ removedEntityId }) => {
    if (removedEntityId) {
      unregisterInfernal(removedEntityId);
    }
  });
}
