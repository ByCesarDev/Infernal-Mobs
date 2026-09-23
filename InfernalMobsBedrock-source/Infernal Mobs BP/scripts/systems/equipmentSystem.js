/**
 * Infernal Mobs Bedrock - Equipment & Durability System
 * Handles item damaging (Rust) and item disarming (Sticky)
 */

import { EquipmentSlot } from "@minecraft/server";
import { isEntityValid } from "../util/entity.js";

const ARMOR_SLOTS = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet
];

export function getEquippable(entity) {
  if (!isEntityValid(entity)) return undefined;
  try {
    return entity.getComponent("minecraft:equippable");
  } catch {
    return undefined;
  }
}

export function getMainHandItem(entity) {
  const equippable = getEquippable(entity);
  if (!equippable) return undefined;
  try {
    return equippable.getEquipment(EquipmentSlot.Mainhand);
  } catch {
    return undefined;
  }
}

export function setMainHandItem(entity, itemStack) {
  const equippable = getEquippable(entity);
  if (!equippable) return false;
  try {
    return equippable.setEquipment(EquipmentSlot.Mainhand, itemStack);
  } catch {
    return false;
  }
}

/**
 * Damages the item in the entity's main hand by `damageAmount`
 * Returns true if the item took damage or broke
 */
export function damageMainHandItem(entity, damageAmount) {
  const equippable = getEquippable(entity);
  if (!equippable) return false;

  try {
    const item = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (!item) return false;

    const durability = item.getComponent("minecraft:durability");
    if (!durability) return false; // Item cannot be damaged (e.g. block or cookie)

    const newDamage = durability.damage + damageAmount;
    if (newDamage >= durability.maxDurability) {
      // Item breaks
      equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
    } else {
      durability.damage = newDamage;
      equippable.setEquipment(EquipmentSlot.Mainhand, item);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Finds the first damageable piece of armor and damages it by `damageAmount`
 * Follows Java parity (damages one piece of armor on player hit)
 */
export function damageFirstArmorPiece(entity, damageAmount) {
  const equippable = getEquippable(entity);
  if (!equippable) return false;

  try {
    for (const slot of ARMOR_SLOTS) {
      const item = equippable.getEquipment(slot);
      if (!item) continue;

      const durability = item.getComponent("minecraft:durability");
      if (!durability) continue;

      const newDamage = durability.damage + damageAmount;
      if (newDamage >= durability.maxDurability) {
        equippable.setEquipment(slot, undefined);
      } else {
        durability.damage = newDamage;
        equippable.setEquipment(slot, item);
      }
      return true; // Damage applied to one piece of armor, stop as Java does
    }
  } catch {
    return false;
  }
  return false;
}
