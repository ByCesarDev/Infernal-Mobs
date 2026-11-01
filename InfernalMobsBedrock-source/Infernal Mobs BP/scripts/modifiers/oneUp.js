/**
 * Infernal Mobs Bedrock - 1UP Modifier
 * Heals the mob to 100% health once when health drops below 25% or on fatal damage
 * Consumes the modifier's one-time revival state so it can die on subsequent hits
 * Banned on Creepers
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { getInfernalState, setInfernalState } from "../storage/entityState.js";
import { getTrackedInfernal } from "../core/infernalManager.js";
import { isEntityAlive, isEntityValid, safeGetHealth } from "../util/entity.js";
import { logError, logInfo } from "../util/log.js";

function trigger1UP(mob, state, health) {
  try {
    health.setCurrentValue(health.effectiveMax);

    // Play level-up sound at mob position
    mob.dimension.playSound("random.levelup", mob.location, {
      volume: 1.0,
      pitch: 1.0
    });

    if (!state.persistent) state.persistent = {};
    state.persistent.oneUpConsumed = true;
    state.currentHealth = health.effectiveMax;
    setInfernalState(mob, state);

    const record = getTrackedInfernal(mob.id);
    if (record && record.state) {
      if (!record.state.persistent) record.state.persistent = {};
      record.state.persistent.oneUpConsumed = true;
      record.state.currentHealth = health.effectiveMax;
    }

    logInfo("1up", `1UP triggered on mob ${mob.id} (${mob.typeId}), restored to full health (consumed extra life)`);
  } catch (err) {
    logError("1up", `Failed triggering 1UP on mob ${mob.id}`, err);
  }
}

function checkAndTrigger1UP(mob) {
  if (!isEntityValid(mob) || !isEntityAlive(mob)) return;

  const state = getInfernalState(mob);
  if (!state || !state.isInfernal) return;
  if (state.persistent?.oneUpConsumed) return;

  const health = safeGetHealth(mob);
  if (!health) return;

  const maxHp = state.infernalMaxHealth ?? health.effectiveMax;
  const current = health.currentValue;

  // Trigger when current health falls below 25% of maximum
  if (current < maxHp * 0.25) {
    trigger1UP(mob, state, health);
  }
}

export const OneUpHandler = {
  id: "1up",

  onIncomingDamageBefore(context) {
    const victim = context.victim;
    if (!isEntityValid(victim) || !isEntityAlive(victim)) return;

    const state = getInfernalState(victim);
    if (!state || !state.isInfernal) return;
    if (state.persistent?.oneUpConsumed) return;

    const health = safeGetHealth(victim);
    if (!health) return;

    const maxHp = state.infernalMaxHealth ?? health.effectiveMax;
    const current = health.currentValue;
    const incomingDamage = context.damage;

    // Trigger if incoming damage would reduce health below 25% or kill the mob
    if (current - incomingDamage < maxHp * 0.25 || incomingDamage >= current) {
      // Absorb the incoming hit that triggered 1UP
      context.damage = 0;

      // Queue the health restoration and consumption outside restricted execution mode
      if (!context.pendingActions) context.pendingActions = [];
      context.pendingActions.push(() => {
        if (!isEntityValid(victim) || !isEntityAlive(victim)) return;
        const currentHealth = safeGetHealth(victim);
        if (!currentHealth) return;
        const freshState = getInfernalState(victim) ?? state;
        trigger1UP(victim, freshState, currentHealth);
      });
    }
  },

  onIncomingDamageAfter(context) {
    checkAndTrigger1UP(context.victim);
  },

  onUpdate(mob) {
    checkAndTrigger1UP(mob);
  }
};

registerModifierHandler("1up", OneUpHandler);
