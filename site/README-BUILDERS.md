# joseqc.com — builder's guide

The working contract between the shell (DS lead) and the six chapter teams: the commands, what the build does with
your files, and the stage / figure API. (Written against the design documents BRIEF-C, SYSTEM-C and SPEC-C, which
are not part of this repository; section references such as "SPEC-C §14" point there.)

Paths below are relative to `site/`, and every command runs from `site/` after `npm ci`. `<out>` is the build's output
folder: `--out=<dir>` (relative to `site/`), default `.build/www`; `npm run build` uses `--out=..`, the repository root.

## 1. Commands

```sh
cd site
npm run build                           # production: node build.mjs --out=..  -> ../index.html, ../404.html, ../js/ …
npm run dev                             # full build into .build/www, rebuilt on change, served at http://localhost:8080/
node build.mjs                          # FULL build -> <out>/index.html, <out>/404.html, <out>/js/, .build/build-report.json
                                        #   generators in CHECK mode, ledger verify, static + rendered lint, budgets
node build.mjs --dev --chapter it       # your dev page -> <out>/dev-it.html (+ <out>/js-dev/it/, .build/build-report.it.json)
                                        #   runs YOUR generators in WRITE mode first
node build.mjs --gen --chapter it       # only (re)write your generated markup, no page
node build.mjs --chapter it --watch --serve   # rebuild on any change under shell/, chapters/, data/; serve <out> on :8080
node build.mjs --strict                 # budget, missing-poster and glyph warnings become errors
node build.mjs --fast                   # skip the rendered (Playwright) lint layer
node build.mjs --fonts=google           # also emit the Google Fonts links (self-hosted stays the fallback)

npm run lint                            # = node tools/lint.mjs index.html --root=..  (the production page)
node tools/lint.mjs dev-it.html         # lint a page built into .build/www (static + rendered); --no-render for static only
npm run check                           # = node tools/check.mjs index --root=..  (serves the root itself)
node tools/check.mjs dev-it             # harness on .build/www (stage, readouts, ledger, layout, HTTP errors)
node tools/check.mjs index --full       # + 320–1920 overflow sweep, no-WebGL, context loss, hidden tab, URL-bar, header
node tools/cvd.mjs index                # rendered colour-vision check of Figs. 7 and 8 (needs a server: --base=<url>)
node data/facts.assert.mjs              # every displayed number recomputed (npm run facts)
node tools/scaffold.mjs                 # writes day-0 placeholders ONLY for missing chapter files (never overwrites)
node tools/fonts.mjs --src=<dir>        # one-off: instance/copy the 5 woff2, fallback metrics, tools/glyphs.json
```

Pages are served by `npm run dev` (or `--serve`) at `http://localhost:8080/index.html` and
`http://localhost:8080/dev-<slug>.html`. Hand-run chapter tools (posters, verify) default to `--base=http://localhost:8080/`.
Playwright is a dev dependency; install its browser once with `npx playwright install chromium`.

Dev builds of different chapters can run at the same time: each writes only `.build/<slug>/`, `<out>/js-dev/<slug>/`,
`<out>/dev-<slug>.html` and `.build/build-report.<slug>.json`. A full build takes `.build/site.lock`; a second concurrent full
build fails fast.

## 2. What you own

| Team | Files |
|---|---|
| DS lead | `build.mjs`, `site.config.mjs`, `data/facts.json`, `data/facts.assert.mjs`, `shell/**`, `tools/**`, `fonts/**`, this file |
| ENG / CHEM / MICRO / ENV / IT / DI | `chapters/NN-slug/**` (everything in your directory, including `chapter.json` after day 0) |

Never edit another team's file. Need a shell change, a new three.js export, a new icon, a facts key? Ask the DS lead
(hand-off), or put it in your own directory where the build already looks for it:

- **Your own asserts**: `chapters/NN-slug/facts.assert.mjs` exporting `default (facts, { eq, ok }) => results[]` is run
  by `data/facts.assert.mjs` on every build (see §7). New *keys* in `facts.json` still go through the DS lead.
- **Your own figure-internal colours**: `--plate-*` custom properties in your `chapter.css` (§5).

The day-0 placeholders (`chapter.html/css/js` carrying `PLACEHOLDER (DS lead, day 0)`) are yours to replace wholesale.

## 3. `chapter.json`

```json
{ "slug": "chemistry", "code": "chem", "no": "02", "nav": "Chemistry", "navShort": "Chemistry", "years": "2018–2025",
  "contents": "SFWMD · City of Boca Raton", "indexContents": "…optional, the dialog row (defaults to contents)…",
  "band": false,
  "figures": [ { "id": "burette", "kind": "gl", "states": ["above","level","below"], "initial": "level", "final": "level",
                 "reduced": "tri", "sizes": "(min-width:1024px) 40vw, calc(100vw - 32px)" },
               { "id": "calibration", "kind": "dom", "states": ["drawn"], "final": "drawn" } ],
  "facts": ["chem.burette", "chem.cal"], "generators": ["tools/calibration-svg.mjs"] }
```

- Figure numbers come from these `figures` lists in site order (`site.config.mjs`), never from HTML. Adding a figure
  renumbers everything (ledger links included). The locator, index dialog, contents list and dev pages are generated
  from these files.
- `initial` (GL only): the picture shown before the intro plays (Fig. 1 `polished`). The build adds a CSS rule so that
  poster shows from first paint when motion is on; the authored HTML stays in the `final` state.
- `reduced`: name of the small-multiples poster state shown instead of the final poster under reduced motion / Motion off.
- `band: true` (chapter 06): the build adds `ch-band on-resin` to your root section.
- `generators`: the ONLY scripts the build runs for you. `tools/posters.mjs` and `tools/ledger-sign.mjs` are run by hand
  and must never be listed here.

## 4. `chapter.html` (the fragment)

Exactly one root: `<section class="ch" id="{slug}" data-ch="{code}" aria-labelledby="…">…</section>`. Anatomy and
order (SYSTEM-C §4.4; DOM order = phone order, the desktop grid places the figure, never reorder with CSS):

```html
<section class="ch" id="chemistry" data-ch="chem" aria-labelledby="chem-t">
  <div class="seam" aria-hidden="true"></div>
  <header class="ch-head">
    <p class="kicker"><span class="no">02</span> — Chemistry <span class="yrs">· 2018–2025</span></p>
    <h2 id="chem-t">Read it at eye level.</h2>
    <ul class="roles"><li><span class="org">City of Boca Raton</span> <i>Lead Wastewater Analyst</i> <span class="yr">2018–2024</span></li></ul>
  </header>
  <blockquote class="pull">optional</blockquote>
  <div class="ch-body"><p>≤ 90 words</p></div>
  <figure class="fig fig--plate" …>…</figure>        <!-- desktop: columns 7–12, top-aligned with the title -->
  <figure class="fig fig--mini" …>…</figure>         <!-- optional, text column -->
  <details class="methods"><summary><span class="k">Methods</span> · ≤ 40 characters in total</summary><p>…</p></details>
  <p class="bridge">optional</p>
</section>
```

Placeholders (an unresolved `{{…}}` fails the build):

| Placeholder | Output |
|---|---|
| `{{fig:burette}}` | `Fig. 3` |
| `{{figref:burette}}` | `<a href="#fig-burette">Fig. 3</a>` (on a dev page, another chapter's figure links to `index.html#fig-…`) |
| `{{fact:chem.burette}}` / `{{fact:chem.burette.above}}` / `{{fact:micro.key.control.log}}` | the fact's `value` / that field, HTML-escaped |
| `{{sci:micro.key.control.cfuSci}}` | `1.86 × 10<sup>6</sup>` |
| `{{poster:burette level "alt text"}}` | `<picture class="poster" data-for="level">` with AVIF srcset + fallback `<img width height>` (see §6) |
| `{{icon:check}}` | `<svg class="i" aria-hidden="true"><use href="#i-check"/></svg>`. Icons: `arrow-ne arrow-r check cross replay chevron dot mark` |
| `{{site.email}}`, `{{site.linkedin}}`, `{{site.iqcSentence}}`, `{{site.now.role}}` … | strings from `site.config.mjs` |
| `{{#if site.iqcVisit}}…{{/if}}` | conditional block (not nested). `site.iqcVisit` follows gate G6a |
| `{{asset:img/x.png}}` | content-hashed copy in `<out>/assets/`, path relative to your directory |
| `{{contents}}` | the hero "In this page" list (Engineering only) |
| `<!--gen:NAME:start-->…<!--gen:NAME:end-->` | generator output region (§8); markers are stripped from the page |

The first figure of the site (Fig. 1) automatically gets `data-hero-figure` (used by `tools/check.mjs`) and eager,
high-priority loading of its `initial` poster.

## 5. CSS conventions

- `chapter.css`: every selector starts with `[data-ch=code]` or `#slug` (`html.motion [data-ch=code] …` is also
  accepted). Lint fails otherwise.
- Use ONLY the semantic tokens: `--surface --plate --fg --fg-2 --hair --a --a-mark --a-fill --a-on --a-hover --fail`
  (+ `--steel`, `--rule`, `--ground`, `--paper`, `--ink` neutrals). They switch automatically on resin (`.on-resin`).
  No hex literals, except inside figure-internal custom properties named `--plate-*` (e.g. `--plate-agar-0: #EFE4BC`),
  which the DS lead reviews.
- Heights: never `vh`, `dvh`, `lvh` or raw `svh` (lint). Use `calc(var(--svh) * 100 - 256px)`. Height-capped plates
  use `--aspect` on the figure (`style="--aspect: 4/5"`); `.fig--plate .plate` is already capped to
  `calc(var(--svh) * 100 - var(--header) - 200px)` on desktop. The figure computes that capped width once as `--pw`
  from ITS OWN `--aspect` (never below 400 px) and takes it as the FIGURE's own max-width, so the plate, readout,
  controls and caption share one right edge and `@container fig` sees the plate width, not the column (on a short
  desktop window your narrow rules apply). Declare `--aspect` on the `figure`, never only on `.plate` (a figure without it keeps its
  parts at the column width; `tools/check.mjs --full` flags a readout or control that runs past its plate).
- Type roles are global (`h2`, `h3`, `.kicker`, `.readout`, `figcaption`, `.ctrl button`, `.corner`); do not restyle them.
  Mono everywhere in figures (`var(--mono)`), tabular numbers.
- Motion: only `transform`, `opacity`, `stroke-dashoffset`. Gate entry styles on `html.motion` / the `.pre` class your
  `arm()` adds. No `animation-timeline`. Controls are hidden without JS (`html:not(.js) .ctrl`), Replay without motion.
- Glyphs: the three Latin subsets have no Greek capitals, no θ, ≈, Δ, arrows or ticks (`tools/glyphs.json`). CSS
  `text-transform: uppercase` (corners, kickers, readout labels, buttons) turns µ into Greek capital Μ (U+039C), which
  is NOT in the fonts: write `<span class="nt">µ</span>` (no transform) inside uppercase contexts. The same `.nt` span
  keeps case-sensitive units and symbols honest in corners, labels and statuses: `<span class="nt">mL</span>` (ML is
  megalitre), `72 <span class="nt">h</span>` (H is henry), `<span class="nt">r</span> 0.9998`, `<span class="nt">UV-Vis</span>`. Write "angle" or
  "theta" for θ, "about" for ≈, and use `{{icon:…}}` for arrows and ticks. Plex Mono ships no italic: avoid `<i>` in mono
  text (it would be synthesized). The rendered lint checks every character after text-transform.
- With JS on, every chapter (chapter 01 too: on a phone it starts below the hero), `#contact` and the footer are
  `content-visibility:auto` (placeholder `contain-intrinsic-size` 1400 px, 400 px for contact and footer):
  its `innerText` is empty until it renders. Tools and verify scripts must scroll to the figure first (main.js lays all
  chapters out before an anchor jump, hash load or print). IntersectionObservers in later chapters fire once the
  chapter starts rendering.
- Container queries: every `figure.fig` is `container: fig / inline-size`, so `@container fig (width < 330px)` works.
- Icon-only Replay under 330 px is shell CSS: write `<button class="replay" aria-label="Replay">{{icon:replay}}<span class="rt">Replay</span></button>`.
- Print: every top-level `@media print` block (shell and chapters) is moved by the build into `assets/late.HASH.css`,
  with shell/print.css, shell/dialog.css (the index dialog), shell/footer.css (contact + footer), the forced-colors
  indications (pressed figure control, current locator chapter) and the Newsreader italic face. main.js adds that sheet after
  the load event + idle (a `<noscript>` link covers no-JS; the index button awaits it), so none of it counts against the
  12 KB inline CSS or the first load (≤ 160 KB, ≤ 8 requests: HTML, four fonts, main, the two Fig. 1 posters). Until it
  lands, italic text is the regular face slanted; keep italics out of the first screen. Budget unit: KB = 1024 bytes.
- `/* late:start */ … /* late:end */` in shell or chapter CSS moves those rules into late.css too. Use it only for rules
  that cannot matter before late.css lands: hover-only polish, `html:not(.js)` rules (the no-JS `<noscript>` link is
  render-blocking), and fallback paths. A figure whose fallback rules are late carries `data-needs-late`, which makes
  main.js load late.css as the figure comes within 1.5 screens (Fig. 8's no-`crypto.subtle` branch does this).
- Posters: a poster that cannot show is `display:none` (generated CSS), so it is never fetched early: with motion on,
  the reduced-motion small multiples; with motion off or no JS, every state but the current one until `html.late`.
- Lazy chunks must not import modules the eager bundle also imports (facts.json, models, dom-figure.js) and the site's JS
  uses no `import * as` namespace objects: either would make esbuild split a shared chunk that `main` then fetches on
  first load. Hand such things to the lazy module through the figure element or `attach()` (`fig.__field`, `fig.__burette`).
  The build reports `first load requests` (budget 8).
- Grid: desktop (≥ 1024) `.ch` is a 12-column grid with full-bleed outer tracks (lines 2–14 = columns 1–12, `1 / -1` =
  full bleed). Text defaults to columns 1–5; `.fig--plate` to 7–12 rows 2–10; `.ch-band` mirrors it. `.fig-band` is a
  full-bleed resin band (`.band-in` inside: figure 1–6, text 8–12).

## 6. Figure frame (SYSTEM-C §3.2)

```html
<figure class="fig fig--plate" id="fig-burette" data-fig="burette" data-kind="gl"
        data-states="above level below" data-state="level" data-final="level" style="--aspect: 4/5">
  <div class="plate">
    <div class="host">{{poster:burette above "…"}}{{poster:burette level "…"}}{{poster:burette below "…"}}</div>
    <span class="corner tl">{{fig:burette}}</span><span class="corner tr">0.1 mL div.</span>
    <span class="corner bl">50 mL burette</span><span class="corner br">Simulated</span>
  </div>
  <div class="readout" aria-hidden="true"><span class="lbl">Reading</span> <b class="val" style="--w:5ch"
    data-fact-readout="chem.burette">{{fact:chem.burette}}</b> <span class="unit">mL</span><span class="lead"></span>
    <span class="status is-true">At eye level</span></div>
  <div class="ctrl" role="group" aria-label="Look from"><button type="button" aria-pressed="false" data-set="above">Above</button>…
    <button type="button" class="replay">{{icon:replay}}Replay</button></div>
  <p class="sr-only" aria-live="polite" data-live></p>
  <figcaption><b>{{fig:burette}}</b> · … · simulated. … Shown: <span class="state">level</span>.</figcaption>
</figure>
```

- Author the **final** state (`data-state` = `data-final`); no-JS and first paint must be correct.
- Multi-row readouts: wrap each in `<div class="row">`. Status: `.is-true` (accent) / `.is-fail` (+ word + icon).
- Posters: files `chapters/NN/posters/<id>-<state>-<width>.(avif|webp|png)` (e.g. `burette-level-720.avif`,
  `burette-level-1200.avif`, `burette-level-720.webp`). The build hashes and copies them to `<out>/posters/` and writes
  width/height from the file. Missing posters render a hatched placeholder and a warning (an error under `--strict`).
  Capture them from your dev page with `await __stage.capture(id, state, widthPx)` (returns a PNG data URL rendered by
  the live scene, same code as the page) or with `dev-<slug>.html?poster=<state>&w=<px>` + `__stage.idle`.
- The ledger (Fig. 8) rows carry `data-key="<facts key>"` with `.val` and `.unit` children; lint and check compare
  them with the figure readouts and `facts.json`.

## 7. Facts

`data/facts.json` is the single source (values exactly as SPEC-C §11). In HTML use `{{fact:…}}`; in JS
`import facts from '../../data/facts.json'` (it is also passed to `setup()`). The bundle gets ONLY the keys listed in
your `chapter.json` `"facts"` plus the ledger rows, with `_*` fields stripped: list every key your JS reads. Editorial
notes live in `site.config.mjs` (`iqcNotes`, build-only), and a build check fails on editorial or crypto words in shipped JS. Numbers never animate; a readout's resting
text must equal its fact (lint + check).

Adding asserts without touching DS files: create `chapters/NN-slug/facts.assert.mjs`:

```js
export default function (facts, { eq, ok }) {
  const k = facts['env.key']
  eq('env: hover apex 20.6 µS', (2.610 / 0.126826).toFixed(1), '20.6')   // name, got, want
  ok('env: Rs ≥ 1.5', 1.555 >= 1.5)                                       // name, condition
}
```

`eq`/`ok` record into the shared result list; any failure stops the build with the name, got and want.

## 8. Generators

`export default async function gen({ facts, root }) { return [{ marker: 'f5c', html: '<svg…>' }] }` — pure and
deterministic (no network, no unseeded randomness, no keys, no browser). The build replaces the text between
`<!--gen:f5c:start-->` and `<!--gen:f5c:end-->` in **your** `chapter.html`: written on `--chapter <you>` builds,
compared (and failed if stale: "stale generated markup: node build.mjs --gen --chapter <slug>") on full builds.

Ledger: the build recomputes r/h from `facts.json` and compares them with
`chapters/06-data-integrity/ledger-data.json` (missing or stale: full build and DI builds fail; other dev builds warn).
While chapter 06 is still the day-0 placeholder a missing ledger is only a notice.

## 9. The stage (one renderer, many figures)

`chapter.js` default-exports `setup({ stage, facts, root, dev, params })`. It is eager and small: it registers figures
and wires controls. Heavy code goes behind `load()`. The stage owns the only WebGL2 context, canvas, renderer and rAF
loop; it moves the canvas to the most visible GL host, runs each figure's intro once (one at a time, document order),
handles cold caps (GL 2.5 s / DOM 1.2 s after a figure holds the intro lock), reduced motion / save-data / Motion off
/ no WebGL (posters, three.js never fetched), context loss and the quality ladder.

### 9.1 GL figure (controller + scene)

```js
// chapters/02-chemistry/chapter.js
import { wireControls, announce } from '../../shell/stage/dom-figure.js'
import { reading } from './burette.model.js'                      // pure maths: the DOM is right without WebGL
export default function setup({ stage, root }) {
  const fig = root.querySelector('#fig-burette')
  const val = fig.querySelector('[data-fact-readout]')
  const show = (s) => { c.pressed(s); val.textContent = reading(s) }
  const c = wireControls(fig, { onSet: (s) => { show(s); stage.setState('burette', s); announce(fig, `Looking from ${s}: ${reading(s)} millilitres.`) } })
  stage.register({
    id: 'burette', kind: 'gl', fig, host: fig.querySelector('.host'),
    states: ['above', 'level', 'below'], initial: 'level', final: 'level',
    load: () => import('./burette.gl.js'),
    intro: { at: 0.4, delay: 450, maxMs: 2600 },
    pointer: 'fine-hover',                       // the stage forwards mouse events over the plate to scene.pointer()
    onState(snap) { if (snap.state) show(snap.state) },  // called on every snapshot change (and at boot, readout null)
  })
}
```

```js
// chapters/02-chemistry/burette.gl.js (lazy). three ONLY via the shell re-export:
import { Scene, OrthographicCamera, Mesh, ShaderMaterial } from '../../shell/stage/three.js'
import { Chan, stepAll, snapAll } from '../../shell/stage/channels.js'
export function create(env) {   // env: { renderer, tokens:{fg,fg2,plate,surface,a,aMark,hair}, coarse, fine,
                                //        quality:{level,scale}, shared: Map, nextTask(), compile(r,scene,cam), fig, host, id, motion }
  return {
    async init(renderer) { /* build; await env.nextTask() between heavy steps; await env.compile(renderer, scene, camera) */ },
    resize(w, h, dpr) {},                         // CSS px + effective dpr; never call renderer.setSize/setPixelRatio
    setState(s, { animate = true } = {}) {},      // discrete state; animate or jump
    intro() {},                                   // the one-time entry sequence; must end in data-final
    step(now) { return false },                   // advance channels; true while anything moves
    draw() {},                                    // setRenderTarget(null), setClearColor, render — everything it relies on
    snapshot() { return { state: 'level', poster: 'level', readout: null } }, // poster = state name only at rest
    rest() {}, snap() {},                         // nearest poster-backed state / finish all motion now
    pointer(e, rect) {},                          // optional (fine mouse over the plate only)
    async restore(renderer) {},                   // after context restore: re-upload CanvasTextures, re-bake RTs
    dispose() {}, stats() { return { drawCalls: 1, triangles: 1 } },
    scale(coarse) { return 1 },                   // optional internal resolution scale (B: 0.75 on coarse)
  }
}
```

A complete, working scene implementing every method is `shell/stage/demo.gl.js` (the day-0 placeholders use it).
Rules: no rAF, timers, window listeners, `setSize`/`setPixelRatio` in scenes; no depth buffer (order with
`renderOrder`; a scene that needs depth renders to its own target); colours from `env.tokens`, never hex literals.
Zero renders at rest: `step()` must return false once nothing moves (fixed-duration tweens, not long exponential tails).

`stage.setState(id, s)` after updating the DOM: if the canvas is live on that host it animates, otherwise the poster
swaps (cross-fade, instant under reduced motion) and the scene catches up next time it is attached.
`stage.replay(id)` replays the intro (motion on only). `stage.motion()` / `stage.onMotion(fn)` expose the motion state.

### 9.2 DOM / SVG figure

```js
import { anim, draw, fadeIn, finished, stopAll, timers, wireControls, announce } from '../../shell/stage/dom-figure.js'
export default function setup({ stage, root }) {
  const fig = root.querySelector('#fig-layers')
  const t = timers()
  const c = wireControls(fig, { onSet: (s) => { set(fig, s); stage.setState('layers', s) }, onReplay: () => stage.replay('layers') })
  function set(el, s) { el.dataset.state = s; c.pressed(s) /* + readout text, live sentence */ }
  stage.registerDom({
    id: 'layers', kind: 'dom', fig, final: 'trace', intro: { at: 0.4, delay: 250 },
    load: () => import('./heavy.js'),                    // optional (the ledger)
    arm(el) { el.classList.add('pre') },                 // only called when motion is on AND the figure starts below the fold
    play(el) { el.classList.remove('pre'); draw(el.querySelector('.l1'), { dur: 240 }); /* … */ return finished(el) },
    settle(el) { t.clear(); stopAll(el); el.classList.remove('pre'); set(el, 'trace') },   // final state now, 0 animations left
    set,                                                 // used by ?state= and by stage.setState
  })
}
```

The stage calls `settle()` on: boot for every figure it does not arm (reduced motion / Motion off / above the fold /
`?intro=0`), leaving the screen mid-intro or while queued, a hidden tab (running or queued), the cold cap (1.2 s after the
lock is free for it), the 6 s backstop, any button press during the intro, and after `play()` resolves. `settle()` must
therefore be idempotent and safe before `play()` ever ran.
No rAF ever; timers only write text or start WAAPI animations and `settle()` must clear them.

### 9.3 Stats

`window.__stage` (alias `window.__proto`, read by `tools/check.mjs`): `renderer, renders, frames, cpuMs, quality, reason,
roForwarded, losses, idle, introLog, state()`. `state()` = active host, lock holder, MP, draw calls, per-figure
`id:kind:state` (`*` = not played yet, `>` = intro running, `@ratio` = visible).

## 10. Dev pages

`dev-<slug>.html` = shell + your chapter + contact + footer, unminified with sourcemaps, `__DEV__ = true`, and a HUD
(bottom right; `?hud=0` hides it). Query parameters:

| Param | Effect |
|---|---|
| `?state=<s>` | every figure that has state `s` starts in it (no intro) |
| `?intro=0` | no intros; everything in its final state, GL still live |
| `?motion=0` | Motion off for this load (posters, three.js never fetched) |
| `?quality=L0..L3` | force a quality ladder level (L3 = posters) |
| `?qa=1` | quality ladder runs even on software GL; logs its windows |
| `?poster=<s>&w=<px>` | poster capture: no intro, no fade, preserved drawing buffer, canvas at `w` device px |
| `?slow=10` | every channel tween 10× slower (review aid) |

Cross-chapter links on dev pages go to `index.html#…`. The DI dev page works alone (it reads `facts.json`).

## 11. Lint (`tools/lint.mjs`, run by every build)

Sources: chapter.css scoping and hex, banned viewport units, `animation-timeline`, `from 'three'` outside
`shell/stage/three.js`, scroll listeners, rAF in chapter code. Page (static DOM with JS off, then rendered DOM with JS on
at 1440 and 390): client corrections 2026-10-06 — `tokeniz` exactly once, in the IQC tagline `[data-iqc=tagline]`
("Immutable QC — Tokenized lab data."); `blockchain` exactly once, in the selected S-sentence `[data-iqc=sentence]`;
`Filecoin` exactly once, in the roadmap line `[data-iqc=roadmap]` (starts "Next:"); all inside the one `[data-once=iqc]`
block (full and DI pages; 0 elsewhere); tagline, sentence and status adjacent and equal to facts `iqc.*` / site.config;
no customer / client / pilot / deploy / production / chain name in the IQC block; banned words (token(s), wallet, stake,
crypto, on-chain, chain(s) except "chain of custody", Sepolia, Ethereum, NFT, web3, coin(s), ERC-20, trading, shot peen,
CV / résumé, compliance ready, cannot be altered, guaranteed, lowercase immutable, airworthy, TrueChem, voice bans…) in text, attributes, title, meta, JSON-LD and template content; unaccented name; Spanish once;
glyphs (no ≥ → ≈ ✓ ✗ ◆ ▾ ● ⁻ ⁰ ₁ ^ in text, no `%` right after a digit, every rendered character in its face's cmap
from `tools/glyphs.json`, after `text-transform`); `.ch-body` ≤ 90 words, titles ≤ 8, pull/bridge ≤ 14, methods summary
≤ 40 characters; every figure: four corners, BR SIMULATED, TL `Fig. N`, caption starts `Fig. N`, says simulated,
≤ 40 words, GL posters per state with width/height, `.ctrl` role=group + label, 44 × 44 buttons, `aria-pressed`,
readout `aria-hidden`; resting `[data-fact-readout]` = facts; ledger cells = readouts = facts.

## 12. Check (`tools/check.mjs`)

`node tools/check.mjs <index|dev-slug> [out-prefix] [--full]` prints one JSON line per profile (desktop 1440×900,
Pixel 7 at 4× CPU, iPhone 13 reduced motion) with the prototype harness's fields (`rendersAtRest, firstScreen,
stats, layout{overflowX, canvases, h1, drawCalls, triangles, pixelRatio, cpuMs, quality}, errors`) plus
`framesAtRest`, `scrollRest` (renders/frames over 3 s idle at every figure), `animationsAtRest`, `stage`, `readouts`
(each `[data-fact-readout]` vs facts) and `ledger` (cell = readout = facts). `--full` adds the overflow sweep
(320–1920), header at 320/360, no-WebGL, forced context loss, hidden tab and the URL-bar (pinned `--svh`) test.
Screenshots go to `<out-prefix>-<profile>-*.png` (default `.build/check/`).
