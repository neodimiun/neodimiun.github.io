// Team ENV review aid (run by hand, never by build.mjs): screenshots and layout measurements of Fig. 6 on the dev page.
//   node chapters/04-environmental/tools/verify.mjs [outDir] [--base=http://localhost:8080/]
// Per viewport (1440×900, 390×844, 412×915, 360×740, 320×568) and per state: figure block height (must be equal across
// states), horizontal overflow, label font sizes (≥ 10.5 px at 320, ≥ 11 px at ≥ 390), pairwise label overlap (0), labels
// inside the plate and clear of the corner rows, button sizes (≥ 44), the button row on one line. Also: the intro (animation
// count, dash paths, duration), renders/rAF/animations at rest, the hover reading, reduced motion, no JS, and the inline
// figure size (gzip of its outerHTML, budget 4.2 KB).
import { chromium, devices } from 'playwright'
import { gzipSync } from 'node:zlib'
import { mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const out = args.find((a) => !a.startsWith('--')) || new URL('../../../.build/env-verify/', import.meta.url).pathname
const base = (args.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080/').slice(7)
mkdirSync(out, { recursive: true })
const URL0 = base + 'dev-environmental.html'
const STATES = ['std', 'sample', 'spike']
const VPS = [[1440, 900], [390, 844], [412, 915], [360, 740], [320, 568]]
// the dev page puts Fig. 6 near the top; on the real page it is far below the fold. A spacer (inserted while the page
// parses, before the stage boots) puts it below the fold so the stage arms the intro as it would on index.html.
const SPACER = () => new MutationObserver((_, o) => { const s = document.getElementById('environmental'); if (s && !s.previousElementSibling?.classList?.contains('sp')) { const d = document.createElement('div'); d.className = 'sp'; d.style.height = '1600px'; s.before(d); o.disconnect() } }).observe(document, { childList: true, subtree: true })
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const fails = []
const F = (m) => { fails.push(m); console.log('FAIL', m) }

function measure() {
  const fig = document.getElementById('fig-chromatogram'), plate = fig.querySelector('.plate'), pr = plate.getBoundingClientRect()
  const vis = (el) => { const cs = getComputedStyle(el); let e = el; while (e && e !== fig) { const c = getComputedStyle(e); if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity === 0) return false; e = e.parentElement } return cs.visibility !== 'hidden' }
  const labels = [...fig.querySelectorAll('.lb i, .plate .corner')].filter(vis).map((el) => {
    const r = el.getBoundingClientRect()
    return { t: el.textContent, x0: r.left, x1: r.right, y0: r.top, y1: r.bottom, fs: parseFloat(getComputedStyle(el).fontSize), corner: el.classList.contains('corner') }
  })
  const over = []
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    const a = labels[i], c = labels[j]
    const w = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0), h = Math.min(a.y1, c.y1) - Math.max(a.y0, c.y0)
    if (w > 0.5 && h > 0.5) over.push(`${a.t} × ${c.t} (${w.toFixed(1)}×${h.toFixed(1)})`)
  }
  const outside = labels.filter((l) => l.x0 < pr.left - 0.5 || l.x1 > pr.right + 0.5 || l.y0 < pr.top - 0.5 || l.y1 > pr.bottom + 0.5).map((l) => l.t)
  const cornerRow = 10 + 11 + 2 // corners: 10 px inset, 11 px text
  const inCorner = labels.filter((l) => !l.corner && (l.y0 < pr.top + cornerRow || l.y1 > pr.bottom - cornerRow)).map((l) => l.t)
  const minFs = Math.min(...labels.filter((l) => !l.corner).map((l) => l.fs))
  const btns = [...fig.querySelectorAll('.ctrl button')].filter((x) => x.offsetParent).map((x) => { const r = x.getBoundingClientRect(); return [x.textContent.trim() || x.getAttribute('aria-label'), Math.round(r.width), Math.round(r.height), Math.round(r.top)] })
  const ctrl = fig.querySelector('.ctrl').getBoundingClientRect()
  return {
    fig: Math.round(fig.getBoundingClientRect().height * 10) / 10, plate: [Math.round(pr.width * 10) / 10, Math.round(pr.height * 10) / 10],
    readout: Math.round(fig.querySelector('.readout').getBoundingClientRect().height * 10) / 10, cap: Math.round(fig.querySelector('figcaption').getBoundingClientRect().height),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, over, outside, inCorner, minFs, btns,
    oneRow: new Set(btns.map((x) => x[3])).size === 1, ctrlW: Math.round(ctrl.width),
    rowsOverflow: [...fig.querySelectorAll('.readout .row')].filter((r) => r.scrollWidth > r.clientWidth + 1).length,
  }
}

// ---- layout per viewport and state
for (const [w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 1000 ? 2 : 1, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(URL0 + '?hud=0', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready)
  const heights = {}
  for (const s of STATES) {
    await p.evaluate((s) => document.querySelector(`#fig-chromatogram [data-set="${s}"]`).click(), s)
    await p.waitForTimeout(80)
    const m = await p.evaluate(measure)
    heights[s] = m.fig
    console.log(`${w}×${h} ${s}`, JSON.stringify({ fig: m.fig, plate: m.plate, readout: m.readout, cap: m.cap, minFs: m.minFs, ctrlW: m.ctrlW, oneRow: m.oneRow }))
    if (m.overflow) F(`${w} ${s}: horizontal overflow ${m.overflow}px`)
    if (m.over.length) F(`${w} ${s}: label overlap ${m.over.join(' | ')}`)
    if (m.outside.length) F(`${w} ${s}: label outside the plate ${m.outside.join(' | ')}`)
    if (m.inCorner.length) F(`${w} ${s}: label in a corner row ${m.inCorner.join(' | ')}`)
    if (m.minFs < (w <= 360 ? 10.5 : 11)) F(`${w} ${s}: label font ${m.minFs}px`)
    if (m.btns.some((x) => x[1] < 44 || x[2] < 44)) F(`${w} ${s}: button under 44 px ${JSON.stringify(m.btns)}`)
    if (!m.oneRow) F(`${w} ${s}: buttons wrap ${JSON.stringify(m.btns)}`)
    if (m.rowsOverflow) F(`${w} ${s}: readout row overflows`)
    await p.locator('#fig-chromatogram').screenshot({ path: `${out}fig-${w}-${s}.png`, style: '.site-hd{visibility:hidden!important}' })
  }
  if (new Set(Object.values(heights)).size !== 1) F(`${w}: figure height differs by state ${JSON.stringify(heights)}`)
  await p.evaluate(() => document.querySelector('#fig-chromatogram [data-set="sample"]').click())
  await p.evaluate(() => document.getElementById('environmental').scrollIntoView())
  await p.waitForTimeout(100)
  await p.screenshot({ path: `${out}page-${w}.png`, fullPage: false })
  await p.locator('#environmental').screenshot({ path: `${out}chapter-${w}.png` })
  if (errs.length) F(`${w}: page errors ${errs.join(' | ')}`)
  await ctx.close()
}

// ---- intro, rest, hover (motion on, desktop)
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(SPACER)
  await ctx.addInitScript(() => {
    window.__raf = 0; const r = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (f) => { window.__raf++; return r(f) }
  })
  const p = await ctx.newPage()
  const logs = []; p.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`)); p.on('pageerror', (e) => F(`pageerror ${e}`))
  await p.goto(URL0 + '?hud=0', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready)
  const armed = await p.evaluate(() => document.getElementById('fig-chromatogram').classList.contains('pre'))
  await p.evaluate(() => document.getElementById('fig-chromatogram').scrollIntoView({ block: 'center' }))
  // sample the intro: max animation count, dash paths, end time
  const intro = await p.evaluate(async () => {
    const fig = document.getElementById('fig-chromatogram'), t0 = performance.now()
    let max = 0, dash = 0, start = 0, end = 0
    while (performance.now() - t0 < 6000) {
      const a = fig.getAnimations({ subtree: true })
      if (a.length && !start) start = performance.now()
      if (a.length > max) { max = a.length; dash = a.filter((x) => x.effect.getKeyframes().some((k) => 'strokeDashoffset' in k)).length }
      if (start && !a.length && !end) end = performance.now()
      if (end) break
      await new Promise((r) => setTimeout(r, 20))
    }
    return { max, dash, ms: Math.round(end - start), live: fig.querySelector('[data-live]').getAttribute('aria-live'), state: fig.dataset.state, live2: fig.querySelector('[data-live]').textContent }
  })
  console.log('intro', JSON.stringify({ armed, ...intro }))
  if (!armed) F('intro: figure was not armed below the fold')
  if (intro.max > 40 || intro.dash > 24 || intro.dash !== 8) F(`intro: ${intro.max} animations, ${intro.dash} dash paths`)
  if (intro.ms > 3600) F(`intro: ${intro.ms} ms`)
  if (intro.live !== 'polite' || intro.state !== 'sample') F(`intro end: live ${intro.live}, state ${intro.state}`)
  await p.screenshot({ path: `${out}desk-after-intro.png` })
  const rest = await p.evaluate(async () => {
    const s = window.__stage, a = { r: s.renders, f: s.frames, raf: window.__raf }
    await new Promise((r) => setTimeout(r, 3000))
    return { renders: s.renders - a.r, frames: s.frames - a.f, raf: window.__raf - a.raf, anims: document.getAnimations().length }
  })
  console.log('rest', JSON.stringify(rest))
  if (rest.renders || rest.raf || rest.anims) F(`rest: ${JSON.stringify(rest)}`)
  // states with motion: wait for transitions, then rest again
  for (const s of ['std', 'spike', 'sample']) {
    await p.click(`#fig-chromatogram [data-set="${s}"]`)
    await p.waitForTimeout(900)
    const r = await p.evaluate(async () => { const a = window.__raf; await new Promise((r) => setTimeout(r, 1000)); return { raf: window.__raf - a, anims: document.getAnimations().length, live: document.querySelector('#fig-chromatogram [data-live]').textContent } })
    console.log('state', s, JSON.stringify(r))
    if (r.raf || r.anims) F(`after ${s}: ${JSON.stringify(r)}`)
    await p.locator('#fig-chromatogram').screenshot({ path: `${out}desk-motion-${s}.png` })
  }
  // hover: the nitrate apex in the sample state
  const pt = await p.evaluate(() => { const r = document.querySelector('#fig-chromatogram .plate').getBoundingClientRect(); const u = r.width / 360; return { x: r.left + (58 + 31 * 3.21) * u, y: r.top + 300 * u } })
  await p.mouse.move(pt.x, pt.y)
  const hv = await p.evaluate(() => document.querySelector('#fig-chromatogram .cur .t')?.textContent)
  console.log('hover', hv)
  if (hv !== '3.20 min · 20.6 µS · Nitrate') F(`hover reads "${hv}"`)
  await p.locator('#fig-chromatogram').screenshot({ path: `${out}desk-hover.png` })
  const ro = await p.evaluate(() => document.querySelector('[data-fact-readout="env.key"]').textContent)
  if (ro !== '3.48') F(`readout ${ro} after hover`)
  await p.mouse.move(5, 5)
  // replay from a zoomed state
  await p.click('#fig-chromatogram [data-set="std"]'); await p.waitForTimeout(700)
  await p.click('#fig-chromatogram .replay'); await p.waitForTimeout(1100)
  await p.locator('#fig-chromatogram').screenshot({ path: `${out}desk-replay-1100.png` })
  await p.waitForTimeout(2000)
  const after = await p.evaluate(() => ({ state: document.getElementById('fig-chromatogram').dataset.state, anims: document.getAnimations().length }))
  console.log('replay', JSON.stringify(after))
  if (after.state !== 'sample' || after.anims) F(`replay: ${JSON.stringify(after)}`)
  const dev = logs.filter((l) => /self-check|Assertion/.test(l))
  console.log('dev', dev.join(' | '))
  if (!dev.some((l) => l.includes('self-check 3.48 / 5.90 / 96.8'))) F('dev self-check did not report')
  const src = await (await fetch(URL0)).text(), i0 = src.search(/<figure\b[^>]*data-fig="chromatogram"/), html = src.slice(i0, src.indexOf('</figure>', i0) + 9) // as build.mjs measures it
  const kb = gzipSync(html, { level: 9 }).length / 1024
  console.log('inline figure', html.length, 'B raw,', kb.toFixed(2), 'KB gzip (budget 4.2)')
  if (kb > 4.2) F(`inline figure ${kb.toFixed(2)} KB gzip > 4.2`)
  await ctx.close()
}

// ---- zoom transition cost, Pixel 7 profile at 4× CPU (budget: p95 ≤ 33 ms over the transition), and the URL-bar test.
// Raster runs on the CPU here (--disable-gpu): in this sandbox the GPU process is SwiftShader, which emulates GPU raster in
// software and dominates frame times for any repaint (tracing: RasterDecoderImpl flush ≈ 0.6 s per transition), while the
// renderer main thread stays at p95 ≈ 10 ms per frame at 4×. CPU raster is the honest stand-in for a phone's GPU raster.
{
  const b2 = await chromium.launch({ args: ['--disable-gpu'] })
  const ctx = await b2.newContext({ ...devices['Pixel 7'] })
  const p = await ctx.newPage()
  const cdp = await ctx.newCDPSession(p)
  await p.goto(URL0 + '?hud=0', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready)
  await p.evaluate(() => document.getElementById('fig-chromatogram').scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(3500)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  for (const s of ['std', 'spike', 'sample', 'std', 'sample']) {
    const r = await p.evaluate(async (s) => {
      const d = []; let last = 0, go = true
      const tick = (t) => { if (last) d.push(t - last); last = t; if (go) requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
      document.querySelector(`#fig-chromatogram [data-set="${s}"]`).click()
      await new Promise((r) => setTimeout(r, 1300)); go = false
      d.sort((a, b) => a - b)
      return { n: d.length, median: +d[d.length >> 1].toFixed(1), p95: +d[Math.floor(d.length * 0.95)].toFixed(1), max: +d[d.length - 1].toFixed(1) }
    }, s)
    console.log('transition', s, JSON.stringify(r))
    if (r.p95 > 33) F(`transition to ${s}: p95 ${r.p95} ms at 4× CPU`)
  }
  // the intro at 4× CPU (§14 item 33: median ≤ 16.7, p95 ≤ 33 ms, no long task over 80 ms)
  await ctx.addInitScript(SPACER)
  await p.goto(URL0 + '?hud=0', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready)
  const intro = await p.evaluate(async () => {
    const lt = []; new PerformanceObserver((l) => lt.push(...l.getEntries().map((e) => e.duration))).observe({ type: 'longtask' })
    document.getElementById('fig-chromatogram').scrollIntoView({ block: 'center' })
    const d = []; let last = 0, go = true
    const tick = (t) => { if (last) d.push(t - last); last = t; if (go) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
    await new Promise((r) => setTimeout(r, 3600)); go = false
    d.sort((a, b) => a - b)
    return { n: d.length, median: +d[d.length >> 1].toFixed(1), p95: +d[Math.floor(d.length * 0.95)].toFixed(1), longTasks: lt.map(Math.round) }
  })
  console.log('intro frames at 4x', JSON.stringify(intro))
  if (intro.median > 16.8 || intro.p95 > 33.4 || intro.longTasks.some((x) => x > 80)) F(`intro frames ${JSON.stringify(intro)}`)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  // URL-bar collapse (§14 item 45): pin --svh, grow the viewport, nothing in the figure may move or animate
  await p.setViewportSize({ width: 390, height: 664 })
  await p.evaluate(() => document.getElementById('fig-chromatogram').scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(400)
  const box = () => p.evaluate(() => { document.documentElement.style.setProperty('--svh', innerHeight / 100 + 'px'); return ['#fig-chromatogram', '#fig-chromatogram .plate', '#environmental'].map((q) => { const r = document.querySelector(q).getBoundingClientRect(); return [r.width, r.height] }).flat().concat(document.getAnimations().length) })
  const a = await box()
  await p.setViewportSize({ width: 390, height: 720 }); await p.waitForTimeout(350)
  const z = await p.evaluate(() => ['#fig-chromatogram', '#fig-chromatogram .plate', '#environmental'].map((q) => { const r = document.querySelector(q).getBoundingClientRect(); return [r.width, r.height] }).flat().concat(document.getAnimations().length))
  console.log('url-bar', JSON.stringify(a), JSON.stringify(z))
  if (a.some((v, i) => Math.abs(v - z[i]) > 0.5)) F('URL-bar: figure size changed')
  await ctx.close(); await b2.close()
}

// ---- intro frames at fixed times (paused WAAPI), phone
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SPACER)
  const p = await ctx.newPage()
  await p.goto(URL0 + '?hud=0', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready)
  await p.evaluate(() => document.getElementById('fig-chromatogram').scrollIntoView({ block: 'center' }))
  await p.waitForFunction(() => document.getElementById('fig-chromatogram').getAnimations({ subtree: true }).length > 0, null, { timeout: 5000 })
  for (const at of [400, 1100, 1600, 2000]) {
    await p.evaluate((at) => { for (const a of document.getElementById('fig-chromatogram').getAnimations({ subtree: true })) { a.pause(); a.currentTime = at } }, at)
    await p.locator('#fig-chromatogram .plate').screenshot({ path: `${out}m-intro-${at}.png` })
  }
  await ctx.close()
}

// ---- no JS
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false })
  const p = await ctx.newPage()
  await p.goto(URL0, { waitUntil: 'load' })
  const r = await p.evaluate(() => ({ ro: document.querySelector('[data-fact-readout="env.key"]').textContent, ctrl: getComputedStyle(document.querySelector('#fig-chromatogram .ctrl')).display, state: document.getElementById('fig-chromatogram').dataset.state }))
  console.log('no-js', JSON.stringify(r))
  if (r.ro !== '3.48' || r.ctrl !== 'none' || r.state !== 'sample') F(`no JS: ${JSON.stringify(r)}`)
  await p.locator('#fig-chromatogram').screenshot({ path: `${out}nojs-390.png` })
  await ctx.close()
}
// ---- reduced motion: no .pre, final state at once, Replay hidden, instant swaps, live still announces
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.goto(URL0 + '?hud=0', { waitUntil: 'load' })
  await p.evaluate(() => document.getElementById('fig-chromatogram').scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(800)
  const r = await p.evaluate(async () => {
    const fig = document.getElementById('fig-chromatogram')
    const o = { pre: fig.classList.contains('pre'), anims: document.getAnimations().length, replay: getComputedStyle(fig.querySelector('.replay')).display }
    fig.querySelector('[data-set="spike"]').click()
    await new Promise((r) => setTimeout(r, 30))
    o.zoom = getComputedStyle(fig.querySelector('.zm')).transform; o.live = fig.querySelector('[data-live]').textContent
    return o
  })
  console.log('reduced', JSON.stringify(r))
  if (r.pre || r.anims || r.replay !== 'none' || !r.zoom.startsWith('matrix(9') || !r.live.startsWith('Matrix spike')) F(`reduced motion: ${JSON.stringify(r)}`)
  await p.locator('#fig-chromatogram').screenshot({ path: `${out}reduced-390-spike.png` })
  await ctx.close()
}
await b.close()
console.log(fails.length ? `${fails.length} FAIL(S)` : 'verify: all checks pass')
process.exit(fails.length ? 1 : 0)
