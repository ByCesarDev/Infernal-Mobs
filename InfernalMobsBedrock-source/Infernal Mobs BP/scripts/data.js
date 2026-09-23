import { TIER } from "./config.js";

export const MODIFIER_IDS = Object.freeze([
  "1UP", "Alchemist", "Berserk", "Blastoff", "Bulwark", "Choke",
  "Cloaking", "Darkness", "Ender", "Exhaust", "Fiery", "Ghastly",
  "Gravity", "LifeSteal", "Ninja", "Poisonous", "Quicksand", "Regen",
  "Rust", "Sapper", "Sprint", "Sticky", "Storm", "Unyielding",
  "Vengeance", "Weakness", "Webber", "Wither"
]);

export const INCOMPATIBLE = Object.freeze({
  Blastoff: ["Gravity"],
  Gravity: ["Blastoff"],
  Ender: ["Ninja"],
  Ninja: ["Ender"],
  Sprint: ["Quicksand"],
  Quicksand: ["Sprint"]
});

export const TIER_STYLE = Object.freeze({
  [TIER.ELITE]: { label: "Elite", color: "§e", particles: "minecraft:basic_flame_particle" },
  [TIER.ULTRA]: { label: "Ultra", color: "§d", particles: "minecraft:portal_directional" },
  [TIER.INFERNAL]: { label: "Infernal", color: "§c", particles: "minecraft:lava_particle" }
});

export const LOOT = Object.freeze({
  [TIER.ELITE]: [
    ["minecraft:iron_ingot", 2, 5], ["minecraft:cookie", 3, 6],
    ["minecraft:iron_sword", 1, 1], ["minecraft:chainmail_helmet", 1, 1]
  ],
  [TIER.ULTRA]: [
    ["minecraft:gold_ingot", 3, 7], ["minecraft:golden_apple", 1, 2],
    ["minecraft:blaze_powder", 3, 6], ["minecraft:enchanted_book", 1, 1]
  ],
  [TIER.INFERNAL]: [
    ["minecraft:diamond", 2, 4], ["minecraft:ender_pearl", 2, 4],
    ["minecraft:diamond_sword", 1, 1], ["minecraft:enchanted_book", 1, 1]
  ]
});
