// tools/cvd.mjs (DS lead) — colour-vision check, SPEC-C §14 item 26.
// 1. Tokens: reads every colour from shell/tokens.css, simulates deuteranopia / protanopia / tritanopia (Machado 2009,
//    severity 1.0, linear RGB) and reports the nearest accent pairs (OKLab ΔE×100) and fail-mark contrast per vision.
// 2. Rendered: for Figs. 7 and 8 (or --figs=a,b) in every state, applies the same matrices as an SVG feColorMatrix filter
//    (color-interpolation-filters: linearRGB) to the figure, screenshots it, finds the fail and pass marks (elements whose
//    computed color / stroke / fill is --fail / --a / --a-mark) and samples them. Pass: every simulated fail mark keeps
//    ≥ 3:1 against its plate. PNGs: c/.build/cvd/.
//   node tools/cvd.mjs [index | dev-<slug>] [--figs=layers,record] [--base=http://localhost:8080/]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const C = join(dirname(fileURLToPath(import.meta.url)), '..')
const M = {
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
}
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const sim = (rgb, m) => { const l = rgb.map(lin); return [0, 1, 2].map((i) => Math.min(1, Math.max(0, gam(m[i * 3] * l[0] + m[i * 3 + 1] * l[1] + m[i * 3 + 2] * l[2])))) }
const L = (rgb) => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const contrast = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
function oklab(rgb) {
  const [r, g, b] = rgb.map(lin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
const dE = (a, b) => { const p = oklab(a), q = oklab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * 100 }

// ---------------------------------------------------------------- 1. tokens
const css = readFileSync(join(C, 'shell/tokens.css'), 'utf8')
const T = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]))
const codes = ['eng', 'chem', 'micro', 'env', 'it', 'di']
const tokenReport = {}
for (const [vision, m] of [['normal', null], ...Object.entries(M)]) {
  const f = (h) => (m ? sim(hex2(h), m) : hex2(h))
  const near = (suffix) => {
    let best = null
    for (let i = 0; i < codes.length; i++) for (let j = i + 1; j < codes.length; j++) {
      const d = dE(f(T[codes[i] + suffix]), f(T[codes[j] + suffix]))
      if (!best || d < best.d) best = { pair: `${codes[i]}/${codes[j]}`, d: +d.toFixed(1) }
    }
    return best
  }
  tokenReport[vision] = {
    nearestText: near(''), nearestOnDark: near('-dk'),
    failOnPaper: +contrast(f(T.fail), f(T.paper)).toFixed(2), failOnGround: +contrast(f(T.fail), f(T.ground)).toFixed(2),
    failDkOnResinPlate: +contrast(f(T['fail-dk']), f(T['resin-plate'])).toFixed(2),
    failVsPassOnResin: +dE(f(T['fail-dk']), f(T['di-dk'])).toFixed(1), failVsItMark: +dE(f(T.fail), f(T['it-mark'])).toFixed(1),
  }
}
console.log(JSON.stringify({ tokens: tokenReport }))

// ---------------------------------------------------------------- 2. rendered figures
const args = process.argv.slice(2)
const target = args.find((a) => !a.startsWith('--')) || 'index'
const base = (args.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080/').slice(7)
const figs = (args.find((a) => a.startsWith('--figs=')) || '--figs=layers,record').slice(7).split(',')
const OUT = join(C, '.build/cvd'); mkdirSync(OUT, { recursive: true })
const { chromium } = await import('playwright')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage()
await page.goto(base + (target.endsWith('.html') ? target : target + '.html') + '?intro=0')
await page.waitForTimeout(1200)
const results = []
let failed = false
for (const id of figs) {
  const states = await page.evaluate((id) => document.getElementById('fig-' + id)?.dataset.states?.split(' ') ?? null, id)
  if (!states) { results.push({ fig: id, note: 'not on this page' }); continue }
  for (const st of states) {
    await page.evaluate(([id, st]) => { const b = document.querySelector(`#fig-${id} .ctrl button[data-set="${st}"]`); if (b) b.click() }, [id, st])
    await page.waitForTimeout(900)
    for (const [vision, m] of Object.entries(M)) {
      const marks = await page.evaluate(([id, vision, m]) => {
        const fig = document.getElementById('fig-' + id)
        fig.scrollIntoView({ block: 'center' })
        let svg = document.getElementById('cvd-defs')
        if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'cvd-defs'; svg.setAttribute('style', 'position:absolute;width:0;height:0'); document.body.appendChild(svg) }
        svg.innerHTML = `<filter id="cvd-${vision}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${m.slice(0, 3).join(' ')} 0 0 ${m.slice(3, 6).join(' ')} 0 0 ${m.slice(6, 9).join(' ')} 0 0 0 0 0 1 0"/></filter>`
        fig.style.filter = `url(#cvd-${vision})`
        const plate = fig.querySelector('.plate')
        const cs = getComputedStyle(plate)
        const fail = cs.getPropertyValue('--fail').trim().toLowerCase(), a = cs.getPropertyValue('--a').trim().toLowerCase(), am = cs.getPropertyValue('--a-mark').trim().toLowerCase()
        const toHex = (c) => { const v = c.match(/[\d.]+/g); return v && v.length >= 3 ? '#' + v.slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('') : '' }
        const fr = fig.getBoundingClientRect()
        const out = []
        for (const el of fig.querySelectorAll('*')) {
          const s = getComputedStyle(el)
          if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue
          const r = el.getBoundingClientRect()
          if (r.width < 2 || r.height < 2) continue
          const cols = [s.color, s.stroke, s.fill].map(toHex).map((x) => x.toLowerCase())
          const kind = cols.includes(fail) ? 'fail' : cols.includes(a) || cols.includes(am) ? 'pass' : null
          if (!kind || (el.children.length && !(el instanceof SVGElement))) continue
          out.push({ kind, tag: el.tagName.toLowerCase(), cls: String(el.className?.baseVal ?? el.className).slice(0, 30), x: r.left - fr.left, y: r.top - fr.top, w: r.width, h: r.height })
        }
        const pr = plate.getBoundingClientRect()
        return { marks: out.slice(0, 60), plateAt: { x: pr.left - fr.left + 3, y: pr.top - fr.top + pr.height / 2 } }
      }, [id, vision, m])
      const buf = await page.locator('#fig-' + id).screenshot()
      writeFileSync(join(OUT, `${target}-${id}-${st}-${vision}.png`), buf)
      await page.evaluate((id) => { document.getElementById('fig-' + id).style.filter = '' }, id)
      // sample in a scratch page: the most distant pixel from the plate inside each mark's box
      const sampled = await page.evaluate(async ([b64, marks, plateAt]) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height
        const g = cv.getContext('2d'); g.drawImage(img, 0, 0)
        const k = img.width / (document.querySelector('#cvd-defs') ? img.width : img.width)
        const px = (x, y) => Array.from(g.getImageData(Math.max(0, Math.min(img.width - 1, Math.round(x * devicePixelRatio))), Math.max(0, Math.min(img.height - 1, Math.round(y * devicePixelRatio))), 1, 1).data).slice(0, 3)
        const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
        const Lm = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2])
        const cr = (a, b) => { const x = Lm(a), y = Lm(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
        const plate = px(plateAt.x, plateAt.y)
        void k
        return marks.map((m) => {
          const d = devicePixelRatio, x0 = Math.max(0, Math.floor(m.x * d)), y0 = Math.max(0, Math.floor(m.y * d))
          const w = Math.max(1, Math.min(img.width - x0, Math.ceil(m.w * d))), h = Math.max(1, Math.min(img.height - y0, Math.ceil(m.h * d)))
          const data = g.getImageData(x0, y0, w, h).data
          let best = 1
          for (let i = 0; i < data.length; i += 4) best = Math.max(best, cr([data[i], data[i + 1], data[i + 2]], plate))
          return { ...m, contrast: +best.toFixed(2) }
        })
      }, [buf.toString('base64'), marks.marks, marks.plateAt])
      const fails = sampled.filter((s) => s.kind === 'fail'), passes = sampled.filter((s) => s.kind === 'pass')
      const worst = fails.length ? Math.min(...fails.map((s) => s.contrast)) : null
      const ok = worst == null || worst >= 3
      if (!ok) failed = true
      if (process.env.CVD_DEBUG) console.log(JSON.stringify(sampled))
      results.push({ fig: id, state: st, vision, failMarks: fails.length, passMarks: passes.length, worstFail: worst, worstPass: passes.length ? Math.min(...passes.map((s) => s.contrast)) : null, ok })
    }
  }
}
for (const r of results) console.log(JSON.stringify(r))
await browser.close()
process.exit(failed ? 1 : 0)
