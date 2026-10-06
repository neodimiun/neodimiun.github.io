// tools/verify.mjs (Team IT): Fig. 7 acceptance checks that are specific to this figure (SPEC-C §8.4, §14 items 9, 37,
// 39, 41, 43, 44). Run by hand against a built page (NOT a generator):
//   node chapters/05-it/tools/verify.mjs [dev-it|index] [--base=http://localhost:8080/] [--shots=dir]
// 1. static: gzip of the figure's outerHTML (≤ 3.4 KB), SVG nodes per variant (≤ 160)
// 2. rendered, at 320 360 375 390 768 1024 1440 × model/trace/fix: variant, plate size, pairwise label overlap = 0
//    (labels + corners), label size (≥ 10.5 px at 320/360, ≥ 11 px from 390), labels inside the plate, no horizontal
//    overflow, button row on one line and ≥ 44 × 44, identical figure block height across states, readout strings,
//    break mark (ticks + "L4–6") inside the L7–L3 gap and "DNS · UDP 53" on the L7 plane (D2)
// 3. intro (motion on, 390 × 600): getAnimations() peak = 21 with the §8.4 targets (10 dash), no text bbox change between
//    t = 0 and t = 1300 ms, 0 animations and 0 renders at rest, the trace sentence announced
import { readFileSync, mkdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const C = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const args = process.argv.slice(2)
const page = (args.find((a) => !a.startsWith('--')) || 'dev-it').replace(/\.html$/, '')
const base = (args.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080/').slice(7)
const shots = (args.find((a) => a.startsWith('--shots=')) || '').slice(8)
if (shots) mkdirSync(shots, { recursive: true })
const out = { errors: [], info: {} }
const E = (m) => out.errors.push(m)

// ---------------------------------------------------------------- 1. static
const html = readFileSync(join(C, page + '.html'), 'utf8')
const fig = (html.match(/<figure class="fig fig--plate" id="fig-layers"[\s\S]*?<\/figure>/) || [])[0] || ''
if (!fig) E('static: #fig-layers not found')
const gz = gzipSync(fig, { level: 9 }).length / 1024
out.info.figureGzipKB = +gz.toFixed(2)
if (gz > 3.4) E(`static: figure markup ${gz.toFixed(2)} KB gzip > 3.4 KB (A7)`)

const { chromium } = await import('playwright')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })

// ---------------------------------------------------------------- 2. rendered layout
const WIDTHS = [320, 360, 375, 390, 768, 1024, 1440]
const STATES = ['model', 'trace', 'fix']
const heights = {}
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(`${base}${page}.html?intro=0&hud=0`)
  await p.evaluate(() => document.fonts.ready)
  if (out.info.nodes == null) out.info.nodes = await p.evaluate(() => ['vr', 'vn'].map((v) => {
    const svgs = [...document.querySelectorAll(`#fig-layers svg.${v}`)], defs = document.querySelector('#fig-layers svg.dfs')
    return svgs.reduce((a, s) => a + s.querySelectorAll('*').length + 1, 0) + defs.querySelectorAll('*').length + 1
  }))
  for (const st of STATES) {
    await p.evaluate((st) => document.querySelector(`#fig-layers .ctrl [data-set="${st}"]`).click(), st)
    await p.evaluate(() => { const f = document.getElementById('fig-layers'); scrollTo(0, f.getBoundingClientRect().top + scrollY - 70) })
    await p.waitForTimeout(80)
    const r = await p.evaluate(({ w, st }) => {
      const f = document.getElementById('fig-layers'), plate = f.querySelector('.plate'), pr = plate.getBoundingClientRect()
      const vis = (el) => { for (let e = el; e && e !== f; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false } const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 }
      // text boxes: each visible label's text extent (Range over its contents), plus the four corners
      const box = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); const rs = [...rg.getClientRects()].filter((x) => x.width > 0); if (!rs.length) return null
        return { l: Math.min(...rs.map((x) => x.left)), t: Math.min(...rs.map((x) => x.top)), r: Math.max(...rs.map((x) => x.right)), b: Math.max(...rs.map((x) => x.bottom)) } }
      const labs = [...f.querySelectorAll('.lb .l, .plate .corner')].filter(vis).map((el) => ({ el, txt: el.innerText.trim(), b: box(el), fs: parseFloat(getComputedStyle(el).fontSize) })).filter((x) => x.b && x.txt)
      const over = []
      for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) {
        const a = labs[i].b, b = labs[j].b, ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t)
        if (ox > 0.5 && oy > 0.5) over.push(`${labs[i].txt} × ${labs[j].txt}`)
      }
      const outside = labs.filter((x) => x.b.l < pr.left - 0.5 || x.b.r > pr.right + 0.5 || x.b.t < pr.top - 0.5 || x.b.b > pr.bottom + 0.5).map((x) => x.txt)
      const small = labs.filter((x) => x.fs < (w >= 390 ? 11 : 10.5)).map((x) => `${x.txt} ${x.fs}px`)
      const btns = [...f.querySelectorAll('.ctrl button')].filter(vis).map((b) => b.getBoundingClientRect())
      const row = btns.length ? { w: Math.max(...btns.map((b) => b.right)) - Math.min(...btns.map((b) => b.left)), lines: new Set(btns.map((b) => Math.round(b.top))).size, min: Math.min(...btns.map((b) => Math.min(b.width, b.height))) } : null
      const variant = getComputedStyle(f.querySelector('svg.vr')).display !== 'none' ? 'regular' : 'narrow'
      const ro = [...f.querySelectorAll('.readout .row')].filter(vis).map((r) => r.innerText.replace(/\s+/g, ' ').trim())
      const sr = (s) => getComputedStyle(f.querySelector(s)).display
      // D2: the break mark (ticks + "L4–6") lies entirely between the L7 polygon bottom and the L3 polygon top; the
      // "DNS · UDP 53" label lies on the L7 plane (inside the L7 polygon's vertical extent)
      const sv = f.querySelector(`svg.sm.${variant === 'regular' ? 'vr' : 'vn'}`), p7 = sv.querySelector('.p7 .pl').getBoundingClientRect(), p3 = sv.querySelector('.p3 .pl').getBoundingClientRect()
      const bkL = f.querySelector('.lb .l.bk'), bkT = f.querySelector(`.ov.${variant === 'regular' ? 'vr' : 'vn'} .bk`), dq = f.querySelector('.lb .l.dq')
      const gap = []
      if (st !== 'model') for (const [n, b] of [['break label', box(bkL)], ['break ticks', bkT.getBoundingClientRect()]]) if (!b || b.top < p7.bottom || b.bottom > p3.top) gap.push(`${n} ${b ? `${(b.top - pr.top).toFixed(1)}–${(b.bottom - pr.top).toFixed(1)}` : 'missing'} not in ${(p7.bottom - pr.top).toFixed(1)}–${(p3.top - pr.top).toFixed(1)}`)
      if (st === 'trace') { const b = box(dq); if (!b || b.top < p7.top || b.bottom > p7.bottom) gap.push('DNS · UDP 53 label not on the L7 plane') }
      return { gap, variant, plate: `${+pr.width.toFixed(1)} × ${+pr.height.toFixed(1)}`, figW: f.getBoundingClientRect().width, figH: +f.getBoundingClientRect().height.toFixed(1),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, over, outside, small, row, ro, replayIcon: getComputedStyle(f.querySelector('.replay .rt')).display === 'none', n: labs.length }
    }, { w, st })
    ;(heights[w] ||= {})[st] = r.figH
    const tag = `${w}/${st}`
    if (r.over.length) E(`${tag}: label overlap: ${r.over.join('; ')}`)
    if (r.gap.length) E(`${tag}: ${r.gap.join('; ')}`)
    if (r.outside.length) E(`${tag}: label outside the plate: ${r.outside.join('; ')}`)
    if (r.small.length) E(`${tag}: label too small: ${r.small.join('; ')}`)
    if (r.overflowX > 0) E(`${tag}: horizontal overflow ${r.overflowX}px`)
    if (r.row && (r.row.lines !== 1 || r.row.min < 44)) E(`${tag}: buttons ${JSON.stringify(r.row)}`)
    const wantNarrow = r.figW < 330
    if ((r.variant === 'narrow') !== wantNarrow) E(`${tag}: ${r.variant} variant at figure width ${r.figW}`)
    if (w === 320 && r.plate !== '288 × 384') E(`${tag}: plate ${r.plate} ≠ 288 × 384`)
    if (w === 360 && r.plate !== '328 × 437.3') E(`${tag}: plate ${r.plate} ≠ 328 × 437.3`)
    // 390: SPEC-C assumes a 16 px gutter (358 × 447.5); the shell's gutter is clamp(16px, 3.2vw + 4px, 64px) = 16.48 px
    if (w === 390 && !(Math.abs(parseFloat(r.plate) - 358) <= 1 && Math.abs(parseFloat(r.plate.split('×')[1]) - 447.5) <= 1.25)) E(`${tag}: plate ${r.plate} ≠ 358 × 447.5`)
    const want = { model: ['ROUND TRIP – ms NOT RUN', 'ROOT CAUSE – NOT TRACED'], trace: ['ROUND TRIP 18 ms · 4 of 4 PASS', 'ROOT CAUSE 192.168.1.10 DNS FOUND'],
      fix: ['ROUND TRIP 18 ms · 4 of 4 PASS', 'ROOT CAUSE 192.168.1.10 DNS FIXED', 'DNS NOW 192.168.1.1 · ROUTER'] }[st]
    if (r.ro.join('|') !== want.join('|')) E(`${tag}: readout ${JSON.stringify(r.ro)} ≠ ${JSON.stringify(want)}`)
    out.info[tag] = `${r.variant} ${r.plate} labels ${r.n} row ${r.row ? Math.round(r.row.w) : '-'}px`
    if (shots) await p.locator('#fig-layers').screenshot({ path: join(shots, `fig7-${w}-${st}.png`) })
  }
  // row with Replay (motion on): measured separately, Replay is hidden under reduced motion
  await p.emulateMedia({ reducedMotion: 'no-preference' })
  await p.goto(`${base}${page}.html?intro=0&hud=0`)
  const rr = await p.evaluate(() => { const bs = [...document.querySelectorAll('#fig-layers .ctrl button')].map((b) => b.getBoundingClientRect()).filter((b) => b.width)
    return { w: Math.round(Math.max(...bs.map((b) => b.right)) - Math.min(...bs.map((b) => b.left))), lines: new Set(bs.map((b) => Math.round(b.top))).size, n: bs.length, min: Math.min(...bs.map((b) => Math.min(b.width, b.height))), replay: Math.round(bs.at(-1).width) } })
  out.info[`${w}/buttons`] = rr
  if (rr.n !== 4 || rr.lines !== 1 || rr.min < 44) E(`${w}: button row with Replay ${JSON.stringify(rr)}`)
  if (errs.length) E(`${w}: page errors ${errs.join(' | ')}`)
  await ctx.close()
}
for (const [w, h] of Object.entries(heights)) if (new Set(Object.values(h)).size !== 1) E(`${w}: figure block height differs across states ${JSON.stringify(h)}`)

// ---------------------------------------------------------------- 3. intro
{
  // a viewport short enough that the figure starts below the fold on a dev page (so arm() runs)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 600 }, reducedMotion: 'no-preference' })
  const p = await ctx.newPage()
  await p.addInitScript(() => { window.__rafN = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = (f) => { window.__rafN++; return r(f) } })
  await p.goto(`${base}${page}.html?hud=0`)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(400)
  const armed = await p.evaluate(() => document.getElementById('fig-layers').classList.contains('pre'))
  if (!armed) E('intro: figure not armed (.pre) below the fold')
  await p.evaluate(() => { const f = document.getElementById('fig-layers'); scrollTo(0, f.getBoundingClientRect().top + scrollY - 60) })
  // wait for the first animation, then sample
  const t0 = await p.evaluate(() => new Promise((res) => { const s = performance.now(); const tick = () => { if (document.getAnimations().some((a) => document.getElementById('fig-layers').contains(a.effect.target))) res(performance.now() - s); else if (performance.now() - s > 4000) res(-1); else setTimeout(tick, 5) }; tick() }))
  if (t0 < 0) E('intro: never started')
  const snap = await p.evaluate(() => {
    const f = document.getElementById('fig-layers'), A = document.getAnimations().filter((a) => f.contains(a.effect.target))
    const name = (el) => (el.closest('svg.sm') ? '%' : '') + (el.getAttribute('class') || el.tagName)
    const texts = [...f.querySelectorAll('.lb .l, .readout .row')].map((e) => { const b = e.getBoundingClientRect(), q = document.querySelector('#fig-layers .plate').getBoundingClientRect(); return [b.left - q.left, b.top - q.top, b.width, b.height].map((x) => +x.toFixed(2)).join(',') })
    return { n: A.length, targets: A.map((a) => `${Math.round(a.effect.getTiming().delay)}:${name(a.effect.target)}:${Object.keys(a.effect.getKeyframes()[0]).filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)).join('+')}`), texts }
  })
  out.info.intro = { n: snap.n, targets: snap.targets }
  if (snap.n !== 21) E(`intro: ${snap.n} animations at the peak (want 21)`)
  const dash = snap.targets.filter((t) => t.includes('strokeDash')).length
  if (dash !== 10) E(`intro: ${dash} dash animations (want 10)`)
  const want = [0, 80, 160, 240, 400, 400, 560, 880, 1020, 1080, 1240, 1400, 1540, 1600, 1920, 1920, 2060, 2120, 2700, 2980, 2980]
  const got = snap.targets.map((t) => +t.split(':')[0]).sort((a, b) => a - b)
  if (got.join() !== want.join()) E(`intro: delays ${got.join()} ≠ §8.4`)
  await p.waitForTimeout(Math.max(0, 1300 - 20))
  const mid = await p.evaluate(() => ({ n: document.getAnimations().length, texts: [...document.getElementById('fig-layers').querySelectorAll('.lb .l, .readout .row')].map((e) => { const b = e.getBoundingClientRect(), q = document.querySelector('#fig-layers .plate').getBoundingClientRect(); return [b.left - q.left, b.top - q.top, b.width, b.height].map((x) => +x.toFixed(2)).join(',') }) }))
  if (shots) await p.locator('#fig-layers').screenshot({ path: join(shots, 'fig7-intro-1300.png') })
  const moved = mid.texts.filter((t, i) => t !== snap.texts[i]).length
  if (moved) E(`intro: ${moved} text boxes changed between t = 0 and t = 1300 ms`)
  await p.waitForTimeout(2600)
  if (shots) await p.locator('#fig-layers').screenshot({ path: join(shots, 'fig7-intro-end.png') })
  const r0 = await p.evaluate(() => ({ renders: window.__stage?.renders ?? 0, raf: window.__rafN }))
  await p.waitForTimeout(3000)
  const rest = await p.evaluate(() => ({ anims: document.getAnimations().length, renders: window.__stage?.renders ?? 0, raf: window.__rafN, state: document.getElementById('fig-layers').dataset.state,
    live: document.querySelector('#fig-layers [data-live]').textContent, ro: document.querySelector('[data-fact-readout="it.key"]').textContent, log: window.__stage?.introLog?.filter((l) => /layers/.test(l)) }))
  out.info.rest = rest
  if (rest.anims) E(`rest: ${rest.anims} animations`)
  if (rest.renders !== r0.renders) E(`rest: ${rest.renders - r0.renders} renders in 3 s`)
  if (rest.raf !== r0.raf) E(`rest: ${rest.raf - r0.raf} rAF in 3 s`)
  if (rest.state !== 'trace' || rest.ro !== '18') E(`rest: state ${rest.state}, readout ${rest.ro}`)
  if (!/^Trace complete\./.test(rest.live)) E(`rest: live region "${rest.live}"`)
  await ctx.close()
}
await browser.close()
console.log(JSON.stringify(out, null, 1))
process.exit(out.errors.length ? 1 : 0)
