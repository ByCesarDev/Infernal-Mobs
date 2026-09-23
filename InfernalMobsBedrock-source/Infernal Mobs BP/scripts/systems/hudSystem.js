/**
 * Infernal Mobs Bedrock - HUD System
 * Renders individual 3-line actionbar display with 3s retention and segmented health bar
 */

import { world } from "@minecraft/server";
import { ensureStableName, formatFullName, formatModifierRows, formatShortName } from "./namingSystem.js";
import { getInfernalState } from "../storage/entityState.js";
import { isPlayerHudEnabled } from "../storage/playerPreferences.js";
import { getConfig } from "../storage/worldConfig.js";
import { getCurrentTick } from "../core/tickScheduler.js";
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
 * Raycasts from player's eyes to locate targeted infernal mob
 */
function findTargetedInfernal(player) {
  if (!isEntityValid(player)) return null;

  try {
    const hits = player.getEntitiesFromViewDirection({
      maxDistance: 20
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

  return null;
}

/**
 * Periodic HUD tick runner (called 2-4 times per second via tickScheduler)
 */
export function tickHudSystem(currentTick) {
  const config = getConfig();
  if (!config.hudEnabled) return;

  const players = world.getAllPlayers();

  for (const player of players) {
    if (!isEntityValid(player) || !isPlayerHudEnabled(player)) continue;

    let session = playerHudSessions.get(player.id);
    const targetData = findTargetedInfernal(player);

    if (targetData) {
      if (session && session.infernalId === targetData.entity.id) {
        // Same target: extend expiration without wiping rendered cache
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
    renderHudForPlayer(player, session);
  }
}

function renderHudForPlayer(player, session) {
  const entity = session.infernalEntity;
  const state = getInfernalState(entity);
  if (!state || !state.isInfernal) {
    playerHudSessions.delete(player.id);
    return;
  }

  ensureStableName(state, entity);

  const config = getConfig();
  const health = safeGetHealth(entity);
  const currentHp = health ? health.currentValue : (state.infernalMaxHealth ?? 20);
  const maxHp = state.infernalMaxHealth ?? (health?.effectiveMax ?? 20);

  // Line 1: Title & Full Name
  const fullName = formatFullName(state);

  // Lines 2+: Modifier names grouped into 5s
  const modRows = formatModifierRows(state.modifiers);
  const modifierLines = modRows.map((row) => `§7${row}`);

  const lines = [fullName, ...modifierLines];

  // Optional Health Bar (respects disableHealthBar config)
  if (!config.disableHealthBar) {
    const healthBar = buildHealthBar(currentHp, maxHp, 10);
    lines.push(healthBar);
  }

  const combinedText = lines.join("\n");

  if (session.lastRenderedText !== combinedText) {
    session.lastRenderedText = combinedText;
    try {
      player.onScreenDisplay.setActionBar(combinedText);
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
