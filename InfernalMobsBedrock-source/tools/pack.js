import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const bpDir = existsSync(join(root, "Infernal Mobs BP")) ? "Infernal Mobs BP" : "behavior_pack";
const rpDir = existsSync(join(root, "Infernal Mobs RP")) ? "Infernal Mobs RP" : "resource_pack";
const dist = join(root, "dist");
const behaviorArchive = join(dist, "InfernalMobsBedrock-BP.mcpack");
const resourceArchive = join(dist, "InfernalMobsBedrock-RP.mcpack");
const addonArchive = join(dist, "InfernalMobsBedrock.mcaddon");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

function runZip(archivePath, cwd, entries) {
  try {
    if (cwd) {
      execFileSync("zip", ["-q", "-r", archivePath, "."], { cwd });
    } else {
      execFileSync("zip", ["-q", "-j", archivePath, ...entries]);
    }
    return;
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  // Fallback to bsdtar (built-in on Windows 10/11) with explicit zip format
  try {
    if (cwd) {
      execFileSync("tar", ["--format", "zip", "-c", "-f", archivePath, "*"], { cwd });
    } else {
      execFileSync("tar", ["--format", "zip", "-c", "-f", archivePath, "-C", dist, "InfernalMobsBedrock-BP.mcpack", "InfernalMobsBedrock-RP.mcpack"]);
    }
    return;
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  // Fallback to powershell Compress-Archive
  const tempZip = archivePath + ".temp.zip";
  if (cwd) {
    execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${cwd}/*' -DestinationPath '${tempZip}' -Force; Move-Item -Path '${tempZip}' -Destination '${archivePath}' -Force`]);
  } else {
    execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${behaviorArchive}','${resourceArchive}' -DestinationPath '${tempZip}' -Force; Move-Item -Path '${tempZip}' -Destination '${archivePath}' -Force`]);
  }
}

zipDirectory(join(root, bpDir), behaviorArchive);
zipDirectory(join(root, rpDir), resourceArchive);
runZip(addonArchive, null, [behaviorArchive, resourceArchive]);
cpSync(join(root, "README.md"), join(dist, "README.md"));
cpSync(join(root, "LICENSE-NOTICE.md"), join(dist, "LICENSE-NOTICE.md"));
console.log(`Created:
- ${behaviorArchive}
- ${resourceArchive}
- ${addonArchive}`);

function zipDirectory(source, target) {
  runZip(target, source);
}
