/**
 * Infernal Mobs Bedrock - Choke Modifier
 * Progressively drains target air; deals 2 drowning damage upon exhaustion
 * Dual backend: native airSupply if writeable; stable simulated counter fallback
 * Hitting the infernal recovers 60 units of air
 */

import { DAMAGE_GUARDS } from "../core/constants.js";
import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { checkAirSupplyCapability } from "../core/capabilityDetector.js";
import { hasLineOfSight } from "../systems/lineOfSight.js";
import { isCreativePlayer, isEntityAlive, isEntityValid, isPlayer } from "../util/entity.js";
import { setDamageGuard } from "../util/guards.js";

function drainAir(mob, record, target, tick) {
  if (!target || !isEntityValid(target) || !isEntityAlive(target)) return;
  if (isCreativePlayer(target)) return;

  if (checkAirSupplyCapability(target)) {
    // Native airSupply backend
    try {
      const breathable = target.getComponent("minecraft:breathable");
      if (breathable && typeof breathable.airSupply === "number") {
        let air = breathable.airSupply - 1;
        if (air < -19) {
          air = 0;
          setDamageGuard(target.id, DAMAGE_GUARDS.CHOKE, tick);
          target.applyDamage(2.0, { cause: "drowning" });
        }
        breathable.airSupply = air;
        return;
      }
    } catch {}
  }

  // Stable simulated fallback backend
  if (record.simulatedAir === undefined) {
    record.simulatedAir = 300;
  }

  record.simulatedAir--;
  if (record.simulatedAir < -19) {
    record.simulatedAir = 0;
    setDamageGuard(target.id, DAMAGE_GUARDS.CHOKE, tick);
    try {
      target.applyDamage(2.0, { cause: "drowning" });
      target.dimension.spawnParticle("minecraft:bubble_column_bubble", {
        x: target.location.x,
        y: target.location.y + 1.2,
        z: target.location.z
      });
    } catch {}
  }
}

function recoverAir(mob, record, target) {
  if (!target || !isEntityValid(target)) return;

  if (checkAirSupplyCapability(target)) {
    try {
      const breathable = target.getComponent("minecraft:breathable");
      if (breathable && typeof breathable.airSupply === "number") {
        breathable.airSupply = Math.min(300, breathable.airSupply + 60);
        return;
      }
    } catch {}
  }

  // Simulated recovery
  if (record && record.simulatedAir !== undefined) {
    record.simulatedAir = Math.min(300, record.simulatedAir + 60);
  }
}

export const ChokeHandler = {
  id: "choke",

  onIncomingDamageAfter(context) {
    const victim = context.victim;
    const attacker = context.attacker;
    // When attacker hits the choking mob, recover 60 air units (Java parity)
    if (attacker && isEntityValid(attacker)) {
      const record = context.record ?? null;
      recoverAir(victim, record, attacker);
    }
  },

  onUpdate(mob, record, currentTick, target, isSteady) {
    if (!isSteady || !target || !hasLineOfSight(mob, target)) return;
    drainAir(mob, record, target, currentTick);
  },

  onDeath(mob, record) {
    if (record) {
      record.simulatedAir = 300;
    }
  }
};

registerModifierHandler("choke", ChokeHandler);
