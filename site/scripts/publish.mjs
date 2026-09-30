// Copies the built site to the repository root, which GitHub Pages serves.
// fonts/ and media/ live at the root already (public/ symlinks to them).
import { cpSync, rmSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, "../dist")
const root = resolve(here, "../..")

if (!existsSync(resolve(dist, "index.html"))) throw new Error("run the build first")

rmSync(resolve(root, "assets"), { recursive: true, force: true })
cpSync(resolve(dist, "assets"), resolve(root, "assets"), { recursive: true })
for (const f of ["index.html", "favicon.svg", "home-mark.png", "icons.svg"]) {
  if (existsSync(resolve(dist, f))) cpSync(resolve(dist, f), resolve(root, f))
}
console.log("published to repository root")
