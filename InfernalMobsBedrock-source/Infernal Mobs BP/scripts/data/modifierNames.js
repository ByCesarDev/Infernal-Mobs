/**
 * Infernal Mobs Bedrock - Modifier Names, Prefixes, Suffixes & Localization Keys
 * Source: Java NeoForge assets/infernalmobs/lang/en_us.json
 */

export const MODIFIER_METADATA = Object.freeze({
  "1up": {
    displayName: "1UP",
    prefixes: ["recurring", "undying", "twinlived"],
    suffixes: ["ofRecurrence", "theUndying", "oftwinLives"],
    description: "Cures the mob completely once when health falls below 25%."
  },
  "alchemist": {
    displayName: "Alchemist",
    prefixes: ["witchkin", "brewing", "singed"],
    suffixes: ["theWitchkin", "theBrewmaster", "theSinged"],
    description: "Throws splash potions (Slowness, Poison, Weakness, Harming) at targets."
  },
  "berserk": {
    displayName: "Berserk",
    prefixes: ["reckless", "raging", "smashing"],
    suffixes: ["ofRecklessness", "theRaging", "ofSmashing"],
    description: "Deals double outgoing attack damage (max 10) but damages itself on hit."
  },
  "blastoff": {
    displayName: "Blastoff",
    prefixes: ["thumping", "trolling", "byebye"],
    suffixes: ["ofMissionControl", "theNASA", "ofWEE"],
    description: "Launches the target high into the air."
  },
  "bulwark": {
    displayName: "Bulwark",
    prefixes: ["turtling", "defensive", "armoured"],
    suffixes: ["ofTurtling", "theDefender", "ofeffingArmor"],
    description: "Halves all incoming damage (minimum 1)."
  },
  "choke": {
    displayName: "Choke",
    prefixes: ["Sith Lord", "Dark Lord", "Darth"],
    suffixes: ["ofBreathlessness", "theAnaerobic", "ofDeprivation"],
    description: "Drains target oxygen; deals 2 drowning damage when exhausted. Hitting the mob recovers air."
  },
  "cloaking": {
    displayName: "Cloaking",
    prefixes: ["stalking", "unseen", "hunting"],
    suffixes: ["ofStalking", "theUnseen", "thePredator"],
    description: "Grants 10 seconds of invisibility on target acquisition or being hit."
  },
  "darkness": {
    displayName: "Darkness",
    prefixes: ["dark", "shadowkin", "eclipsed"],
    suffixes: ["ofDarkness", "theShadow"],
    description: "Applies Blindness for 6 seconds on incoming or outgoing contact."
  },
  "ender": {
    displayName: "Ender",
    prefixes: ["enderborn", "tricky"],
    suffixes: ["theEnderborn", "theTrickster"],
    description: "Chance to teleport on incoming damage, negating the hit and reflecting damage."
  },
  "exhaust": {
    displayName: "Exhaust",
    prefixes: ["exhausting", "draining"],
    suffixes: ["ofExhaustion", "theDrainer"],
    description: "Adds 1 food exhaustion point to players on contact."
  },
  "fiery": {
    displayName: "Fiery",
    prefixes: ["burning", "toasting"],
    suffixes: ["ofFieryWrath", "theSmoldering"],
    description: "Sets target on fire for 3s on contact; extinguishes its own fire when struck."
  },
  "ghastly": {
    displayName: "Ghastly",
    prefixes: ["bombing", "fireballsy"],
    suffixes: ["ofFireballs", "theFirebreather"],
    description: "Fires explosive fireballs at targets from distance."
  },
  "gravity": {
    displayName: "Gravity",
    prefixes: ["repulsing", "sproing"],
    suffixes: ["ofRepulsion", "theFlipper"],
    description: "Pushes the player away horizontally every 5 seconds."
  },
  "lifesteal": {
    displayName: "LifeSteal",
    prefixes: ["vampiric", "transfusing", "bloodsucking"],
    suffixes: ["theVampire", "ofTransfusion", "ofLifeSteal"],
    description: "Heals itself equal to the attack damage it deals."
  },
  "ninja": {
    displayName: "Ninja",
    prefixes: ["totallyzen", "innerlypeaceful", "Ronin"],
    suffixes: ["theZenMaster", "ofEquilibrium", "ofInnerPeace"],
    description: "Teleports away with an explosion on hit, negating damage and reflecting it."
  },
  "poisonous": {
    displayName: "Poisonous",
    prefixes: ["poisonous", "stinging", "despoiling"],
    suffixes: ["ofPoison", "theBane", "theVenomous"],
    description: "Applies Poison for 6 seconds on incoming or outgoing contact."
  },
  "quicksand": {
    displayName: "Quicksand",
    prefixes: ["slowing", "Quicksand"],
    suffixes: ["ofSoothe", "theSlow"],
    description: "Applies Slowness I for 45 ticks every 50 ticks to visible target."
  },
  "regen": {
    displayName: "Regen",
    prefixes: ["regenerating", "healing", "nighunkillable"],
    suffixes: ["ofRegeneration", "theTough", "thePhoenix"],
    description: "Heals 1 HP per second when not at full health or burning."
  },
  "rust": {
    displayName: "Rust",
    prefixes: ["rusting", "decaying"],
    suffixes: ["ofDecay", "theEquipmentHaunter"],
    description: "Damages player weapon by 4 on hit; damages player armor when attacking."
  },
  "sapper": {
    displayName: "Sapper",
    prefixes: ["hungering", "starving"],
    suffixes: ["ofHunger", "theStarving"],
    description: "Applies Hunger for 6 seconds on contact."
  },
  "sprint": {
    displayName: "Sprint",
    prefixes: ["sprinting", "swift", "charging"],
    suffixes: ["ofSpeed", "theFast"],
    description: "Gains bursts of sprinting speed towards its target every 5 seconds."
  },
  "sticky": {
    displayName: "Sticky",
    prefixes: ["thieving", "snagging", "quickfingered"],
    suffixes: ["ofSnagging", "theQuickFingered", "ofPettyTheft", "yoink"],
    description: "Knocks the held item out of the player's hand onto the ground."
  },
  "storm": {
    displayName: "Storm",
    prefixes: ["striking", "thundering", "electrified"],
    suffixes: ["ofLightning", "theRaiden"],
    description: "Summons real lightning bolts onto sky-exposed targets."
  },
  "unyielding": {
    displayName: "Unyielding",
    prefixes: ["relentless", "unyielding", "unstoppable"],
    suffixes: ["theImmovable", "theUnstoppable", "theMountain"],
    description: "Immune to hostile knockback."
  },
  "vengeance": {
    displayName: "Vengeance",
    prefixes: ["thorned", "thorny", "spiky"],
    suffixes: ["ofRetribution", "theVengeful", "theSpiky"],
    description: "Reflects half of incoming damage back to attacker (capped at 10)."
  },
  "weakness": {
    displayName: "Weakness",
    prefixes: ["apathetic", "deceiving"],
    suffixes: ["ofEnfeeblement", "theDeceiver"],
    description: "Applies Weakness for 6 seconds on incoming or outgoing contact."
  },
  "webber": {
    displayName: "Webber",
    prefixes: ["ensnaring", "webbing"],
    suffixes: ["ofTraps", "theMutated", "theSpider"],
    description: "Spawns permanent cobweb at target feet every 15 seconds."
  },
  "wither": {
    displayName: "Wither",
    prefixes: ["withering"],
    suffixes: ["ofWithering", "theWithered"],
    description: "Applies Wither for 6 seconds on incoming or outgoing contact."
  }
});
