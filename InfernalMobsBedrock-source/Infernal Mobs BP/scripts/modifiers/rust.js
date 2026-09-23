/**
 * Infernal Mobs Bedrock - Rust Modifier
 * Incoming hit from non-creative player: damages held weapon by 4 points
 * Outgoing hit on player: damages 1 piece of armor by max(1, floor(0.75 * damage))
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { damageFirstArmorPiece, damageMainHandItem } from "../systems/equipmentSystem.js";
import { isCreativePlayer, isEntityValid, isPlayer } from "../util/entity.js";

export const RustHandler = {
  id: "rust",

  onIncomingDamageAfter(context) {
    const attacker = context.attacker;
    if (isEntityValid(attacker) && isPlayer(attacker) && !isCreativePlayer(attacker)) {
      damageMainHandItem(attacker, 4);
    }
  },

  onOutgoingDamageAfter(context) {
    const victim = context.victim;
    const damage = context.damage;
    if (isEntityValid(victim) && isPlayer(victim) && damage > 0) {
      const armorDamage = Math.max(1, Math.floor(damage * 0.75));
      damageFirstArmorPiece(victim, armorDamage);
    }
  }
};

registerModifierHandler("rust", RustHandler);
