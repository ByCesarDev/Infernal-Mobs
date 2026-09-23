/**
 * Infernal Mobs Bedrock - Bulwark Modifier
 * Halves all incoming damage (minimum 1)
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";

export const BulwarkHandler = {
  id: "bulwark",

  /**
   * Pre-damage hook: alters incoming damage directly
   */
  onIncomingDamageBefore(context) {
    if (context.damage > 0) {
      context.damage = Math.max(context.damage / 2, 1);
    }
  }
};

registerModifierHandler("bulwark", BulwarkHandler);
