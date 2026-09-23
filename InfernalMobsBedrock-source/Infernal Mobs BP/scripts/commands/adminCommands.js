/**
 * Infernal Mobs Bedrock - Admin Commands
 * Permission level: Admin (2)
 * All mutations deferred via system.run outside restricted execution mode
 */

import { system, CustomCommandStatus } from "@minecraft/server";
import { SCHEMA_VERSION, TIER } from "../core/constants.js";
import { MODIFIER_IDS, areModifiersCompatible, isModifierAllowedOnSpecies } from "../data/incompatibilities.js";
import { clearInfernalState, getInfernalState } from "../storage/entityState.js";
import { getConfig, loadWorldConfig, resetWorldConfig, setModifierEnabledConfig, updateConfigOption } from "../storage/worldConfig.js";
import { createInfernal } from "../core/spawnManager.js";
import { getTrackedInfernal, unregisterInfernal } from "../core/infernalManager.js";
import { restoreVanillaHealth } from "../systems/healthSystem.js";
import { formatFullName, ensureStableName } from "../systems/namingSystem.js";
import { getChokeBackendName } from "../core/capabilityDetector.js";
import { isEntityAlive, isEntityValid, isPlayer, safeGetHealth } from "../util/entity.js";
import { distance } from "../util/vector.js";

function getPointedLivingEntity(player, maxDistance = 20) {
  if (!isPlayer(player)) return null;
  try {
    const hits = player.getEntitiesFromViewDirection({ maxDistance });
    for (const hit of hits) {
      const ent = hit.entity;
      if (ent.id === player.id) continue;
      if (isEntityValid(ent) && isEntityAlive(ent)) {
        return ent;
      }
    }
  } catch {}
  return null;
}

export function handleConfigCommand() {
  const config = getConfig();
  const info = "§6=== Infernal Mobs World Configuration ===§r\n" +
    `§7Elite Rarity: §f1 in ${config.eliteRarity}\n` +
    `§7Ultra Rarity: §f1 in ${config.ultraRarity}\n` +
    `§7Infernal Rarity: §f1 in ${config.infernoRarity}\n` +
    `§7Health Factor: §f${config.modHealthFactor}\n` +
    `§7Max Damage Cap: §f${config.maxDamage}\n` +
    `§7Cooldown Factor: §f${config.modCooldownFactor}\n` +
    `§7Health Changes: §f${config.healthChangesDisabled ? "DISABLED" : "ENABLED"}\n` +
    `§7HUD: §f${config.hudEnabled ? "ON" : "OFF"}\n` +
    `§7Names: §f${config.namesEnabled ? "ON" : "OFF"}\n` +
    `§7Loot: §f${config.lootEnabled ? "ON" : "OFF"}\n` +
    `§7XP: §f${config.xpEnabled ? "ON" : "OFF"}\n` +
    `§7Anti-Farm: §f${config.antiFarm ? "ON" : "OFF"}\n` +
    `§7Debug: §f${config.debug ? "ON" : "OFF"}\n` +
    `§7Schema Version: §f${SCHEMA_VERSION}`;

  return { status: CustomCommandStatus.Success, message: info };
}

export function handleSetCommand(origin, option, value) {
  if (!option || value === undefined) {
    return { status: CustomCommandStatus.Failure, message: "§cUsage: /infernalmobs:set <option> <value>" };
  }

  const opt = String(option).trim();
  const val = String(value).trim();

  let resultMsg = "";
  system.run(() => {
    const res = updateConfigOption(opt, val);
    resultMsg = res.message;
    if (origin.sourceEntity?.sendMessage) {
      origin.sourceEntity.sendMessage(res.success ? `§a${res.message}` : `§c${res.message}`);
    }
  });

  return { status: CustomCommandStatus.Success, message: `§7Updating '${opt}'...` };
}

export function handleModifierConfigCommand(origin, modifier, toggle) {
  const modId = String(modifier ?? "").trim().toLowerCase();
  if (!MODIFIER_IDS.includes(modId)) {
    return { status: CustomCommandStatus.Failure, message: `§cUnknown modifier: ${modifier}` };
  }

  const str = String(toggle ?? "").trim().toLowerCase();
  const enabled = str === "on" || str === "true" || str === "1";

  system.run(() => {
    setModifierEnabledConfig(modId, enabled);
    if (origin.sourceEntity?.sendMessage) {
      origin.sourceEntity.sendMessage(`§aModifier §e${modId}§a set to §e${enabled ? "ON" : "OFF"}§a.`);
    }
  });

  return { status: CustomCommandStatus.Success, message: `§7Setting ${modId} to ${enabled ? "ON" : "OFF"}...` };
}

export function handleMakeCommand(origin, tierArg) {
  const player = origin.sourceEntity ?? origin.initiator;
  if (!isPlayer(player)) {
    return { status: CustomCommandStatus.Failure, message: "§cMust be executed by a player targeting a mob." };
  }

  const target = getPointedLivingEntity(player);
  if (!target) {
    return { status: CustomCommandStatus.Failure, message: "§cNo eligible mob found in crosshair within 20 blocks." };
  }

  const tier = String(tierArg ?? "random").trim().toLowerCase();
  const selectedTier = tier === "rare" ? TIER.RARE : tier === "ultra" ? TIER.ULTRA : tier === "infernal" ? TIER.INFERNAL : null;

  system.run(() => {
    const state = createInfernal(target, selectedTier);
    if (state) {
      try {
        const dim = target.dimension;
        const loc = target.location;
        dim.playSound("ambient.weather.thunder", loc, { volume: 1.0, pitch: 1.0 });
        dim.playSound("random.explode", loc, { volume: 0.8, pitch: 1.2 });
        for (let dy = 0; dy <= 4; dy += 0.5) {
          dim.spawnParticle("minecraft:electric_spark_particle", {
            x: loc.x + (Math.random() - 0.5) * 0.6,
            y: loc.y + dy,
            z: loc.z + (Math.random() - 0.5) * 0.6
          });
        }
      } catch {}
      player.sendMessage(`§aConverted ${target.typeId} into a §e${state.tier.toUpperCase()}§a infernal with ${state.modifiers.length} modifiers: ${state.modifiers.join(", ")}`);
    } else {
      player.sendMessage("§cFailed to convert target into an infernal mob.");
    }
  });

  return { status: CustomCommandStatus.Success, message: "§7Processing mob conversion..." };
}

export function handleSetModsCommand(origin, modsArg) {
  const player = origin.sourceEntity ?? origin.initiator;
  if (!isPlayer(player)) {
    return { status: CustomCommandStatus.Failure, message: "§cMust be executed by a player targeting a mob." };
  }

  const target = getPointedLivingEntity(player);
  if (!target) {
    return { status: CustomCommandStatus.Failure, message: "§cNo eligible mob found in crosshair within 20 blocks." };
  }

  const rawList = String(modsArg ?? "").split(/[\s,]+/).filter(Boolean).map((m) => m.toLowerCase());
  if (rawList.length === 0) {
    return { status: CustomCommandStatus.Failure, message: "§cProvide at least one modifier ID." };
  }

  // Validate
  const valid = [];
  for (const m of rawList) {
    if (!MODIFIER_IDS.includes(m)) {
      return { status: CustomCommandStatus.Failure, message: `§cUnknown modifier: ${m}` };
    }
    if (valid.includes(m)) {
      return { status: CustomCommandStatus.Failure, message: `§cDuplicate modifier: ${m}` };
    }
    if (!isModifierAllowedOnSpecies(m, target.typeId)) {
      return { status: CustomCommandStatus.Failure, message: `§cModifier '${m}' is banned on species ${target.typeId}.` };
    }
    if (!areModifiersCompatible(m, valid)) {
      return { status: CustomCommandStatus.Failure, message: `§cModifier '${m}' is incompatible with already selected modifiers.` };
    }
    valid.push(m);
  }

  system.run(() => {
    const state = createInfernal(target, null, valid);
    if (state) {
      player.sendMessage(`§aSet custom modifiers on ${target.typeId}: §e${valid.join(", ")}`);
    }
  });

  return { status: CustomCommandStatus.Success, message: "§7Applying custom modifiers..." };
}

export function handleRemoveCommand(origin) {
  const player = origin.sourceEntity ?? origin.initiator;
  if (!isPlayer(player)) {
    return { status: CustomCommandStatus.Failure, message: "§cMust be executed by a player targeting a mob." };
  }

  const target = getPointedLivingEntity(player);
  if (!target) {
    return { status: CustomCommandStatus.Failure, message: "§cNo mob found in crosshair." };
  }

  const state = getInfernalState(target);
  if (!state || !state.isInfernal) {
    return { status: CustomCommandStatus.Failure, message: "§cTargeted mob is not an infernal mob." };
  }

  system.run(() => {
    restoreVanillaHealth(target, state.baseMaxHealth ?? 20);
    clearInfernalState(target);
    unregisterInfernal(target.id);
    target.nameTag = "";
    player.sendMessage(`§aInfernal status removed from ${target.typeId} (${target.id}).`);
  });

  return { status: CustomCommandStatus.Success, message: "§7Removing infernal status..." };
}

export function handleRerollCommand(origin) {
  const player = origin.sourceEntity ?? origin.initiator;
  if (!isPlayer(player)) {
    return { status: CustomCommandStatus.Failure, message: "§cMust be executed by a player targeting a mob." };
  }

  const target = getPointedLivingEntity(player);
  if (!target) {
    return { status: CustomCommandStatus.Failure, message: "§cNo mob found in crosshair." };
  }

  system.run(() => {
    clearInfernalState(target);
    unregisterInfernal(target.id);
    const newState = createInfernal(target);
    if (newState) {
      player.sendMessage(`§aRerolled ${target.typeId} -> §e${newState.tier.toUpperCase()}§a (${newState.modifiers.join(", ")})`);
    }
  });

  return { status: CustomCommandStatus.Success, message: "§7Rerolling infernal modifiers..." };
}

export function handleScanCommand(origin, radiusArg) {
  const player = origin.sourceEntity ?? origin.initiator;
  if (!isPlayer(player)) {
    return { status: CustomCommandStatus.Failure, message: "§cMust be executed by a player." };
  }

  const radius = Math.max(5, Math.min(64, Number(radiusArg) || 32));
  const dim = player.dimension;
  const entities = dim.getEntities({ location: player.location, maxDistance: radius });

  const found = [];
  for (const ent of entities) {
    if (ent.id === player.id) continue;
    const state = getInfernalState(ent);
    if (state && state.isInfernal) {
      const dist = Math.round(distance(player.location, ent.location));
      found.push(`§e${state.tier.toUpperCase()} ${ent.typeId} §7(${dist}m away) [${state.modifiers.length} mods]`);
    }
  }

  let msg = `§6=== Infernals Scan (radius ${radius}m) ===§r\n`;
  if (found.length === 0) {
    msg += "§7No infernal mobs found in area.";
  } else {
    msg += `§aFound ${found.length} infernal mob(s):\n` + found.slice(0, 10).join("\n");
    if (found.length > 10) msg += `\n§7...and ${found.length - 10} more.`;
  }

  return { status: CustomCommandStatus.Success, message: msg };
}

export function handleDebugCommand(origin) {
  const player = origin.sourceEntity ?? origin.initiator;
  if (!isPlayer(player)) {
    return { status: CustomCommandStatus.Failure, message: "§cMust be executed by a player targeting a mob." };
  }

  const target = getPointedLivingEntity(player);
  if (!target) {
    return { status: CustomCommandStatus.Failure, message: "§cNo mob found in crosshair." };
  }

  const state = getInfernalState(target);
  const health = safeGetHealth(target);
  const record = getTrackedInfernal(target.id);
  const chokeBackend = getChokeBackendName(target);

  let debugMsg = `§6=== Infernal Debug Info ===§r\n` +
    `§7Entity ID: §f${target.id} (${target.typeId})\n` +
    `§7Infernal: §f${Boolean(state?.isInfernal)}\n`;

  if (state) {
    ensureStableName(state, target);
    debugMsg += `§7Name: §f${formatFullName(state)}\n` +
      `§7Schema: §f${state.schema} | Tier: §f${state.tier}\n` +
      `§7Modifiers: §e${state.modifiers?.join(", ")}\n` +
      `§7Health: §f${health?.currentValue ?? "?"} / ${state.infernalMaxHealth} (Base: ${state.baseMaxHealth})\n` +
      `§71UP Consumed: §f${Boolean(state.persistent?.oneUpConsumed)}\n` +
      `§7Choke Backend: §b${chokeBackend}\n` +
      `§7Simulated Air: §f${record?.simulatedAir ?? 300}\n` +
      `§7Steady Target Ticks: §f${record?.steadyTargetTicks ?? 0}\n` +
      `§7Sprinting: §f${Boolean(record?.sprintingState)}`;
  }

  return { status: CustomCommandStatus.Success, message: debugMsg };
}

export function handleReloadCommand(origin) {
  system.run(() => {
    loadWorldConfig();
    if (origin.sourceEntity?.sendMessage) {
      origin.sourceEntity.sendMessage("§aInfernal Mobs configuration reloaded successfully.");
    }
  });
  return { status: CustomCommandStatus.Success, message: "§7Reloading configuration..." };
}

export function handleResetConfigCommand(origin, confirmArg) {
  if (confirmArg !== "confirm") {
    return {
      status: CustomCommandStatus.Failure,
      message: "§cTo reset config to default values, type: §e/infernalmobs:resetconfig confirm"
    };
  }

  system.run(() => {
    resetWorldConfig();
    if (origin.sourceEntity?.sendMessage) {
      origin.sourceEntity.sendMessage("§aInfernal Mobs configuration has been reset to defaults.");
    }
  });

  return { status: CustomCommandStatus.Success, message: "§7Resetting configuration..." };
}
