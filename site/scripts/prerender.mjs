// Renders the app to static HTML and injects it into dist/index.html so
// crawlers and link previews see the content. The client bundle hydrates it.
import { readFileSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, "../dist")
const ssr = pathToFileURL(resolve(here, "../dist-ssr/entry-server.js")).href

const { render } = await import(ssr)
const html = render()

const file = resolve(dist, "index.html")
const template = readFileSync(file, "utf8")
if (!template.includes("<!--app-html-->")) {
  throw new Error("dist/index.html has no <!--app-html--> marker")
}
writeFileSync(file, template.replace("<!--app-html-->", html))
console.log(`prerendered ${html.length.toLocaleString()} chars into dist/index.html`)
