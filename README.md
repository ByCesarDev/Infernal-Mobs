# Infernal Mobs for Minecraft Bedrock

<p align="center">
  <img src="./InfernalMobsBedrock-source/Infernal%20Mobs%20RP/pack_icon.png" alt="Infernal Mobs for Minecraft Bedrock" width="180">
</p>

<p align="center">
  An authorized Bedrock Edition port of AtomicStryker's <strong>Infernal Mobs</strong>, rebuilt in JavaScript on the stable Minecraft Script API.
</p>

<p align="center">
  <img alt="Minecraft Bedrock" src="https://img.shields.io/badge/Minecraft-Bedrock-3C8527?logo=minecraft&logoColor=white">
  <img alt="Script API 2.10.0" src="https://img.shields.io/badge/Script%20API-2.10.0-5C2D91">
  <img alt="28 modifiers" src="https://img.shields.io/badge/Modifiers-28-E67E22">
  <img alt="Authorized port" src="https://img.shields.io/badge/Port-Authorized-2471A3">
  <img alt="Public beta" src="https://img.shields.io/badge/Status-Public%20Beta-F1C40F">
</p>

Infernal Mobs turns ordinary hostile creatures into rare, persistent mini-bosses. An infernal mob can receive multiple combat modifiers, increased health, a generated name, a colored particle aura, a dedicated HUD, bonus drops, and additional experience.

The goal of this project is behavioral parity with the original Java mod wherever Bedrock permits it—not a simplified imitation. Systems that cannot be transferred directly have been recreated using stable Bedrock APIs and documented below.

> [!IMPORTANT]
> This project is an independent Bedrock Edition port. The original Infernal Mobs mod was created by [AtomicStryker](https://github.com/AtomicStryker), who granted permission for this port to use the original project's resources.

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [How infernal mobs are generated](#how-infernal-mobs-are-generated)
- [Health, names, HUD, and particles](#health-names-hud-and-particles)
- [Modifiers](#modifiers)
- [Modifier restrictions](#modifier-restrictions)
- [Loot and experience](#loot-and-experience)
- [Commands](#commands)
- [Configuration](#configuration)
- [Compatibility with other add-ons](#compatibility-with-other-add-ons)
- [Bedrock adaptations and parity notes](#bedrock-adaptations-and-parity-notes)
- [Project structure](#project-structure)
- [Development](#development)
- [Testing and validation](#testing-and-validation)
- [Troubleshooting](#troubleshooting)
- [Localization](#localization)
- [Credits and permission](#credits-and-permission)

## Features

- **28 functional modifiers** covering offense, defense, movement, control, survival, retaliation, and utility.
- **Three escalation tiers:** Rare, Ultra, and Infernal.
- **Persistent infernal identity:** modifiers, generated names, health, cooldowns, and special state survive chunk unloads and world reloads.
- **Generated names:** stable prefix and suffix combinations are assigned once and stored with each mob.
- **Targeted boss HUD:** nearby players see the mob's name, complete modifier list, segmented health bar, and exact health value.
- **Classic multicolor aura:** a custom Bedrock particle emitter recreates the original colored mob-spell appearance using the vanilla particle texture atlas.
- **Bonus loot and XP:** stronger mobs reward more bonus item rolls and experience.
- **Physical Alchemist potions:** splash potions travel through the world, collide, and apply distance-based effects.
- **Complete Unyielding behavior:** incoming knockback is detected and countered while preserving the mob's intended movement.
- **Other add-on compatibility:** naturally spawned custom monsters can become infernal when they use the standard `monster` family.
- **Player and administrator commands:** inspect modifiers, toggle the HUD, configure the add-on, create test mobs, scan an area, and reload settings.
- **Stable Script API implementation:** built for `@minecraft/server` 2.10.0 without relying on experimental APIs.
- **English and Spanish localization:** `en_US`, `es_ES`, and `es_MX` are included.

## Requirements

| Component | Requirement |
|---|---|
| Minecraft | Bedrock Edition with a minimum engine version of **1.26.0** |
| Script API | `@minecraft/server` **2.10.0** |
| Packs | Both the Behavior Pack and Resource Pack must be active |
| Experiments | No experimental Script API dependency is intended |
| Multiplayer | Supported; HUD preferences and targeting are handled per player |

The project is currently version **0.1.0** and should be treated as a public beta while it receives broader survival and add-on compatibility testing.

## Installation

### Using the packaged `.mcaddon`

1. Download the latest `.mcaddon` from the project's [Releases page](https://github.com/ByCesarDev/Infernal-Mobs/releases).
2. Open the file with Minecraft. Bedrock should import both packs automatically.
3. Create a world or edit an existing one.
4. Activate **Infernal Mobs BP** under Behavior Packs.
5. Confirm that the linked **Infernal Mobs RP** is also active under Resource Packs.
6. Enter the world and use `/infernalmobs:info` to verify that the script initialized correctly.

### Installing the source packs manually

Copy the two folders inside `InfernalMobsBedrock-source/` into the appropriate Bedrock development pack directories:

- `Infernal Mobs BP` → `development_behavior_packs`
- `Infernal Mobs RP` → `development_resource_packs`

Activate both packs on the same world. The Behavior Pack declares the Resource Pack as a dependency, so they are intended to be used together.

> [!NOTE]
> Administrator commands require operator permission. Commands that change gameplay settings also require cheats to be enabled by Minecraft.

## How infernal mobs are generated

When an eligible hostile entity spawns, the add-on performs a sequence of rarity rolls:

1. **Elite roll:** by default, the mob has a `1 / 15` chance to become infernal.
2. **Ultra upgrade:** a successful Elite has a `1 / 7` chance to upgrade to Ultra.
3. **Infernal upgrade:** a successful Ultra has a `1 / 7` chance to upgrade to Infernal.

The default modifier counts are:

| Generated tier | Modifier count |
|---|---:|
| Elite | 2–4 |
| Ultra | 5–8 |
| Infernal | 8–12 |

For presentation, the HUD derives the visible label from the final number of modifiers:

| Visible label | Final modifier count |
|---|---:|
| Rare | 1–5 |
| Ultra | 6–10 |
| Infernal | 11+ |

These ranges can overlap the initially rolled tier because invalid, disabled, incompatible, or species-restricted modifiers are rejected during generation.

### Eligible entities

An entity is eligible when it is a supported hostile mob or declares the Bedrock entity family `monster`. The add-on also verifies that the entity has a health component and is not a player or a tamed entity.

Eligibility is further controlled by:

- `dimensionBlacklist`
- `entityBlacklist`
- `entityWhitelist`
- `entitiesAlwaysInfernal`

By default, the Warden, Wither, and Ender Dragon are excluded.

## Health, names, HUD, and particles

### Health scaling

Unless `healthChangesDisabled` is enabled, maximum health is calculated as:

```text
infernal maximum health = base maximum health × modifier count × modHealthFactor
```

The mob's current health is restored proportionally when it is converted and is persisted afterward. The default `modHealthFactor` is `1.0`.

### Generated names

Infernal mobs receive a generated title composed from tier, descriptive affixes, and the entity's localized name. The generated affixes are persisted, so a mob does not randomly change names when it unloads, reloads, or is viewed by a different player.

### Targeted HUD

Looking at or fighting an infernal mob displays a per-player action-bar HUD containing:

- the generated infernal name;
- every modifier, split into readable rows;
- a segmented health bar;
- current and maximum health;
- tier-specific colors.

The HUD remains visible briefly after the player loses direct aim and then expires. Players may disable it for themselves with `/infernalmobs:hud off`. Server owners can disable it globally with `hudEnabled` or suppress the health bar alone with `disableHealthBar`.

### Particle aura

Infernal mobs emit a multicolor spiral aura based on the original mod's visual language. The Resource Pack defines `infernalmobs:colored_mobspell`, a custom emitter that uses a vanilla-style particle sprite rather than introducing an unrelated visual design.

For performance, particles are emitted only when a player is within range. The normal emission rate is two particles every two ticks, or approximately 20 particles per second for an observed mob.

## Modifiers

| Modifier | Category | Behavior |
|---|---|---|
| **1UP** | Survival | Restores the mob once when it would otherwise die, consuming the modifier's one-time revival state. |
| **Alchemist** | Ranged offense | Throws tracked splash potions that collide with the world and apply distance-based effects in an impact radius. |
| **Berserk** | Offense | Increases damage output while imposing the original modifier's defensive tradeoff. |
| **Blastoff** | Control | Launches the victim upward when the mob lands a valid attack. |
| **Bulwark** | Defense | Reduces incoming damage. |
| **Choke** | Control | Drains the target's air supply; uses the breathable component when available and a safe fallback otherwise. |
| **Cloaking** | Defense | Makes the mob invisible under the modifier's combat conditions. |
| **Darkness** | Debuff | Applies Darkness to the victim. |
| **Ender** | Mobility | Teleports the mob in response to combat, following the modifier's cooldown and safety rules. |
| **Exhaust** | Debuff | Applies Mining Fatigue to reduce the victim's action speed. |
| **Fiery** | Retaliation | Ignites attackers without using a damaging lightning entity. |
| **Ghastly** | Ranged offense | Fires explosive projectiles toward the current combat target. |
| **Gravity** | Control | Pulls the target toward the infernal mob. |
| **LifeSteal** | Survival | Heals the mob for part of the damage it deals. |
| **Ninja** | Mobility | Teleports in response to damage and leaves a visual burst. |
| **Poisonous** | Debuff | Applies Poison to the victim. |
| **Quicksand** | Debuff | Applies Slowness to the victim. |
| **Regen** | Survival | Periodically regenerates health. |
| **Rust** | Equipment pressure | Damages the attacker's held equipment when applicable. |
| **Sapper** | Debuff | Applies Hunger to the victim. |
| **Sprint** | Mobility | Increases the mob's movement speed. |
| **Sticky** | Equipment pressure | Can disarm the victim and drop the affected held item. |
| **Storm** | Ranged offense | Calls real lightning against the current target. This modifier can cause normal lightning damage and fire. |
| **Unyielding** | Defense | Detects post-hit velocity changes and counters incoming knockback while preserving normal movement. |
| **Vengeance** | Retaliation | Reflects part of received damage back to the attacker. |
| **Weakness** | Debuff | Applies Weakness to the victim. |
| **Webber** | Control | Places temporary cobwebs to obstruct the victim. |
| **Wither** | Debuff | Applies the Wither effect to the victim. |

Modifier cooldowns are scaled globally by `modCooldownFactor`. Individual modifiers can also be disabled with `/infernalmobs:modifierconfig` or through the stored configuration.

## Modifier restrictions

The generator prevents combinations that would conflict mechanically:

| Modifier | Cannot coexist with |
|---|---|
| Blastoff | Webber |
| Gravity | Webber |
| Sticky | Storm |

Some modifiers are also disallowed on specific species because their behavior is ineffective, unstable, or contrary to the original design:

| Entity | Disallowed modifiers |
|---|---|
| Creeper | 1UP, Berserk, LifeSteal, Sticky |
| Spider / Cave Spider | Cloaking |

The generation system validates the final modifier set to prevent duplicate modifiers, incompatible pairs, disabled modifiers, and species violations.

## Loot and experience

When an infernal mob dies, the add-on can award:

- **25 bonus experience points** by default;
- **one bonus item roll per five modifiers**, rounded upward;
- tier-appropriate equipment and items;
- dynamically enchanted rewards where applicable.

The loot system uses separate Rare, Ultra, and Infernal tables so stronger mobs can produce better rewards. Loot and XP can be disabled independently with `lootEnabled` and `xpEnabled`.

`antiFarm` is available for servers that want additional protection against repeated or artificial reward farming.

## Commands

All commands use the `/infernalmobs:` namespace.

### Player commands

These commands are available to any player and do not require cheats.

| Command | Description |
|---|---|
| `/infernalmobs:help` | Shows the available commands and basic usage. |
| `/infernalmobs:info` | Displays add-on version and runtime information. |
| `/infernalmobs:modifier <modifier>` | Explains a specific modifier. |
| `/infernalmobs:hud <on\|off>` | Enables or disables the infernal HUD for the executing player. |

### Administrator commands

These commands require operator-level permission.

| Command | Description |
|---|---|
| `/infernalmobs:config` | Shows the current configuration. |
| `/infernalmobs:set <option> <value>` | Changes a supported configuration option. |
| `/infernalmobs:modifierconfig <modifier> <on\|off>` | Enables or disables one modifier globally. |
| `/infernalmobs:make [rare\|ultra\|infernal\|random]` | Converts an eligible mob in the crosshair into the selected tier. |
| `/infernalmobs:setmods <modifiers>` | Replaces the targeted infernal mob's modifiers with a comma- or space-separated list. Quote the argument when needed. |
| `/infernalmobs:remove` | Removes infernal status from the targeted mob. |
| `/infernalmobs:reroll` | Generates a new valid modifier set for the targeted infernal mob. |
| `/infernalmobs:scan [radius]` | Reports infernal mobs within the requested radius. |
| `/infernalmobs:debug` | Toggles or reports diagnostic behavior. |
| `/infernalmobs:reload` | Reloads stored configuration without restarting the world. |
| `/infernalmobs:resetconfig confirm` | Restores the default configuration. The confirmation argument prevents accidental resets. |

Examples:

```mcfunction
/infernalmobs:make infernal
/infernalmobs:setmods "storm, regen, bulwark, unyielding"
/infernalmobs:modifier alchemist
/infernalmobs:set eliteRarity 20
/infernalmobs:modifierconfig webber off
/infernalmobs:scan 64
```

The `/make` conversion effect uses sound and electric particles only. It deliberately does **not** summon a real lightning bolt, so converting a mob cannot damage it or set the area on fire. The **Storm** modifier is different: Storm intentionally uses real lightning as part of its attack.

## Configuration

Configuration is stored in the world and survives reloads. Use `/infernalmobs:config` to inspect active values and `/infernalmobs:set` to change supported scalar options.

| Option | Default | Type | Description |
|---|---:|---|---|
| `eliteRarity` | `15` | Positive integer | One eligible mob in this many passes the initial Elite roll. |
| `ultraRarity` | `7` | Positive integer | One Elite in this many upgrades to Ultra. |
| `infernoRarity` | `7` | Positive integer | One Ultra in this many upgrades to Infernal. |
| `modHealthFactor` | `1.0` | Positive number | Global multiplier in the infernal health formula. |
| `maxDamage` | `10.0` | Positive number | Caps applicable modifier-driven damage. |
| `modCooldownFactor` | `1.0` | Positive number | Multiplies modifier cooldown durations. |
| `healthChangesDisabled` | `false` | Boolean | Prevents infernal conversion from changing maximum health. |
| `disableHealthBar` | `false` | Boolean | Hides the segmented health bar while retaining other HUD information. |
| `hudEnabled` | `true` | Boolean | Enables the targeted infernal HUD globally. |
| `namesEnabled` | `true` | Boolean | Enables generated infernal names. |
| `lootEnabled` | `true` | Boolean | Enables bonus item rewards. |
| `xpEnabled` | `true` | Boolean | Enables bonus experience rewards. |
| `antiFarm` | `false` | Boolean | Enables anti-farming reward restrictions. |
| `debug` | `false` | Boolean | Enables additional diagnostic output. |
| `dimensionBlacklist` | `[]` | String array | Dimension identifiers in which natural infernal conversion is disabled. |
| `entityBlacklist` | Warden, Wither, Ender Dragon | String array | Entity identifiers that may never convert naturally. |
| `entityWhitelist` | `[]` | String array | Optional explicit eligibility filter. Empty means normal detection rules apply. |
| `entitiesAlwaysInfernal` | `[]` | String array | Entity identifiers that always attempt infernal conversion. |
| `modsEnabled` | `{}` | Modifier map | Per-modifier enable/disable overrides. Missing entries use the normal enabled state. |

Supported `/infernalmobs:set` options are:

```text
eliteRarity, ultraRarity, infernoRarity, modHealthFactor, maxDamage,
modCooldownFactor, healthChangesDisabled, disableHealthBar, hudEnabled,
namesEnabled, lootEnabled, xpEnabled, antiFarm, debug
```

List-based advanced settings remain part of the persisted configuration model but are not exposed through the scalar `/set` command.

## Compatibility with other add-ons

Infernal Mobs is designed to recognize custom hostile entities without maintaining a hard-coded list for every add-on. A custom creature can participate in natural infernal generation when it:

1. declares `"monster"` in its `minecraft:type_family` component;
2. has a valid health component;
3. is not tamed and is not a player;
4. is not rejected by an Infernal Mobs blacklist or whitelist rule.

Example:

```json
{
  "minecraft:type_family": {
    "family": ["monster", "my_addon_creature"]
  }
}
```

This makes compatibility automatic for add-ons that follow Bedrock's normal entity-family conventions. Custom entities with unusual damage, movement, inventory, or breathable behavior may still require modifier-specific testing.

## Bedrock adaptations and parity notes

Java Edition and Bedrock Edition expose different engine hooks. The following systems preserve the original gameplay intent while using stable Bedrock mechanisms.

### Combat target memory

The stable Script API does not provide every Java-style mob attack-target hook. Infernal Mobs therefore records recent valid combat interactions and maintains short-lived target memory. Modifiers such as Storm, Ghastly, Gravity, and Alchemist can use that target consistently without scanning unrelated players.

### Choke and air supply

Choke prefers `EntityBreathableComponent.airSupply` when the entity type exposes a writable breathable component. Capability is cached per entity type. If Bedrock does not expose compatible air state for a target, the modifier uses a controlled fallback so it remains functional without repeatedly throwing component errors.

### Alchemist projectiles

Alchemist throws a visible physical splash potion rather than applying an effect instantly. The script tracks its flight, detects impact, uses a **4.125-block** splash radius, and applies continuous distance falloff. This preserves the expected projectile telegraph and rewards players for moving away from the impact point.

### Unyielding knockback resistance

Stable Bedrock scripting does not expose a universal writable knockback-resistance attribute for arbitrary vanilla entities. Unyielding stores the mob's pre-hit velocity, observes the post-hit velocity delta, and applies a counter-impulse only to the knockback component. Normal walking, falling, jumping, and existing movement are preserved. Short-lived snapshots are pruned and removed when the entity dies or unloads.

### Cosmetic and real lightning

Administrative conversion uses harmless electric particles and sound. Storm remains an offensive modifier and summons real lightning, including Minecraft's normal consequences. Keeping these paths separate prevents test commands from accidentally injuring or igniting the mob being configured.

### Persistent state

Infernal state uses world/entity dynamic properties with an internal schema version. The stored data includes modifier selection, generated name affixes, current infernal health, one-time 1UP state, and cooldown-related state. This prevents chunk reloads from silently rerolling or resetting established mobs.

## Project structure

```text
Infernal-Mobs/
├── InfernalMobsBedrock-source/
│   ├── Infernal Mobs BP/
│   │   ├── manifest.json
│   │   └── scripts/
│   │       ├── config/
│   │       ├── core/
│   │       ├── data/
│   │       ├── modifiers/
│   │       └── main.js
│   └── Infernal Mobs RP/
│       ├── manifest.json
│       ├── particles/
│       ├── texts/
│       └── pack_icon.png
├── tools/
│   ├── check-project.js
│   ├── pack.js
│   ├── setup-mock.js
│   └── test-generation.js
├── package.json
└── README.md
```

The exact internal module layout may evolve, but the project deliberately separates configuration, persistent state, generation logic, modifier behavior, resource definitions, validation, and packaging.

## Development

### Prerequisites

- A current Node.js release suitable for the repository's tooling
- npm
- Minecraft Bedrock Edition for in-game validation
- A code editor with JavaScript and JSON support

### Install dependencies

```bash
npm install
```

### Validate the project

```bash
npm run check
```

This validates project structure, manifests, scripts, and other repository invariants.

### Run automated tests

```bash
npm test
```

The `pretest` step prepares the local Script API mock, then the test suite verifies generation and consistency behavior.

### Build the add-on

```bash
npm run pack
```

The packaging tool produces the distributable add-on from the source Behavior Pack and Resource Pack.

### Recommended contribution workflow

1. Fork the repository and create a focused branch.
2. Keep modifier logic isolated from unrelated systems.
3. Preserve existing world-state compatibility whenever possible.
4. Add or update automated checks for changed generation rules.
5. Run `npm run check`, `npm test`, and `npm run pack` before submitting a pull request.
6. Describe any deliberate difference from the original Java behavior.

Issues and pull requests are welcome at [ByCesarDev/Infernal-Mobs](https://github.com/ByCesarDev/Infernal-Mobs).

## Testing and validation

The repository includes automated validation for the areas most likely to regress during development:

- JavaScript syntax and module integrity;
- manifest and pack dependency correctness;
- modifier registration and lookup;
- rarity and modifier-count generation;
- duplicate prevention;
- incompatibility enforcement;
- species restriction enforcement;
- health-scaling invariants;
- packaging completeness.

Generation has also been stress-tested across **100,000 simulated mobs** to detect duplicate modifiers, forbidden combinations, blacklist violations, and health formula errors.

Automated tests are not a replacement for in-game testing. Changes involving velocity, projectiles, particles, entity components, death events, chunks, or multiplayer visibility should be tested in a real Bedrock world.

## Troubleshooting

### No infernal mobs appear

- Confirm that both packs are active on the same world.
- Run `/infernalmobs:info` and check the Content Log for script startup errors.
- Verify that the dimension and entity are not blacklisted.
- Remember that the default initial chance is only `1 / 15` for eligible spawns.
- Use `/infernalmobs:make random` on a mob in your crosshair to test conversion directly.

### A custom add-on mob never becomes infernal

- Confirm that its entity definition includes the `monster` family.
- Confirm that it exposes a health component.
- Check `entityBlacklist`, `entityWhitelist`, and `dimensionBlacklist`.
- Make sure the entity is not considered tamed.

### The HUD does not appear

- Run `/infernalmobs:hud on`.
- Ask an operator to verify that `hudEnabled` is `true`.
- Look directly at the infernal mob or engage it in combat.
- Check whether another add-on is continuously replacing the action bar.

### A modifier does not generate

- Check `/infernalmobs:modifierconfig <modifier> on`.
- Review the incompatibility and species-restriction tables above.
- Remember that rerolling always validates the complete modifier set.

### Lightning damages or ignites an entity

The `/make` conversion animation is cosmetic and should not cause damage. The Storm modifier intentionally uses real lightning and can damage entities or start fires according to normal Minecraft rules.

### Commands are unavailable

- Public commands should work for any player once the pack is loaded.
- Configuration and mutation commands require operator permission.
- Minecraft may require cheats for commands that change world or entity state.

### Existing mobs behave incorrectly after updating

Make a backup before changing add-on versions. Run `/infernalmobs:reload`, inspect the Content Log, and test a newly generated infernal mob. If only previously saved mobs are affected, include the old and new add-on versions plus reproduction steps in a GitHub issue.

## Localization

The Resource Pack currently includes:

- English (United States): `en_US`
- Spanish (Spain): `es_ES`
- Spanish (Mexico): `es_MX`

Contributions for additional languages are welcome. Keep command identifiers and modifier IDs unchanged; translate user-facing names, descriptions, messages, and help text.

## Credits and permission

- **Original mod and design:** [AtomicStryker](https://github.com/AtomicStryker)
- **Original source repository:** [AtomicStryker's Minecraft Mods](https://github.com/AtomicStryker/atomicstrykers-minecraft-mods)
- **Original Infernal Mobs page:** [CurseForge](https://www.curseforge.com/minecraft/mc-mods/atomicstrykers-infernal-mobs)
- **Bedrock port:** [CesarDev / ByCesarDev](https://github.com/ByCesarDev)
- **Bedrock source repository:** [ByCesarDev/Infernal-Mobs](https://github.com/ByCesarDev/Infernal-Mobs)

This Bedrock port was created with explicit permission from AtomicStryker to use the original project's resources. That permission applies to this project and should not be interpreted as a blanket grant for unrelated redistribution or relicensing. Consult the repository owner before reusing protected project assets outside the terms provided by the project.

Minecraft is a trademark of Microsoft Corporation. This project is not affiliated with, endorsed by, or sponsored by Mojang Studios or Microsoft.

---

<p align="center">
  <strong>Ordinary monsters are only the beginning.</strong>
</p>
