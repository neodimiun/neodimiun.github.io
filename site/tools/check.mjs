// tools/check.mjs (DS lead) — the Path C harness. Extends the prototype harness (same JSON fields per profile) with the stage,
// rest checks at every figure, readout/ledger/facts equality and, with --full, the SPEC-C §14 layout and fallback profiles.
// Two accessibility profiles follow the three device profiles: a keyboard Tab-walk (keyboard-WxH) and WCAG 1.4.12 text
// spacing (spacing-WxH), one JSON line each.
//   node tools/check.mjs <index | dev-<slug> | path.html> [out-prefix] [--full] [--a11y] [--root=<dir> | --base=<url>]
//   Without --base it serves --root itself (relative to site/; default .build/www; `npm run check` passes --root=..).
//   --a11y runs only the accessibility profiles (with --full, the --full block too).
//   Every HTTP response >= 400 and every failed request is a hard failure (missing asset).
// Exit code 1 when a hard check fails (renders/frames at rest, overflow, readout/ledger mismatch, page errors, focus
// order / visibility, text spacing).
import { chromium, devices } from 'playwright'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const C = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const pos = args.filter((a) => !a.startsWith('--'))
const target = pos[0] || 'index'
const file = target.endsWith('.html') ? target : `${target}.html`
const out = pos[1] || join(C, '.build/check', target)
mkdirSync(dirname(out), { recursive: true })
const FULL = args.includes('--full')
const A11Y = args.includes('--a11y') // only the keyboard and text-spacing profiles
let base = (args.find((a) => a.startsWith('--base=')) || '').slice(7)
let srv = null
if (!base) {
  const { serve } = await import('./lint.mjs')
  const r = args.find((a) => a.startsWith('--root='))
  const s = await serve(r ? resolve(C, r.slice(7)) : join(C, '.build/www'))
  srv = s.srv; base = `http://127.0.0.1:${s.port}/`
}
const url = base + file
const facts = JSON.parse(readFileSync(join(C, 'data/facts.json'), 'utf8'))
const B = JSON.parse(readFileSync(join(C, 'tools/budgets.json'), 'utf8'))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
let hardFail = false
const flag = (cond, why, bag) => { if (!cond) { hardFail = true; bag.push(why) } }

const numbers = (cfg) => {
  const readouts = {}
  for (const el of document.querySelectorAll('[data-fact-readout]')) {
    const k = el.dataset.factReadout
    readouts[k] = { dom: el.textContent.trim(), fact: cfg.facts[k]?.value ?? null, ok: el.textContent.trim() === cfg.facts[k]?.value }
  }
  const rec = document.getElementById('fig-record')
  const ledger = rec ? cfg.rows.map((key) => {
    const row = rec.querySelector(`[data-key="${key}"]`)
    const cell = row ? `${row.querySelector('.val')?.textContent.trim()} ${row.querySelector('.unit')?.textContent.trim()}` : null
    const ro = document.querySelector(`[data-fact-readout="${key}"]`)
    const readout = ro ? `${ro.textContent.trim()} ${cfg.facts[key].unit}` : null
    const fact = `${cfg.facts[key].value} ${cfg.facts[key].unit}`
    return { key, cell, readout, fact, ok: cell === fact && (readout == null || readout === fact) }
  }) : null
  return { readouts, ledger }
}

// renders / frames over `ms` with nothing happening
const rest = (page, ms = 3000) => page.evaluate(async (ms) => {
  const s = window.__stage
  const a = s ? { r: s.renders, f: s.frames } : null
  await new Promise((r) => setTimeout(r, ms))
  return a ? { renders: s.renders - a.r, frames: s.frames - a.f, animations: document.getAnimations().length } : null
}, ms)

async function scrollRest(page) {
  // visit every figure, let its intro finish, then count renders + frames at rest (must be 0 / 0)
  const ids = await page.evaluate(() => [...document.querySelectorAll('figure.fig')].map((f) => f.id))
  // the mouse rests in the header, never over a plate (Fig. 3's fine-pointer eye height is a deliberate reading)
  await page.mouse.move(2, 2)
  const res = {}
  for (const id of ids) {
    // instant scroll (html.motion sets scroll-behavior: smooth), then wait until no intro holds the lock or runs
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center', behavior: 'instant' }), id)
    await page.waitForTimeout(700)
    await page.evaluate(async () => {
      const s = window.__stage, t0 = performance.now()
      const busy = () => { const st = s?.state?.(); return !!st && (!!st.lock || /[>]/.test(st.figs)) }
      let calm = 0
      while (performance.now() - t0 < 9000 && calm < 3) { calm = busy() ? 0 : calm + 1; await new Promise((r) => setTimeout(r, 150)) }
    })
    await page.waitForTimeout(400)
    res[id] = await rest(page, 3000)
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  return res
}

// a button press after the intro has played (Fig. 9): with motion on it animates (CSS transitions; the stage must not
// settle a played figure on input, which would snap it) and then rests with no animation left; under reduced motion it
// switches at once. The figure ends back in its final state.
const PRESS_ANIM = [['fig-singularity', 'all', 'zoomed']]
async function pressAfterIntro(page, reduced) {
  const res = {}
  for (const [id, s, back] of PRESS_ANIM) {
    if (!(await page.locator(`#${id}`).count())) continue
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center', behavior: 'instant' }), id)
    await page.waitForTimeout(600)
    const anims = () => page.evaluate((id) => { const f = document.getElementById(id); return document.getAnimations().filter((a) => a.playState === 'running' && f.contains(a.effect?.target)).length }, id)
    const r = res[id] = { played: await page.evaluate((id) => (window.__stage?.state?.().figs || '').includes(`${id.slice(4)}:dom`) && !/\*|>/.test((window.__stage.state().figs.split(' ').find((x) => x.startsWith(id.slice(4) + ':')) || '')), id) }
    await page.locator(`#${id} .ctrl [data-set="${s}"]`).click()
    await page.waitForTimeout(400)
    r.during = await anims()
    await page.waitForTimeout(2400)
    r.rest = await anims(); r.state = await page.evaluate((id) => document.getElementById(id).dataset.state, id)
    await page.locator(`#${id} .ctrl [data-set="${back}"]`).click()
    await page.waitForTimeout(2800)
    r.back = await page.evaluate((id) => document.getElementById(id).dataset.state, id); r.restBack = await anims()
    r.ok = r.state === s && r.back === back && !r.rest && !r.restBack && (reduced ? r.during === 0 : r.during > 0)
  }
  await page.mouse.move(2, 2)
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  return res
}

// header stability (design review R5): hovering any locator number, or any chapter becoming current, must not move a
// number (desktop) or resize the index button (phones); an anchor jump lands the chapter's seam just under the header
async function headerAndAnchors(page) {
  const out = { moved: [], idxWidths: null, anchors: {} }
  const xs = () => page.evaluate(() => [...document.querySelectorAll('.loc a')].map((a) => Math.round(a.getBoundingClientRect().left * 2) / 2).join(','))
  const locVisible = await page.evaluate(() => { const l = document.querySelector('.loc'); return !!l && getComputedStyle(l).display !== 'none' })
  if (locVisible) {
    const rest = await xs()
    const n = await page.locator('.loc a').count()
    for (let i = 0; i < n; i++) {
      const b = await page.locator('.loc a').nth(i).boundingBox()
      for (const dx of [0, 1, 0]) { await page.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2); await page.waitForTimeout(160); const now = await xs(); if (now !== rest) out.moved.push(`hover ${i + 1}: ${now} (rest ${rest})`) }
    }
    await page.mouse.move(2, 400)
  }
  const ids = await page.evaluate(() => [...document.querySelectorAll('main > section.ch[id]')].map((s) => s.id))
  const w = new Set(), pos = new Set()
  for (const id of ids) {
    await page.evaluate((id) => { document.documentElement.style.scrollBehavior = 'auto'; location.hash = '#' + id }, id)
    await page.waitForTimeout(500)
    out.anchors[id] = await page.evaluate((id) => { const s = document.getElementById(id), sm = s.querySelector(':scope > .seam'), hd = document.querySelector('.site-hd').getBoundingClientRect().bottom; return sm ? Math.round(sm.getBoundingClientRect().top - hd) : Math.round(s.getBoundingClientRect().top - hd) }, id)
    w.add(await page.evaluate(() => { const i = document.querySelector('.idx'); return i && getComputedStyle(i).display !== 'none' ? Math.round(i.getBoundingClientRect().width) : null }))
    if (locVisible) pos.add(await xs())
  }
  out.idxWidths = [...w]
  if (pos.size > 1) out.moved.push(`chapter change: ${[...pos].join(' | ')}`)
  await page.evaluate(() => { history.replaceState(null, '', location.pathname + location.search); scrollTo({ top: 0, behavior: 'instant' }); document.documentElement.style.scrollBehavior = '' })
  return out
}

// in-page helpers shared by the --full layout checks and the accessibility checks below. chk(page) installs them as
// window.__chk (each is sent as its source text, so it may use only the page and window.__chk)
const pageHelpers = {
  // the header row (R5, §14 item 56): its visible items left to right, whether two overlap, the index button's label
  headerRow() {
    const hd = document.querySelector('.hd-row'), vis = (el) => el && getComputedStyle(el).display !== 'none'
    const items = [...hd.children].filter(vis).map((el) => { const r = el.getBoundingClientRect(); return { c: el.className.split(' ')[0], l: Math.round(r.left), r: Math.round(r.right), h: Math.round(r.height) } })
    const overlap = items.some((a, i) => items.slice(i + 1).some((b) => a.r > b.l + 0.5))
    const idx = document.querySelector('.idx')
    return { header: items, overlap, idxLabel: vis(idx) ? idx.innerText.replace(/\s+/g, ' ').trim() : null, idxClipped: vis(idx) ? idx.scrollWidth > idx.clientWidth : null }
  },
  // a focus indicator in a computed style: a visible outline (style, width, colour, offset) and the box-shadow
  ringOf(c) {
    return { outline: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 && !/^(transparent|rgba\(.*,\s*0\))$/.test(c.outlineColor) ? `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} ${c.outlineOffset}` : '', shadow: c.boxShadow === 'none' ? '' : c.boxShadow }
  },
  // "In this page" rows: a part whose text is wider than its box
  contentsCut() {
    return [...document.querySelectorAll('.contents a > span')].filter((e) => getComputedStyle(e).display !== 'none' && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent)
  },
  // visible text runs under root: one box per SVG <text>, and per HTML text node (or, with lines, per line of it)
  runs(root, { lines = false } = {}) {
    const vis = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    const runs = []
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n; (n = tw.nextNode());) {
      const el = n.parentElement
      if (!n.data.trim() || !el || el.closest('.sr-only,[aria-hidden="true"] title') || !vis(el)) continue
      const t = n.data.trim().slice(0, 24)
      if (el instanceof SVGElement) {
        const R = (el.closest('text') || el).getBoundingClientRect()
        if (R.width >= 1 && R.height >= 1) runs.push({ t, R, el: el.closest('text') || el })
        continue
      }
      const rg = document.createRange(); rg.selectNodeContents(n)
      for (const R of lines ? rg.getClientRects() : [rg.getBoundingClientRect()]) if (R.width >= 1 && R.height >= 1) runs.push({ t, R, el })
    }
    return runs
  },
  // a short name for a finding: section, tag.firstClass and (text) the accessible name or text
  label(el, text = true) {
    const s = el.closest('section[id], #contact, footer, header'), c = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : ''
    return `${s && s !== el ? `${s.id || s.tagName.toLowerCase()} ` : ''}${el.tagName.toLowerCase()}${c}${text ? ` "${(el.getAttribute('aria-label') || el.textContent).replace(/\s+/g, ' ').trim().slice(0, 28)}"` : ''}`
  },
  // pairs of runs from unrelated elements whose boxes share more than 2 × 3 px (a text box is taller than its glyphs)
  overlaps(runs) {
    const out = []
    for (let i = 0; i < runs.length; i++) {
      for (let j = i + 1; j < runs.length; j++) {
        const a = runs[i], b = runs[j]
        const x = Math.min(a.R.right, b.R.right) - Math.max(a.R.left, b.R.left), y = Math.min(a.R.bottom, b.R.bottom) - Math.max(a.R.top, b.R.top)
        if (x > 2 && y > 3 && a.el !== b.el && !a.el.contains(b.el) && !b.el.contains(a.el)) out.push({ a, b, x, y })
      }
    }
    return out
  },
}
const chk = (page) => page.evaluate(`window.__chk = {${Object.values(pageHelpers).map(String).join(',\n')}}`)

async function run(name, ctxOpts, { throttle = 1, reduced = false } = {}) {
  const ctx = await browser.newContext({ ...ctxOpts, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  const errors = [], hard = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); if (m.type() === 'error') hard.push(`console error: ${m.text()}`) })
  page.on('pageerror', (e) => { errors.push(`pageerror: ${e}`); hard.push(`pageerror: ${e}`) })
  page.on('response', (r) => { if (r.status() >= 400) hard.push(`HTTP ${r.status()} ${r.url()}`) })
  page.on('requestfailed', (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText || '')) hard.push(`request failed ${r.url()} (${r.failure()?.errorText})`) })
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${out}-${name}-0.png` })
  await page.waitForTimeout(4500)
  await page.screenshot({ path: `${out}-${name}-settled.png` })
  const r0 = await page.evaluate(() => ({ r: window.__proto?.renders ?? null, f: window.__stage?.frames ?? null }))
  await page.waitForTimeout(2000)
  const r1 = await page.evaluate(() => ({ r: window.__proto?.renders ?? null, f: window.__stage?.frames ?? null, a: document.getAnimations().length }))
  const rendersAtRest = r0.r == null || r1.r == null ? null : r1.r - r0.r
  const framesAtRest = r0.f == null || r1.f == null ? null : r1.f - r0.f
  flag(!rendersAtRest && !framesAtRest, `renders/frames at rest ${rendersAtRest}/${framesAtRest}`, hard)
  const firstScreen = await page.evaluate(() => {
    const el = document.querySelector('[data-hero-figure]')
    if (!el) return null
    // §14 item 46: the first screen holds the eyebrow, H1, the field and its control (the caption may fall below)
    const b = el.getBoundingClientRect()
    const end = Math.max(...[el.querySelector('.plate'), el.querySelector('.ctrl')].filter(Boolean).map((e) => e.getBoundingClientRect().bottom))
    return { top: Math.round(b.top), bottom: Math.round(end), figureBottom: Math.round(b.bottom), vh: innerHeight, fits: end <= innerHeight + 1 }
  })
  const vp = page.viewportSize()
  await page.mouse.move(vp.width * 0.6, vp.height * 0.45, { steps: 8 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}-${name}-hover.png` })
  await page.evaluate(() => scrollTo(0, innerHeight * 0.6))
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}-${name}-scroll.png` })
  await page.evaluate(() => scrollTo(0, 0))
  const cdp = await ctx.newCDPSession(page)
  if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
  const stats = await page.evaluate(async () => {
    const t = []; let last = performance.now(); let on = true
    const loop = (now) => { t.push(now - last); last = now; if (on) requestAnimationFrame(loop) }
    requestAnimationFrame(loop)
    await new Promise((r) => setTimeout(r, 3000))
    on = false; t.shift(); t.sort((a, b) => a - b)
    const q = (p) => t[Math.floor(t.length * p)]
    return { frames: t.length, median: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1) }
  })
  if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  const hdr = await headerAndAnchors(page)
  flag(!hdr.moved.length, `header locator moved: ${hdr.moved.slice(0, 3).join('; ')}`, hard)
  flag(hdr.idxWidths.length <= 1, `index button width changes with the chapter: ${hdr.idxWidths.join(', ')}`, hard)
  for (const [id, d] of Object.entries(hdr.anchors)) if (id !== 'engineering') flag(d >= 0 && d <= 48, `#${id}: seam lands ${d} px under the header (0–48)`, hard)
  const sr = await scrollRest(page)
  const press = await pressAfterIntro(page, reduced)
  for (const [id, v] of Object.entries(press)) flag(v.ok, `${id}: a press after the intro ${reduced ? 'must switch at once' : 'must animate, then rest'}: ${JSON.stringify(v)}`, hard)
  for (const [id, v] of Object.entries(sr)) if (v) flag(!v.renders && !v.frames && !v.animations, `${id}: at rest renders ${v.renders} frames ${v.frames} animations ${v.animations}`, hard)
  const layout = await page.evaluate(() => {
    const p = window.__proto
    const info = p?.renderer?.info
    return {
      overflowX: document.documentElement.scrollWidth > innerWidth,
      canvases: [...document.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}`),
      h1: document.querySelector('h1')?.textContent?.trim().slice(0, 80) ?? null,
      drawCalls: info?.render?.calls ?? null,
      triangles: info?.render?.triangles ?? null,
      pixelRatio: p?.renderer?.getPixelRatio?.() ?? null,
      cpuMs: p?.cpuMs != null ? +p.cpuMs.toFixed(2) : null,
      quality: p?.quality ?? null,
    }
  })
  flag(!layout.overflowX, 'horizontal overflow', hard)
  flag(layout.canvases.length <= 1, `${layout.canvases.length} canvases (one shared canvas)`, hard)
  if (layout.drawCalls != null) flag(layout.drawCalls <= B.drawCalls, `draw calls ${layout.drawCalls} > ${B.drawCalls}`, hard)
  if (layout.cpuMs != null) flag(layout.cpuMs <= B.cpuMsPerFrame, `cpuMs ${layout.cpuMs} > ${B.cpuMsPerFrame}`, hard)
  const mp = await page.evaluate(() => { const c = document.querySelector('canvas'); return c ? c.width * c.height / 1e6 : 0 })
  flag(mp <= (vp.width < 600 ? B.mpCoarse : B.mpFine) + 1e-6, `drawing buffer ${mp.toFixed(3)} MP over budget`, hard)
  const nums = await page.evaluate(numbers, { facts, rows: facts.ledger.rows })
  for (const [k, v] of Object.entries(nums.readouts)) flag(v.ok, `readout ${k} "${v.dom}" ≠ fact "${v.fact}"`, hard)
  for (const row of nums.ledger || []) flag(row.ok, `ledger ${row.key}: cell "${row.cell}" / readout "${row.readout}" / fact "${row.fact}"`, hard)
  const stage = await page.evaluate(() => window.__stage?.state?.() ?? null)
  const three = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /js\/chunks\/chunk-|three/.test(e.name)).length)
  if (reduced) flag(three === 0 || !stage || /posters/.test(stage.quality), 'three.js requested under reduced motion', hard)
  if (hard.length) hardFail = true // page errors, console errors and HTTP errors are pushed straight into hard
  console.log(JSON.stringify({ name, throttle, reduced, rendersAtRest, framesAtRest, firstScreen, stats, header: hdr, layout, scrollRest: sr, press, stage, readouts: nums.readouts, ledger: nums.ledger, hard, errors: errors.slice(0, 8) }))
  await ctx.close()
}

// a fresh page for an accessibility profile: page errors and HTTP errors are hard failures, as in run()
async function freshPage(w, h, query = '') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } })
  const page = await ctx.newPage(), hard = []
  page.on('pageerror', (e) => hard.push(`pageerror: ${e}`))
  page.on('response', (r) => { if (r.status() >= 400) hard.push(`HTTP ${r.status()} ${r.url()}`) })
  page.on('requestfailed', (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText || '')) hard.push(`request failed ${r.url()} (${r.failure()?.errorText})`) })
  await page.goto(url + (query ? (url.includes('?') ? '&' : '?') + query : ''), { waitUntil: 'load' })
  await page.waitForTimeout(1000); await chk(page)
  return { ctx, page, hard }
}

// keyboard Tab-walk (WCAG 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 2.4.11) at 390 × 844 and 1440 × 900, motion on: from the top,
// Tab through every focusable element until focus leaves the page or wraps to the start (cap 400 presses). Every focused
// element, once the browser has scrolled it into view, must lie fully inside the viewport (the skip link included: it must
// appear when focused) and show a :focus-visible indicator: an outline of some width, or a box-shadow, that it does not
// wear at rest (each element's resting style is read again after the walk, when nothing is focused). Every one outside
// the sticky header, the skip link and an open dialog must also not sit under the header (top ≥ header bottom). The walk
// must reach the footer's last focusable, every figure control and every <details> summary, and must not return to an
// element before it ends (a focus trap).
const FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, iframe, [tabindex]:not([tabindex="-1"]), [contenteditable=""], [contenteditable="true"]'
const tabStep = async (i) => {
  const ringOf = window.__chk.ringOf
  // the focus scroll is smooth under html.motion: wait for 8 frames without movement (2 s at most)
  for (let y = scrollY, calm = 0, k = 0; k < 120 && calm < 8; k++) { await new Promise((r) => requestAnimationFrame(r)); calm = scrollY === y ? calm + 1 : 0; y = scrollY }
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return { out: true }
  const name = window.__chk.label(el), seen = window.__tab || (window.__tab = new Map())
  if (seen.has(el)) return { name, again: seen.get(el) }
  const R = el.getBoundingClientRect(), hd = document.querySelector('.site-hd').getBoundingClientRect().bottom
  const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight
  const focused = { ...ringOf(getComputedStyle(el)), fv: el.matches(':focus-visible') }
  seen.set(el, { i, focused })
  // the header, the skip link and an open dialog sit over the page: only the under-the-header rule does not apply to them
  const over = !!el.closest('.site-hd, dialog[open]') || el.matches('.skip')
  return { name, i, over, box: [R.left, R.top, R.right, R.bottom].map(Math.round), hd: Math.round(hd), inView: R.left >= -0.5 && R.top >= -0.5 && R.right <= W + 0.5 && R.bottom <= H + 0.5, belowHeader: over || R.top >= hd - 0.5 }
}
// after the walk (nothing focused): each step's indicator = a focused outline or box-shadow that differs from its rest
const ringsAfter = () => {
  const ringOf = window.__chk.ringOf, out = {}
  for (const [el, { i, focused: f }] of window.__tab || []) {
    const r = ringOf(getComputedStyle(el))
    out[i] = f.fv && ((!!f.outline && f.outline !== r.outline) || (!!f.shadow && f.shadow !== r.shadow))
  }
  return out
}
const tabReach = (sel) => {
  const seen = window.__tab || new Map(), vis = (el) => el.checkVisibility({ visibilityProperty: true }), name = window.__chk.label
  const ft = [...document.querySelectorAll('.site-ft')].flatMap((f) => [...f.querySelectorAll(sel)]).filter(vis), last = ft[ft.length - 1]
  const controls = [...document.querySelectorAll('figure.fig .ctrl button')].filter((b) => vis(b) && !b.disabled)
  const summaries = [...document.querySelectorAll('details > summary:first-of-type')].filter(vis)
  return { footerLast: last ? name(last) : null, footerLastReached: !!last && seen.has(last), controls: controls.length, summaries: summaries.length,
    missedControls: controls.filter((e) => !seen.has(e)).map((e) => name(e)), missedSummaries: summaries.filter((e) => !seen.has(e)).map((e) => name(e)) }
}
async function tabWalk(w, h) {
  const t0 = Date.now(), { ctx, page, hard } = await freshPage(w, h)
  const steps = []; let end = 'cap of 400 presses'
  for (let i = 0; i < 400; i++) {
    await page.keyboard.press('Tab')
    const s = await page.evaluate(tabStep, i)
    if (s.out) { end = 'left the page'; break }
    if (s.again != null) { end = s.again.i === 0 ? 'wrapped to the start' : `back to ${s.name} (press ${s.again.i + 1}) at press ${i + 1}`; break }
    steps.push(s)
  }
  // focus has left the page (or wrapped): read every stepped element's resting style
  await page.evaluate(() => document.activeElement?.blur?.())
  const rings = await page.evaluate(ringsAfter)
  const reach = await page.evaluate(tabReach, FOCUSABLE)
  const offscreen = steps.filter((s) => !(s.inView && s.belowHeader)).map((s) => `${s.name} at ${s.box.join(',')} (header bottom ${s.hd})`)
  const noRing = steps.filter((s) => !rings[s.i]).map((s) => s.name)
  flag(/^(left the page|wrapped)/.test(end), `focus trap: ${end}`, hard)
  flag(!offscreen.length, `focused outside the viewport or under the header: ${offscreen.slice(0, 4).join('; ')}`, hard)
  flag(!noRing.length, `no visible focus indicator: ${noRing.slice(0, 4).join('; ')}`, hard)
  flag(reach.footerLastReached, `the footer's last focusable was not reached: ${reach.footerLast}`, hard)
  flag(!reach.missedControls.length && reach.controls > 0, `figure controls not reached: ${reach.missedControls.slice(0, 6).join('; ') || 'none on the page'}`, hard)
  flag(!reach.missedSummaries.length && reach.summaries > 0, `summaries not reached: ${reach.missedSummaries.slice(0, 6).join('; ') || 'none on the page'}`, hard)
  if (hard.length) hardFail = true
  console.log(JSON.stringify({ name: `keyboard-${w}x${h}`, presses: steps.length + 1, end, focused: steps.length, overlays: steps.filter((s) => s.over).length, offscreen, noRing, reach, ms: Date.now() - t0, hard }))
  await ctx.close()
}

// WCAG 1.4.12 text spacing at 320 × 640, 390 × 844 and 1280 × 800, figures final (?intro=0), every chapter laid out (as
// main.js does before a jump) and every <details> open: line height 1.5, letter spacing 0.12em, word spacing 0.16em and
// 2em after paragraphs, all !important, on HTML text only (each outer <svg> keeps the spacing it inherited, so drawings
// and their SVG text are unchanged). Asserts: no horizontal page overflow and no visible text past the viewport (body
// clips x, so scrollWidth alone misses it); no text line cut by an overflow hidden / clip box (the box's scrollWidth or
// scrollHeight exceeds its client box because of that text, by more than the 3 px a text box is taller than its glyphs);
// no two unrelated text lines overlap (runs / overlaps, as in the --full figure-label check); header items neither
// overlap nor leave the viewport, the index label and the "In this page" rows are not cut (headerRow / contentsCut, as
// in the --full sweep). A finding inside a SPACING_ALLOW selector is reported under `allowed`, not failed.
const TEXT_SPACING = 'body *:not(svg, svg *){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}body p{margin-bottom:2em!important}'
const SPACING_ALLOW = [
  ['.plate', 'in-plot text (A6) is placed on measured fixed metrics inside the drawing, like the SVG text the override skips'],
]
const applySpacing = (css) => {
  document.documentElement.classList.remove('c0')
  for (const s of document.querySelectorAll('main > .ch, #contact, .site-ft')) s.style.contentVisibility = 'visible'
  for (const d of document.querySelectorAll('details')) d.open = true
  const keep = [...document.querySelectorAll('svg')].filter((s) => !s.parentElement?.closest('svg')).map((s) => { const c = getComputedStyle(s); return [s, c.letterSpacing, c.wordSpacing] })
  document.head.append(Object.assign(document.createElement('style'), { textContent: css }))
  for (const [s, l, ws] of keep) { s.style.setProperty('letter-spacing', l, 'important'); s.style.setProperty('word-spacing', ws, 'important') }
}
const spacingAudit = (allow) => {
  const H = window.__chk, W = document.documentElement.clientWidth, cs = new Map(), cutBy = new Map()
  const st = (e) => { if (!cs.has(e)) cs.set(e, getComputedStyle(e)); return cs.get(e) }
  const res = { overflowX: document.documentElement.scrollWidth > W, beyond: [], clipped: [], overlaps: [], ...H.headerRow(), contentsCut: H.contentsCut(), allowed: [] }
  res.headerOut = res.header.filter((i) => i.l < -0.5 || i.r > W + 0.5).map((i) => i.c)
  const add = (key, els, msg) => { const a = allow.find(([sel]) => els.some((e) => e.closest(sel))); if (a) res.allowed.push(`${key}: ${msg} [${a[0]}]`); else res[key].push(msg) }
  const runs = H.runs(document.body, { lines: true }).filter((r) => !r.el.closest('.skip'))
  for (const r of runs) {
    if (r.el instanceof SVGElement) continue // not overridden; still an overlap partner
    // clip the line to every overflow hidden / clip box above it (below body: body's x clip is the viewport, `beyond`)
    let { left, right, top, bottom } = r.R
    for (let a = r.el; a && a !== document.body; a = a.parentElement) {
      const c = st(a), cx = c.overflowX !== 'visible', cy = c.overflowY !== 'visible'
      if (!cx && !cy) continue
      const B = a.getBoundingClientRect(), m = c.overflowX === 'clip' && c.overflowY === 'clip' ? parseFloat(c.overflowClipMargin) || 0 : 0
      const bl = B.left + a.clientLeft - m, bt = B.top + a.clientTop - m, br = bl + a.clientWidth + 2 * m, bb = bt + a.clientHeight + 2 * m
      // only hidden / clip lose the text (auto / scroll scroll to it); every box limits what is visible
      const lx = c.overflowX === 'hidden' || c.overflowX === 'clip', ly = c.overflowY === 'hidden' || c.overflowY === 'clip'
      if ((lx && (left < bl - 3 || right > br + 3)) || (ly && (top < bt - 3 || bottom > bb + 3))) {
        const done = cutBy.get(a) || new Set()
        if (!done.has(r.el)) add('clipped', [r.el], `${H.label(r.el)} cut by ${H.label(a, false)} (${c.overflowX}/${c.overflowY}, scroll ${a.scrollWidth}×${a.scrollHeight}, client ${a.clientWidth}×${a.clientHeight})`)
        cutBy.set(a, done.add(r.el))
      }
      if (cx) { left = Math.max(left, bl); right = Math.min(right, br) }
      if (cy) { top = Math.max(top, bt); bottom = Math.min(bottom, bb) }
    }
    r.R = { left, right, top, bottom }
    if (right - left >= 1 && (right > W + 1 || left < -1)) add('beyond', [r.el], `${H.label(r.el)} ${Math.round(left)}–${Math.round(right)} (viewport ${W})`)
  }
  for (const { a, b, x, y } of H.overlaps(runs.filter((r) => r.R.right - r.R.left >= 1 && r.R.bottom - r.R.top >= 1))) add('overlaps', [a.el, b.el], `${H.label(a.el)} × ${H.label(b.el)} (${Math.round(x)}×${Math.round(y)})`)
  return res
}
async function textSpacing(w, h) {
  const t0 = Date.now(), { ctx, page, hard } = await freshPage(w, h, 'intro=0')
  await page.evaluate(applySpacing, TEXT_SPACING)
  await page.waitForTimeout(300)
  const r = await page.evaluate(spacingAudit, SPACING_ALLOW)
  flag(!r.overflowX && !r.beyond.length, `horizontal overflow${r.overflowX ? ' (scrollWidth)' : ''}: ${r.beyond.slice(0, 4).join('; ')}`, hard)
  flag(!r.clipped.length, `text cut by its box: ${r.clipped.slice(0, 4).join('; ')}`, hard)
  flag(!r.overlaps.length, `overlapping text: ${r.overlaps.slice(0, 4).join('; ')}`, hard)
  flag(!r.overlap && !r.headerOut.length && !r.idxClipped && !r.contentsCut.length, `header / contents: ${JSON.stringify({ header: r.header, idxClipped: r.idxClipped, contentsCut: r.contentsCut })}`, hard)
  if (hard.length) hardFail = true
  console.log(JSON.stringify({ name: `spacing-${w}x${h}`, ...r, ms: Date.now() - t0, hard }))
  await ctx.close()
}

if (!A11Y) {
  await run('desktop', { viewport: { width: 1440, height: 900 } })
  await run('mobile', { ...devices['Pixel 7'] }, { throttle: 4 })
  await run('mobile-reduced', { ...devices['iPhone 13'] }, { reduced: true })
}
for (const [w, h] of [[390, 844], [1440, 900]]) await tabWalk(w, h)
for (const [w, h] of [[320, 640], [390, 844], [1280, 800]]) await textSpacing(w, h)

if (FULL) {
  const res = {}, problems = []
  // overflow sweep (§14 item 41) + header at 320 / 360 (item 56)
  for (const w of [320, 360, 375, 390, 768, 1024, 1180, 1280, 1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 640 : 900 } })
    const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(800); await chk(p)
    res[`w${w}`] = await p.evaluate(() => {
      return { overflowX: document.documentElement.scrollWidth > innerWidth, ...window.__chk.headerRow(),
        summariesOneLine: [...document.querySelectorAll('details.methods > summary')].every((s) => s.getBoundingClientRect().height <= 46),
        contentsCut: window.__chk.contentsCut(),
        frameEdge: innerWidth < 1024 ? [] : [...document.querySelectorAll('.fig--plate')].filter((f) => getComputedStyle(f).getPropertyValue('--aspect').trim()).flatMap((f) => { const pr = f.querySelector(':scope > .plate')?.getBoundingClientRect().right; return [...f.querySelectorAll(':scope > .readout, :scope > .ctrl, :scope > figcaption')].filter((e) => e.getBoundingClientRect().right > pr + 1).map((e) => `${f.id} .${e.className.split(' ')[0] || e.tagName.toLowerCase()}`) }) }
    })
    flag(!res[`w${w}`].overflowX && !res[`w${w}`].overlap && !res[`w${w}`].idxClipped && !res[`w${w}`].contentsCut.length && !res[`w${w}`].frameEdge.length, `layout at ${w}: ${JSON.stringify(res[`w${w}`])}`, problems)
    await p.screenshot({ path: `${out}-w${w}.png` })
    await ctx.close()
  }
  // figure labels + control rows on short desktop windows (where the height cap shrinks the plates) and a phone: every
  // figure in its final state (?intro=0), no two visible text runs inside a plate overlap, none runs past the plate
  // edge by more than 3 px (plates clip; a text range's box is taller than its glyphs), and on desktop each control row
  // stays on one line
  for (const [w, h] of [[1024, 600], [1280, 720], [1366, 657], [1440, 900], [1920, 1080], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } })
    const p = await ctx.newPage(); await p.goto(url + (url.includes('?') ? '&' : '?') + 'intro=0'); await p.waitForTimeout(800); await chk(p)
    const r = res[`fig${w}x${h}`] = await p.evaluate(() => {
      const vis = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      const out = { overlaps: [], clipped: [], ctrlRows: [] }
      for (const f of document.querySelectorAll('figure.fig')) {
        const plate = f.querySelector(':scope > .plate'); if (!plate) continue
        f.scrollIntoView({ block: 'center', behavior: 'instant' })
        const P = plate.getBoundingClientRect(), runs = window.__chk.runs(plate)
        for (const a of runs) if (a.R.left < P.left - 3 || a.R.right > P.right + 3 || a.R.top < P.top - 3 || a.R.bottom > P.bottom + 3) out.clipped.push(`${f.id} "${a.t}"`)
        for (const { a, b, x, y } of window.__chk.overlaps(runs)) out.overlaps.push(`${f.id} "${a.t}" × "${b.t}" (${Math.round(x)}×${Math.round(y)})`)
        const c = f.querySelector(':scope > .ctrl')
        if (c && vis(c) && innerWidth >= 1024) { const tops = new Set([...c.querySelectorAll('button')].filter((b) => b.getClientRects().length && vis(b)).map((b) => Math.round(b.getBoundingClientRect().top))); if (tops.size > 1) out.ctrlRows.push(`${f.id}: ${tops.size} rows`) }
      }
      out.plates = [...document.querySelectorAll('.fig--plate')].map((f) => `${f.id.slice(4)}:${Math.round(f.querySelector(':scope > .plate').getBoundingClientRect().width)}`).join(' ')
      return out
    })
    flag(!r.overlaps.length && !r.clipped.length && !r.ctrlRows.length, `figure labels / controls at ${w}×${h}: ${JSON.stringify(r)}`, problems)
    await ctx.close()
  }
  // CLS with fonts delayed 1.5 s (§14 item 39), desktop and phone, page scrolled top to bottom
  for (const [n, o] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const ctx = await browser.newContext(o); const p = await ctx.newPage()
    await p.route('**/*.woff2', async (r) => { await new Promise((res) => setTimeout(res, 1500)); await r.continue() })
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true }) })
    await p.goto(url); await p.waitForTimeout(3000)
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.7) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 120)) } })
    await p.waitForTimeout(500)
    res[`cls-${n}`] = +(await p.evaluate(() => window.__cls)).toFixed(4)
    flag(res[`cls-${n}`] <= B.cls, `CLS ${n} ${res[`cls-${n}`]} > ${B.cls}`, problems)
    await ctx.close()
  }
  // no WebGL: posters for every GL state, readouts intact
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage()
    await p.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return /webgl/.test(t) ? null : g.call(this, t, o) } })
    await p.goto(url); await p.waitForTimeout(4000)
    // DOM figures never use WebGL: their intros still play when each is reached, so visit every figure first
    res.noWebGLRest = await scrollRest(p)
    res.noWebGL = await p.evaluate((cfg) => ({ quality: window.__stage.quality, canvases: document.querySelectorAll('canvas').length, ...(() => { const r = {}; for (const el of document.querySelectorAll('[data-fact-readout]')) r[el.dataset.factReadout] = el.textContent.trim() === cfg[el.dataset.factReadout].value; return { readoutsOk: Object.values(r).every(Boolean) } })() }), facts)
    flag(res.noWebGL.readoutsOk && res.noWebGL.canvases === 0, `no WebGL: ${JSON.stringify(res.noWebGL)}`, problems)
    await ctx.close()
  }
  // forced context loss and restore (§14 item 49)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage()
    await p.goto(url); await p.waitForTimeout(6000)
    const has = await p.evaluate(() => !!window.__stage.renderer)
    if (has) {
      await p.evaluate(() => { window.__ext = window.__stage.renderer.getContext().getExtension('WEBGL_lose_context'); window.__ext.loseContext() }); await p.waitForTimeout(500)
      const lost = await p.evaluate(() => ({ quality: window.__stage.quality, canvasOpacity: getComputedStyle(document.querySelector('canvas')).opacity }))
      await p.evaluate(() => window.__ext.restoreContext()); await p.waitForTimeout(1500)
      const back = await p.evaluate(() => ({ quality: window.__stage.quality, st: window.__stage.state() }))
      res.contextLoss = { lost, back }
    } else res.contextLoss = 'no renderer'
    await ctx.close()
  }
  // hidden tab: no frames while hidden
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage()
    await p.goto(url); await p.waitForTimeout(500)
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
    const a = await p.evaluate(() => window.__stage.frames); await p.waitForTimeout(2000)
    res.hiddenTab = { frames: (await p.evaluate(() => window.__stage.frames)) - a }
    flag(res.hiddenTab.frames === 0, `hidden tab drew ${res.hiddenTab.frames} frames`, problems)
    await ctx.close()
  }
  // URL-bar collapse emulation (§14 item 45): pin --svh, grow the viewport, nothing may move or render
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }); const p = await ctx.newPage()
    await p.goto(url); await p.waitForTimeout(5000)
    const snap = () => p.evaluate(() => ({ sizes: [...document.querySelectorAll('figure, .plate, .hero, header, section.ch')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width * 2) / 2, Math.round(r.height * 2) / 2] }), renders: window.__stage.renders, ro: window.__stage.roForwarded, anim: document.getAnimations().length }))
    const runs = []
    for (const at of ['top', '#fig-burette', '#fig-record']) {
      await p.evaluate((at) => { if (at === 'top') scrollTo(0, 0); else document.querySelector(at)?.scrollIntoView({ block: 'center' }) }, at)
      await p.waitForTimeout(4500)
      await p.setViewportSize({ width: 390, height: 664 }); await p.waitForTimeout(300)
      await p.evaluate(() => document.documentElement.style.setProperty('--svh', innerHeight / 100 + 'px'))
      await p.waitForTimeout(200)
      const a = await snap()
      await p.setViewportSize({ width: 390, height: 720 }); await p.waitForTimeout(400)
      const b = await snap()
      const moved = a.sizes.filter((s, i) => Math.abs(s[0] - b.sizes[i][0]) > 0.5 || Math.abs(s[1] - b.sizes[i][1]) > 0.5).length
      runs.push({ at, moved, renders: b.renders - a.renders, ro: b.ro - a.ro, newAnimations: b.anim - a.anim })
      await p.evaluate(() => document.documentElement.style.removeProperty('--svh'))
    }
    res.urlBar = runs
    for (const r of runs) flag(!r.moved && !r.renders && !r.ro && r.newAnimations <= 0, `URL-bar at ${r.at}: ${JSON.stringify(r)}`, problems)
    await ctx.close()
  }
  // Fig. 8 verifier probes (§14 items 10(b)/(c), 12, 13, 50): crypto.subtle call counts per state, fault injection, the
  // no-subtle fallback. They live in DI's review tool; run it against this page when the page carries the ledger.
  const diTool = join(C, 'chapters/06-data-integrity/tools/verify.mjs')
  if (existsSync(diTool) && /id="fig-record"/.test(await (await fetch(url)).text())) {
    const r = spawnSync(process.execPath, [diTool, file.replace(/\.html$/, ''), `--base=${base}`], { encoding: 'utf8', timeout: 300000 })
    const tail = (r.stdout + r.stderr).trim().split('\n').slice(-3).join(' | ')
    res.ledgerVerifier = { exit: r.status, tail: tail.slice(0, 600) }
    flag(r.status === 0, `Fig. 8 verifier probes failed: ${tail.slice(0, 300)}`, problems)
  }
  console.log(JSON.stringify({ name: 'full', ...res, problems }))
}
await browser.close()
if (srv) srv.close()
process.exit(hardFail ? 1 : 0)
