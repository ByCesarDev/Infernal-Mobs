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

  if (entity && entity.typeId && !state.name.speciesTypeId) {
    state.name.speciesTypeId = entity.typeId;
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
 * Returns translation key for tier
 * @param {string} tier
 */
export function getTierTranslationKey(tier) {
  if (!tier) return "infernalmobs.class.rare";
  return `infernalmobs.class.${tier.toLowerCase()}`;
}

/**
 * Returns translation key for modifier prefix
 * @param {string} prefixStr
 */
export function getPrefixTranslationKey(prefixStr) {
  if (!prefixStr) return "";
  const clean = prefixStr.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `infernalmobs.prefix.${clean}`;
}

/**
 * Returns translation key for modifier suffix
 * @param {string} suffixStr
 */
export function getSuffixTranslationKey(suffixStr) {
  if (!suffixStr) return "";
  const clean = suffixStr.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `infernalmobs.suffix.${clean}`;
}

/**
 * Returns translation key for modifier ID
 * @param {string} modId
 */
export function getModifierTranslationKey(modId) {
  if (!modId) return "";
  return `infernalmobs.mod.${modId.toLowerCase()}`;
}

/**
 * Resolves translation component for entity species
 * @param {string} speciesOrTypeId
 */
export function getSpeciesTranslationComponent(speciesOrTypeId) {
  if (!speciesOrTypeId) return { text: "Mob" };
  const clean = speciesOrTypeId.replace(/^minecraft:/, "");
  return { translate: `entity.${clean}.name` };
}

/**
 * Builds RawMessage components for the Full Infernal Name (Title line in HUD)
 * Example (EN): "§bRare witchkin Zombie the Mountain"
 * Example (ES): "§bRaro brujo Zombi la Montaña"
 * @param {Object} state
 * @returns {import("@minecraft/server").RawMessage}
 */
export function buildRawFullName(state) {
  if (!state) return { text: "" };

  const style = TIER_STYLE[state.tier] ?? TIER_STYLE.rare;
  const tierKey = getTierTranslationKey(state.tier);
  const rawComponents = [];

  // 1. Color and Tier label
  rawComponents.push({ text: `${style.color}` });
  rawComponents.push({ translate: tierKey });

  // 2. Prefix (e.g. "witchkin" / "brujo")
  const prefixStr = state.name?.prefixText || state.name?.prefixModifier;
  if (prefixStr) {
    const prefixKey = getPrefixTranslationKey(prefixStr);
    rawComponents.push({ text: " " });
    rawComponents.push({ translate: prefixKey });
  }

  // 3. Species Name (e.g. "Zombie" / "Zombi")
  rawComponents.push({ text: " " });
  const speciesId = state.name?.speciesTypeId || state.name?.speciesKey || "mob";
  rawComponents.push(getSpeciesTranslationComponent(speciesId));

  // 4. Suffix (e.g. "the Mountain" / "la Montaña")
  if (state.modifiers && state.modifiers.length > 1 && state.name?.suffixText) {
    const suffixKey = getSuffixTranslationKey(state.name.suffixText);
    rawComponents.push({ text: " " });
    rawComponents.push({ translate: suffixKey });
  }

  return { rawtext: rawComponents };
}

/**
 * Formats modifier list into localized RawMessage rows (divided into rows of 5)
 * Example (EN): "§7Alchemist · Storm · Berserk · Darkness · Vengeance"
 * Example (ES): "§7Alquimista · Tormenta · Berserker · Oscuridad · Venganza"
 * @param {string[]} modifiers
 * @returns {import("@minecraft/server").RawMessage[]}
 */
export function buildRawModifierRows(modifiers) {
  if (!modifiers || modifiers.length === 0) return [];

  const rows = [];
  for (let i = 0; i < modifiers.length; i += 5) {
    const chunk = modifiers.slice(i, i + 5);
    const rowComponents = [{ text: "§7" }];

    for (let j = 0; j < chunk.length; j++) {
      if (j > 0) {
        rowComponents.push({ text: " · " });
      }
      const modId = chunk[j];
      const modKey = getModifierTranslationKey(modId);
      rowComponents.push({ translate: modKey });
    }

    rows.push({ rawtext: rowComponents });
  }

  return rows;
}

/**
 * Builds the complete multi-line RawMessage for the player actionbar HUD
 * Multilingual per client: translates tier, modifiers, prefixes, suffixes, and mob names.
 * @param {Object} state
 * @param {number} currentHp
 * @param {number} maxHp
 * @param {Object} config
 * @param {Function} [buildHealthBarFn]
 * @returns {import("@minecraft/server").RawMessage}
 */
export function buildRawHudMessage(state, currentHp, maxHp, config, buildHealthBarFn = null) {
  const components = [];

  // Line 1: Localized Full Title
  const fullNameRaw = buildRawFullName(state);
  if (fullNameRaw.rawtext) {
    components.push(...fullNameRaw.rawtext);
  }

  // Lines 2+: Localized Modifier Rows
  const modRows = buildRawModifierRows(state.modifiers);
  for (const row of modRows) {
    components.push({ text: "\n" });
    if (row.rawtext) {
      components.push(...row.rawtext);
    }
  }

  // Line 3/4: Health Bar (if enabled)
  if (!config.disableHealthBar && typeof buildHealthBarFn === "function") {
    components.push({ text: "\n" });
    components.push({ text: buildHealthBarFn(currentHp, maxHp, 10) });
  }

  return { rawtext: components };
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
 * Returns full generated name including suffix for HUD display fallback / logs
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
 * Formats modifier list for string representation (divided into rows of 5)
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
