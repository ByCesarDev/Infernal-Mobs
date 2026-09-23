import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const bpDir = existsSync(join(root, "Infernal Mobs BP")) ? "Infernal Mobs BP" : "behavior_pack";
const rpDir = existsSync(join(root, "Infernal Mobs RP")) ? "Infernal Mobs RP" : "resource_pack";
const dist = join(root, "dist");
const stage = join(dist, "stage");
const behaviorArchive = join(stage, "InfernalMobsBedrock-BP.mcpack");
const resourceArchive = join(stage, "InfernalMobsBedrock-RP.mcpack");
const addonArchive = join(dist, "InfernalMobsBedrock.mcaddon");

rmSync(dist, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

zipDirectory(join(root, bpDir), behaviorArchive);
zipDirectory(join(root, rpDir), resourceArchive);
execFileSync("zip", ["-q", "-j", addonArchive, behaviorArchive, resourceArchive]);
cpSync(join(root, "README.md"), join(dist, "README.md"));
cpSync(join(root, "LICENSE-NOTICE.md"), join(dist, "LICENSE-NOTICE.md"));
console.log(addonArchive);

function zipDirectory(source, target) {
  execFileSync("zip", ["-q", "-r", target, "."], { cwd: source });
}
