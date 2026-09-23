/**
 * Infernal Mobs Bedrock - Player Preferences Storage
 * Persists individual player preferences (e.g. HUD visibility)
 */

import { PROPERTIES } from "../core/constants.js";
import { isEntityValid } from "../util/entity.js";
import { logError } from "../util/log.js";

const DEFAULT_PLAYER_PREFS = Object.freeze({
  hudEnabled: true
});

export function getPlayerPreferences(player) {
  if (!isEntityValid(player)) return { ...DEFAULT_PLAYER_PREFS };
  try {
    const raw = player.getDynamicProperty(PROPERTIES.playerPrefs);
    if (typeof raw === "string" && raw) {
      return { ...DEFAULT_PLAYER_PREFS, ...JSON.parse(raw) };
    }
  } catch (error) {
    logError("playerPrefs", `Failed reading preferences for ${player?.name}`, error);
  }
  return { ...DEFAULT_PLAYER_PREFS };
}

export function setPlayerPreferences(player, prefs) {
  if (!isEntityValid(player)) return false;
  try {
    player.setDynamicProperty(PROPERTIES.playerPrefs, JSON.stringify(prefs));
    return true;
  } catch (error) {
    logError("playerPrefs", `Failed setting preferences for ${player?.name}`, error);
    return false;
  }
}

export function setPlayerHudEnabled(player, enabled) {
  const prefs = getPlayerPreferences(player);
  prefs.hudEnabled = Boolean(enabled);
  return setPlayerPreferences(player, prefs);
}

export function isPlayerHudEnabled(player) {
  const prefs = getPlayerPreferences(player);
  return prefs.hudEnabled !== false;
}
