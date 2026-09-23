/**
 * Infernal Mobs Bedrock - Custom Command Registration
 * Registered during system.beforeEvents.startup using customCommandRegistry
 */

import { CommandPermissionLevel, CustomCommandParamType, system } from "@minecraft/server";
import { MODIFIER_IDS } from "../data/incompatibilities.js";
import {
  handleHelpCommand,
  handleHudCommand,
  handleInfoCommand,
  handleModifierCommand
} from "./playerCommands.js";
import {
  handleConfigCommand,
  handleDebugCommand,
  handleMakeCommand,
  handleModifierConfigCommand,
  handleReloadCommand,
  handleRemoveCommand,
  handleRerollCommand,
  handleResetConfigCommand,
  handleScanCommand,
  handleSetCommand,
  handleSetModsCommand
} from "./adminCommands.js";
import { logInfo } from "../util/log.js";

export function registerCustomCommands() {
  system.beforeEvents.startup.subscribe((event) => {
    const registry = event.customCommandRegistry;
    if (!registry) return;

    try {
      // 1. Register Enums first
      registry.registerEnum("infernalmobs:all_modifiers", [...MODIFIER_IDS]);
      registry.registerEnum("infernalmobs:toggle", ["on", "off"]);
      registry.registerEnum("infernalmobs:tier_enum", ["rare", "ultra", "infernal", "random"]);
      registry.registerEnum("infernalmobs:config_options", [
        "eliteRarity",
        "ultraRarity",
        "infernoRarity",
        "modHealthFactor",
        "maxDamage",
        "modCooldownFactor",
        "healthChangesDisabled",
        "disableHealthBar",
        "hudEnabled",
        "namesEnabled",
        "lootEnabled",
        "xpEnabled",
        "antiFarm",
        "debug"
      ]);

      // 2. Register Public Commands (Permission: Any, cheatsRequired: false)
      registry.registerCommand({
        name: "infernalmobs:help",
        description: "List available Infernal Mobs commands",
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: false
      }, handleHelpCommand);

      registry.registerCommand({
        name: "infernalmobs:info",
        description: "Inspect the targeted infernal mob",
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: false
      }, handleInfoCommand);

      registry.registerCommand({
        name: "infernalmobs:modifier",
        description: "Explain the powers and behavior of a modifier",
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: false,
        mandatoryParameters: [
          { name: "infernalmobs:all_modifiers", type: CustomCommandParamType.Enum }
        ]
      }, handleModifierCommand);

      registry.registerCommand({
        name: "infernalmobs:hud",
        description: "Toggle individual infernal mob HUD",
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: false,
        mandatoryParameters: [
          { name: "infernalmobs:toggle", type: CustomCommandParamType.Enum }
        ]
      }, handleHudCommand);

      // 3. Register Admin Commands (Permission: Admin)
      registry.registerCommand({
        name: "infernalmobs:config",
        description: "Display current world configuration",
        permissionLevel: CommandPermissionLevel.Admin
      }, handleConfigCommand);

      registry.registerCommand({
        name: "infernalmobs:set",
        description: "Modify an Infernal Mobs configuration option",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [
          { name: "infernalmobs:config_options", type: CustomCommandParamType.Enum },
          { name: "value", type: CustomCommandParamType.String }
        ]
      }, handleSetCommand);

      registry.registerCommand({
        name: "infernalmobs:modifierconfig",
        description: "Enable or disable a modifier for new spawns",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [
          { name: "infernalmobs:all_modifiers", type: CustomCommandParamType.Enum },
          { name: "infernalmobs:toggle", type: CustomCommandParamType.Enum }
        ]
      }, handleModifierConfigCommand);

      registry.registerCommand({
        name: "infernalmobs:make",
        description: "Convert targeted mob into an infernal mob",
        permissionLevel: CommandPermissionLevel.Admin,
        optionalParameters: [
          { name: "infernalmobs:tier_enum", type: CustomCommandParamType.Enum }
        ]
      }, handleMakeCommand);

      registry.registerCommand({
        name: "infernalmobs:setmods",
        description: "Set custom modifiers on the targeted mob",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [
          { name: "modifiers", type: CustomCommandParamType.String }
        ]
      }, handleSetModsCommand);

      registry.registerCommand({
        name: "infernalmobs:remove",
        description: "Remove infernal status from targeted mob",
        permissionLevel: CommandPermissionLevel.Admin
      }, handleRemoveCommand);

      registry.registerCommand({
        name: "infernalmobs:reroll",
        description: "Reroll modifiers and name for targeted infernal mob",
        permissionLevel: CommandPermissionLevel.Admin
      }, handleRerollCommand);

      registry.registerCommand({
        name: "infernalmobs:scan",
        description: "Scan for nearby loaded infernal mobs",
        permissionLevel: CommandPermissionLevel.Admin,
        optionalParameters: [
          { name: "radius", type: CustomCommandParamType.Integer }
        ]
      }, handleScanCommand);

      registry.registerCommand({
        name: "infernalmobs:debug",
        description: "Technical diagnostics of targeted mob",
        permissionLevel: CommandPermissionLevel.Admin
      }, handleDebugCommand);

      registry.registerCommand({
        name: "infernalmobs:reload",
        description: "Reload Infernal Mobs configuration",
        permissionLevel: CommandPermissionLevel.Admin
      }, handleReloadCommand);

      registry.registerCommand({
        name: "infernalmobs:resetconfig",
        description: "Reset configuration to default values (requires confirmation)",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [
          { name: "confirm", type: CustomCommandParamType.String }
        ]
      }, handleResetConfigCommand);

      logInfo("commands", "Custom commands successfully registered during startup.");
    } catch (error) {
      console.error("[InfernalMobs] Failed to register custom commands:", error);
    }
  });
}
