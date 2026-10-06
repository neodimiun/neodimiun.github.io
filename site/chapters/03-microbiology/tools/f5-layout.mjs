// Fig. 5 layout generator (Team MICRO; declared in chapter.json). SPEC-C §6.4: the reference implementation is
// the SPEC-C reference layout script; the PRNG, dart throwing, radii, lag/start/cohort/dot/row rules and the serpentine order below
// are that code, unchanged. Pure and deterministic (seeds 61 / 6538), no network, no browser.
//
// Writes three regions of chapter.html:
//   f5c  control dish SVG (gradients, clip and the shared defs live here)
//   f5t  treated dish SVG
//   f5l  the log ladder: SVG marks in % of the inner track (x(v) = 20 + v·(w − 40)/7 at every width, no script) + DOM labels
import { STUDY, perCoupon, r2, frac } from '../disinfectant.model.js'

export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
export function layout({ seed, n, nSurf, surf, sub, R = 40.5, gap = 0.7 }) {
  const rnd = mulberry32(seed), out = []; let tries = 0
  for (let i = 0; i < n; i++) {
    const isS = i < nSurf; let c
    for (;;) {
      if (++tries > 2e6) throw new Error('pack fail')
      const u = rnd(), v = rnd()
      let r, rx, ry, rot
      if (isS) { r = surf[0] + (surf[1] - surf[0]) * Math.pow(rnd(), 0.8); rx = ry = r; rot = 0 }
      else { rx = sub[0] + (sub[1] - sub[0]) * rnd(); ry = (0.60 + 0.15 * rnd()) * rx; rot = Math.round(rnd() * 180); r = rx }
      const d = Math.sqrt(u) * (R - r), a = 2 * Math.PI * v, x = d * Math.cos(a), y = d * Math.sin(a)
      if (out.every((o) => Math.hypot(o.x - x, o.y - y) >= o.r + r + gap)) { c = { x, y, r, rx, ry, rot, surface: isS, lag: rnd() }; break }
    }
    c.start = 270 + c.lag * 400 + (c.surface ? 0 : 130); c.cohort = Math.min(7, Math.floor((c.start - 270) / 66.25))
    c.dot = c.surface ? Math.min(0.42, 0.55 * c.r) : Math.min(0.42, 0.35 * c.ry)
    c.row = Math.floor((c.y + 45) / 10); out.push(c)
  }
  out.sort((p, q) => p.row - q.row || (p.row % 2 ? q.x - p.x : p.x - q.x))
  return out
}
export const DISHES = {
  ctrl: { seed: 61, n: STUDY.control.colonies, nSurf: 56, surf: [0.95, 1.70], sub: [1.10, 1.40] },
  trt: { seed: 6538, n: STUDY.treated.colonies, nSurf: 4, surf: [1.70, 2.70], sub: [1.40, 2.00] },
}
export const CTRL = layout(DISHES.ctrl)
export const TRT = layout(DISHES.trt)

// Number format: no trailing zeros, no leading zero ("-0.50" → "-.5"). Centres and colony radii are written to 0.1 mm
// (0.30 px on the 280 px desktop dish, 0.17 px on a 161 px phone dish); count-dot radii to 0.01 mm. SPEC-C §6.5 asks for
// 2 decimals throughout, but that costs 6.0 KB gzip against the 5.4 KB inline budget (A7); 1 decimal lands at about 5.2.
const num = (d) => (v) => { const s = String(+v.toFixed(d)); return s === '-0' ? '0' : s.replace(/^(-?)0\./, '$1.') }
export const n1 = num(1), n2 = num(2)
// geometry exactly as written into the page (what the asserts measure)
export const written = (L) => L.map((c) => ({ ...c, x: +n1(c.x), y: +n1(c.y), r: +n1(c.surface ? c.r : c.rx), rx: +n1(c.rx), ry: +n1(c.ry), dot: +n2(c.dot) }))

export function stats(L) {
  const W = written(L)
  let gmin = 1e9
  for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) gmin = Math.min(gmin, Math.hypot(W[i].x - W[j].x, W[i].y - W[j].y) - W[i].r - W[j].r)
  const coh = Array(8).fill(0); for (const c of L) coh[c.cohort]++
  const rows = {}; for (const c of L) rows[c.row] = (rows[c.row] || 0) + 1
  let cum = 0
  const cumRows = Object.keys(rows).map(Number).sort((a, b) => a - b).map((r) => [r, rows[r], cum += rows[r]])
  return { n: L.length, surface: L.filter((c) => c.surface).length, minGap: gmin, extent: Math.max(...W.map((c) => Math.hypot(c.x, c.y) + c.r)),
    firstStart: Math.min(...L.map((c) => c.start)), lastStart: Math.max(...L.map((c) => c.start)), cohorts: coh, rows: cumRows,
    dotMin: Math.min(...W.map((c) => c.dot)), dotMax: Math.max(...W.map((c) => c.dot)),
    dotInside: W.every((c) => c.dot <= (c.surface ? c.r : c.ry)) }
}

function dish(L, { label, defs }) {
  const groups = (key, el) => {
    const by = new Map()
    for (const c of L) { const k = c[key]; if (!by.has(k)) by.set(k, []); by.get(k).push(el(c)) }
    return [...by.keys()].sort((a, b) => a - b).map((k) => `<g class="${key === 'cohort' ? 'k' : 'r'}${k}">${by.get(k).join('')}</g>`).join('')
  }
  // cohort groups keep the serpentine order inside; colony shapes: surface = gradient circle, subsurface = a lens rotated
  // about its own centre (translate, then rotate: the same picture as rotate(a x y) on cx/cy, fewer bytes)
  const colony = (c) => c.surface ? `<circle cx="${n1(c.x)}" cy="${n1(c.y)}" r="${n1(c.r)}"/>`
    : `<ellipse transform="translate(${n1(c.x)} ${n1(c.y)})rotate(${c.rot})" rx="${n1(c.rx)}" ry="${n1(c.ry)}"/>`
  const dot = (c) => `<circle cx="${n1(c.x)}" cy="${n1(c.y)}" r="${n2(c.dot)}"/>`
  const grid = []
  for (let v = -40; v <= 40; v += 10) grid.push(`M${v}-45V45`)
  for (let v = -40; v <= 40; v += 10) grid.push(`M-45 ${v}H45`)
  const D = defs ? '<defs><radialGradient id="f5-ag"><stop class="a0" offset="0"/><stop class="a1" offset=".86"/><stop class="a2" offset="1"/></radialGradient>' +
    '<radialGradient id="f5-co" cx=".42" cy=".4" r=".62"><stop class="c0" offset="0"/><stop class="c1" offset=".55"/><stop class="c2" offset="1"/></radialGradient>' +
    '<clipPath id="f5-cl"><circle r="43.6"/></clipPath></defs>' : ''
  return `<svg class="petri" viewBox="-47 -47 94 94" role="img" aria-label="${label}">${D}` +
    '<circle class="lid" cx=".7" cy="1" r="45.9"/><circle class="agar" r="43.6"/>' +
    `<path class="grid" clip-path="url(#f5-cl)" d="${grid.join('')}"/><circle class="w1" r="43.6"/><circle class="w2" r="45"/>` +
    `<g class="gc">${groups('cohort', colony)}</g><g class="gm">${groups('row', dot)}</g></svg>`
}

// the ladder: positions as fractions of the inner track; CSS places DOM labels at calc(20px + f·(100% − 40px))
export function ladderNumbers(facts) {
  const k = facts['micro.key']
  const lc = Math.log10(perCoupon(STUDY.control)), lt = Math.log10(perCoupon(STUDY.treated))
  const C = +k.control.log, D = +k.treated.log, E = +k.criterionEnd
  return { k, lc, lt, C, D, E, fC: frac(C), fD: frac(D), fE: frac(E),
    tips: { ctrl: `log ${lc.toFixed(4)}`, trt: `log ${lt.toFixed(4)}`, lr: `LR ${(lc - lt).toFixed(4)}`, crit: `criterion end ${k.criterionEnd}` } }
}
const pc = (f) => `${+(f * 100).toFixed(3)}%`
const fx = (f) => String(+f.toFixed(5))
function ladder(facts) {
  const N = ladderNumbers(facts), { k, fC, fD, fE } = N
  const ticks = Array.from({ length: 8 }, (_, v) => v)
  const svg = '<svg class="ladder" height="72" aria-hidden="true">' +
    `<line class="drop" x1="${pc(fD)}" y1="18" x2="${pc(fD)}" y2="52"/><line class="drop" x1="${pc(fC)}" y1="18" x2="${pc(fC)}" y2="52"/>` +
    `<line class="drop" x1="${pc(fE)}" y1="33" x2="${pc(fE)}" y2="52"/>` +
    `<line class="crit" x1="${pc(fC)}" y1="33" x2="${pc(fE)}" y2="33"/>` +
    `<line class="ach" pathLength="1" x1="${pc(fC)}" y1="18" x2="${pc(fD)}" y2="18"/>` +
    `<line class="ax" x1="0" y1="52" x2="100%" y2="52"/>` + ticks.map((v) => `<line class="tk" x1="${pc(frac(v))}" y1="52" x2="${pc(frac(v))}" y2="56"/>`).join('') +
    `<circle class="dc" cx="${pc(fC)}" cy="52" r="4"/><circle class="dd" cx="${pc(fD)}" cy="52" r="4"/></svg>`
  const lab = ticks.map((v) => `<span class="tv" style="--x:${fx(frac(v))}">${v}</span>`).join('') +
    `<span class="lb ba" style="--x:${fx(fD)}">${k.value} log achieved</span><span class="lb bc" style="--x:${fx(fE)}">${k.criterion} criterion</span>`
  const hits = [['dc', fC, 52, N.tips.ctrl], ['dd', fD, 52, N.tips.trt], ['de', fE, 33, N.tips.crit]]
    .map(([c, f, y, t]) => `<span class="hit ${c}" style="--x:${fx(f)};--y:${y}px"><span class="tip">${t}</span></span>`).join('')
  return svg + lab + hits
}

export default async function gen({ facts }) {
  return [
    { marker: 'f5c', html: dish(CTRL, { label: `Control plate, 1 in 1,000, ${STUDY.control.colonies} colonies counted`, defs: true }) },
    { marker: 'f5t', html: dish(TRT, { label: `Disinfected plate, undiluted, ${STUDY.treated.colonies} colonies counted`, defs: false }) },
    { marker: 'f5l', html: ladder(facts) },
  ]
}

// node chapters/03-microbiology/tools/f5-layout.mjs  → the measured table of SPEC-C §6.4
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [name, L] of [['control', CTRL], ['treated', TRT]]) {
    const s = stats(L)
    console.log(name, { ...s, minGap: s.minGap.toFixed(3), extent: s.extent.toFixed(2), lastH: (s.lastStart / 1400 * 72).toFixed(1), firstH: (s.firstStart / 1400 * 72).toFixed(1), rows: JSON.stringify(s.rows) })
  }
  console.log({ r2: r2(4.15557) })
}
