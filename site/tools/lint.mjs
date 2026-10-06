// tools/lint.mjs (DS lead) — SYSTEM-C §9, SPEC-C §12.3 step 10, §14 items 14–22, A4, A8, A13, A14, A16, A19.
// Three layers:
//   1. sources: chapter.css scoping + hex, svh/vh units, animation-timeline, three imports, scroll listeners, rAF in chapters
//   2. static page: the built HTML parsed by Chromium with JavaScript OFF (string rules compare case-insensitively)
//   3. rendered page: the same page after JS (?intro=0), string rules on innerText (after text-transform), glyph cmap check
// Used by build.mjs (lintAll) and standalone:  node tools/lint.mjs [index.html | dev-<slug>.html] [--root=<dir>] [--no-render]
//   --root: the folder the page was built into (relative to site/; default .build/www, `npm run lint` passes ..)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, relative, extname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(p, 'utf8')
const esbuild = createRequire(import.meta.url)('esbuild')
// split a selector list on top-level commas only (not inside :is() / :where() / :not() / attribute brackets)
const splitSel = (pre) => {
  const out = []; let depth = 0, cur = ''
  for (const ch of pre) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  out.push(cur)
  return out.map((x) => x.trim()).filter(Boolean)
}
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })

// ------------------------------------------------------------------------------------------------ 1. sources
export function lintSources(C, chapters) {
  const errors = [], warnings = []
  const rel = (p) => relative(C, p)
  const cssFiles = [...walk(join(C, 'shell')).filter((f) => f.endsWith('.css')), ...chapters.map((ch) => join(ch.path, 'chapter.css')).filter(existsSync)]
  for (const f of cssFiles) {
    const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '')
    if (/animation-timeline/.test(src)) errors.push(`${rel(f)}: animation-timeline is banned (A14)`)
    // parse check: a stray brace or bad block silently drops the rules after it
    try {
      const r = esbuild.transformSync(read(f).replace(/\{\{[^}]*\}\}/g, 'x'), { loader: 'css', logLevel: 'silent' })
      for (const w of r.warnings) errors.push(`${rel(f)}:${w.location?.line ?? '?'}: CSS parse warning: ${w.text}`)
    } catch (e) { errors.push(`${rel(f)}: CSS parse error: ${(e.errors || [e])[0].text || e.message}`) }
    if (!f.endsWith('tokens.css')) {
      const u = src.match(/[\d.]\s*(vh|dvh|lvh|svh)\b/)
      if (u) errors.push(`${rel(f)}: unit "${u[1]}" is banned outside tokens.css; use calc(var(--svh) * N) (A19)`)
    }
  }
  for (const ch of chapters) {
    const f = join(ch.path, 'chapter.css')
    if (!existsSync(f)) continue
    const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '')
    const okSel = (s) => s.startsWith(`[data-ch=${ch.code}]`) || s.startsWith(`[data-ch="${ch.code}"]`) || s.startsWith(`#${ch.slug}`) ||
      (/^html\b/.test(s) && (s.includes(`[data-ch=${ch.code}]`) || s.includes(`#${ch.slug}`)))
    const decl = (d) => {
      const hex = d.match(/#[0-9a-fA-F]{3,8}\b/)
      if (hex && !/^\s*--plate-[\w-]+\s*:/.test(d)) errors.push(`${ch.dir}/chapter.css: hex colour ${hex[0]} (use tokens; figure-internal colours go in --plate-* properties)`)
    }
    const stack = []
    let buf = ''
    for (const c of src) {
      if (c === '{') {
        const pre = buf.trim(); buf = ''
        const inKey = stack.some((p) => /^@(-webkit-)?keyframes/.test(p))
        stack.push(pre)
        if (pre.startsWith('@') || inKey) continue
        for (const sel of splitSel(pre)) if (!okSel(sel)) errors.push(`${ch.dir}/chapter.css: selector "${sel}" must start with [data-ch=${ch.code}] or #${ch.slug}`)
      } else if (c === '}') { if (stack.length) decl(buf); buf = ''; stack.pop() }
      else if (c === ';') { if (stack.length) decl(buf); buf = '' }
      else buf += c
    }
  }
  const jsFiles = [...walk(join(C, 'shell')), ...chapters.flatMap((ch) => walk(ch.path))].filter((f) => /\.(m?js)$/.test(f))
  for (const f of jsFiles) {
    const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    const r = rel(f)
    const isTool = /\/tools\//.test(r)
    if (!r.endsWith('shell/stage/three.js') && !isTool && /from\s*['"]three['"]|import\(\s*['"]three['"]\s*\)/.test(src)) errors.push(`${r}: imports 'three' directly; import from shell/stage/three.js`)
    if (/addEventListener\(\s*['"]scroll['"]|\bonscroll\s*=/.test(src)) errors.push(`${r}: scroll listener (zero scroll listeners site-wide)`)
    if (/animation-timeline|animationTimeline|ScrollTimeline|ViewTimeline/.test(src)) errors.push(`${r}: scroll-driven animation timeline is banned (A14)`)
    if (r.startsWith('chapters/') && !isTool && /requestAnimationFrame/.test(src)) errors.push(`${r}: requestAnimationFrame in chapter code (the stage owns the only loop; DOM figures use WAAPI)`)
    if (r.startsWith('chapters/') && !isTool && /setInterval\(/.test(src)) warnings.push(`${r}: setInterval in chapter code (timers may only write text or start WAAPI, and settle() clears them)`)
  }
  const build = read(join(C, 'build.mjs'))
  if (/(import\s*\(?|spawn\w*\(|exec\w*\(|fork\()[^\n]*(posters\.mjs|ledger-sign)/.test(build) || /tools\/\*|readdirSync\([^)]*tools/.test(build)) errors.push('build.mjs runs a hand-run tool (posters.mjs / ledger-sign.mjs) or globs tools/ (§12.2: generators come only from chapter.json)')
  return { errors, warnings }
}

// ------------------------------------------------------------------------------------------------ 2 + 3. page rules (run inside the page)
function pageRules(cfg) {
  const errors = [], warnings = [], info = {}
  const E = (m) => errors.push(m), W = (m) => warnings.push(m)
  const rendered = cfg.mode === 'rendered'
  const words = (t) => t.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
  const txt = (el) => (rendered ? el.innerText : el.textContent).replace(/\s+/g, ' ').trim()
  // ---- every string on the page: text nodes (+ template content), the listed attributes, title, meta, JSON-LD
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT'])
  const nodes = []
  const tw = (root) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) if (!SKIP.has(n.parentElement?.tagName)) nodes.push(n)
  }
  tw(document.body)
  for (const t of document.querySelectorAll('template')) tw(t.content)
  const tt = (n) => {
    const el = n.parentElement
    const cs = el && el.isConnected ? getComputedStyle(el) : null
    return cs && cs.textTransform === 'uppercase' && rendered ? n.data.toUpperCase() : n.data
  }
  const ATTRS = ['alt', 'title', 'aria-label', 'aria-description', 'aria-roledescription', 'placeholder', 'content', 'value', 'label']
  const attrStrings = []
  for (const el of document.querySelectorAll('*')) for (const a of ATTRS) if (el.hasAttribute(a)) attrStrings.push({ el, s: el.getAttribute(a), a })
  const extra = [document.title, ...[...document.querySelectorAll('script[type="application/ld+json"], noscript')].map((s) => s.textContent)]
  const all = [...nodes.map((n) => ({ s: tt(n), el: n.parentElement })), ...attrStrings, ...extra.map((s) => ({ s, el: null }))]
  const where = (el) => {
    if (!el) return 'head'
    const f = el.closest('figure.fig'), s = el.closest('section')
    return f ? `#${f.id}` : s ? `#${s.id || s.className}` : el.closest('header,footer,dialog')?.tagName.toLowerCase() || 'page'
  }
  // ---- exactly-once rules (client corrections 2026-10-06): "tokeniz" once, in the IQC tagline; "blockchain" once, in the
  // IQC sentence; "Filecoin" once, in the roadmap line. All three inside the one [data-once="iqc"] block of #data-integrity.
  for (const [re, name, slot] of [[/tokeni[sz]/gi, 'tokeniz', 'tagline'], [/blockchain/gi, 'blockchain', 'sentence'], [/filecoin/gi, 'Filecoin', 'roadmap']]) {
    let n = 0, inside = 0
    for (const x of all) { const k = (x.s.match(re) || []).length; n += k; if (k && x.el && x.el.closest(`[data-once="iqc"] [data-iqc="${slot}"]`)) inside += k }
    if (n !== cfg.onceExpected) E(`/${name}/ occurs ${n}× on this page (expected ${cfg.onceExpected})`)
    if (cfg.onceExpected && inside !== n) E(`/${name}/ must sit only in the IQC ${slot} ([data-once="iqc"] [data-iqc="${slot}"]; ${n - inside} outside)`)
  }
  if (cfg.onceExpected) {
    const once = document.querySelectorAll('[data-once="iqc"]')
    const slot = (k) => once[0]?.querySelector(`[data-iqc="${k}"]`)
    const t = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null)
    const Q = cfg.facts.iqc || {}
    if (once.length !== 1) E(`[data-once="iqc"] must exist exactly once (found ${once.length})`)
    else {
      if (t(slot('tagline')) !== `Immutable QC: ${Q.tagline}`) E(`the IQC tagline is "${t(slot('tagline'))}", not "Immutable QC: ${Q.tagline}" (facts iqc.tagline)`)
      if (t(slot('sentence')) !== cfg.iqcSentence) E(`the IQC sentence is not ${cfg.iqcSentenceId} from site.config.mjs`)
      if (t(slot('status')) !== Q.status) E(`the IQC status line is not facts iqc.status`)
      if (t(slot('roadmap')) !== Q.roadmap) E(`the IQC roadmap line is not facts iqc.roadmap`)
      // the honest status sits directly with the tagline and the sentence: tagline, sentence, status in that order, adjacent
      if (slot('tagline')?.nextElementSibling !== slot('sentence') || slot('sentence')?.nextElementSibling !== slot('status')) E('IQC block order must be tagline, sentence, status (adjacent)')
      // no customers, deployments, pilots or production use implied; no chain named; no Filecoin claim outside the roadmap
      const q = once[0].textContent
      const NO = [[/\bcustomers?\b/i, 'customer'], [/\bclients?\b/i, 'client'], [/\bpilots?\b/i, 'pilot'], [/\bdeploy/i, 'deploy'], [/\bin production\b|production use|production-ready/i, 'production'],
        [/\bused by\b|trusted by|\badopt/i, 'used by / adopted'], [/\bmainnet\b/i, 'mainnet'], [/\bbase\b/i, 'Base (chain name)'], [/filecoin calibration/i, 'Filecoin Calibration']]
      for (const [re, name] of NO) if (re.test(q)) E(`IQC block implies "${name}" (client corrections 2026-10-06 items 3, 8)`)
      if (!/^Next:/.test(t(slot('roadmap')) || '')) E('the roadmap line must start "Next:" (Filecoin is upcoming, not current)')
    }
    if (!once[0]?.closest('#data-integrity')) E('[data-once="iqc"] must be inside #data-integrity')
    const di = document.getElementById('data-integrity')
    if (di && !/Independent project · open alpha/i.test(di.textContent)) E('"Independent project · open alpha" missing from the IQC block')
  }
  // ---- banned strings
  const BANNED = [
    [/\btokens?\b/i, 'token(s)'], [/wallet/i, 'wallet'], [/\bstak(e|ing)/i, 'stake/staking'], [/crypto/i, 'crypto'], [/on-?chain/i, 'on-chain'],
    [/\bchains?\b/i, 'chain(s) (only "chain of custody" is allowed)'], [/sepolia/i, 'Sepolia'], [/ethereum/i, 'Ethereum'], [/\bNFTs?\b/i, 'NFT'],
    [/web3/i, 'web3'], [/\bcoins?\b/i, 'coin(s)'], [/compliance[\s-]ready/i, 'compliance ready'], [/cannot be altered/i, 'cannot be altered'],
    [/guaranteed/i, 'guaranteed'], [/airworthy/i, 'airworthy'], [/truechem/i, 'TrueChem'], [/passionate/i, 'passionate'], [/leveraging/i, 'leveraging'],
    [/deep expertise/i, 'deep expertise'], [/most common/i, 'most common'], [/intersection of/i, 'intersection of'], [/driven by/i, 'driven by'],
    [/committed to/i, 'committed to'], [/results-oriented/i, 'results-oriented'],
    // client corrections 2026-10-06: no shot peen anywhere (he does not perform it, holds no shot peen certification);
    // no CV link or mention; no token product, staking, wallets or trading
    [/shot[\s-]?peen/i, 'shot peen'], [/\bCV\b/i, 'CV'], [/curriculum vitae|r[ée]sum[ée]\b/i, 'CV / résumé'], [/\bERC-?20\b/i, 'ERC-20'], [/\btrading\b/i, 'trading'],
  ]
  for (const x of all) {
    const s = x.s.replace(/chain of custody/gi, '').replace(/filecoin/gi, '') // Filecoin is allowed (once, roadmap line; counted above)
    for (const [re, name] of BANNED) if (re.test(s)) E(`banned "${name}" in ${where(x.el)}: "${x.s.trim().slice(0, 80)}"`)
    if (/immutable(?!qc\.com)/.test(x.s)) E(`lowercase "immutable" outside "Immutable QC" / immutableqc.com in ${where(x.el)}: "${x.s.trim().slice(0, 60)}"`)
    const noUrl = x.s.replace(/\S+@\S+|https?:\/\/\S+/g, '')
    if (/\bJose\b/i.test(noUrl) || /Fernandez/i.test(noUrl)) E(`unaccented name in ${where(x.el)}: "${x.s.trim().slice(0, 60)}" (always José A. Fernández Abreu)`)
  }
  // ---- production page (full build): no prototype marker anywhere, indexable, canonical on the domain root
  if (cfg.full) {
    for (const x of all) if (/prototype/i.test(x.s)) E(`"Prototype" in ${where(x.el)}: "${x.s.trim().slice(0, 60)}"`)
    if ([...document.querySelectorAll('meta[name="robots" i], meta[name="googlebot" i]')].some((m) => /noindex/i.test(m.content))) E('robots noindex on the production page')
    if (cfg.origin && document.querySelector('link[rel="canonical"]')?.getAttribute('href') !== cfg.origin + '/') E(`canonical is not ${cfg.origin}/`)
  }
  const sec = (id) => document.getElementById(id)
  if (sec('fig-disinfectant') && /required/i.test(sec('fig-disinfectant').textContent)) E('"required" in Fig. 5 (SPEC-C §6.1 item 4)')
  if (sec('environmental') && /bracket/i.test(sec('environmental').textContent)) E('"bracket" in chapter 04 (§7.1 D2)')
  if (sec('data-integrity') && /11\.70/.test(sec('data-integrity').textContent)) E('"11.70" in chapter 06 (§9.1 item 2)')
  // ---- glyph rules (A8, A16): banned code points, % straight after a digit, ^, and the face's cmap
  const BAD_GLYPHS = /[≥≤→←↗≈✓✗◆▾●⁻⁰¹²³₀₁₂₃↻]/
  const G = cfg.glyphs
  const sets = G && Object.fromEntries(Object.entries(G).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, new Set(v)]))
  const missing = new Map()
  for (const n of nodes) {
    const el = n.parentElement
    if (!el || el.closest('code, pre.hud, .hud, template')) continue
    const s = tt(n)
    if (BAD_GLYPHS.test(s)) E(`glyph "${s.match(BAD_GLYPHS)[0]}" in text (${where(el)}); use a sprite icon, <sub>/<sup>, or words`)
    if (/\d%/.test(s)) E(`"%" directly after a digit in ${where(el)}: "${s.trim().slice(0, 40)}" (use U+00A0 before %)`)
    if (/\^/.test(s)) E(`"^" in text (${where(el)}); use <sup>`)
    if (!sets || !el.isConnected) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const fam = cs.fontFamily
    let set = fam.includes('Plex Mono') ? (+cs.fontWeight >= 500 ? sets.mono500 : sets.mono) : fam.includes('Newsreader') ? (cs.fontStyle === 'italic' ? sets.serifItalic : sets.serif) : fam.includes('Archivo') ? sets.display : null
    if (!set) continue
    for (const ch of s) {
      const cp = ch.codePointAt(0)
      if (cp <= 32 || cp === 0xa0 || cp === 0x200b || cp === 0x2009 || cp === 0x202f) continue
      if (!set.has(cp)) { const k = `${ch} U+${cp.toString(16).toUpperCase().padStart(4, '0')}`; if (!missing.has(k)) missing.set(k, where(el)) }
    }
  }
  for (const [k, w] of missing) (rendered ? E : W)(`glyph ${k} is not in its font's cmap (${w}): it would fall back to a system font`)
  // ---- name, Spanish once
  const es = document.querySelectorAll('[lang^="es"]')
  if (cfg.contact && es.length !== 1) E(`Spanish must appear exactly once with lang="es" (found ${es.length})`)
  // ---- JSON-LD carries no IQC claims
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) if (/immutable/i.test(s.textContent)) E('JSON-LD mentions Immutable QC')
  // ---- chapters: word budgets, titles, summaries, pull / bridge
  info.words = {}
  for (const s of document.querySelectorAll('section.ch')) {
    const body = s.querySelectorAll('.ch-body')
    const n = [...body].reduce((a, b) => a + words(b.textContent), 0)
    info.words[s.id] = n
    if (n > 90) E(`#${s.id} .ch-body has ${n} words (≤ 90)`)
    for (const b of body) if (b.querySelector('b, strong')) E(`#${s.id} .ch-body uses <b>/<strong> (emphasis is italic)`)
    for (const h of s.querySelectorAll('h2')) if (words(h.textContent) > 8) E(`#${s.id} title has ${words(h.textContent)} words (≤ 8)`)
    for (const sel of ['.pull', '.bridge']) {
      const els = s.querySelectorAll(sel)
      if (els.length > 1) E(`#${s.id}: more than one ${sel}`)
      for (const e of els) if (words(e.textContent) > 14) E(`#${s.id} ${sel} has ${words(e.textContent)} words (≤ 14)`)
    }
    for (const sum of s.querySelectorAll('details.methods > summary')) {
      const t = sum.textContent.replace(/\s+/g, ' ').trim()
      if ([...t].length > 40) E(`#${s.id} methods summary is ${[...t].length} characters (≤ 40, A13): "${t}"`)
    }
  }
  // ---- figures
  const figs = [...document.querySelectorAll('figure.fig')]
  let prevN = 0
  for (const f of figs) {
    const id = f.dataset.fig, decl = cfg.figures[id]
    if (!decl) { E(`figure #${f.id}: data-fig="${id}" is not declared in any chapter.json`); continue }
    if (f.id !== `fig-${id}`) E(`figure data-fig="${id}" must have id="fig-${id}"`)
    if (f.dataset.kind !== decl.kind) E(`#${f.id}: data-kind="${f.dataset.kind}" but chapter.json says "${decl.kind}"`)
    const states = (f.dataset.states || '').split(/\s+/).filter(Boolean)
    if (states.join(' ') !== decl.states.join(' ')) E(`#${f.id}: data-states "${states.join(' ')}" ≠ chapter.json "${decl.states.join(' ')}"`)
    if (f.dataset.final !== decl.final) E(`#${f.id}: data-final="${f.dataset.final}" ≠ chapter.json "${decl.final}"`)
    if (!rendered && f.dataset.state !== decl.final) E(`#${f.id}: authored data-state must be the final state "${decl.final}" (no-JS shows the final state)`)
    const corner = (c) => f.querySelector(`.plate .corner.${c}`)
    for (const c of ['tl', 'tr', 'bl', 'br']) if (!corner(c)) E(`#${f.id}: missing corner .${c}`)
    if (corner('br') && !/^simulated$/i.test(txt(corner('br')))) E(`#${f.id}: BR corner must read SIMULATED`)
    if (corner('tl') && txt(corner('tl')).toLowerCase() !== `fig. ${decl.n}`) E(`#${f.id}: TL corner "${txt(corner('tl'))}" ≠ "Fig. ${decl.n}" (use {{fig:${id}}})`)
    if (decl.n <= prevN) E(`#${f.id}: figure numbers out of document order`)
    prevN = decl.n
    const cap = f.querySelector('figcaption')
    if (!cap) E(`#${f.id}: no figcaption`)
    else {
      if (!/simulated/i.test(cap.textContent)) E(`#${f.id}: caption must say "simulated"`)
      if (words(cap.textContent) > 40) E(`#${f.id}: caption has ${words(cap.textContent)} words (≤ 40)`)
      if (!new RegExp(`^Fig\\. ${decl.n}\\b`, 'i').test(txt(cap))) E(`#${f.id}: caption must start "Fig. ${decl.n}"`)
    }
    if (decl.kind === 'gl') {
      if (!/--aspect/.test(f.getAttribute('style') || '')) W(`#${f.id}: no --aspect declared (fixed aspect ratio, CLS 0)`)
      for (const s of states) {
        const p = f.querySelector(`.poster[data-for="${s}"]`)
        if (!p) E(`#${f.id}: no poster for state "${s}"`)
        else if (p.classList.contains('poster--missing')) W(`#${f.id}: poster for "${s}" not generated yet`)
        else { const img = p.querySelector('img'); if (!img || !img.getAttribute('width') || !img.getAttribute('height')) E(`#${f.id}: poster "${s}" needs explicit width/height`) }
      }
      if (!f.querySelector('.host')) E(`#${f.id}: GL figure needs a .host`)
    }
    const ctrl = f.querySelector('.ctrl')
    if (ctrl) {
      if (ctrl.getAttribute('role') !== 'group' || !(ctrl.getAttribute('aria-label') || ctrl.getAttribute('aria-labelledby'))) E(`#${f.id}: .ctrl needs role="group" and aria-label / aria-labelledby`)
      for (const b of ctrl.querySelectorAll('button')) {
        if (!b.hasAttribute('aria-pressed') && !b.classList.contains('replay')) E(`#${f.id}: state button "${b.textContent.trim()}" needs aria-pressed`)
        if (b.classList.contains('replay') && !b.textContent.trim() && !b.getAttribute('aria-label')) E(`#${f.id}: icon-only Replay needs aria-label="Replay"`)
        if (rendered && b.offsetParent) { const r = b.getBoundingClientRect(); if (r.width < 43.5 || r.height < 43.5) E(`#${f.id}: button "${b.textContent.trim()}" is ${Math.round(r.width)}×${Math.round(r.height)} (≥ 44 × 44)`) }
      }
      if (!f.querySelector('[aria-live], [data-live]')) W(`#${f.id}: interactive figure without a live region`)
    }
    for (const r of f.querySelectorAll('.readout')) if (r.getAttribute('aria-hidden') !== 'true') E(`#${f.id}: .readout must be aria-hidden="true"`)
  }
  for (const [id, d] of Object.entries(cfg.figures)) if (cfg.inScope.includes(d.chapter) && !document.getElementById(`fig-${id}`)) W(`Fig. ${d.n} (${id}) declared in chapter.json but not in the page yet`)
  // ---- numbers: resting readouts = facts; ledger cells = readouts = facts
  info.readouts = {}
  for (const el of document.querySelectorAll('[data-fact-readout]')) {
    const k = el.dataset.factReadout, want = cfg.facts[k]?.value, got = el.textContent.trim()
    info.readouts[k] = got
    if (want == null) E(`[data-fact-readout="${k}"]: no such fact`)
    else if (got !== want) E(`[data-fact-readout="${k}"] reads "${got}" at rest; facts.json says "${want}"`)
  }
  const rec = document.getElementById('fig-record')
  if (rec) for (const key of cfg.ledgerRows) {
    const row = rec.querySelector(`[data-key="${key}"]`)
    if (!row) { E(`ledger row for ${key} missing ([data-key="${key}"] in #fig-record)`); continue }
    const v = row.querySelector('.val')?.textContent.trim(), u = row.querySelector('.unit')?.textContent.trim()
    const want = `${cfg.facts[key].value} ${cfg.facts[key].unit}`
    if (`${v} ${u}` !== want) E(`ledger ${key}: "${v} ${u}" ≠ facts "${want}"`)
    const ro = cfg.full && document.querySelector(`[data-fact-readout="${key}"]`)
    if (cfg.full && !ro) W(`ledger ${key}: its figure readout [data-fact-readout="${key}"] is not on the page yet`)
    if (ro && ro.textContent.trim() !== v) E(`ledger ${key}: cell "${v}" ≠ figure readout "${ro.textContent.trim()}"`)
  }
  // ---- leftovers
  if (/\{\{[^}]*\}\}/.test(document.documentElement.outerHTML)) E('unresolved {{…}} placeholder in the page')
  for (const el of document.querySelectorAll('[style]')) if (/[\d.](vh|dvh|lvh|svh)\b/.test(el.getAttribute('style'))) E(`inline style uses a banned viewport unit on <${el.tagName.toLowerCase()} id="${el.id}"> (A19)`)
  return { errors, warnings, info }
}

// ------------------------------------------------------------------------------------------------ server + browser
// a static server shaped like GitHub Pages: a folder serves its index.html, a missing path gets 404.html with status 404
export function serve(root, port = 0, host = '127.0.0.1') {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.avif': 'image/avif', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.map': 'application/json', '.txt': 'text/plain; charset=utf-8' }
  const srv = createServer((req, res) => {
    let p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    if (p.startsWith(root) && existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html')
    if (!p.startsWith(root) || !existsSync(p) || statSync(p).isDirectory()) {
      const nf = join(root, '404.html')
      res.writeHead(404, existsSync(nf) ? { 'content-type': TYPES['.html'] } : {}); res.end(existsSync(nf) ? readFileSync(nf) : undefined); return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p))
  })
  return new Promise((r) => srv.listen(port, host, () => r({ srv, port: srv.address().port })))
}
export async function lintPage(root, pageFile, cfg, { render = true } = {}) {
  let chromium, browser
  try { ({ chromium } = await import('playwright')) } catch (e) { return { errors: [], warnings: ['Playwright unavailable (npm install): page lint skipped'], info: {} } }
  try { browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }) } catch (e) {
    return { errors: [], warnings: ['Playwright Chromium unavailable (npx playwright install chromium): page lint skipped'], info: {} }
  }
  const { srv, port } = await serve(root)
  const out = { errors: [], warnings: [], info: {} }
  try {
    const modes = render ? ['static', 'rendered'] : ['static']
    for (const mode of modes) {
      for (const vp of mode === 'rendered' ? [{ width: 1440, height: 900 }, { width: 390, height: 844 }] : [{ width: 1440, height: 900 }]) {
        const ctx = await browser.newContext({ viewport: vp, javaScriptEnabled: mode === 'rendered', reducedMotion: 'reduce' })
        const page = await ctx.newPage()
        const pageErrors = []
        page.on('pageerror', (e) => pageErrors.push(e.message))
        await page.goto(`http://127.0.0.1:${port}/${pageFile}${mode === 'rendered' ? '?intro=0' : ''}`, { waitUntil: 'load' })
        if (mode === 'rendered') {
          await page.evaluate(() => document.fonts.ready)
          await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } scrollTo(0, 0) })
          await page.waitForTimeout(800)
          // chapters, contact and footer are content-visibility:auto; skipped (off-screen) content has no innerText
          await page.addStyleTag({ content: 'main > .ch,#contact,.site-ft{content-visibility:visible!important}' })
        }
        const r = await page.evaluate(pageRules, { ...cfg, mode })
        const tag = mode === 'rendered' ? `[rendered ${vp.width}] ` : ''
        const seen = new Set(out.errors)
        for (const e of r.errors) if (!seen.has(e) && !out.errors.some((x) => x.endsWith(e))) out.errors.push(tag + e)
        for (const w of r.warnings) if (!out.warnings.some((x) => x.endsWith(w))) out.warnings.push(tag + w)
        for (const e of pageErrors) out.errors.push(`${tag}page error: ${e}`)
        out.info[`${mode}-${vp.width}`] = r.info
        await ctx.close()
      }
    }
  } finally { await browser.close(); srv.close() }
  out.rendered = render ? 'on' : 'off'
  return out
}

// ------------------------------------------------------------------------------------------------ build entry
export async function lintAll({ C, root = C, ctx, pageFile, scope, chapter, render }) {
  const src = lintSources(C, ctx.chapters)
  const figures = Object.fromEntries([...ctx.figs.values()].map((f) => [f.id, { n: f.n, kind: f.kind, states: f.states, final: f.final, chapter: f.chapter.slug }]))
  const inScope = scope === 'full' ? ctx.chapters.map((c) => c.slug) : [chapter.slug]
  const cfg = {
    figures, inScope, facts: ctx.facts, ledgerRows: ctx.facts.ledger.rows, full: scope === 'full', contact: true,
    onceExpected: scope === 'full' || chapter?.slug === 'data-integrity' ? 1 : 0,
    iqcSentence: ctx.site.iqcSentence, iqcSentenceId: ctx.site.iqcSentenceId, origin: ctx.site.origin,
    glyphs: JSON.parse(read(join(C, 'tools/glyphs.json'))),
  }
  const pg = await lintPage(root, pageFile, cfg, { render })
  return { errors: [...src.errors, ...pg.errors], warnings: [...src.warnings, ...pg.warnings], words: pg.info['static-1440']?.words, readouts: pg.info['static-1440']?.readouts, rendered: pg.rendered }
}

// ------------------------------------------------------------------------------------------------ CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const C = join(HERE, '..')
  const pageFile = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'index.html'
  const cfgMod = await import(pathToFileURL(join(C, 'site.config.mjs')).href)
  const chapters = cfgMod.chapters.map((dir) => ({ ...JSON.parse(read(join(C, 'chapters', dir, 'chapter.json'))), dir, path: join(C, 'chapters', dir) }))
  const facts = JSON.parse(read(join(C, 'data/facts.json')))
  const figs = new Map(); let n = 0
  for (const ch of chapters) for (const f of ch.figures) figs.set(f.id, { ...f, n: ++n, chapter: ch })
  const sid = cfgMod.iqcSentenceOverride || cfgMod.selectIqcSentence(cfgMod.iqcGate)
  const site = { iqcSentenceId: sid, iqcSentence: cfgMod.iqcSentences[sid], origin: cfgMod.site.origin }
  const rootArg = process.argv.find((a) => a.startsWith('--root='))
  const root = rootArg ? resolve(C, rootArg.slice(7)) : join(C, '.build/www')
  const m = pageFile.match(/^dev-([\w-]+)\.html$/)
  const chapter = m ? chapters.find((c) => c.slug === m[1]) : null
  const r = await lintAll({ C, root, ctx: { chapters, facts, figs, site }, pageFile, scope: chapter ? 'chapter' : 'full', chapter, render: !process.argv.includes('--no-render') })
  for (const w of r.warnings) console.log(`warning ${w}`)
  for (const e of r.errors) console.log(`ERROR   ${e}`)
  console.log(`lint ${pageFile}: ${r.errors.length} error(s), ${r.warnings.length} warning(s)`)
  process.exit(r.errors.length ? 1 : 0)
}
