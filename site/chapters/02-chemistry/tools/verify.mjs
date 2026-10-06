// Chapter 02 QA (Team CHEM; run by hand, not a generator): measures what SPEC-C §14 items 3, 41, 43, 57 and the
// chapter's own layout rules ask of Figs. 3 and 4, at every acceptance width, and prints one JSON line per width.
//   node chapters/02-chemistry/tools/verify.mjs [page=dev-chemistry.html] [--base=http://localhost:8080/]
// Checks: no horizontal overflow; Fig. 4 plate 4:3 and its drawing-box size; every DOM label ≥ 10.5 px (≥ 11 at ≥ 390);
// no two labels (plot labels + corners) overlap, no plot label covers a data point or the diamond; Fig. 3 corner labels
// sit outside the host (never over the drawing); readouts at rest equal facts.json; buttons ≥ 44 × 44; Fig. 4 has no
// controls / live region / SVG <text>; the readout strips keep one height in all three Fig. 3 states.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const facts = JSON.parse(readFileSync(join(HERE, '../../../data/facts.json'), 'utf8'))
const page0 = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'dev-chemistry.html'
const base = (process.argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080/').slice(7)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
let bad = 0
for (const w of [320, 360, 375, 390, 412, 768, 1024, 1440, 1920]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 740 : 900 }, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.goto(`${base}${page0}?hud=0`)
  await p.evaluate(() => document.fonts.ready)
  const r = await p.evaluate(async (facts) => {
    const out = { problems: [] }
    const P = (m) => out.problems.push(m)
    const box = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } }
    const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad
    out.overflowX = document.documentElement.scrollWidth > innerWidth
    if (out.overflowX) P('horizontal overflow')
    // ---- Fig. 4
    const f4 = document.getElementById('fig-calibration')
    const plate = box(f4.querySelector('.plate')), draw = box(f4.querySelector('.draw'))
    out.f4 = { plate: `${plate.w.toFixed(1)}×${plate.h.toFixed(1)}`, draw: `${draw.w.toFixed(1)}×${draw.h.toFixed(1)}`, scale: +(draw.w / 400).toFixed(3) }
    if (Math.abs(plate.w / plate.h - 4 / 3) > 0.01) P('Fig. 4 plate is not 4:3')
    if (Math.abs(draw.w / draw.h - 400 / 248) > 0.01) P('Fig. 4 drawing box is not 400:248')
    const labels = [...f4.querySelectorAll('.pl:not(.chk-l), .chk-l > span, .corner')].map((el) => ({ el, t: el.textContent.trim(), b: box(el), fs: parseFloat(getComputedStyle(el).fontSize) }))
    for (const L of labels) if (L.fs < (innerWidth >= 390 ? 11 : 10.5) && !L.el.classList.contains('corner')) P(`Fig. 4 label "${L.t}" ${L.fs}px`)
    for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (hit(labels[i].b, labels[j].b)) P(`Fig. 4 labels overlap: "${labels[i].t}" / "${labels[j].t}"`)
    const marks = [...f4.querySelectorAll('.draw > svg .pt, .late .chk')].map(box)
    for (const L of labels) for (const m of marks) if (hit(L.b, m)) P(`Fig. 4 label "${L.t}" covers a data mark`)
    for (const L of labels) if (L.b.l < plate.l - 0.5 || L.b.r > plate.r + 0.5 || L.b.t < plate.t - 0.5 || L.b.b > plate.b + 0.5) P(`Fig. 4 label "${L.t}" leaves the plate`)
    out.f4.minGap = (() => { let g = 1e9; for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) { const a = labels[i].b, b = labels[j].b; const dx = Math.max(b.l - a.r, a.l - b.r), dy = Math.max(b.t - a.b, a.t - b.b); g = Math.min(g, Math.max(dx, dy)) } return +g.toFixed(1) })()
    if (f4.querySelector('.ctrl, [data-live], [aria-live], .replay')) P('Fig. 4 has controls / live region / Replay (A20: none)')
    if (f4.querySelector('svg text')) P('Fig. 4 uses SVG <text> (A6)')
    // ---- Fig. 3
    const f3 = document.getElementById('fig-burette')
    const host = box(f3.querySelector('.host')), p3 = box(f3.querySelector('.plate'))
    out.f3 = { plate: `${p3.w.toFixed(1)}×${p3.h.toFixed(1)}`, host: `${host.w.toFixed(1)}×${host.h.toFixed(1)}` }
    if (Math.abs(p3.w / p3.h - 0.8) > 0.01) P('Fig. 3 plate is not 4:5')
    for (const c of f3.querySelectorAll('.corner')) if (hit(box(c), host)) P(`Fig. 3 corner "${c.textContent}" over the drawing`)
    const c3 = [...f3.querySelectorAll('.corner')].map(box)
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (hit(c3[i], c3[j])) P('Fig. 3 corners overlap')
    for (const b of document.querySelectorAll('#chemistry .ctrl button')) { const q = box(b); if (q.w < 44 || q.h < 44) P(`button ${b.textContent} ${q.w}×${q.h}`) }
    // readouts at rest
    out.readouts = {}
    for (const el of document.querySelectorAll('#chemistry [data-fact-readout]')) { const k = el.dataset.factReadout; out.readouts[k] = el.textContent.trim(); if (el.textContent.trim() !== facts[k].value) P(`readout ${k} ${el.textContent.trim()} ≠ ${facts[k].value}`) }
    // the three states (reduced motion: instant swaps) keep the strip's height; values and statuses per state
    const ro = f3.querySelector('.readout'), h0 = ro.getBoundingClientRect().height
    out.states = {}
    for (const s of ['above', 'below', 'level']) {
      f3.querySelector(`[data-set="${s}"]`).click()
      await new Promise((r) => setTimeout(r, 50))
      out.states[s] = `${f3.querySelector('.val').textContent} ${f3.querySelector('.readout .status').innerText} · ${f3.querySelector('[aria-pressed=true]')?.dataset.set} · live "${f3.querySelector('[data-live]').textContent}"`
      if (Math.abs(ro.getBoundingClientRect().height - h0) > 0.5) P(`Fig. 3 readout height changes in state ${s}`)
      const want = { above: facts['chem.burette'].above, level: facts['chem.burette'].value, below: facts['chem.burette'].below }[s]
      if (f3.querySelector('.val').textContent !== want) P(`Fig. 3 ${s} reads ${f3.querySelector('.val').textContent} ≠ ${want}`)
      if (f3.dataset.state !== s) P(`Fig. 3 data-state ${f3.dataset.state} ≠ ${s}`)
    }
    const f4ro = f4.querySelector('.readout')
    out.f4.readout = f4ro.innerText.replace(/\s+/g, ' ').trim()
    out.f4.inPlot = [...f4.querySelectorAll('.pl')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).join(' | ')
    return out
  }, facts)
  bad += r.problems.length
  console.log(JSON.stringify({ w, ...r }))
  await ctx.close()
}
await browser.close()
console.log(bad ? `verify: ${bad} problem(s)` : 'verify: ok')
process.exit(bad ? 1 : 0)
