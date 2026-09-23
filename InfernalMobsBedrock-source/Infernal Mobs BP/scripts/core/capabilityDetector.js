/**
 * Infernal Mobs Bedrock - Runtime Capability Detector
 * Dynamically tests engine feature availability without relying on hardcoded versions
 */

let cachedAirSupplyStatus = null;

/**
 * Checks if the breathable component on the provided entity supports readable and writable airSupply
 * @param {import("@minecraft/server").Entity} [entity] Optional entity to test against
 * @returns {boolean}
 */
export function checkAirSupplyCapability(entity) {
  if (cachedAirSupplyStatus !== null) {
    return cachedAirSupplyStatus;
  }

  if (!entity) {
    // If no entity provided yet, default to false until tested on first living entity
    return false;
  }

  try {
    const breathable = entity.getComponent("minecraft:breathable");
    if (!breathable) return false;

    // Check if property exists and can be read
    if ("airSupply" in breathable && typeof breathable.airSupply === "number") {
      const original = breathable.airSupply;
      // Test if writing is allowed
      breathable.airSupply = original;
      cachedAirSupplyStatus = true;
      return true;
    }
  } catch {
    cachedAirSupplyStatus = false;
    return false;
  }

  cachedAirSupplyStatus = false;
  return false;
}

export function getChokeBackendName(entity) {
  return checkAirSupplyCapability(entity) ? "native" : "simulated";
}
