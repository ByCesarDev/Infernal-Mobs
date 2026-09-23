/**
 * Infernal Mobs Bedrock - Unyielding Modifier (Interface / Stub)
 * Blocks hostile knockback upon taking damage
 * Reserved for integration with Cesar's custom knockback method
 */

import { registerModifierHandler } from "../data/modifierDefinitions.js";

export const UnyieldingHandler = {
  id: "unyielding",

  onIncomingDamageBefore(context) {
    // Stub ready for Cesar's custom knockback cancellation technique
  },

  onIncomingDamageAfter(context) {
    // Post-damage hook ready
  }
};

registerModifierHandler("unyielding", UnyieldingHandler);
