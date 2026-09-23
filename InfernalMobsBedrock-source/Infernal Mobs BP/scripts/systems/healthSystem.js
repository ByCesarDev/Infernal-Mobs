/**
 * Infernal Mobs Bedrock - Health System
 * Strict parity with Java NeoForge health scaling formula
 */

import { system } from "@minecraft/server";
import { getConfig } from "../storage/worldConfig.js";
import { isEntityValid, safeGetHealth } from "../util/entity.js";
import { logDebug, logError } from "../util/log.js";

/**
 * Calculates infernal maximum health according to Java formula:
 * infernalMaxHealth = baseMaxHealth * modifierCount * modHealthFactor
 */
export function calculateInfernalMaxHealth(baseMaxHealth, modifierCount, configOverride = null) {
  const config = configOverride ?? getConfig();
  if (config.healthChangesDisabled) {
    return baseMaxHealth;
  }
  const factor = config.modHealthFactor ?? 1.0;
  const count = Math.max(1, modifierCount);
  return Math.max(baseMaxHealth, Math.round(baseMaxHealth * count * factor));
}

/**
 * Applies infernal health boost to entity
 * Uses minecraft:health_boost effect without particles to raise maximum health in Bedrock
 */
export function applyInfernalHealth(entity, targetMaxHealth, baseMaxHealth, desiredHealth = null) {
  if (!isEntityValid(entity)) return;

  const config = getConfig();
  if (config.healthChangesDisabled) return;

  try {
    const health = safeGetHealth(entity);
    if (!health) return;

    const extraHealth = targetMaxHealth - baseMaxHealth;
    if (extraHealth > 0) {
      // Each health boost amplifier level provides +4 max health
      const amplifier = Math.max(0, Math.min(254, Math.ceil(extraHealth / 4) - 1));
      // 1728000 ticks = 24 hours duration
      entity.addEffect("minecraft:health_boost", 1728000, {
        amplifier,
        showParticles: false
      });
    }

    const targetVal = (desiredHealth !== null && desiredHealth !== undefined)
      ? Math.max(1, Math.min(targetMaxHealth, desiredHealth))
      : targetMaxHealth;

    // Apply the health to currentValue once effectiveMax has updated
    system.run(() => {
      if (!isEntityValid(entity)) return;
      const currentHealth = safeGetHealth(entity);
      if (currentHealth) {
        try {
          const finalVal = Math.min(targetVal, currentHealth.effectiveMax);
          currentHealth.setCurrentValue(finalVal);
        } catch (err) {
          logError("healthSystem", "Failed setting current health value", err);
        }
      }
    });

    // Double-check after 2 ticks to ensure Bedrock's attribute calculation has stabilized during chunk loading
    system.runTimeout(() => {
      if (!isEntityValid(entity)) return;
      const currentHealth = safeGetHealth(entity);
      if (currentHealth && currentHealth.currentValue < targetVal && currentHealth.effectiveMax >= targetVal) {
        try {
          currentHealth.setCurrentValue(targetVal);
        } catch {}
      }
    }, 2);
  } catch (error) {
    logError("healthSystem", `Failed applying health to ${entity?.id}`, error);
  }
}

/**
 * Restores vanilla health on removal of infernal status
 */
export function restoreVanillaHealth(entity, baseMaxHealth) {
  if (!isEntityValid(entity)) return;
  try {
    entity.removeEffect("minecraft:health_boost");
    const health = safeGetHealth(entity);
    if (health) {
      const current = health.currentValue;
      if (current > baseMaxHealth) {
        health.setCurrentValue(baseMaxHealth);
      }
    }
  } catch (error) {
    logError("healthSystem", `Failed restoring vanilla health on ${entity?.id}`, error);
  }
}
