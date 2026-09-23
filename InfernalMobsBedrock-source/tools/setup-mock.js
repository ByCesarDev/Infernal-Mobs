import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const mockSrc = resolve(root, "tools/mock-minecraft.js");
const mockDest = resolve(root, "node_modules/@minecraft/server/index.js");

if (existsSync(mockSrc)) {
  mkdirSync(dirname(mockDest), { recursive: true });
  copyFileSync(mockSrc, mockDest);
  console.log("Mock @minecraft/server configured successfully.");
}
