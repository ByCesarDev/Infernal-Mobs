/**
 * Infernal Mobs Bedrock - Central Damage Pipeline
 * Centralizes incoming and outgoing combat handling with recursion guards
 */

import { system } from "@minecraft/server";
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
 * Process order strictly matches Java NeoForge:
 * 1. Victim incoming handlers (Bulwark, Ender, Ninja)
 * 2. If not cancelled: Attacker outgoing handlers (Berserk, etc.)
 * 3. Deferred execution for mutations (teleport, damage, sound) to avoid privilege errors
 * @param {import("@minecraft/server").EntityHurtBeforeEvent} event
 */
export function handleBeforeHurt(event) {
  const victim = event.hurtEntity;
  const currentTick = getCurrentTick();

  if (!isEntityValid(victim) || !isEntityAlive(victim)) return;

  // 1. Guard against cosmetic lightning damage (/make command)
  if (hasDamageGuard(victim.id, DAMAGE_GUARDS.COSMETIC_LIGHTNING, currentTick)) {
    event.cancel = true;
    try {
      victim.extinguishFire(false);
    } catch {}
    return;
  }

  // Guard against internally generated recursive damage
  if (hasDamageGuard(victim.id, DAMAGE_GUARDS.REFLECT, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.BERSERK_SELF, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.CHOKE, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.NINJA_REFLECT, currentTick) ||
      hasDamageGuard(victim.id, DAMAGE_GUARDS.ENDER_REFLECT, currentTick)) {
    return;
  }

  const attacker = event.damageSource?.damagingEntity;
  const pendingActions = [];

  // 2. Incoming Damage to an Infernal Mob (Victim is Infernal) - JAVA ORDER FIRST
  const victimState = getInfernalState(victim);
  if (victimState && victimState.isInfernal) {
    processIncomingBeforeHurt(event, victim, attacker, victimState, currentTick, pendingActions);
    if (event.cancel) {
      // Defensive modifier (Ender, Ninja) negated the hit: execute deferred actions and abort attacker processing
      if (pendingActions.length > 0) {
        system.run(() => {
          for (const action of pendingActions) {
            try { action(); } catch (err) { logError("damagePipeline", "Error in pending action", err); }
          }
        });
      }
      return;
    }
  }

  // 3. Outgoing Damage from an Infernal Mob (Attacker is Infernal) - JAVA ORDER SECOND
  if (attacker && isEntityValid(attacker)) {
    const attackerState = getInfernalState(attacker);
    if (attackerState && attackerState.isInfernal) {
      processOutgoingBeforeHurt(event, attacker, victim, attackerState, currentTick, pendingActions);
    }
  }

  // 4. Dispatch any queued mutations outside restricted execution mode
  if (pendingActions.length > 0) {
    system.run(() => {
      for (const action of pendingActions) {
        try { action(); } catch (err) { logError("damagePipeline", "Error in pending action", err); }
      }
    });
  }
}

/**
 * Process outgoing damage before it is applied
 */
function processOutgoingBeforeHurt(event, attacker, victim, state, tick, pendingActions) {
  const context = {
    attacker,
    victim,
    source: event.damageSource,
    damage: event.damage,
    originalDamage: event.damage,
    pendingActions,
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
function processIncomingBeforeHurt(event, victim, attacker, state, tick, pendingActions) {
  const context = {
    victim,
    attacker,
    source: event.damageSource,
    damage: event.damage,
    originalDamage: event.damage,
    cancel: false,
    pendingActions,
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
    record: getTrackedInfernal(victim.id),
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
