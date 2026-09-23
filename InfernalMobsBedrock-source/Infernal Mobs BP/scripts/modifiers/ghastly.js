/**
 * Infernal Mobs Bedrock - Ghastly Modifier
 * Fires an explosive fireball at targets between 3 and 12 blocks away (6s cooldown)
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { hasLineOfSight } from "../systems/lineOfSight.js";
import { shootFireball } from "../systems/projectileSystem.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";
import { distance } from "../util/vector.js";

const COOLDOWN_TICKS = 120; // 6 seconds
const MIN_DISTANCE = 3.0;
const MAX_DISTANCE = 12.0;

export const GhastlyHandler = {
  id: "ghastly",

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (!isSteady || !target || !isEntityValid(target) || !isEntityAlive(target)) return;

    const dist = distance(mob.location, target.location);
    if (dist < MIN_DISTANCE || dist > MAX_DISTANCE) return;

    if (!hasLineOfSight(mob, target)) return;

    if (!checkCooldownAndMark(mob, "ghastly", COOLDOWN_TICKS)) {
      return;
    }

    shootFireball(mob, target);
  }
};

registerModifierHandler("ghastly", GhastlyHandler);
