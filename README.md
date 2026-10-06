# joseqc.com

Personal site of José A. Fernández Abreu, Materials & Process Engineer (Collins Aerospace). One page, six chapters
(Engineering, Chemistry, Microbiology, Environmental science, IT, Data integrity), each built around a simulated,
interactive figure whose numbers are computed, never animated. Static HTML, CSS and JavaScript; three.js draws the
WebGL figures on a single shared canvas, and every figure has a correct poster or DOM state without JavaScript.

## Build

Requires Node 20 or newer.

```sh
cd site
npm ci
npm run build        # production build, written to the repository root
```

`npm run build` regenerates `index.html`, `404.html`, `favicon.svg`, `assets/`, `posters/` and `js/` at the repository
root (it empties `assets/`, `posters/` and `js/` first, so stale hashed files never pile up), then checks the facts,
the ledger, budgets and the page lint. Commit the source changes and the regenerated root files together.

Other scripts (run in `site/`):

| Script | What it does |
|---|---|
| `npm run dev` | Full build into `site/.build/www`, rebuilt on every change, served at http://localhost:8080/. `npm run dev -- --chapter it` builds one chapter's dev page (`dev-it.html`, with a HUD). |
| `npm run lint` | Lints the built root page: copy rules, glyphs, figure anatomy, readouts = facts, no "Prototype", no `noindex`. |
| `npm run check` | Browser harness on the built root page (desktop, phone, reduced-motion phone): zero renders at rest, no console errors or failed requests, readouts = ledger = facts, layout. Add `-- --full` for the 320–1920 px sweep and fallback profiles. |
| `npm run facts` | Recomputes every number shown on the page from `data/facts.json`. |

`lint` and `check` use Playwright (a dev dependency). Install its browser once with `npx playwright install chromium`.
Without it, the build still succeeds and skips the rendered lint with a warning.

## Where things live

```
CNAME, .nojekyll          GitHub Pages: custom domain, serve files as is
index.html, 404.html      built pages (generated, committed)
favicon.svg, assets/,     built files: fonts, late stylesheet, posters, JavaScript bundles
posters/, js/             (generated, content-hashed, committed)
site/                     source
  build.mjs               the assembler (esbuild): pages, CSS, bundles, posters, lint, budgets
  site.config.mjs         chapter order, site strings, Immutable QC copy gate
  data/facts.json         every number on the page (single source); facts.assert.mjs recomputes them
  shell/                  page shell: HTML, CSS, icons, main.js, the shared WebGL stage
  chapters/NN-slug/       one folder per chapter: chapter.html/css/js/json, models, scenes, poster sources
  fonts/                  self-hosted OFL fonts (Archivo, Newsreader, IBM Plex Mono) and their licenses
  tools/                  lint, check, budgets, glyph tables, colour-vision check, one-off font tool
  README-BUILDERS.md      the detailed contract for editing chapters, figures and the stage
```

## Deployment

GitHub Pages deploys the `main` branch from the repository root, with no build step on GitHub: whatever is committed
at the root is the live site at https://joseqc.com/. To publish a change, run `npm run build` in `site/`, check the
result locally (for example `npm run check`), and commit the source and the regenerated root files together.
