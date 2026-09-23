/**
 * Infernal Mobs Bedrock - Vector Math Utility
 */

export function distance(a, b) {
  return Math.sqrt(distanceSquared(a, b));
}

export function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function horizontalDistance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 1e-6) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function normalizeHorizontal(v) {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len < 1e-6) return { x: 0, z: 0 };
  return { x: v.x / len, z: v.z / len };
}
