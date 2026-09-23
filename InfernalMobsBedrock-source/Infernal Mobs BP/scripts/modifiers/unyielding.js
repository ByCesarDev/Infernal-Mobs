/**
 * Infernal Mobs Bedrock - Unyielding Modifier
 * Cancels hostile knockback while preserving the mob's pre-damage inertial movement
 */

import { system } from "@minecraft/server";
import { registerModifierHandler } from "../data/modifierDefinitions.js";
import { isEntityAlive, isEntityValid } from "../util/entity.js";

const pendingKnockback = new Map();

function rememberVelocity(entity, tick) {
  if (!isEntityValid(entity)) return;

  const existing = pendingKnockback.get(entity.id);

  // Preserve pre-damage velocity before the first hit of the tick
  if (existing?.tick === tick) return;

  try {
    pendingKnockback.set(entity.id, {
      tick,
      velocity: entity.getVelocity(),
      correctionScheduled: false
    });
  } catch {}
}

function cancelAppliedKnockback(entity, tick) {
  if (!isEntityValid(entity) || !isEntityAlive(entity)) return;

  const snapshot = pendingKnockback.get(entity.id);
  if (!snapshot || snapshot.tick !== tick) return;
  if (snapshot.correctionScheduled) return;

  snapshot.correctionScheduled = true;

  system.run(() => {
    try {
      if (!isEntityValid(entity) || !isEntityAlive(entity)) return;

      const after = entity.getVelocity();
      const before = snapshot.velocity;

      const deltaX = after.x - before.x;
      const deltaZ = after.z - before.z;

      // Knockback generally increases Y upward. Don't counter gravity falling downward.
      const deltaY = Math.max(0, after.y - before.y);

      const epsilon = 0.001;

      if (
        Math.abs(deltaX) > epsilon ||
        Math.abs(deltaY) > epsilon ||
        Math.abs(deltaZ) > epsilon
      ) {
        entity.applyImpulse({
          x: -deltaX,
          y: -deltaY,
          z: -deltaZ
        });
      }
    } catch {
      // Ignore entities unloaded between events
    } finally {
      pendingKnockback.delete(entity.id);
    }
  });
}

/**
 * Clears pending knockback snapshot for an entity when it dies or is removed
 * @param {string} entityId
 */
export function clearUnyieldingState(entityId) {
  pendingKnockback.delete(entityId);
}

/**
 * Prunes orphaned snapshots older than maxAgeTicks (e.g. cancelled hits by Ender/Ninja)
 * @param {number} currentTick
 * @param {number} [maxAgeTicks]
 */
export function pruneUnyieldingSnapshots(currentTick, maxAgeTicks = 5) {
  for (const [id, snapshot] of pendingKnockback.entries()) {
    if (currentTick - snapshot.tick > maxAgeTicks) {
      pendingKnockback.delete(id);
    }
  }
}

export const UnyieldingHandler = {
  id: "unyielding",

  onIncomingDamageBefore(context) {
    rememberVelocity(context.victim, context.tick);
  },

  onIncomingDamageAfter(context) {
    cancelAppliedKnockback(context.victim, context.tick);
  }
};

registerModifierHandler("unyielding", UnyieldingHandler);
