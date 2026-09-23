/**
 * Infernal Mobs Bedrock - Naming System
 * Generates stable entity names with tier prefixes and modifier affixes matching Java logic
 */

import { TIER_STYLE } from "../core/constants.js";
import { MODIFIER_METADATA } from "../data/modifierNames.js";
import { pickRandom } from "../util/random.js";

/**
 * Capitalizes first letter of string
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Returns formatted short name for entity nameTag (single line, no modifier spam)
 * Example: "§bRare singed Zombie"
 */
export function formatShortName(state) {
  if (!state) return "";
  const style = TIER_STYLE[state.tier] ?? TIER_STYLE.rare;
  const prefixMeta = MODIFIER_METADATA[state.name?.prefixModifier];
  const prefix = prefixMeta ? (pickRandom(prefixMeta.prefixes) ?? state.name.prefixModifier) : "";
  const species = capitalize(state.name?.speciesKey ?? "Mob");

  return `${style.color}${style.label} ${prefix} ${species}`.trim();
}

/**
 * Returns full generated name including suffix for HUD display
 * Example: "Rare singed Zombie of Darkness"
 */
export function formatFullName(state) {
  if (!state) return "";
  const style = TIER_STYLE[state.tier] ?? TIER_STYLE.rare;
  const prefixMeta = MODIFIER_METADATA[state.name?.prefixModifier];
  const prefix = prefixMeta ? (pickRandom(prefixMeta.prefixes) ?? state.name.prefixModifier) : "";
  const species = capitalize(state.name?.speciesKey ?? "Mob");

  let suffix = "";
  if (state.modifiers && state.modifiers.length > 1 && state.name?.suffixModifier) {
    const suffixMeta = MODIFIER_METADATA[state.name.suffixModifier];
    suffix = suffixMeta ? (pickRandom(suffixMeta.suffixes) ?? "") : "";
  }

  const parts = [`${style.color}${style.label}`, prefix, species, suffix].filter(Boolean);
  return parts.join(" ").trim();
}

/**
 * Formats modifier list for HUD actionbar (divided into rows of 5)
 * Example:
 * Line 1: Fiery · Storm · Regen · Darkness · Vengeance
 * Line 2: 1UP · Sprint · Sticky · Webber · Wither
 */
export function formatModifierRows(modifiers) {
  if (!modifiers || modifiers.length === 0) return [];

  const displayList = modifiers.map((modId) => {
    const meta = MODIFIER_METADATA[modId];
    return meta ? meta.displayName : capitalize(modId);
  });

  const rows = [];
  for (let i = 0; i < displayList.length; i += 5) {
    const chunk = displayList.slice(i, i + 5);
    rows.push(chunk.join(" · "));
  }

  return rows;
}
