#!/usr/bin/env node
// build.mjs (DS lead) — the Path C assembler. SPEC-C §12.3, SYSTEM-C §6.3.
//
//   node build.mjs                         full build: index.html + 404.html, js/, generators in CHECK mode, site lock
//   node build.mjs --dev --chapter it      dev page dev-it.html (+ js-dev/it/), X's generators in WRITE mode
//   node build.mjs --gen --chapter it      write X's generated markup only (no page)
//   flags: --strict (budget / poster / glyph warnings fail) · --watch · --fonts=google · --fast (skip the rendered lint)
//          --no-lint · --out=<dir> · --serve[=port]
//
// Output: every page and emitted folder (index.html, 404.html, dev-*.html, favicon.svg, assets/, posters/, js/, js-dev/)
// goes to --out (relative to this folder; default .build/www). `npm run build` is --out=.. : the repository root, which
// GitHub Pages serves as is. A full build first empties <out>/assets, <out>/posters and <out>/js (hashed files only
// accumulate otherwise). Build scratch (bundle entries, late.css, the lock, build-report*.json) stays in .build/.
//
// Dependencies: esbuild + three (site/package.json). Generators are resolved ONLY from chapter.json "generators".
import * as esbuild from 'esbuild'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, copyFileSync, openSync, closeSync, unlinkSync, statSync, watch } from 'node:fs'
import { dirname, join, relative, resolve, basename, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

const C = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (f) => argv.includes(f)
const opt = (f) => { const i = argv.findIndex((a) => a === f || a.startsWith(f + '=')); if (i < 0) return null; return argv[i].includes('=') ? argv[i].split('=')[1] : argv[i + 1] }
const ARGS = { dev: flag('--dev'), chapter: opt('--chapter'), gen: flag('--gen'), strict: flag('--strict'), watch: flag('--watch'), fonts: opt('--fonts') || 'self', fast: flag('--fast'), lint: !flag('--no-lint'),
  out: opt('--out'), serve: argv.some((a) => a === '--serve' || a.startsWith('--serve=')) ? (Number(opt('--serve')) || 8080) : 0 }
const OUT = ARGS.out ? resolve(C, ARGS.out) : join(C, '.build/www')

const read = (p) => readFileSync(p, 'utf8')
const gz = (s) => gzipSync(typeof s === 'string' ? Buffer.from(s) : s, { level: 9 }).length
const hash8 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const kb = (n) => (n / 1024).toFixed(1)

class BuildError extends Error {}
const log = { errors: [], warnings: [], notices: [] }
const fail = (m) => { log.errors.push(m) }
const warn = (m) => { log.warnings.push(m) }
const note = (m) => { log.notices.push(m) }

// ------------------------------------------------------------------------------------------------ 1. load
async function load() {
  const cfg = await import(pathToFileURL(join(C, 'site.config.mjs')).href + `?t=${Date.now()}`)
  const chapters = cfg.chapters.map((dir) => {
    const p = join(C, 'chapters', dir, 'chapter.json')
    if (!existsSync(p)) throw new BuildError(`missing ${relative(C, p)}`)
    const j = JSON.parse(read(p))
    for (const k of ['slug', 'code', 'no', 'nav', 'years', 'figures']) if (j[k] == null) throw new BuildError(`${dir}/chapter.json: "${k}" is required`)
    return { ...j, dir, path: join(C, 'chapters', dir), short: j.navShort || j.nav }
  })
  const facts = JSON.parse(read(join(C, 'data/facts.json')))
  const assertFacts = (await import(pathToFileURL(join(C, 'data/facts.assert.mjs')).href + `?t=${Date.now()}`)).default
  // run after step 2, so a --chapter / --gen build writes its generated markup before the asserts (some chapters assert
  // that their generated markup is current) instead of failing on the stale copy it is about to replace
  const runAsserts = async () => { try { return await assertFacts(facts) } catch (e) { throw new BuildError(e.message) } }
  // figure numbering from chapter.json in site order (never from HTML): identical in full and dev builds
  const figs = new Map()
  let n = 0
  for (const ch of chapters) for (const f of ch.figures) {
    if (figs.has(f.id)) throw new BuildError(`figure id "${f.id}" declared twice`)
    figs.set(f.id, { ...f, n: ++n, chapter: ch })
  }
  // derived site strings: the IQC sentence + links follow the §15 gate record (or the prototype override)
  const sid = cfg.iqcSentenceOverride || cfg.selectIqcSentence(cfg.iqcGate)
  if (cfg.iqcSentenceOverride) note(`IQC sentence override ${cfg.iqcSentenceOverride} active (gate record selects ${cfg.selectIqcSentence(cfg.iqcGate)})`)
  const site = { ...cfg.site, iqcSentenceId: sid, iqcSentence: cfg.iqcSentences[sid], iqcVisit: cfg.iqcGate.G6a === true, iqcCodeLink: cfg.iqcGate.G6b === true && !!cfg.site.iqcCode }
  return { cfg, chapters, facts, runAsserts, figs, site }
}

// ------------------------------------------------------------------------------------------------ 2. generators
const MARK = (name) => new RegExp(`(<!--gen:${name}:start-->)([\\s\\S]*?)(<!--gen:${name}:end-->)`)
async function generators(ch, facts, mode) {
  const out = []
  for (const g of ch.generators || []) {
    const p = join(ch.path, g)
    if (!existsSync(p)) { note(`${ch.dir}: generator ${g} not written yet (skipped)`); continue }
    const mod = await import(pathToFileURL(p).href + `?t=${Date.now()}`)
    const res = await mod.default({ facts, root: ch.path })
    const htmlPath = join(ch.path, 'chapter.html')
    let html = existsSync(htmlPath) ? read(htmlPath) : ''
    let changed = false
    for (const { marker, html: gen } of res || []) {
      const re = MARK(marker)
      const m = html.match(re)
      if (!m) { fail(`${ch.dir}/chapter.html: missing <!--gen:${marker}:start--> … <!--gen:${marker}:end--> for ${g}`); continue }
      if (m[2] === gen) continue
      if (mode === 'check') fail(`stale generated markup (${ch.dir}, ${marker}): node build.mjs --gen --chapter ${ch.slug}`)
      else { html = html.replace(re, (_, a, __, b) => a + gen + b); changed = true }
    }
    if (changed) { writeFileSync(htmlPath, html); out.push(g) }
  }
  return out
}

// ------------------------------------------------------------------------------------------------ 3. ledger verify
function ledgerVerify(facts, ctx) {
  const p = join(C, 'chapters/06-data-integrity/ledger-data.json')
  const sev = ctx.scope === 'full' || ctx.slug === 'data-integrity' ? fail : warn
  const diHtml = join(C, 'chapters/06-data-integrity/chapter.html')
  const day0 = existsSync(diHtml) && read(diHtml).includes('PLACEHOLDER (DS lead, day 0)')
  if (!existsSync(p)) {
    if (day0) note('ledger not built yet (chapter 06 is still the day-0 placeholder; a full build requires ledger-data.json once DI lands)')
    else if (ctx.scope === 'full' || ctx.slug === 'data-integrity') fail('ledger missing: DI runs node chapters/06-data-integrity/tools/ledger-sign.mjs (§12.4)')
    else note('ledger not built yet (step 3 skipped)')
    return { status: 'missing' }
  }
  const H = (s) => createHash('sha256').update(s, 'utf8').digest('hex')
  let data
  try { data = JSON.parse(read(p)) } catch (e) { sev(`ledger-data.json unreadable: ${e.message}`); return { status: 'unreadable' } }
  let prev = '0'.repeat(64)
  const problems = []
  facts.ledger.rows.forEach((key, i) => {
    const f = facts[key], rec = (data.records || [])[i] || {}
    const r = H(`fig-${f.fig}|${f.label}|${f.value}|${f.unit}`), h = H(prev + r + String(i + 1))
    if (rec.r !== r || rec.h !== h || (rec.prev != null && rec.prev !== prev)) problems.push(`record ${String(i + 1).padStart(2, '0')} (${key})`)
    prev = h
  })
  if (data.anchor !== prev) problems.push('anchor')
  if (/"d"\s*:/.test(read(p))) problems.push('private key material ("d") in ledger-data.json')
  if (problems.length) { sev(`ledger stale (${problems.join(', ')}): DI runs node chapters/06-data-integrity/tools/ledger-sign.mjs (§12.4)`); return { status: 'stale', problems } }
  return { status: 'ok', anchor: prev }
}

// ------------------------------------------------------------------------------------------------ assets + posters
function makeAssets() {
  const map = new Map()
  return {
    url(abs) {
      if (map.has(abs)) return map.get(abs)
      if (!existsSync(abs)) { fail(`asset not found: ${relative(C, abs)}`); return 'missing' }
      const buf = readFileSync(abs)
      const name = `${basename(abs, extname(abs))}.${hash8(buf)}${extname(abs)}`
      const dir = join(OUT, 'assets'); mkdirSync(dir, { recursive: true })
      const out = join(dir, name)
      if (!existsSync(out)) writeFileSync(out, buf)
      const u = `assets/${name}`
      map.set(abs, u)
      return u
    },
    files: map,
  }
}
function imageSize(buf) {
  const s = buf.toString('latin1', 0, 32)
  if (s.startsWith('\x89PNG')) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  if (s.startsWith('RIFF') && s.slice(8, 12) === 'WEBP') {
    const k = s.slice(12, 16)
    if (k === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
    if (k === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
    if (k === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 } }
  }
  const i = buf.indexOf('ispe')
  if (i > 0) return { w: buf.readUInt32BE(i + 8), h: buf.readUInt32BE(i + 12) }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2
    while (o < buf.length) { const m = buf[o + 1]; const len = buf.readUInt16BE(o + 2); if (m >= 0xc0 && m <= 0xc3) return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) }; o += 2 + len }
  }
  return null
}
function posterHtml(ctx, ch, id, state, alt) {
  const fig = ctx.figs.get(id)
  if (!fig) { fail(`${ch.dir}: {{poster:${id} …}} for an undeclared figure`); return '' }
  const dir = join(fig.chapter.path, 'posters')
  const re = new RegExp(`^${id}-${state}-(\\d+)\\.(avif|webp|png|jpe?g)$`)
  const files = existsSync(dir) ? readdirSync(dir).map((f) => [f, f.match(re)]).filter(([, m]) => m) : []
  if (!files.length) {
    ctx.missingPosters.push(`${id}/${state}`)
    return `<div class="poster poster--missing" data-for="${esc(state)}" role="img" aria-label="${esc(alt)}"></div>`
  }
  const avif = files.filter(([, m]) => m[2] === 'avif').sort((a, b) => a[1][1] - b[1][1])
  const fall = files.filter(([, m]) => m[2] !== 'avif').sort((a, b) => a[1][1] - b[1][1])
  const pick = fall[0] || avif[0]
  const buf = readFileSync(join(dir, pick[0]))
  const dim = imageSize(buf) || { w: +pick[1][1], h: +pick[1][1] }
  const copy = (f) => {
    const b = readFileSync(join(dir, f)), name = `${basename(f, extname(f))}.${hash8(b)}${extname(f)}`
    mkdirSync(join(OUT, 'posters'), { recursive: true })
    if (!existsSync(join(OUT, 'posters', name))) writeFileSync(join(OUT, 'posters', name), b)
    ctx.posterBytes.set(name, { bytes: b.length, w: +f.match(re)[1], ext: f.match(re)[2], fig: id, state })
    return `posters/${name}`
  }
  const sizes = fig.sizes || (fig.n === 1 ? '(min-width:1024px) 560px, 358px' : '(min-width:1024px) 40vw, calc(100vw - 32px)')
  const hero = fig.n === 1
  const prio = hero && state === (fig.initial || fig.final) ? ' fetchpriority="high"' : ''
  const src = avif.length ? `<source type="image/avif" srcset="${avif.map(([f, m]) => `${copy(f)} ${m[1]}w`).join(', ')}" sizes="${sizes}">` : ''
  const fallSet = fall.length > 1 ? ` srcset="${fall.map(([f, m]) => `${copy(f)} ${m[1]}w`).join(', ')}" sizes="${sizes}"` : ''
  return `<picture class="poster" data-for="${esc(state)}">${src}<img src="${copy(pick[0])}"${fallSet} width="${dim.w}" height="${dim.h}" alt="${esc(alt)}" decoding="async" loading="${hero ? 'eager' : 'lazy'}"${prio}></picture>`
}

// ------------------------------------------------------------------------------------------------ 4. placeholders
function lookup(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) }
function factOf(facts, path) {
  const parts = path.split('.')
  for (let i = parts.length; i > 0; i--) {
    const key = parts.slice(0, i).join('.')
    if (key in facts) { const rest = parts.slice(i); return rest.length ? lookup(facts[key], rest.join('.')) : facts[key].value }
  }
  return undefined
}
function resolve$(text, ctx, where, ch) {
  // conditionals first: {{#if path}}…{{/if}} (not nested)
  text = text.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, p, body) => {
    const v = p.startsWith('site.') ? lookup(ctx.site, p.slice(5)) : p.startsWith('build.') ? lookup(ctx.build, p.slice(6)) : undefined
    return v ? body : ''
  })
  return text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (all, body) => {
    const m = body.match(/^(\w+)(?::([\s\S]*))?$/) || body.match(/^(site|build)\.([\w.]+)$/)
    let k = body.includes(':') ? body.slice(0, body.indexOf(':')) : body.split('.')[0]
    let arg = body.includes(':') ? body.slice(body.indexOf(':') + 1).trim() : body.split('.').slice(1).join('.')
    void m
    switch (k) {
      case 'fig': { const f = ctx.figs.get(arg); if (!f) break; return `Fig. ${f.n}` }
      case 'figref': {
        const f = ctx.figs.get(arg); if (!f) break
        const local = ctx.scope === 'full' || (ch && f.chapter.slug === ch.slug)
        return `<a href="${local ? '' : 'index.html'}#fig-${arg}">Fig. ${f.n}</a>`
      }
      case 'fact': { const v = factOf(ctx.facts, arg); if (v == null || typeof v === 'object') break; return esc(v) }
      case 'sci': { const v = factOf(ctx.facts, arg); if (!v || v.m == null) break; return `${esc(v.m)} × 10<sup>${String(v.e).replace('-', '−')}</sup>` }
      case 'icon': if (!ctx.icons.has(arg)) break; return `<svg class="i" aria-hidden="true"><use href="#i-${arg}"/></svg>`
      case 'asset': { const base = ch ? ch.path : join(C, 'shell'); return ctx.assets.url(resolve(base, arg)) }
      case 'poster': {
        const pm = arg.match(/^([\w-]+)\s+([\w-]+)\s+"([^"]*)"$/)
        if (!pm || !ch) break
        return posterHtml(ctx, ch, pm[1], pm[2], pm[3])
      }
      case 'contents': return ctx.contents
      case 'site': { const v = lookup(ctx.site, arg); if (v == null || typeof v === 'object') break; return esc(v) }
      case 'build': { const v = lookup(ctx.build, arg); if (v == null) break; return String(v) }
    }
    fail(`${where}: unresolved ${all}`)
    return all
  })
}

// ------------------------------------------------------------------------------------------------ 5. generated shell parts
function shellParts(ctx, page) {
  const { chapters, site } = ctx
  const dev = page.kind === 'dev', nf = page.kind === '404'
  // the 404 page is served at any depth (/a/b): its links go to the home page, and nothing is "current"
  const cur = nf ? null : page.chapter || chapters[0]
  const href = (slug) => (nf ? site.base : dev && slug !== cur.slug ? 'index.html' : '') + '#' + slug
  const N = String(chapters.length).padStart(2, '0')
  // label slots are as wide as the longest name (Plex Mono: one character = 1ch + tracking), so nothing in the header moves
  const lw = Math.max(...chapters.map((c) => [...c.nav].length)), sw = Math.max(...chapters.map((c) => [...c.short].length))
  const locator = `<nav class="loc" aria-label="Chapters" style="--lw:${lw}"><ol>${chapters.map((c) => `<li data-ch="${c.code}"><a href="${href(c.slug)}" data-slug="${c.slug}"${c === cur ? ' aria-current="location"' : ''}><span class="n">${c.no}</span><span class="sr-only"> ${esc(c.nav)}</span></a></li>`).join('')}</ol><span class="loc-lbl" aria-hidden="true"><span class="sep">·</span><span class="v">${cur ? esc(cur.nav) : ''}</span></span></nav>`
  const contentsHref = nf ? `${site.base}#contents` : dev && cur.slug !== chapters[0].slug ? 'index.html#contents' : '#contents'
  const idxbtn = cur
    ? `<a class="idx hd-mono" href="${contentsHref}" style="--lw:${lw};--sw:${sw}" aria-label="Chapter index, current: ${cur.no} ${esc(cur.nav)}"><span class="k">Index </span><span class="n">${cur.no}/${N}</span><span class="nm"><span class="sep"> · </span><span class="l">${esc(cur.nav)}</span><span class="s">${esc(cur.short)}</span></span>{{icon:chevron}}</a>`
    : `<a class="idx hd-mono" href="${contentsHref}"><span class="n">Index</span>{{icon:chevron}}</a>`
  const strip = `<div class="strip" aria-hidden="true">${chapters.map((c) => `<i data-ch="${c.code}" data-slug="${c.slug}"${c === cur ? ' class="on"' : ''}></i>`).join('')}</div>`
  const yrs = (y) => `<span class="nw">${esc(y)}</span>`
  const dialog = `<dialog class="idx-dlg" id="idx-dlg" aria-label="Chapter index"><div class="in"><div class="hd"><p class="kicker">Index</p><button class="x hd-mono" type="button">Close</button></div><ol>${chapters.map((c) => {
    const d = c.indexContents ?? c.contents
    return `<li data-ch="${c.code}"><a href="${href(c.slug)}"><span>${c.no} ${esc(c.nav)}</span><span class="d"><span class="dt">· </span>${d ? esc(d) + ' · ' : ''}${yrs(c.years)}</span></a></li>`
  }).join('')}</ol><p class="more"><a href="${nf ? site.base : ''}#contact">Contact</a><a href="mailto:${esc(site.email)}">Email</a><a href="${esc(site.linkedin)}">LinkedIn</a></p></div></dialog>`
  const contents = `<nav class="contents" id="contents" aria-label="Career chapters"><p class="kicker">In this page</p><ol>${chapters.map((c) => `<li data-ch="${c.code}"><a href="${href(c.slug)}"><span class="no">${c.no}</span> <span class="nm">${esc(c.nav)}</span><span class="lead"></span><span class="org">${esc(c.contents || '')}</span><span class="yr">${esc(c.years)}</span></a></li>`).join('')}</ol></nav>`
  return { locator, idxbtn, strip, dialog, contents }
}

// ------------------------------------------------------------------------------------------------ fragments
function fragment(ctx, ch) {
  const p = join(ch.path, 'chapter.html')
  if (!existsSync(p)) { fail(`${ch.dir}/chapter.html missing (node tools/scaffold.mjs writes a placeholder)`); return '' }
  let html = read(p).replace(/<!--(?!gen:)[\s\S]*?-->/g, '').trim()
  const root = html.match(/^<section\b([^>]*)>/)
  if (!root) { fail(`${ch.dir}/chapter.html: the fragment must have exactly one root <section class="ch" id="${ch.slug}" data-ch="${ch.code}">`); return html }
  const attrs = root[1]
  if (!/\bclass="[^"]*\bch\b/.test(attrs) || !attrs.includes(`id="${ch.slug}"`) || !attrs.includes(`data-ch="${ch.code}"`)) fail(`${ch.dir}: root must be <section class="ch" id="${ch.slug}" data-ch="${ch.code}">`)
  if ((html.match(/<\/section>/g) || []).length !== 1 || !html.endsWith('</section>')) fail(`${ch.dir}: exactly one root <section> (nested sections are not allowed)`)
  if (ch.band) html = html.replace(/^<section\b([^>]*?)class="([^"]*)"/, (_, a, cls) => `<section${a}class="${cls} ch-band on-resin"`)
  // the hero figure (first figure of the site) carries data-hero-figure for tools/check.mjs
  const first = [...ctx.figs.values()].find((f) => f.n === 1)
  if (first && first.chapter === ch) html = html.replace(new RegExp(`<figure\\b([^>]*\\bdata-fig="${first.id}")`), '<figure data-hero-figure$1')
  html = html.replace(/<!--gen:[\w-]+:(start|end)-->/g, '')
  return resolve$(html, ctx, `${ch.dir}/chapter.html`, ch)
}

// ------------------------------------------------------------------------------------------------ 6. CSS
// late.css is not inlined: the Newsreader italic face + dialog.css (index dialog) + footer.css (contact + footer, the
// page's last screens) + print.css + every chapter's @media print block. main.js adds it after the load event + idle,
// earlier when the dialog opens or the contact section comes within 1.5 screens (a <noscript> link covers no-JS). So
// neither the italic font (25 KB) nor the sheet is part of the first load (SPEC-C §14 item 34: ≤ 160 KB, ≤ 8
// requests), and inline CSS stays ≤ 12 KB.
const SHELL_CSS = ['tokens', 'fonts', 'base', 'nav', 'chapter', 'figure', 'band']
const LATE_CSS = ['dialog', 'footer', 'print'] // + the italic face; see the late.css note above
async function css(ctx, scopeChapters) {
  const parts = SHELL_CSS.map((n) => resolve$(read(join(C, 'shell', `${n}.css`)), ctx, `shell/${n}.css`, null))
  // self-hosted (the default): the Google family names that open each token stack ('Archivo', 'Newsreader', 'IBM Plex
  // Mono', there for --fonts=google) are not web fonts here, so Chrome asks the system font service for each of them
  // once per font description before it reaches the self-hosted face: ~30 blocking lookups, 35-60 ms of the first
  // layout on a 4x-throttled phone. Only --fonts=google keeps them.
  if (ARGS.fonts !== 'google') parts[0] = parts[0].replace(/(--(?:display|serif|mono):)'(?:Archivo|Newsreader|IBM Plex Mono)',\s*/g, '$1')
  const ITALIC = /@font-face\{font-family:'Newsreader C';[^}]*font-style:italic[^}]*\}/
  const italic = (parts[1].match(ITALIC) || [''])[0]
  if (!italic) warn('shell/fonts.css: no Newsreader C italic face found to defer')
  parts[1] = parts[1].replace(ITALIC, '')
  // generated: poster visibility per state, the intro's initial poster before the stage starts, reduced-motion small multiples
  const states = new Set(), gen = []
  for (const f of ctx.figs.values()) if (f.kind === 'gl') {
    f.states.forEach((s) => states.add(s))
    if (f.initial && f.initial !== f.final) gen.push(`html.motion.gl #fig-${f.id}:not(.started) .poster[data-for="${f.initial}"]{visibility:visible;opacity:1}html.motion.gl #fig-${f.id}:not(.started) .poster:not([data-for="${f.initial}"]){visibility:hidden;opacity:0}`)
    if (f.reduced && ctx.reducedPosters.has(f.id)) gen.push(`html.js:not(.motion) #fig-${f.id}[data-state="${f.final}"] .poster[data-for="${f.final}"]{visibility:hidden;opacity:0;display:none}html.js:not(.motion) #fig-${f.id}[data-state="${f.final}"] .poster[data-for="${f.reduced}"]{visibility:visible;opacity:1;display:block}`)
  }
  // posters that cannot show are display:none, so neither loading=lazy nor the stage's pre-load fetches them: with motion
  // on, the reduced-motion small multiples; with motion off (or no JS), every poster but the current one until html.late
  // (main.js, after load + idle), so a button press then finds its poster already cached
  const reduced = [...new Set([...ctx.figs.values()].filter((f) => f.kind === 'gl' && f.reduced).map((f) => f.reduced))]
  if (reduced.length) gen.push(reduced.map((r) => `html.motion .poster[data-for="${r}"]`).join(',') + '{display:none}')
  gen.push('html:not(.motion):not(.late) .poster{display:none}')
  parts.push([...states].map((s) => `.fig[data-state="${s}"] .poster[data-for="${s}"]`).join(',') + '{visibility:visible;opacity:1;display:block}', gen.join(''))
  // the hatched placeholder ships only while a poster is missing (dev; --strict fails on it)
  if (ctx.missingPosters.length) parts.push('.poster--missing{background:repeating-linear-gradient(135deg,transparent 0 9px,var(--hair) 9px 10px)}')
  for (const ch of scopeChapters) {
    const p = join(ch.path, 'chapter.css')
    if (existsSync(p)) parts.push(resolve$(read(p), ctx, `${ch.dir}/chapter.css`, ch))
  }
  // shell or chapter CSS may mark rules that cannot matter before late.css lands (hover-only polish, no-JS rules (the
  // no-JS page links late.css render-blocking in <noscript>), fallback paths such as Fig. 8's no-crypto.subtle branch)
  // with /* late:start */ … /* late:end */: they ship in late.css, not inline (README-BUILDERS, "late.css")
  let lateCh = ''
  for (let k = 0; k < parts.length; k++) parts[k] = parts[k].replace(/\/\*\s*late:start[^*]*\*\/([\s\S]*?)\/\*\s*late:end\s*\*\//g, (_, r) => { lateCh += r + '\n'; return '' })
  const raw = parts.join('\n')
  const out = await esbuild.transform(raw, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] })
  // every top-level @media print block (shell/print.css + any chapter's) moves to the print stylesheet, which the page
  // links AFTER the inline <style>, so print rules keep the last word they had in source order
  let inline = '', printBlocks = '', i = 0
  const code = out.code
  for (let m; (m = /@media print\{/g.exec(code.slice(i))); ) {
    const at = i + m.index
    let d = 0, j = at + m[0].length - 1
    for (; j < code.length; j++) { if (code[j] === '{') d++; else if (code[j] === '}' && --d === 0) break }
    inline += code.slice(i, at); printBlocks += code.slice(at, j + 1); i = j + 1
  }
  inline += code.slice(i)
  const pr = await esbuild.transform(italic + LATE_CSS.map((n) => resolve$(read(join(C, 'shell', `${n}.css`)), ctx, `shell/${n}.css`, null)).join('\n') + '\n' + lateCh, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] })
  const prFile = join(C, '.build', ctx.scope === 'full' ? 'site' : scopeChapters[0].slug, 'late.css')
  // late.css is served from assets/ itself: its asset URLs are relative to that folder
  mkdirSync(dirname(prFile), { recursive: true }); writeFileSync(prFile, (pr.code + printBlocks).replace(/url\((["']?)assets\//g, 'url($1'))
  ctx.lateCss = ctx.assets.url(prFile)
  return inline.trim()
}

// ------------------------------------------------------------------------------------------------ 7. JS
async function bundle(ctx, scopeChapters, page) {
  const dev = page.kind === 'dev'
  const tag = dev ? page.chapter.slug : 'site'
  const scratch = join(C, '.build', tag)
  mkdirSync(scratch, { recursive: true })
  const imports = [], list = []
  scopeChapters.forEach((ch, i) => {
    const p = join(ch.path, 'chapter.js')
    if (!existsSync(p)) { warn(`${ch.dir}/chapter.js missing`); return }
    imports.push(`import c${i} from ${JSON.stringify(relative(scratch, p).split('\\').join('/'))}`)
    list.push(`[${JSON.stringify(ch.slug)}, c${i}]`)
  })
  const entryName = dev ? `dev-${tag}` : 'main'
  const entry = join(scratch, `${entryName}.js`)
  writeFileSync(entry, `// GENERATED by build.mjs\nimport { boot } from ${JSON.stringify(relative(scratch, join(C, 'shell/main.js')))}\n${imports.join('\n')}\nboot([${list.join(', ')}], { dev: ${dev} })\n`)
  const outdir = dev ? join(OUT, 'js-dev', tag) : join(OUT, 'js')
  rmSync(outdir, { recursive: true, force: true })
  // the browser gets only the facts the page's code reads: every chapter.json "facts" key + the ledger rows, with no
  // "_"-prefixed (editorial) field at any depth. Text-only facts (iqc.*) are resolved into the HTML at build time.
  const need = new Set([...ctx.chapters.flatMap((ch) => ch.facts || []), ...(ctx.facts.ledger?.rows || [])])
  const strip = (v) => (Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v)
  const runtimeFacts = { name: 'runtime-facts', setup(b) {
    b.onLoad({ filter: /[\\/]data[\\/]facts\.json$/ }, () => ({ loader: 'json', contents: JSON.stringify(strip(Object.fromEntries(Object.entries(ctx.facts).filter(([k]) => need.has(k))))) }))
  } }
  const res = await esbuild.build({
    entryPoints: { [entryName]: entry }, bundle: true, splitting: true, format: 'esm', minify: !dev, sourcemap: dev ? 'linked' : false,
    target: ['es2020', 'safari15'], outdir, entryNames: '[name]-[hash]', chunkNames: 'chunks/[name]-[hash]',
    loader: { '.json': 'json', '.glsl': 'text' }, metafile: true, legalComments: 'none', define: { __DEV__: String(dev) },
    absWorkingDir: C, logLevel: 'silent', plugins: [runtimeFacts],
  }).catch((e) => { throw new BuildError(`esbuild: ${e.message}`) })
  // inputs are reported relative to this folder; output files relative to OUT (where the pages that load them live)
  const rel = (p) => relative(C, resolve(C, p)).split('\\').join('/')
  const relOut = (p) => relative(OUT, resolve(C, p)).split('\\').join('/')
  const outs = Object.entries(res.metafile.outputs).filter(([f]) => f.endsWith('.js'))
  const info = outs.map(([f, o]) => {
    const abs = resolve(C, f), buf = readFileSync(abs)
    const inputs = Object.keys(o.inputs)
    const threeBytes = inputs.filter((i) => i.includes('node_modules/three')).reduce((s, i) => s + o.inputs[i].bytesInOutput, 0)
    return { file: relOut(f), raw: buf.length, gz: gz(buf), entry: o.entryPoint ? rel(o.entryPoint) : null, threeBytes, inputs: inputs.map(rel), imports: (o.imports || []).map((x) => ({ path: relOut(x.path), kind: x.kind })), bytesByInput: Object.fromEntries(inputs.map((i) => [rel(i), o.inputs[i].bytesInOutput])) }
  })
  // shipped JS carries no internal / editorial notes and no crypto vocabulary (BRIEF-C items 3, 4): distinctive words
  // anywhere in the code, "token(s)" inside quoted string literals (the stage's `tokens` property is CSS colour tokens)
  for (const o of info) {
    const code = readFileSync(resolve(OUT, o.file), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, '')
    const hit = code.match(/hash-chained|\bcustomers?\b|fabreu08|anchorToday|_source\b|ERC-?20|\bstaking\b|\bwallets?\b|\bmainnet\b|sepolia/i)
      || (code.match(/(["'])(?:\\[\s\S]|(?!\1)[^\\\n])*\1/g) || []).map((l) => l.match(/\btokens?\b/i)).find(Boolean)
    if (hit) fail(`shipped JS ${o.file} contains "${hit[0]}" (editorial notes or crypto words must not ship; see site.config.mjs iqcNotes)`)
  }
  const main = info.find((o) => o.entry && o.entry.endsWith(`${entryName}.js`))
  const three = info.filter((o) => o.threeBytes > 0).sort((a, b) => b.threeBytes - a.threeBytes)[0] || null
  const glc = info.find((o) => o.entry === 'shell/stage/gl.js') || null
  for (const o of info) o.role = o === main ? 'main' : o === three ? 'three' : o === glc ? 'gl' : o.entry?.endsWith('.gl.js') ? 'scene' : o.entry ? 'lazy' : 'shared'
  if (info.filter((o) => o.threeBytes > 20000).length > 1) warn(`three.js is split across ${info.filter((o) => o.threeBytes > 20000).length} chunks (expected one shared chunk)`)
  return { main, three, gl: glc, chunks: info, manifest: { main: main.file, three: three && three.file, gl: glc && glc.file } }
}

// ------------------------------------------------------------------------------------------------ page assembly
function jsonld(site) {
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: site.name, jobTitle: site.role, url: site.origin + '/', email: `mailto:${site.email}`, sameAs: [site.linkedin, site.github], homeLocation: { '@type': 'Place', name: site.place } })
}
// favicon: the header mark (shell/icons.svg #i-mark) in ink on paper, written to <out>/favicon.svg
function favicon() {
  const sym = read(join(C, 'shell/icons.svg')).match(/<symbol id="i-mark" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/)
  if (!sym) { warn('shell/icons.svg: no #i-mark symbol for the favicon'); return '' }
  const tok = read(join(C, 'shell/tokens.css')), color = (k) => (tok.match(new RegExp(`--${k}:(#[0-9A-Fa-f]{3,8})`)) || [])[1]
  const [, , w, h] = sym[1].split(/\s+/).map(Number)
  writeFileSync(join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sym[1]}"><rect width="${w}" height="${h}" rx="${Math.round(w / 7)}" fill="${color('paper') || '#F5F3EE'}"/><g style="color:${color('ink') || '#131413'}">${sym[2]}</g></svg>\n`)
  return 'favicon.svg'
}
// Open Graph image: the hero figure's (Fig. 1) final-state poster, widest non-AVIF file (link previews rarely read AVIF)
function ogImage(ctx) {
  const fig = [...ctx.figs.values()].find((f) => f.n === 1)
  if (!fig) return null
  const dir = join(fig.chapter.path, 'posters'), state = fig.final
  const re = new RegExp(`^${fig.id}-${state}-(\\d+)\\.(webp|png|jpe?g)$`)
  const f = existsSync(dir) ? readdirSync(dir).filter((x) => re.test(x)).sort((a, b) => +b.match(re)[1] - +a.match(re)[1])[0] : null
  if (!f) return null
  const b = readFileSync(join(dir, f)), name = `${basename(f, extname(f))}.${hash8(b)}${extname(f)}`
  mkdirSync(join(OUT, 'posters'), { recursive: true })
  if (!existsSync(join(OUT, 'posters', name))) writeFileSync(join(OUT, 'posters', name), b)
  const alt = (read(join(fig.chapter.path, 'chapter.html')).match(new RegExp(`\\{\\{poster:${fig.id} ${state} "([^"]*)"\\}\\}`)) || [])[1] || ''
  return { url: `${ctx.site.origin}/posters/${name}`, ...(imageSize(b) || {}), alt, type: f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : 'image/jpeg' }
}
function ogMeta(ctx) {
  const s = ctx.site, img = ogImage(ctx)
  const m = [['og:type', 'website'], ['og:site_name', s.name], ['og:title', s.title], ['og:description', s.description], ['og:url', s.origin + '/'], ['og:locale', 'en_US']]
  if (img) m.push(['og:image', img.url], ['og:image:type', img.type], ['og:image:width', img.w], ['og:image:height', img.h], ['og:image:alt', img.alt])
  return m.filter(([, v]) => v != null && v !== '').map(([k, v]) => `<meta property="${k}" content="${esc(v)}">`).join('\n') + `\n<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`
}
function page(ctx, { kind, chapter, cssText, js }) {
  const parts = shellParts(ctx, { kind, chapter })
  ctx.contents = parts.contents
  const scope = kind === 'dev' ? [chapter] : kind === 'full' ? ctx.chapters : []
  const main = kind === '404'
    ? `<section class="ch nf" id="not-found" aria-labelledby="nf-t"><div class="seam" aria-hidden="true"></div><p class="kicker">404</p><h1 class="h2" id="nf-t">Nothing recorded at this address.</h1><p class="ch-body"><a href="${ctx.site.base}">Back to joseqc.com {{icon:arrow-r}}</a></p></section>`
    : scope.map((ch) => ctx.fragments.get(ch.slug)).join('\n')
  const fontFiles = ['archivo-c-115-620.woff2', 'newsreader-c-420.woff2', 'ibm-plex-mono-latin-400-normal.woff2']
  const preloads = fontFiles.map((f) => `<link rel="preload" href="${ctx.assets.url(join(C, 'fonts', f))}" as="font" type="font/woff2" crossorigin>`).join('\n')
  const google = ARGS.fonts === 'google' ? '\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@115,620&amp;family=Newsreader:ital,opsz,wght@0,16,420;1,20,420&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap">' : ''
  const manifest = { ...(js ? js.manifest : {}), late: ctx.lateCss, ch: ctx.chapters.map((c) => ({ slug: c.slug, code: c.code, no: c.no, nav: c.nav, short: c.short })) }
  const prepaint = esbuild.transformSync(read(join(C, 'shell/prepaint.js')).replace('__MANIFEST__', JSON.stringify(manifest)), { minify: true, target: 'es2017' }).code.trim()
  ctx.build = {
    title: kind === 'dev' ? `Dev · ${chapter.nav} · ${ctx.site.title}` : kind === '404' ? `Not found · ${ctx.site.title}` : ctx.site.title,
    og: kind === 'full' ? ogMeta(ctx) : '', favicon: ctx.favicon ? (kind === '404' ? ctx.site.base : '') + ctx.favicon : '',
    prepaint, preloads: preloads + google, css: cssText, printcss: !ctx.lateCss ? '' : js ? `<noscript><link rel="stylesheet" href="${ctx.lateCss}"></noscript>` : `<link rel="stylesheet" href="${ctx.lateCss}">`, jsonld: jsonld(ctx.site),
    sprite: read(join(C, 'shell/icons.svg')).trim(), home: kind === '404' ? ctx.site.base : '', figs: kind === '404' ? '' : 'yes', iqcVisit: ctx.site.iqcVisit ? 'yes' : '',
    locator: parts.locator, idxbtn: parts.idxbtn, strip: parts.strip, dialog: parts.dialog, chapters: main,
    contact: read(join(C, 'shell/contact.html')).trim(),
    hud: '', script: js ? `<script type="module" src="${js.main.file}"></script>` : '',
  }
  // shell placeholders resolve in two passes (generated parts contain {{icon}} / {{site}} placeholders themselves)
  let html = read(join(C, 'shell/shell.html'))
  html = html.replace(/\{\{build\.(\w+)\}\}/g, (all, k) => (k in ctx.build ? (k === 'title' ? esc(ctx.build[k]) : ctx.build[k]) : all))
  html = resolve$(html, ctx, `shell (${kind})`, null)
  // 404: every relative asset URL becomes root-absolute (GitHub Pages serves it at the missing path, e.g. /a/b)
  if (kind === '404') html = html.replace(/(href="|src="|url\()(assets|posters|js)\//g, `$1${ctx.site.base}$2/`)
  if (!ctx.favicon) html = html.replace(/<link rel="icon"[^>]*href=""[^>]*>\n?/, '')
  return html
}

// ------------------------------------------------------------------------------------------------ report + budgets
function figureMarkup(html, id) {
  const i = html.search(new RegExp(`<figure\\b[^>]*data-fig="${id}"`))
  if (i < 0) return null
  const j = html.indexOf('</figure>', i)
  return j < 0 ? null : html.slice(i, j + 9)
}
function budgets(ctx, html, cssText, js, page) {
  const B = JSON.parse(read(join(C, 'tools/budgets.json')))
  const rows = []
  const add = (name, value, budget, unit = 'KB') => rows.push({ name, value: +value.toFixed(2), budget, unit, ok: value <= budget })
  const fontsDir = join(C, 'fonts')
  const fontBytes = readdirSync(fontsDir).filter((f) => f.endsWith('.woff2')).reduce((s, f) => s + statSync(join(fontsDir, f)).size, 0)
  const firstFonts = ['archivo-c-115-620.woff2', 'newsreader-c-420.woff2', 'ibm-plex-mono-latin-400-normal.woff2', 'ibm-plex-mono-latin-500-normal.woff2'].reduce((s, f) => s + statSync(join(fontsDir, f)).size, 0)
  if (page === 'full') {
    add('index.html (gzip)', gz(html) / 1024, B.indexHtmlKB)
    add('inline CSS (gzip)', gz(cssText) / 1024, B.inlineCssKB)
    const figs = {}
    let all = ''
    for (const [id, kb0] of Object.entries(B.figureMarkupKB)) {
      const m = figureMarkup(html, id)
      if (!m) continue
      all += m
      figs[id] = gz(m) / 1024
      add(`Fig. ${ctx.figs.get(id)?.n} ${id} inline markup (gzip)`, figs[id], kb0)
    }
    add('inline figure markup, Figs. 4–8 together (gzip)', gz(all) / 1024, B.figureMarkupTotalKB)
  }
  if (page === 'full') { // JS budgets apply to the minified production bundle only (dev bundles are unminified)
    add('eager JS main (gzip)', js.main.gz / 1024, B.eagerJsKB)
    if (js.three) add('three.js shared chunk (gzip)', js.three.gz / 1024, B.threeChunkKB)
    for (const o of js.chunks) if (o.role === 'scene') add(`scene ${o.entry} (gzip)`, o.gz / 1024, B.sceneKB)
    for (const o of js.chunks) if (o.role === 'lazy' && o.entry?.includes('ledger')) add(`ledger chunk ${o.entry} (gzip)`, o.gz / 1024, B.ledgerChunkKB)
    for (const o of js.chunks) if (o.role === 'lazy' && o.entry?.includes('sha256')) add(`sha256 fallback (gzip)`, o.gz / 1024, B.sha256KB)
    for (const ch of ctx.chapters) {
      const kb0 = B.chapterJsKB?.[ch.slug]
      if (!kb0) continue
      const ins = Object.entries(js.main.bytesByInput).filter(([i]) => i.startsWith(`chapters/${ch.dir}/`))
      const bytes = ins.reduce((s, [, b]) => s + b, 0)
      if (bytes) add(`chapter.js + models, ${ch.slug} (minified, est. gzip)`, bytes * (js.main.gz / js.main.raw) / 1024, kb0)
    }
  }
  add('fonts total', fontBytes / 1024, B.fontsKB)
  add('fonts on the first screen', firstFonts / 1024, B.firstScreenFontsKB)
  for (const [name, p] of ctx.posterBytes) if (p.ext === 'avif') add(`poster ${name}`, p.bytes / 1024, p.w >= 1200 ? B.poster1200KB : B.poster720KB)
  if (page === 'full') {
    // what a 412 px phone (DPR 2.625) fetches before the load event: the HTML, the four first-screen fonts (the italic
    // face waits for late.css), main + its static imports, and every Fig. 1 poster (all eager: the intro's initial
    // state and the final one), each at the AVIF width the 358 px slot picks (≥ 940 px). late.css comes after load.
    const heroId = [...ctx.figs.values()][0].id, need = 358 * 2.625
    const byState = new Map()
    for (const p of ctx.posterBytes.values()) if (p.fig === heroId && p.ext === 'avif') (byState.get(p.state) || byState.set(p.state, []).get(p.state)).push(p)
    const heroPosters = [...byState.values()].map((l) => l.sort((a, b) => a.w - b.w).find((p) => p.w >= need) || l[l.length - 1])
    const posterKB = heroPosters.reduce((s, p) => s + p.bytes, 0)
    const eagerChunks = js.main.imports.filter((i) => i.kind === 'import-statement')
    add(`first load: HTML + first-screen fonts + eager JS + ${heroPosters.length} Fig. 1 posters (gzip)`, (gz(html) + firstFonts + js.main.gz + eagerChunks.reduce((s, i) => s + (js.chunks.find((o) => o.file === i.path)?.gz || 0), 0) + posterKB) / 1024, B.firstLoadKB)
    add('first load requests', 1 + 4 + 1 + eagerChunks.length + heroPosters.length, B.firstLoadRequests, 'req')
  }
  return rows
}

// ------------------------------------------------------------------------------------------------ lock
function takeLock() {
  const p = join(C, '.build/site.lock')
  mkdirSync(dirname(p), { recursive: true })
  try {
    const fd = openSync(p, 'wx'); writeFileSync(fd, String(process.pid)); closeSync(fd)
  } catch (e) {
    const pid = +read(p) || 0
    let alive = false
    try { process.kill(pid, 0); alive = pid !== process.pid } catch (err) { alive = err.code === 'EPERM' }
    if (alive) throw new BuildError(`another full build is running (pid ${pid}; ${relative(C, p)})`)
    writeFileSync(p, String(process.pid)) // stale lock from a dead process
  }
  const release = () => { try { if (+read(p) === process.pid) unlinkSync(p) } catch (e) { /* gone */ } }
  process.on('exit', release)
  return release
}

// ------------------------------------------------------------------------------------------------ main
async function build() {
  log.errors.length = 0; log.warnings.length = 0; log.notices.length = 0
  const t0 = performance.now()
  const L = await load()
  const one = ARGS.chapter ? L.chapters.find((c) => c.slug === ARGS.chapter || c.dir === ARGS.chapter) : null
  if (ARGS.chapter && !one) throw new BuildError(`unknown chapter "${ARGS.chapter}" (slugs: ${L.chapters.map((c) => c.slug).join(', ')})`)
  const scope = one ? 'chapter' : 'full'
  const release = scope === 'full' ? takeLock() : () => {}
  try {
    // 2. generators: full = check every chapter; --chapter X = write X only
    const genWritten = []
    for (const ch of L.chapters) {
      if (scope === 'full') await generators(ch, L.facts, 'check')
      else if (ch === one) genWritten.push(...await generators(ch, L.facts, 'write'))
    }
    L.asserts = await L.runAsserts()
    if (ARGS.gen) {
      report(log, t0)
      if (log.errors.length) throw new BuildError('generator errors')
      console.log(genWritten.length ? `generated: ${genWritten.join(', ')}` : 'generated markup up to date')
      return { ok: true }
    }
    // 3. ledger
    const ledger = ledgerVerify(L.facts, { scope, slug: one?.slug })
    // a full build owns <out>/assets, <out>/posters (and js/, emptied by the bundler): hashed names never collide, so
    // stale files would only pile up in the deployed tree
    mkdirSync(OUT, { recursive: true })
    if (scope === 'full') for (const d of ['assets', 'posters']) rmSync(join(OUT, d), { recursive: true, force: true })
    // 4. fragments in scope
    const ctx = { ...L, scope, assets: makeAssets(), icons: new Set([...read(join(C, 'shell/icons.svg')).matchAll(/id="i-([\w-]+)"/g)].map((m) => m[1])), missingPosters: [], posterBytes: new Map(), reducedPosters: new Set(), fragments: new Map(), build: {}, contents: '', favicon: favicon() }
    const scopeCh = scope === 'full' ? L.chapters : [one]
    ctx.contents = shellParts(ctx, { kind: scope === 'full' ? 'full' : 'dev', chapter: one }).contents
    for (const ch of scopeCh) {
      const src = existsSync(join(ch.path, 'chapter.html')) ? read(join(ch.path, 'chapter.html')) : ''
      for (const f of ch.figures) if (f.reduced && src.includes(`{{poster:${f.id} ${f.reduced} `)) ctx.reducedPosters.add(f.id)
      ctx.fragments.set(ch.slug, fragment(ctx, ch))
    }
    if (ctx.missingPosters.length) (ARGS.strict ? fail : warn)(`posters missing (placeholder frames shown): ${ctx.missingPosters.join(', ')}`)
    // 6. CSS, 7. JS
    const cssText = await css(ctx, scopeCh)
    if (log.errors.length) throw new BuildError('stopped before bundling (errors above)')
    const js = await bundle(ctx, scopeCh, scope === 'full' ? { kind: 'full' } : { kind: 'dev', chapter: one })
    if (scope === 'chapter' && js.main) js.main.file = js.main.file // paths are relative to c/, as is every page
    // 8. pages
    const outputs = []
    let html
    if (scope === 'full') {
      html = page(ctx, { kind: 'full', cssText, js })
      writeFileSync(join(OUT, 'index.html'), html); outputs.push('index.html')
      const nf = page(ctx, { kind: '404', cssText, js: null })
      writeFileSync(join(OUT, '404.html'), nf); outputs.push('404.html')
    } else {
      html = page(ctx, { kind: 'dev', chapter: one, cssText, js })
      writeFileSync(join(OUT, `dev-${one.slug}.html`), html); outputs.push(`dev-${one.slug}.html`)
    }
    if (/\{\{[^}]*\}\}/.test(html)) fail(`unresolved placeholder in output: ${html.match(/\{\{[^}]*\}\}/)[0]}`)
    // 10. lint (static, then rendered)
    let lint = { errors: [], warnings: [] }
    if (ARGS.lint) {
      const L2 = await import(pathToFileURL(join(C, 'tools/lint.mjs')).href + `?t=${Date.now()}`)
      lint = await L2.lintAll({ C, root: OUT, ctx, html, pageFile: outputs[0], scope, chapter: one, cssText, js, render: !ARGS.fast })
      lint.errors.forEach((e) => fail(`lint: ${e}`))
      lint.warnings.forEach((w) => (ARGS.strict ? fail : warn)(`lint: ${w}`))
    }
    // 11. report
    const B = budgets(ctx, html, cssText, js, scope)
    for (const b of B) if (!b.ok) (ARGS.strict ? fail : warn)(`budget: ${b.name} ${b.value} ${b.unit} > ${b.budget}`)
    const rep = {
      when: new Date().toISOString(), scope, chapter: one?.slug ?? null, ms: Math.round(performance.now() - t0), out: relative(C, OUT) || '.',
      outputs, sizes: { html: { raw: html.length, gz: gz(html) }, css: { raw: cssText.length, gz: gz(cssText) } },
      js: js.chunks.map(({ inputs, bytesByInput, ...o }) => ({ ...o, inputs: inputs.length, topInputs: Object.entries(bytesByInput).sort((a, b) => b[1] - a[1]).slice(0, 6) })),
      chapterEagerBytes: Object.fromEntries(scopeCh.map((ch) => [ch.slug, Object.entries(js.main.bytesByInput).filter(([i]) => i.startsWith(`chapters/${ch.dir}/`)).reduce((s, [, b]) => s + b, 0)])),
      manifest: js.manifest,
      figures: Object.fromEntries([...L.figs.values()].map((f) => [f.id, { n: f.n, chapter: f.chapter.slug, kind: f.kind, states: f.states, final: f.final, markupGz: figureMarkup(html, f.id) ? gz(figureMarkup(html, f.id)) : null }])),
      posters: Object.fromEntries(ctx.posterBytes), missingPosters: ctx.missingPosters,
      ledger, asserts: L.asserts.length, words: lint.words || null, budgets: B, lint: { errors: lint.errors, warnings: lint.warnings, rendered: lint.rendered || null },
      warnings: log.warnings, notices: log.notices, errors: log.errors,
    }
    writeFileSync(join(C, '.build', scope === 'full' ? 'build-report.json' : `build-report.${one.slug}.json`), JSON.stringify(rep, null, 1))
    table(rep, js)
    report(log, t0)
    return { ok: !log.errors.length }
  } finally { release() }
}

function table(rep, js) {
  const rows = [['output', 'raw KB', 'gzip KB']]
  rows.push([rep.outputs[0], kb(rep.sizes.html.raw), kb(rep.sizes.html.gz)], ['  inline CSS', kb(rep.sizes.css.raw), kb(rep.sizes.css.gz)])
  for (const o of js.chunks) rows.push([`${o.file} (${o.role})`, kb(o.raw), kb(o.gz)])
  const w = [Math.max(...rows.map((r) => r[0].length)), 8, 8]
  console.log(rows.map((r) => r[0].padEnd(w[0]) + '  ' + r[1].padStart(w[1]) + '  ' + r[2].padStart(w[2])).join('\n'))
  const bad = rep.budgets.filter((b) => !b.ok)
  console.log(`budgets: ${rep.budgets.length - bad.length}/${rep.budgets.length} within · facts asserts ${rep.asserts} · ledger ${rep.ledger.status}${rep.lint.rendered ? ` · rendered lint ${rep.lint.rendered}` : ''}`)
}
function report(l, t0) {
  for (const n of l.notices) console.log(`notice  ${n}`)
  for (const w of l.warnings) console.log(`warning ${w}`)
  for (const e of l.errors) console.log(`ERROR   ${e}`)
  console.log(`${l.errors.length ? 'FAILED' : 'ok'} in ${Math.round(performance.now() - t0)} ms · ${l.errors.length} error(s), ${l.warnings.length} warning(s)`)
}

async function run() {
  try { const r = await build(); return r.ok } catch (e) {
    if (e instanceof BuildError) { log.errors.push(e.message); report(log, performance.now()); return false }
    throw e
  }
}

const ok = await run()
if (ARGS.watch) {
  let t = 0
  const IGN = /(^|\/)(\.build|js|js-dev|assets|posters\/?$|index\.html|404\.html|dev-[\w-]+\.html|build-report)/
  const kick = (f) => { if (f && IGN.test(f)) return; clearTimeout(t); t = setTimeout(() => { console.log(`\n— change: ${f} —`); run() }, 200) }
  for (const d of ['shell', 'chapters', 'data']) watch(join(C, d), { recursive: true }, (e, f) => kick(`${d}/${f}`))
  watch(join(C, 'site.config.mjs'), () => kick('site.config.mjs'))
  console.log('watching shell/, chapters/, data/ …')
}
if (ARGS.serve) {
  const { serve } = await import(pathToFileURL(join(C, 'tools/lint.mjs')).href)
  const { port } = await serve(OUT, ARGS.serve)
  console.log(`serving ${relative(process.cwd(), OUT) || '.'} at http://localhost:${port}/`)
} else if (!ARGS.watch) process.exit(ok ? 0 : 1)
