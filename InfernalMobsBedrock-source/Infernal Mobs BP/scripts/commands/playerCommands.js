/**
 * Infernal Mobs Bedrock - Public Player Commands
 * Permission level: Any (0), cheatsRequired: false
 */

import { CustomCommandStatus } from "@minecraft/server";
import { MODIFIER_IDS } from "../data/incompatibilities.js";
import { MODIFIER_METADATA } from "../data/modifierNames.js";
import { formatFullName, formatModifierRows } from "../systems/namingSystem.js";
import { getInfernalState } from "../storage/entityState.js";
import { isPlayerHudEnabled, setPlayerHudEnabled } from "../storage/playerPreferences.js";
import { isEntityAlive, isEntityValid, isPlayer, safeGetHealth } from "../util/entity.js";

/**
 * Handles /infernalmobs:help
 */
export function handleHelpCommand(origin) {
  const isOp = origin.sourceEntity ? origin.sourceEntity.isOp?.() : false;

  let helpText = "§6=== Infernal Mobs Commands ===§r\n" +
    "§e/infernalmobs:help§7 - Show this help menu\n" +
    "§e/infernalmobs:info§7 - Inspect the infernal mob you are looking at\n" +
    "§e/infernalmobs:modifier <id>§7 - Details on a specific modifier\n" +
    "§e/infernalmobs:hud <on|off>§7 - Toggle your personal combat HUD";

  if (isOp) {
    helpText += "\n§c[Admin Commands]§r\n" +
      "§e/infernalmobs:config§7 - View world configuration\n" +
      "§e/infernalmobs:set <opt> <val>§7 - Change config value\n" +
      "§e/infernalmobs:modifierconfig <id> <on|off>§7 - Toggle modifier\n" +
      "§e/infernalmobs:make [tier]§7 - Convert pointed mob to infernal\n" +
      "§e/infernalmobs:remove§7 - Remove infernal status from pointed mob\n" +
      "§e/infernalmobs:reroll§7 - Reroll modifiers on pointed mob\n" +
      "§e/infernalmobs:scan [radius]§7 - Scan for nearby infernals\n" +
      "§e/infernalmobs:debug§7 - Technical debug of pointed mob\n" +
      "§e/infernalmobs:reload§7 - Reload configuration\n" +
      "§e/infernalmobs:resetconfig confirm§7 - Reset configuration";
  }

  return {
    status: CustomCommandStatus.Success,
    message: helpText
  };
}

/**
 * Handles /infernalmobs:info
 */
export function handleInfoCommand(origin) {
  const player = origin.sourceEntity ?? origin.initiator;
  if (!isPlayer(player)) {
    return { status: CustomCommandStatus.Failure, message: "§cThis command can only be executed by a player." };
  }

  const hits = player.getEntitiesFromViewDirection({ maxDistance: 20 });
  let found = null;

  for (const hit of hits) {
    const ent = hit.entity;
    if (ent.id === player.id) continue;
    const state = getInfernalState(ent);
    if (state && state.isInfernal) {
      found = { entity: ent, state };
      break;
    }
  }

  if (!found) {
    return {
      status: CustomCommandStatus.Failure,
      message: "§cNo infernal mob found in your crosshair (look directly at one within 20 blocks)."
    };
  }

  const state = found.state;
  const health = safeGetHealth(found.entity);
  const hp = health ? Math.ceil(health.currentValue) : "?";
  const max = state.infernalMaxHealth ?? (health?.effectiveMax ?? "?");

  let info = `§6${formatFullName(state)}§r\n` +
    `§7Tier: §f${state.tier}§7 | Health: §c${hp}/${max} ❤§r\n` +
    `§7Modifiers (${state.modifiers.length}): §e${state.modifiers.join(", ")}§r\n` +
    `§6Powers:§r\n`;

  for (const modId of state.modifiers) {
    const meta = MODIFIER_METADATA[modId];
    if (meta) {
      info += `§b• ${meta.displayName}: §7${meta.description}\n`;
    }
  }

  return {
    status: CustomCommandStatus.Success,
    message: info.trim()
  };
}

/**
 * Handles /infernalmobs:modifier <modifier>
 */
export function handleModifierCommand(origin, modifierArg) {
  const modId = String(modifierArg ?? "").trim().toLowerCase();
  const meta = MODIFIER_METADATA[modId];

  if (!meta) {
    return {
      status: CustomCommandStatus.Failure,
      message: `§cUnknown modifier '${modifierArg}'. Available modifiers: ${MODIFIER_IDS.join(", ")}`
    };
  }

  const prefixes = meta.prefixes ? meta.prefixes.join(", ") : "none";
  const suffixes = meta.suffixes ? meta.suffixes.join(", ") : "none";

  const message = `§6Modifier: §e${meta.displayName}§r\n` +
    `§7Description: §f${meta.description}§r\n` +
    `§7Prefixes: §b${prefixes}§r\n` +
    `§7Suffixes: §b${suffixes}`;

  return {
    status: CustomCommandStatus.Success,
    message
  };
}

/**
 * Handles /infernalmobs:hud <on|off>
 */
export function handleHudCommand(origin, toggleArg) {
  const player = origin.sourceEntity ?? origin.initiator;
  if (!isPlayer(player)) {
    return { status: CustomCommandStatus.Failure, message: "§cThis command can only be executed by a player." };
  }

  const str = String(toggleArg ?? "").trim().toLowerCase();
  const enable = str === "on" || str === "true" || str === "1";

  // Defer mutation with system.run
  import("@minecraft/server").then(({ system }) => {
    system.run(() => {
      setPlayerHudEnabled(player, enable);
    });
  });

  return {
    status: CustomCommandStatus.Success,
    message: `§aInfernal Mobs combat HUD set to §e${enable ? "ON" : "OFF"}§a.`
  };
}
