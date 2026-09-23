/**
 * Infernal Mobs Bedrock - Sprint Modifier
 * Alternates sprinting bursts every 5s towards target (does not use permanent Speed effect)
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";
import { normalizeHorizontal } from "../util/vector.js";

const SPRINT_CYCLE_TICKS = 100; // 5 seconds

export const SprintHandler = {
  id: "sprint",

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (!isEntityValid(mob) || !isEntityAlive(mob)) return;

    if (!target || !isEntityValid(target) || !isEntityAlive(target)) {
      record.sprintingState = false;
      return;
    }

    // Toggle sprinting state every 5 seconds
    if (currentTick - record.lastSprintToggleTick >= SPRINT_CYCLE_TICKS) {
      record.lastSprintToggleTick = currentTick;
      record.sprintingState = !record.sprintingState;
    }

    // While sprinting state is active, apply moderate acceleration toward target every 10 ticks
    if (record.sprintingState && currentTick % 10 === 0) {
      try {
        const mobLoc = mob.location;
        const targetLoc = target.location;
        const dir = normalizeHorizontal({
          x: targetLoc.x - mobLoc.x,
          z: targetLoc.z - mobLoc.z
        });

        // Small horizontal impulse that preserves vanilla gravity and jump behavior
        mob.applyImpulse({
          x: dir.x * 0.2,
          y: 0.05,
          z: dir.z * 0.2
        });
      } catch {}
    }
  }
};

registerModifierHandler("sprint", SprintHandler);
