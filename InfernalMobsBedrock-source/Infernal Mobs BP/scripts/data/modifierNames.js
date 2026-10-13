/**
 * Infernal Mobs Bedrock - Modifier Names, Prefixes, Suffixes & Localization Keys
 * Source: Java NeoForge assets/infernalmobs/lang/en_us.json
 */

export const MODIFIER_METADATA = Object.freeze({
  "1up": {
    displayName: "1UP",
    prefixes: ["Recurring", "Undying", "Twinlived"],
    suffixes: ["Of Recurrence", "The Undying", "Of Twin Lives"],
    description: "Cures the mob completely once when health falls below 25%."
  },
  "alchemist": {
    displayName: "Alchemist",
    prefixes: ["Witchkin", "Brewing", "Singed"],
    suffixes: ["The Witchkin", "The Brewmaster", "The Singed"],
    description: "Throws splash potions (Slowness, Poison, Weakness, Harming) at targets."
  },
  "berserk": {
    displayName: "Berserk",
    prefixes: ["Reckless", "Raging", "Smashing"],
    suffixes: ["Of Recklessness", "The Raging", "Of Smashing"],
    description: "Deals double outgoing attack damage (max 10) but damages itself on hit."
  },
  "blastoff": {
    displayName: "Blastoff",
    prefixes: ["Thumping", "Trolling", "Byebye"],
    suffixes: ["Of Mission Control", "The NASA", "Of WEE"],
    description: "Launches the target high into the air."
  },
  "bulwark": {
    displayName: "Bulwark",
    prefixes: ["Turtling", "Defensive", "Armoured"],
    suffixes: ["Of Turtling", "The Defender", "Of Effing Armor"],
    description: "Halves all incoming damage (minimum 1)."
  },
  "choke": {
    displayName: "Choke",
    prefixes: ["Sith Lord", "Dark Lord", "Darth"],
    suffixes: ["Of Breathlessness", "The Anaerobic", "Of Deprivation"],
    description: "Drains target oxygen; deals 2 drowning damage when exhausted. Hitting the mob recovers air."
  },
  "cloaking": {
    displayName: "Cloaking",
    prefixes: ["Stalking", "Unseen", "Hunting"],
    suffixes: ["Of Stalking", "The Unseen", "The Predator"],
    description: "Grants 10 seconds of invisibility on target acquisition or being hit."
  },
  "darkness": {
    displayName: "Darkness",
    prefixes: ["Dark", "Shadowkin", "Eclipsed"],
    suffixes: ["Of Darkness", "The Shadow"],
    description: "Applies Blindness for 6 seconds on incoming or outgoing contact."
  },
  "ender": {
    displayName: "Ender",
    prefixes: ["Enderborn", "Tricky"],
    suffixes: ["The Enderborn", "The Trickster"],
    description: "Chance to teleport on incoming damage, negating the hit and reflecting damage."
  },
  "exhaust": {
    displayName: "Exhaust",
    prefixes: ["Exhausting", "Draining"],
    suffixes: ["Of Exhaustion", "The Drainer"],
    description: "Adds 1 food exhaustion point to players on contact."
  },
  "fiery": {
    displayName: "Fiery",
    prefixes: ["Burning", "Toasting"],
    suffixes: ["Of Fiery Wrath", "The Smoldering"],
    description: "Sets target on fire for 3s on contact; extinguishes its own fire when struck."
  },
  "ghastly": {
    displayName: "Ghastly",
    prefixes: ["Bombing", "Fireballsy"],
    suffixes: ["Of Fireballs", "The Firebreather"],
    description: "Fires explosive fireballs at targets from distance."
  },
  "gravity": {
    displayName: "Gravity",
    prefixes: ["Repulsing", "Sproing"],
    suffixes: ["Of Repulsion", "The Flipper"],
    description: "Pushes the player away horizontally every 5 seconds."
  },
  "lifesteal": {
    displayName: "LifeSteal",
    prefixes: ["Vampiric", "Transfusing", "Bloodsucking"],
    suffixes: ["The Vampire", "Of Transfusion", "Of LifeSteal"],
    description: "Heals itself equal to the attack damage it deals."
  },
  "ninja": {
    displayName: "Ninja",
    prefixes: ["Totally Zen", "Innerly Peaceful", "Ronin"],
    suffixes: ["The Zen Master", "Of Equilibrium", "Of Inner Peace"],
    description: "Teleports away with an explosion on hit, negating damage and reflecting it."
  },
  "poisonous": {
    displayName: "Poisonous",
    prefixes: ["Poisonous", "Stinging", "Despoiling"],
    suffixes: ["Of Poison", "The Bane", "The Venomous"],
    description: "Applies Poison for 6 seconds on incoming or outgoing contact."
  },
  "quicksand": {
    displayName: "Quicksand",
    prefixes: ["Slowing", "Quicksand"],
    suffixes: ["Of Soothe", "The Slow"],
    description: "Applies Slowness I for 45 ticks every 50 ticks to visible target."
  },
  "regen": {
    displayName: "Regen",
    prefixes: ["Regenerating", "Healing", "Nigh Unkillable"],
    suffixes: ["Of Regeneration", "The Tough", "The Phoenix"],
    description: "Heals 1 HP per second when not at full health or burning."
  },
  "rust": {
    displayName: "Rust",
    prefixes: ["Rusting", "Decaying"],
    suffixes: ["Of Decay", "The Equipment Haunter"],
    description: "Damages player weapon by 4 on hit; damages player armor when attacking."
  },
  "sapper": {
    displayName: "Sapper",
    prefixes: ["Hungering", "Starving"],
    suffixes: ["Of Hunger", "The Starving"],
    description: "Applies Hunger for 6 seconds on contact."
  },
  "sprint": {
    displayName: "Sprint",
    prefixes: ["Sprinting", "Swift", "Charging"],
    suffixes: ["Of Speed", "The Fast"],
    description: "Gains bursts of sprinting speed towards its target every 5 seconds."
  },
  "sticky": {
    displayName: "Sticky",
    prefixes: ["Thieving", "Snagging", "Quick Fingered"],
    suffixes: ["Of Snagging", "The Quick Fingered", "Of Petty Theft", "Yoink"],
    description: "Knocks the held item out of the player's hand onto the ground."
  },
  "storm": {
    displayName: "Storm",
    prefixes: ["Striking", "Thundering", "Electrified"],
    suffixes: ["Of Lightning", "The Raiden"],
    description: "Summons real lightning bolts onto sky-exposed targets."
  },
  "unyielding": {
    displayName: "Unyielding",
    prefixes: ["Relentless", "Unyielding", "Unstoppable"],
    suffixes: ["The Immovable", "The Unstoppable", "The Mountain"],
    description: "Immune to hostile knockback."
  },
  "vengeance": {
    displayName: "Vengeance",
    prefixes: ["Thorned", "Thorny", "Spiky"],
    suffixes: ["Of Retribution", "The Vengeful", "The Spiky"],
    description: "Reflects half of incoming damage back to attacker (capped at 10)."
  },
  "weakness": {
    displayName: "Weakness",
    prefixes: ["Apathetic", "Deceiving"],
    suffixes: ["Of Enfeeblement", "The Deceiver"],
    description: "Applies Weakness for 6 seconds on incoming or outgoing contact."
  },
  "webber": {
    displayName: "Webber",
    prefixes: ["Ensnaring", "Webbing"],
    suffixes: ["Of Traps", "The Mutated", "The Spider"],
    description: "Spawns permanent cobweb at target feet every 15 seconds."
  },
  "wither": {
    displayName: "Wither",
    prefixes: ["Withering"],
    suffixes: ["Of Withering", "The Withered"],
    description: "Applies Wither for 6 seconds on incoming or outgoing contact."
  }
});
