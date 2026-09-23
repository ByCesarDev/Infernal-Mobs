import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const bpDir = existsSync(join(root, "Infernal Mobs BP")) ? "Infernal Mobs BP" : "behavior_pack";
const rpDir = existsSync(join(root, "Infernal Mobs RP")) ? "Infernal Mobs RP" : "resource_pack";

const required = [
  `${bpDir}/manifest.json`,
  `${bpDir}/scripts/main.js`,
  `${rpDir}/manifest.json`,
  `${rpDir}/texts/languages.json`
];

for (const file of required) {
  if (!existsSync(join(root, file))) throw new Error(`Falta ${file}`);
}

const files = walk(root);
for (const file of files.filter((path) => path.endsWith(".json"))) {
  JSON.parse(readFileSync(file, "utf8"));
}
for (const file of files.filter((path) => path.endsWith(".js"))) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

const bp = JSON.parse(readFileSync(join(root, bpDir, "manifest.json"), "utf8"));
const rp = JSON.parse(readFileSync(join(root, rpDir, "manifest.json"), "utf8"));
const uuids = [bp.header.uuid, ...bp.modules.map((m) => m.uuid), rp.header.uuid, ...rp.modules.map((m) => m.uuid)];
if (new Set(uuids).size !== uuids.length) throw new Error("Hay UUID duplicados en los manifests");
const resourceDependency = bp.dependencies.find((d) => d.uuid === rp.header.uuid);
if (!resourceDependency) throw new Error("El Behavior Pack no enlaza el Resource Pack");

console.log(`Proyecto válido: ${files.length} archivos revisados.`);

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    if (name === "node_modules" || name === "dist") return [];
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
