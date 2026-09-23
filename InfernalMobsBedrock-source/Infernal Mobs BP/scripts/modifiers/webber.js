/**
 * Infernal Mobs Bedrock - Webber Modifier
 * Places a permanent cobweb at target feet or below feet every 15s
 * Incompatible with Gravity and Blastoff
 */

import { BlockPermutation } from "@minecraft/server";
import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { hasLineOfSight } from "../systems/lineOfSight.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

const COOLDOWN_TICKS = 300; // 15 seconds

function triggerWebber(mob, target) {
  if (!isEntityValid(mob) || !isEntityValid(target) || !isEntityAlive(target)) return;

  if (!hasLineOfSight(mob, target)) return;

  if (!checkCooldownAndMark(mob, "webber", COOLDOWN_TICKS)) {
    return;
  }

  const dim = target.dimension;
  const loc = target.location;
  const bx = Math.floor(loc.x);
  const by = Math.floor(loc.y);
  const bz = Math.floor(loc.z);

  try {
    const webPermutation = BlockPermutation.resolve("minecraft:web");
    const blockBelow = dim.getBlock({ x: bx, y: by - 1, z: bz });
    const blockFeet = dim.getBlock({ x: bx, y: by, z: bz });

    if (blockBelow && blockBelow.isAir) {
      blockBelow.setPermutation(webPermutation);
    } else if (blockFeet && blockFeet.isAir) {
      blockFeet.setPermutation(webPermutation);
    } else {
      return;
    }

    mob.dimension.playSound("mob.spider.say", mob.location, {
      volume: 1.0,
      pitch: 1.0
    });
  } catch {}
}

export const WebberHandler = {
  id: "webber",

  onIncomingDamageAfter(context) {
    if (context.attacker && context.attacker.id !== context.victim.id) {
      triggerWebber(context.victim, context.attacker);
    }
  },

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (isSteady && target) {
      triggerWebber(mob, target);
    }
  }
};

registerModifierHandler("webber", WebberHandler);
