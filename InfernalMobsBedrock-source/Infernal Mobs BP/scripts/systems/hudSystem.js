/**
 * Infernal Mobs Bedrock - HUD System
 * Renders individual 3-line actionbar display with 3s retention and segmented health bar
 */

import { world } from "@minecraft/server";
import { buildRawHudMessage, ensureStableName, formatFullName, formatModifierRows, formatShortName } from "./namingSystem.js";
import { getInfernalState } from "../storage/entityState.js";
import { isPlayerHudEnabled } from "../storage/playerPreferences.js";
import { getConfig } from "../storage/worldConfig.js";
import { getCurrentTick } from "../core/tickScheduler.js";
import { getAllActiveInfernals } from "../core/infernalManager.js";
import { hasLineOfSight } from "./lineOfSight.js";
import { applyInfernalHealth } from "./healthSystem.js";
import { isEntityAlive, isEntityValid, safeGetHealth } from "../util/entity.js";

/**
 * Tracks active HUD state per player:
 * Key: player.id
 * Value: {
 *   infernalId: string,
 *   infernalEntity: Entity,
 *   expireTick: number,
 *   lastRenderedText: string
 * }
 */
const playerHudSessions = new Map();

/**
 * Builds a visual segmented health bar:
 * Example: ████████░░ 119/130 ❤
 */
export function buildHealthBar(current, max, segments = 10) {
  const safeMax = Math.max(1, max);
  const safeCurrent = Math.max(0, Math.min(safeMax, current));
  const fraction = safeCurrent / safeMax;
  const filled = Math.round(fraction * segments);
  const empty = segments - filled;

  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `§c${bar} §f${Math.ceil(safeCurrent)}§7/§f${Math.ceil(safeMax)} ❤`;
}

/**
 * Locates the infernal mob targeted by the player:
 * Pass 1: Strict view direction raycast up to 24 blocks
 * Pass 2: Forgiving angular cone check (~1.2m radius around mob center, matching Java AABB.inflate(1.0))
 */
function findTargetedInfernal(player) {
  if (!isEntityValid(player)) return null;

  // Pass 1: Direct raycast along view direction
  try {
    const hits = player.getEntitiesFromViewDirection({
      maxDistance: 24
    });

    for (const hit of hits) {
      const entity = hit.entity;
      if (!isEntityValid(entity) || !isEntityAlive(entity)) continue;
      if (entity.id === player.id) continue;

      const state = getInfernalState(entity);
      if (state && state.isInfernal) {
        return { entity, state };
      }
    }
  } catch {}

  // Pass 2: Forgiving angle cone (allows looking at thin hitboxes or through foliage)
  try {
    const headLoc = player.getHeadLocation();
    const viewDir = player.getViewDirection();
    const activeRecords = getAllActiveInfernals();
    const dimId = player.dimension.id;

    let bestCandidate = null;
    let bestDot = -1;

    for (const record of activeRecords) {
      const mob = record.entity;
      if (!isEntityValid(mob) || !isEntityAlive(mob)) continue;
      if (mob.dimension.id !== dimId) continue;

      const mobLoc = mob.location;
      const dx = mobLoc.x - headLoc.x;
      const dy = (mobLoc.y + 0.9) - headLoc.y;
      const dz = mobLoc.z - headLoc.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      // Within 24 blocks (576 = 24^2) and not inside player
      if (distSq > 576 || distSq < 0.25) continue;

      const dist = Math.sqrt(distSq);
      const dot = (viewDir.x * dx + viewDir.y * dy + viewDir.z * dz) / dist;

      // Angle tolerance: ~1.2 blocks radius around mob center
      const sinTolerance = Math.min(0.5, 1.2 / dist);
      const minDot = Math.sqrt(1 - sinTolerance * sinTolerance);

      if (dot >= minDot && dot > bestDot) {
        if (hasLineOfSight(player, mob)) {
          bestDot = dot;
          bestCandidate = { entity: mob, state: record.state };
        }
      }
    }

    if (bestCandidate) {
      return bestCandidate;
    }
  } catch {}

  return null;
}

/**
 * Periodic HUD tick runner (called 4 times per second via tickScheduler)
 */
export function tickHudSystem(currentTick) {
  const config = getConfig();
  if (!config.hudEnabled) return;

  const players = world.getAllPlayers();

  for (const player of players) {
    if (!isEntityValid(player) || !isPlayerHudEnabled(player)) continue;

    let session = playerHudSessions.get(player.id);
    const targetData = findTargetedInfernal(player);
    const isActivelyTargeting = Boolean(targetData);

    if (targetData) {
      if (session && session.infernalId === targetData.entity.id) {
        // Same target: extend expiration
        session.expireTick = currentTick + 60;
      } else {
        // New target: create new session
        session = {
          infernalId: targetData.entity.id,
          infernalEntity: targetData.entity,
          expireTick: currentTick + 60,
          lastRenderedText: ""
        };
        playerHudSessions.set(player.id, session);
      }
    }

    if (!session) continue;

    // Check if retention expired or entity died
    if (currentTick > session.expireTick || !isEntityValid(session.infernalEntity) || !isEntityAlive(session.infernalEntity)) {
      playerHudSessions.delete(player.id);
      continue;
    }

    // Render HUD
    renderHudForPlayer(player, session, isActivelyTargeting);
  }
}

function renderHudForPlayer(player, session, isActivelyTargeting = false) {
  const entity = session.infernalEntity;
  const state = getInfernalState(entity);
  if (!state || !state.isInfernal) {
    playerHudSessions.delete(player.id);
    return;
  }

  ensureStableName(state, entity);

  const config = getConfig();
  const health = safeGetHealth(entity);

  if (health && state.infernalMaxHealth && health.effectiveMax < state.infernalMaxHealth) {
    applyInfernalHealth(entity, state.infernalMaxHealth, state.baseMaxHealth ?? 20, state.currentHealth ?? state.infernalMaxHealth);
  }

  const maxHp = state.infernalMaxHealth ?? (health?.effectiveMax ?? 20);
  const currentHp = (health && health.effectiveMax >= maxHp)
    ? health.currentValue
    : (state.currentHealth ?? maxHp);

  // Build localized RawMessage (automatically translated by each player's client)
  const rawHudMessage = buildRawHudMessage(state, currentHp, maxHp, config, buildHealthBar);
  const jsonSignature = JSON.stringify(rawHudMessage);

  // In Bedrock, actionbar messages fade out after ~2-3 seconds unless renewed.
  // When the player is actively looking at the mob, we keep it renewed every tick interval.
  // When looking away (retention period), we only update if content/health changed.
  if (isActivelyTargeting || session.lastRenderedText !== jsonSignature) {
    session.lastRenderedText = jsonSignature;
    try {
      player.onScreenDisplay.setActionBar(rawHudMessage);
    } catch {}
  }

  // Update entity nameTag with short name if names enabled, or clear if disabled
  if (isEntityValid(entity)) {
    if (config.namesEnabled) {
      const shortName = formatShortName(state);
      if (entity.nameTag !== shortName) {
        entity.nameTag = shortName;
      }
    } else if (entity.nameTag) {
      entity.nameTag = "";
    }
  }
}
