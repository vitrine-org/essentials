// Adds what `vitrine-widget build` does not copy yet (the pack `icon` named in vitrine.json) to
// dist/, and with --zip packs dist/ into <name>-<version>.vitrine like `vitrine-widget pack`.
//
//   vitrine-widget build && node scripts/assets.mjs [--zip]
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const m = JSON.parse(readFileSync(join(root, "vitrine.json"), "utf8"));

if (m.icon) {
  const src = join(root, m.icon);
  if (!existsSync(src)) throw new Error(`missing icon ${m.icon}`);
  mkdirSync(dirname(join(dist, m.icon)), { recursive: true });
  cpSync(src, join(dist, m.icon));
}

if (process.argv.includes("--zip")) {
  const files = (dir) =>
    readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
  const entries = Object.fromEntries(files(dist).map((p) => [relative(dist, p).split(sep).join("/"), readFileSync(p)]));
  const name = `${m.id.split(".").pop()}-${m.version}.vitrine`;
  writeFileSync(join(root, name), zipSync(entries, { level: 9 }));
  console.log(`packed ${name} (${Object.keys(entries).length} files)`);
}
