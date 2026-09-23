/**
 * Infernal Mobs Bedrock - Central Damage Pipeline
 * Centralizes incoming and outgoing combat handling with recursion guards
 */

import { DAMAGE_GUARDS } from "./constants.js";
import { getModifierHandler } from "../data/modifierDefinitions.js";
import { getTrackedInfernal, registerInfernal } from "./infernalManager.js";
import { getInfernalState } from "../storage/entityState.js";
import { getConfig } from "../storage/worldConfig.js";
import { isEntityAlive, isEntityValid, isPlayer } from "../util/entity.js";
import { hasDamageGuard, setDamageGuard } from "../util/guards.js";
import { getCurrentTick } from "./tickScheduler.js";
import { logDebug, logError } from "../util/log.js";

/**
 * Handles incoming before-damage event (transformations, damage reduction, cancellation)
 * @param {import("@minecraft/server").EntityHurtBeforeEvent} event
 */
export function handleBeforeHurt(event) {
  const victim = event.hurtEntity;
  const currentTick = getCurrentTick();

  if (!isEntityValid(victim) || !isEntityAlive(victim)) return;

  // 1. Guard against internally generated recursive damage
  if (hasDamageGuard(victim.id, DAMAGE_GUARDS.REFLECT, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.BERSERK_SELF, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.CHOKE, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.NINJA_REFLECT, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.ENDER_REFLECT, currentTick)) {
    return;
  }

  const attacker = event.damageSource?.damagingEntity;

  // 2. Outgoing Damage from an Infernal Mob (Attacker is Infernal)
  if (attacker && isEntityValid(attacker)) {
    const attackerState = getInfernalState(attacker);
    if (attackerState && attackerState.isInfernal) {
      processOutgoingBeforeHurt(event, attacker, victim, attackerState, currentTick);
    }
  }

  // 3. Incoming Damage to an Infernal Mob (Victim is Infernal)
  const victimState = getInfernalState(victim);
  if (victimState && victimState.isInfernal) {
    processIncomingBeforeHurt(event, victim, attacker, victimState, currentTick);
  }
}

/**
 * Process outgoing damage before it is applied
 */
function processOutgoingBeforeHurt(event, attacker, victim, state, tick) {
  const context = {
    attacker,
    victim,
    source: event.damageSource,
    damage: event.damage,
    originalDamage: event.damage,
    tick
  };

  const modifiers = state.modifiers ?? [];
  for (const modId of modifiers) {
    const handler = getModifierHandler(modId);
    if (handler && typeof handler.onOutgoingDamageBefore === "function") {
      try {
        handler.onOutgoingDamageBefore(context);
      } catch (error) {
        logError("damagePipeline", `Error in ${modId}.onOutgoingDamageBefore`, error);
      }
    }
  }

  event.damage = Math.max(0, context.damage);
}

/**
 * Process incoming damage before it is applied
 */
function processIncomingBeforeHurt(event, victim, attacker, state, tick) {
  const context = {
    victim,
    attacker,
    source: event.damageSource,
    damage: event.damage,
    originalDamage: event.damage,
    cancel: false,
    tick
  };

  const modifiers = state.modifiers ?? [];
  for (const modId of modifiers) {
    const handler = getModifierHandler(modId);
    if (handler && typeof handler.onIncomingDamageBefore === "function") {
      try {
        handler.onIncomingDamageBefore(context);
        if (context.cancel) {
          break;
        }
      } catch (error) {
        logError("damagePipeline", `Error in ${modId}.onIncomingDamageBefore`, error);
      }
    }
  }

  if (context.cancel) {
    event.cancel = true;
    return;
  }

  event.damage = Math.max(0, context.damage);
}

/**
 * Handles after-damage events (reactions, contact effects, lifesteal, 1UP)
 * @param {import("@minecraft/server").EntityHurtAfterEvent} event
 */
export function handleAfterHurt(event) {
  const victim = event.hurtEntity;
  const currentTick = getCurrentTick();

  if (!isEntityValid(victim)) return;

  // Guard check
  if (hasDamageGuard(victim.id, DAMAGE_GUARDS.REFLECT, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.BERSERK_SELF, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.CHOKE, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.NINJA_REFLECT, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.ENDER_REFLECT, currentTick)) {
    return;
  }

  const attacker = event.damageSource?.damagingEntity;

  // 1. Outgoing reactions (Attacker is Infernal)
  if (attacker && isEntityValid(attacker)) {
    const attackerState = getInfernalState(attacker);
    if (attackerState && attackerState.isInfernal) {
      processOutgoingAfterHurt(event, attacker, victim, attackerState, currentTick);
    }
  }

  // 2. Incoming reactions (Victim is Infernal)
  const victimState = getInfernalState(victim);
  if (victimState && victimState.isInfernal) {
    processIncomingAfterHurt(event, victim, attacker, victimState, currentTick);
  }
}

/**
 * Process outgoing reactions after damage is confirmed
 */
function processOutgoingAfterHurt(event, attacker, victim, state, tick) {
  const context = {
    attacker,
    victim,
    source: event.damageSource,
    damage: event.damage,
    tick
  };

  const modifiers = state.modifiers ?? [];
  for (const modId of modifiers) {
    const handler = getModifierHandler(modId);
    if (handler && typeof handler.onOutgoingDamageAfter === "function") {
      try {
        handler.onOutgoingDamageAfter(context);
      } catch (error) {
        logError("damagePipeline", `Error in ${modId}.onOutgoingDamageAfter`, error);
      }
    }
  }
}

/**
 * Process incoming reactions after damage is confirmed
 */
function processIncomingAfterHurt(event, victim, attacker, state, tick) {
  const context = {
    victim,
    attacker,
    source: event.damageSource,
    damage: event.damage,
    tick
  };

  const modifiers = state.modifiers ?? [];
  for (const modId of modifiers) {
    const handler = getModifierHandler(modId);
    if (handler && typeof handler.onIncomingDamageAfter === "function") {
      try {
        handler.onIncomingDamageAfter(context);
      } catch (error) {
        logError("damagePipeline", `Error in ${modId}.onIncomingDamageAfter`, error);
      }
    }
  }
}
