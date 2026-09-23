/**
 * Infernal Mobs Bedrock - Runtime Capability Detector
 * Dynamically tests engine feature availability without relying on hardcoded versions
 */

/** @type {Map<string, boolean>} */
const airSupplySupportByType = new Map();

/**
 * Checks if the breathable component on the provided entity supports readable and writable airSupply
 * Cached per entity typeId to avoid global cache poisoning across different mob types
 * @param {import("@minecraft/server").Entity} [entity] Entity to test against
 * @returns {boolean}
 */
export function checkAirSupplyCapability(entity) {
  if (!entity || !entity.typeId) {
    return false;
  }

  const typeId = entity.typeId;
  if (airSupplySupportByType.has(typeId)) {
    return airSupplySupportByType.get(typeId);
  }

  try {
    const breathable = entity.getComponent("minecraft:breathable");
    if (!breathable) {
      airSupplySupportByType.set(typeId, false);
      return false;
    }

    // Check if property exists and can be read and written
    if ("airSupply" in breathable && typeof breathable.airSupply === "number") {
      const original = breathable.airSupply;
      breathable.airSupply = original;
      airSupplySupportByType.set(typeId, true);
      return true;
    }
  } catch {
    airSupplySupportByType.set(typeId, false);
    return false;
  }

  airSupplySupportByType.set(typeId, false);
  return false;
}

export function getChokeBackendName(entity) {
  return checkAirSupplyCapability(entity) ? "native" : "simulated";
}
