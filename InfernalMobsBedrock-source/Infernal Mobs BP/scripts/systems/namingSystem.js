/**
 * Infernal Mobs Bedrock - Naming System
 * Generates stable entity names with tier prefixes and modifier affixes matching Java logic
 */

import { TIER_STYLE } from "../core/constants.js";
import { MODIFIER_METADATA } from "../data/modifierNames.js";
import { pickRandom, randomInt } from "../util/random.js";
import { setInfernalState } from "../storage/entityState.js";
import { isEntityValid } from "../util/entity.js";

/**
 * Capitalizes first letter of string
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Ensures state has pre-selected, stable prefixText and suffixText.
 * Generates them once and persists them back to the entity if missing.
 */
export function ensureStableName(state, entity = null) {
  if (!state) return;
  if (!state.name) {
    state.name = {
      speciesKey: "mob"
    };
  }

  let modified = false;
  const modifiers = state.modifiers || [];

  if (!state.name.prefixText) {
    if (!state.name.prefixModifier && modifiers.length > 0) {
      const pIdx = randomInt(0, modifiers.length - 1);
      state.name.prefixModifier = modifiers[pIdx];
      if (modifiers.length > 1) {
        state.name.suffixModifier = modifiers[(pIdx + 1) % modifiers.length];
      }
    }

    if (state.name.prefixModifier) {
      const prefixMeta = MODIFIER_METADATA[state.name.prefixModifier];
      state.name.prefixText = (prefixMeta && prefixMeta.prefixes && prefixMeta.prefixes.length > 0)
        ? pickRandom(prefixMeta.prefixes)
        : state.name.prefixModifier;
      modified = true;
    }
  }

  if (modifiers.length > 1 && !state.name.suffixText) {
    if (!state.name.suffixModifier && state.name.prefixModifier) {
      const pIdx = modifiers.indexOf(state.name.prefixModifier);
      const sIdx = pIdx >= 0 ? (pIdx + 1) % modifiers.length : 0;
      state.name.suffixModifier = modifiers[sIdx];
    }

    if (state.name.suffixModifier) {
      const suffixMeta = MODIFIER_METADATA[state.name.suffixModifier];
      state.name.suffixText = (suffixMeta && suffixMeta.suffixes && suffixMeta.suffixes.length > 0)
        ? pickRandom(suffixMeta.suffixes)
        : "";
      modified = true;
    }
  }

  if (modified && entity && isEntityValid(entity)) {
    try {
      setInfernalState(entity, state);
    } catch {}
  }
}

/**
 * Returns formatted short name for entity nameTag (single line, no modifier spam)
 * Uses stable prefixText. Never calls pickRandom().
 * Example: "§bRare singed Zombie"
 */
export function formatShortName(state) {
  if (!state) return "";
  const style = TIER_STYLE[state.tier] ?? TIER_STYLE.rare;
  const prefix = state.name?.prefixText || (state.name?.prefixModifier ? capitalize(state.name.prefixModifier) : "");
  const species = capitalize(state.name?.speciesKey ?? "Mob");

  return `${style.color}${style.label} ${prefix} ${species}`.trim();
}

/**
 * Returns full generated name including suffix for HUD display
 * Uses stable prefixText and suffixText. Never calls pickRandom().
 * Example: "Rare singed Zombie of Darkness"
 */
export function formatFullName(state) {
  if (!state) return "";
  const style = TIER_STYLE[state.tier] ?? TIER_STYLE.rare;
  const prefix = state.name?.prefixText || (state.name?.prefixModifier ? capitalize(state.name.prefixModifier) : "");
  const species = capitalize(state.name?.speciesKey ?? "Mob");

  let suffix = "";
  if (state.modifiers && state.modifiers.length > 1 && state.name?.suffixText) {
    suffix = state.name.suffixText;
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
