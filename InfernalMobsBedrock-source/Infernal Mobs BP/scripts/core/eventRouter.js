/**
 * Infernal Mobs Bedrock - Event Router
 * Subscribes to Minecraft events and routes to respective subsystems
 */

import { system, world } from "@minecraft/server";
import { handleAfterHurt, handleBeforeHurt } from "./damagePipeline.js";
import { processEntitySpawn } from "./spawnManager.js";
import { getTrackedInfernal, registerInfernal, unregisterInfernal } from "./infernalManager.js";
import { migrateEntityIfNeeded } from "../storage/migrations.js";
import { getInfernalState } from "../storage/entityState.js";
import { getConfig } from "../storage/worldConfig.js";
import { handleInfernalDeath } from "../systems/lootSystem.js";
import { applyInfernalHealth } from "../systems/healthSystem.js";
import { formatShortName } from "../systems/namingSystem.js";
import { getModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityValid } from "../util/entity.js";
import { forgetCombatTarget, recordCombatInteraction } from "./combatMemory.js";
import { getCurrentTick } from "./tickScheduler.js";

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
        // Reconcile health boost and nameTag upon loading chunk
        const targetHealth = state.currentHealth ?? state.infernalMaxHealth;
        applyInfernalHealth(entity, state.infernalMaxHealth, state.baseMaxHealth, targetHealth);
        const config = getConfig();
        if (config.namesEnabled) {
          entity.nameTag = formatShortName(state);
        }
      }
    });
  });

  // Combat hit events (melee)
  world.afterEvents.entityHitEntity.subscribe((event) => {
    const { damagingEntity, hitEntity } = event;
    if (!isEntityValid(damagingEntity) || !isEntityValid(hitEntity)) return;

    const tick = getCurrentTick();
    const attackerState = getInfernalState(damagingEntity);
    if (attackerState && attackerState.isInfernal) {
      recordCombatInteraction(damagingEntity.id, hitEntity, tick);
    }
    const victimState = getInfernalState(hitEntity);
    if (victimState && victimState.isInfernal) {
      recordCombatInteraction(hitEntity.id, damagingEntity, tick);
    }
  });

  // Death and Loot
  world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;
    if (deadEntity) {
      forgetCombatTarget(deadEntity.id);
      const state = getInfernalState(deadEntity);
      if (state && state.isInfernal) {
        const record = getTrackedInfernal(deadEntity.id);
        const modifiers = state.modifiers ?? [];
        for (const modId of modifiers) {
          const handler = getModifierHandler(modId);
          if (handler && typeof handler.onDeath === "function") {
            try {
              handler.onDeath(deadEntity, record);
            } catch {}
          }
        }
      }
    }
    handleInfernalDeath(event);
  });

  // Entity removal
  world.afterEvents.entityRemove.subscribe(({ removedEntityId }) => {
    if (removedEntityId) {
      forgetCombatTarget(removedEntityId);
      unregisterInfernal(removedEntityId);
    }
  });
}
