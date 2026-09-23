/**
 * Infernal Mobs Bedrock - Storm Modifier
 * Summons a real lightning bolt on sky-exposed targets every 25s
 * Incompatible with Sticky
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { hasLineOfSight, isExposedToSky } from "../systems/lineOfSight.js";
import { isEntityAlive, isEntityValid, isPlayer } from "../util/entity.js";
import { distance } from "../util/vector.js";

const COOLDOWN_TICKS = 500; // 25 seconds
const MIN_DISTANCE = 3.0;

export const StormHandler = {
  id: "storm",

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (!isSteady || !target || !isEntityValid(target) || !isEntityAlive(target) || !isPlayer(target)) return;

    // Must not be riding a vehicle (Java parity: target.getVehicle() != null return)
    try {
      if (target.getComponent("minecraft:riding")) return;
    } catch {}

    const dist = distance(mob.location, target.location);
    if (dist <= MIN_DISTANCE) return;

    if (!hasLineOfSight(mob, target)) return;
    if (!isExposedToSky(target)) return;

    if (!checkCooldownAndMark(mob, "storm", COOLDOWN_TICKS)) {
      return;
    }

    try {
      // Spawn real lightning bolt at target location
      target.dimension.spawnEntity("minecraft:lightning_bolt", target.location);
    } catch {}
  }
};

registerModifierHandler("storm", StormHandler);
