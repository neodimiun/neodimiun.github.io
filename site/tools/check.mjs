// tools/check.mjs (DS lead) — the Path C harness. Extends the prototype harness (same JSON fields per profile) with the stage,
// rest checks at every figure, readout/ledger/facts equality and, with --full, the SPEC-C §14 layout and fallback profiles.
//   node tools/check.mjs <index | dev-<slug> | path.html> [out-prefix] [--full] [--root=<dir> | --base=<url>]
//   Without --base it serves --root itself (relative to site/; default .build/www; `npm run check` passes --root=..).
//   Every HTTP response >= 400 and every failed request is a hard failure (missing asset).
// Exit code 1 when a hard check fails (renders/frames at rest, overflow, readout/ledger mismatch, page errors).
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
  console.log(JSON.stringify({ name, throttle, reduced, rendersAtRest, framesAtRest, firstScreen, stats, header: hdr, layout, scrollRest: sr, stage, readouts: nums.readouts, ledger: nums.ledger, hard, errors: errors.slice(0, 8) }))
  await ctx.close()
}

await run('desktop', { viewport: { width: 1440, height: 900 } })
await run('mobile', { ...devices['Pixel 7'] }, { throttle: 4 })
await run('mobile-reduced', { ...devices['iPhone 13'] }, { reduced: true })

if (FULL) {
  const res = {}, problems = []
  // overflow sweep (§14 item 41) + header at 320 / 360 (item 56)
  for (const w of [320, 360, 375, 390, 768, 1024, 1180, 1280, 1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 640 : 900 } })
    const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(800)
    res[`w${w}`] = await p.evaluate(() => {
      const hd = document.querySelector('.hd-row'), vis = (el) => el && getComputedStyle(el).display !== 'none'
      const items = [...hd.children].filter(vis).map((el) => { const r = el.getBoundingClientRect(); return { c: el.className.split(' ')[0], l: Math.round(r.left), r: Math.round(r.right), h: Math.round(r.height) } })
      const overlap = items.some((a, i) => items.slice(i + 1).some((b) => a.r > b.l + 0.5))
      const idx = document.querySelector('.idx')
      return { overflowX: document.documentElement.scrollWidth > innerWidth, header: items, overlap,
        idxLabel: vis(idx) ? idx.innerText.replace(/\s+/g, ' ').trim() : null, idxClipped: vis(idx) ? idx.scrollWidth > idx.clientWidth : null,
        summariesOneLine: [...document.querySelectorAll('details.methods > summary')].every((s) => s.getBoundingClientRect().height <= 46),
        contentsCut: [...document.querySelectorAll('.contents a > span')].filter((e) => vis(e) && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent),
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
    const p = await ctx.newPage(); await p.goto(url + (url.includes('?') ? '&' : '?') + 'intro=0'); await p.waitForTimeout(800)
    const r = res[`fig${w}x${h}`] = await p.evaluate(() => {
      const vis = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      const out = { overlaps: [], clipped: [], ctrlRows: [] }
      for (const f of document.querySelectorAll('figure.fig')) {
        const plate = f.querySelector(':scope > .plate'); if (!plate) continue
        f.scrollIntoView({ block: 'center', behavior: 'instant' })
        const P = plate.getBoundingClientRect(), runs = []
        const tw = document.createTreeWalker(plate, NodeFilter.SHOW_TEXT)
        for (let n; (n = tw.nextNode());) {
          const el = n.parentElement
          if (!n.data.trim() || !el || el.closest('.sr-only,[aria-hidden="true"] title') || !vis(el)) continue
          const rg = document.createRange(); rg.selectNodeContents(n)
          const R = el instanceof SVGElement ? (el.closest('text') || el).getBoundingClientRect() : rg.getBoundingClientRect()
          if (R.width < 1 || R.height < 1) continue
          runs.push({ t: n.data.trim().slice(0, 24), R, el: el instanceof SVGElement ? el.closest('text') || el : el })
        }
        for (const [i, a] of runs.entries()) {
          if (a.R.left < P.left - 3 || a.R.right > P.right + 3 || a.R.top < P.top - 3 || a.R.bottom > P.bottom + 3) out.clipped.push(`${f.id} "${a.t}"`)
          for (const b of runs.slice(i + 1)) {
            if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
            const x = Math.min(a.R.right, b.R.right) - Math.max(a.R.left, b.R.left), y = Math.min(a.R.bottom, b.R.bottom) - Math.max(a.R.top, b.R.top)
            if (x > 2 && y > 3) out.overlaps.push(`${f.id} "${a.t}" × "${b.t}" (${Math.round(x)}×${Math.round(y)})`)
          }
        }
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
  if (existsSync(diTool) && /id="fig-record"/.test(readFileSync(join(C, file), 'utf8'))) {
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
