/**
 * Infernal Mobs Bedrock - Gravity Modifier
 * Pushes the target player AWAY from the infernal mob every 5s (horizontal ~0.8, vertical <= 0.4)
 * Incompatible with Webber
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { hasLineOfSight } from "../systems/lineOfSight.js";
import { isEntityAlive, isEntityValid, isPlayer } from "../util/entity.js";
import { normalizeHorizontal } from "../util/vector.js";

const COOLDOWN_TICKS = 100; // 5 seconds

export const GravityHandler = {
  id: "gravity",

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (!isSteady || !target || !isEntityValid(target) || !isEntityAlive(target) || !isPlayer(target)) return;

    if (!hasLineOfSight(mob, target)) return;

    if (!checkCooldownAndMark(mob, "gravity", COOLDOWN_TICKS)) {
      return;
    }

    const mobLoc = mob.location;
    const targetLoc = target.location;

    // Vector pointing away from the infernal towards the target player
    const awayVec = normalizeHorizontal({
      x: targetLoc.x - mobLoc.x,
      z: targetLoc.z - mobLoc.z
    });

    try {
      // Horizontal knockback power ~0.8, vertical <= 0.4
      target.applyKnockback(awayVec.x, awayVec.z, 0.8, 0.4);

      mob.dimension.playSound("mob.irongolem.hit", mob.location, {
        volume: 1.0,
        pitch: 1.0
      });
    } catch {}
  }
};

registerModifierHandler("gravity", GravityHandler);
