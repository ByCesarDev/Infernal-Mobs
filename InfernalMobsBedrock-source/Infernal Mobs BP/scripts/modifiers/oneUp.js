/**
 * Infernal Mobs Bedrock - 1UP Modifier
 * Heals the mob to 100% health once when health drops below 25%
 * Does not resurrect, clone or duplicate the entity
 * Banned on Creepers
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { getInfernalState, setInfernalState } from "../storage/entityState.js";
import { isEntityAlive, isEntityValid, safeGetHealth } from "../util/entity.js";
import { logInfo } from "../util/log.js";

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

      logInfo("1up", `1UP triggered on mob ${mob.id} (${mob.typeId}), restored to full health`);
    } catch {}
  }
}

export const OneUpHandler = {
  id: "1up",

  onIncomingDamageAfter(context) {
    checkAndTrigger1UP(context.victim);
  },

  onUpdate(mob) {
    checkAndTrigger1UP(mob);
  }
};

registerModifierHandler("1up", OneUpHandler);
