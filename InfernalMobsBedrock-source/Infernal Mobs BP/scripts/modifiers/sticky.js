/**
 * Infernal Mobs Bedrock - Sticky Modifier
 * Disarms player's mainhand item when hit (15s cooldown)
 * Banned on Creepers. Incompatible with Storm.
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkCooldownAndMark } from "../core/infernalManager.js";
import { getMainHandItem, setMainHandItem } from "../systems/equipmentSystem.js";
import { isCreativePlayer, isEntityValid, isPlayer } from "../util/entity.js";
import { logDebug, logError } from "../util/log.js";

const COOLDOWN_TICKS = 300; // 15 seconds

export const StickyHandler = {
  id: "sticky",

  onIncomingDamageAfter(context) {
    const victim = context.victim;
    const attacker = context.attacker;

    if (!isEntityValid(victim) || !isEntityValid(attacker)) return;
    if (!isPlayer(attacker) || isCreativePlayer(attacker)) return;

    if (!checkCooldownAndMark(victim, "sticky", COOLDOWN_TICKS)) {
      return;
    }

    const item = getMainHandItem(attacker);
    if (!item) return;

    // Transactional disarm: clear hand and spawn item in world
    setMainHandItem(attacker, undefined);
    try {
      attacker.dimension.spawnItem(item, attacker.location);

      victim.dimension.playSound("mob.slime.attack", victim.location, {
        volume: 1.0,
        pitch: 1.0
      });

      logDebug("sticky", `Disarmed ${attacker.name}'s ${item.typeId}`);
    } catch (error) {
      // Rollback: restore item to prevent deletion on error
      setMainHandItem(attacker, item);
      logError("sticky", "Failed spawning disarmed item, rolling back", error);
    }
  }
};

registerModifierHandler("sticky", StickyHandler);
