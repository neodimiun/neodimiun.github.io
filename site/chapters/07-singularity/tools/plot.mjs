// Declared generator (chapter.json "generators"): Fig. 9 "When does the wait hit zero?". Writes the SVG geometry and the
// DOM labels (in-plot text is DOM, placed in viewBox units of the same 360 × 360 box) between <!--gen:f9:start--> and
// <!--gen:f9:end--> in this chapter's chapter.html. Pure and deterministic: everything comes from data/snapshot.json through
// singularity.model.mjs, nothing is typed by hand.
//
// Two layers share one plot rectangle:
//   .al  all history: x = time before the snapshot, log (8 billion years to days, near-linear within TAU of the snapshot),
//        y = wait until the next event, log (0.1 day to 8 billion years); Kurzweil's 22 rows (hollow rings), the picks
//        (filled) inside the dashed AI-era box, the fit (solid, to the snapshot)
//   .zl  zoomed in: x = calendar (Jan 1, 2020 to Mar 1, 2028), y = wait, log (0.25 day to 1,500 days); the picks, the open
//        gap (hollow, arrow up: a lower bound), the snapshot line, the 50 % range band, the fit (solid to the snapshot,
//        dashed to zero wait at the omega point on the x axis), the omega point
// The zoom maps the AI-era box onto the zoomed plot's 2020 .. snapshot span: --zt is that transform (all layer, out),
// --zi its inverse (zoomed layer, in). Both are written on the <svg> for chapter.css and chapter.js to read.
// Dots are zero-length round-capped segments in ONE path per series (non-scaling strokes keep them round while a layer
// is scaled); a ring is the same path again, narrower, in the plate colour (<use>).
// Labels never sit on a dot, a line or another label: place() tries anchors around each point and the build fails if no
// anchor is clear at every plate width from 288 px (a 320 px phone) to 644 px (the desktop cap).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { model, YRD, isoMs, DAY, fmt } from '../singularity.model.mjs'

export const VB = 360
export const P = { x0: 50, x1: 346, y0: 34, y1: 312 }
const TAU = 10 // days: the all-history x axis is log10(days before + TAU), so the snapshot itself sits on the right edge
const LA = Math.log10(8e9 * YRD) // left edge of the all-history x axis and top of its y axis (8 billion years, in days)
const YA0 = Math.log10(0.1)
const Z0 = '2020-01-01', Z1 = '2028-03-01', YZ0 = Math.log10(0.25), YZ1 = Math.log10(1500)
const WIDTHS = [288, 358, 463, 596, 644] // plate px: 320 phone, 390 phone, 1024 two-column, 1440 desktop, the height cap
const fontPx = (w) => (w < 330 ? 10 : w >= 450 ? 11.5 : 11) // chapter.css @container fig steps
const CH = 0.6 // IBM Plex Mono advance, em

const n1 = (v) => { const s = (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, ''); return s === '-0' ? '0' : s }
const n2 = (v) => String(Math.round(v * 100) / 100)

export function geometry(S) {
  const M = model(S)
  const W = P.x1 - P.x0, H = P.y1 - P.y0
  // ---- all history
  const ax = (d) => P.x0 + (LA - Math.log10(-d + TAU)) / (LA - Math.log10(TAU)) * W
  const ay = (g) => P.y1 - (Math.log10(g) - YA0) / (LA - YA0) * H
  // ---- zoomed in
  const T0 = isoMs(M.asOf), dz = (iso) => (isoMs(iso) - T0) / DAY
  const zd0 = dz(Z0), zd1 = dz(Z1)
  const zx = (d) => P.x0 + (d - zd0) / (zd1 - zd0) * W
  const zy = (g) => P.y1 - (Math.log10(g) - YZ0) / (YZ1 - YZ0) * H
  // ---- the AI-era box and the zoom between the layers
  const box = { x0: ax(zd0), x1: ax(0), y0: ay(10 ** YZ1), y1: ay(10 ** YZ0) }
  const sx = (zx(0) - P.x0) / (box.x1 - box.x0), sy = H / (box.y1 - box.y0)
  const zt = { tx: P.x0 - sx * box.x0, ty: P.y0 - sy * box.y0, sx, sy }
  return { M, ax, ay, zx, zy, dz, box, zt, zd0, zd1 }
}

// a function sampled on [a, b] (n steps) → polyline points, Ramer-Douglas-Peucker at tol units
function sample(fx, fy, a, b, n) { const out = []; for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n; out.push([fx(t), fy(t)]) } return out }
function rdp(pts, tol) {
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1
  const st = [[0, pts.length - 1]]
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1
    const [x1, y1] = pts[a], [x2, y2] = pts[b], L = Math.hypot(x2 - x1, y2 - y1) || 1
    for (let i = a + 1; i < b; i++) { const d = Math.abs((y2 - y1) * pts[i][0] - (x2 - x1) * pts[i][1] + x2 * y1 - y2 * x1) / L; if (d > md) { md = d; mi = i } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]) }
  }
  return pts.filter((_, i) => keep[i])
}
const poly = (pts) => 'M' + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L')
const dots = (pts) => pts.map(([x, y]) => `M${n1(x)} ${n1(y)}h0`).join('')

// ------------------------------------------------------------------------------------------------ label placement
// A label is anchored at a point (viewBox units) and offset in px by its anchor: its box in px depends on the plate width
// w (units × w / 360) and the font step. Obstacles are given in units: dots (centre, radius in px), segments, rects.
// g: the gap in px between the dot and the label (3, then 6, then 10 when the nearer place is taken)
const ANCHORS = {
  ne: (bw, bh, g) => [g + 2, -bh - g], e: (bw, bh, g) => [g + 5, -bh / 2], se: (bw, bh, g) => [g + 2, g], s: (bw, bh, g) => [-bw / 2, g + 3],
  sw: (bw, bh, g) => [-bw - g - 2, g], w: (bw, bh, g) => [-bw - g - 5, -bh / 2], nw: (bw, bh, g) => [-bw - g - 2, -bh - g], n: (bw, bh, g) => [-bw / 2, -bh - g - 3],
}
// CSS for each anchor (chapter.css reads --tx / --ty): the same offsets as ANCHORS, so the measured box is the drawn box
const cssOf = (a, g) => ({ ne: [`${g + 2}px`, `calc(-100% - ${g}px)`], e: [`${g + 5}px`, '-50%'], se: [`${g + 2}px`, `${g}px`], s: ['-50%', `${g + 3}px`],
  sw: [`calc(-100% - ${g + 2}px)`, `${g}px`], w: [`calc(-100% - ${g + 5}px)`, '-50%'], nw: [`calc(-100% - ${g + 2}px)`, `calc(-100% - ${g}px)`], n: ['-50%', `calc(-100% - ${g + 3}px)`] })[a]
// the four corner labels (shell figure.css: 11 px Plex Mono, .08em tracking, 10 px from the plate's edges), in px at width w
const CORNERS = [[0, 0, 'Fig. 9'], [1, 0, 'Wait · log'], [0, 1, '22 + 41 events'], [1, 1, 'Snapshot']]
const cornerBoxes = (w) => CORNERS.map(([r, b, t]) => { const cw = t.length * 11 * 0.68; return { x0: r ? w - 10 - cw : 10, x1: r ? w - 10 : 10 + cw, y0: b ? w - 21 : 10, y1: b ? w - 10 : 21 } })
export function boxAt(L, w) {
  const k = w / VB, f = fontPx(w), lines = L.text.split('\n'), bw = Math.max(...lines.map((s) => s.length)) * f * CH, bh = lines.length * f * 1.25
  const [ox, oy] = ANCHORS[L.anchor](bw, bh, L.gap ?? 3)
  const x = L.x * k + ox, y = L.y * k + oy
  return { x0: x, y0: y, x1: x + bw, y1: y + bh }
}
const segDist = (px, py, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - ax - t * dx, py - ay - t * dy) }
export function hitsBox(B, ob, k, pad = 2) {
  if (ob.dot) { const [cx, cy] = [ob.dot[0] * k, ob.dot[1] * k], r = ob.r + pad; return cx > B.x0 - r && cx < B.x1 + r && cy > B.y0 - r && cy < B.y1 + r && Math.hypot(Math.max(B.x0 - cx, 0, cx - B.x1), Math.max(B.y0 - cy, 0, cy - B.y1)) < r }
  if (ob.seg) {
    const [a, b] = ob.seg.map(([x, y]) => [x * k, y * k])
    // the segment meets the padded box: sample it (segments are short polyline pieces)
    const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2))
    for (let i = 0; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n; if (x > B.x0 - pad && x < B.x1 + pad && y > B.y0 - pad && y < B.y1 + pad) return true }
    return false
  }
  if (ob.rect) { const R = ob.rect; return R.x1 * k > B.x0 - pad && R.x0 * k < B.x1 + pad && R.y1 * k > B.y0 - pad && R.y0 * k < B.y1 + pad }
  // two labels keep a word space apart (6 px), or they read as one line
  if (ob.label) { const C = boxAt(ob.label, k * VB), q = 6; return C.x1 > B.x0 - q && C.x0 < B.x1 + q && C.y1 > B.y0 - q && C.y0 < B.y1 + q }
  return false
}
// the first anchor in `order` that is clear at every width (inside `inside`, a rect in units); else null. The anchors' own
// offsets keep a label off the dot it names, so that dot is not an obstacle.
const why = (C, w, r) => { if (process.env.PLOT_DEBUG && C.text.includes(process.env.PLOT_DEBUG)) console.log(`  ${C.text} ${C.anchor}/${C.gap} @${w}: ${r}`); return false }
// ws: the plate widths the label must fit at (a label that fits only from 358 px up is hidden below 330 px, class n3)
export function place(L, order, obstacles, inside, gaps = [3, 6, 10], ws = WIDTHS) {
  for (const gap of gaps) for (const a of order) {
    const C = { ...L, anchor: a, gap, ws }
    const ok = ws.every((w) => {
      const k = w / VB, B = boxAt(C, w)
      if (inside && (B.x0 < inside.x0 * k || B.x1 > inside.x1 * k || B.y0 < inside.y0 * k || B.y1 > inside.y1 * k)) return why(C, w, 'outside')
      if (cornerBoxes(w).some((R) => R.x1 > B.x0 - 12 && R.x0 < B.x1 + 12 && R.y1 > B.y0 - 4 && R.y0 < B.y1 + 4)) return why(C, w, 'corner')
      const hit = obstacles.find((ob) => !(ob.dot && ob.dot[0] === L.x && ob.dot[1] === L.y) && !(ob.label && !ob.label.ws.includes(w)) && hitsBox(B, ob, k)) // its own dot: the anchors clear it
      return hit ? why(C, w, Object.keys(hit)[0] + (hit.label ? ' ' + hit.label.text : '')) : true
    })
    if (ok) return C
  }
  return null
}
const segsOf = (pts) => pts.slice(1).map((p, i) => ({ seg: [pts[i], p] }))

// ------------------------------------------------------------------------------------------------ markup
export default async function gen({ facts, root }) {
  const S = JSON.parse(readFileSync(join(root, 'data/snapshot.json'), 'utf8'))
  const G = geometry(S), { M, ax, ay, zx, zy, box, zt } = G
  const problems = []
  const lab = (L) => `<i${L.cls ? ` class="${L.cls}"` : ''} style="--x:${n1(L.x)};--y:${n1(L.y)}${L.anchor ? `;--tx:${cssOf(L.anchor, L.gap)[0]};--ty:${cssOf(L.anchor, L.gap)[1]}` : ''}${L.align ? `;text-align:${L.align}` : ''}">${L.text.replace(/\n/g, '<br>')}</i>`

  // ================================================================ all history
  const kzPts = M.kz.map((p) => [ax(p.d), ay(p.g)])
  const aiPts = M.picks.map((p) => [ax(p.d), ay(p.g)]), aiOpen = M.open.map((p) => [ax(p.d), ay(p.g)])
  // the fit, solid from the left edge to the snapshot (sampled evenly in the axis' own log coordinate)
  const fitA = rdp(sample((u) => ax(-(10 ** u - TAU)), (u) => ay(M.fit.g(-(10 ** u - TAU))), LA, Math.log10(TAU), 240), 0.15)
  const gridA = { y: [[1, '1 d'], [YRD, '1 yr'], [1e3 * YRD, '1k yr'], [1e6 * YRD, '1M yr'], [1e9 * YRD, '1B yr']], x: [[1e9 * YRD, '1B yr ago'], [1e6 * YRD, '1M yr ago'], [1e3 * YRD, '1k yr ago'], [YRD, '1 yr ago']] }
  const gA = gridA.y.map(([g]) => `M${P.x0} ${n1(ay(g))}H${P.x1}`).join('') + gridA.x.map(([d]) => `M${n1(ax(-d))} ${P.y0}V${P.y1}`).join('')
  // labels: ticks, the AI-era box, Kurzweil's key milestones (placed clear of every dot, the fit and each other)
  const labA = []
  for (const [g, t] of gridA.y) labA.push({ x: P.x0, y: ay(g), text: t, cls: 'yt' })
  for (const [d, t] of gridA.x) labA.push({ x: ax(-d), y: P.y1, text: t, cls: 'xt' })
  const obA = [...kzPts.map((dot) => ({ dot, r: 5 })), ...aiPts.concat(aiOpen).map((dot) => ({ dot, r: 4 })), ...segsOf(fitA), { rect: box }]
  const era = place({ x: (box.x0 + box.x1) / 2, y: box.y0, text: 'AI era', cls: 'c' }, ['n', 'nw'], obA, P)
  if (!era) problems.push('no clear place for "AI era"')
  else { labA.push(era); obA.push({ label: era }) }
  // Kurzweil's key rows, most recent first (the crowded end), each trying anchors clear of the line: above-right, below-left
  const keys = M.kz.map((p, i) => ({ ...p, i })).filter((p) => p.key).reverse()
  for (const p of keys) {
    const [x, y] = kzPts[p.i]
    const order = ['ne', 'sw', 'e', 'w', 'nw', 'se', 'n', 's'], inside = { ...P, y0: 12 }
    // on the narrowest plates (under 330 px) the oldest milestones crowd the corner row: a label that has no clear place
    // there is dropped there (class n3), never moved onto a dot
    const L = place({ x, y, text: p.label, cls: 'k' }, order, obA, inside) || place({ x, y, text: p.label, cls: 'k n3' }, order, obA, inside, undefined, WIDTHS.slice(1))
    if (!L) { problems.push(`no clear place for the label "${p.label}"`); continue }
    labA.push(L); obA.push({ label: L })
  }

  // ================================================================ zoomed in
  const zPts = M.picks.map((p) => [zx(p.d), zy(p.g)]), zOpen = M.open.map((p) => [zx(p.d), zy(p.g)])
  const om = [zx(M.omega.d), P.y1]
  const fitZs = rdp(sample((d) => zx(d), (d) => zy(M.fit.g(d)), G.zd0, 0, 200), 0.15)
  // dashed: from the snapshot down to the floor of the plot (wait 0.25 day), then along the floor to the omega point
  let dF = 0; for (let lo = 0, hi = M.omega.d; hi - lo > 1e-6;) { dF = (lo + hi) / 2; if (M.fit.g(dF) > 10 ** YZ0) lo = dF; else hi = dF }
  const fitZd = rdp(sample((d) => zx(d), (d) => zy(Math.max(M.fit.g(d), 10 ** YZ0)), 0, dF, 120), 0.15).concat([om])
  const years = []; for (let y = 2020; y <= 2028; y++) years.push(y)
  const gZ = [[1, '1 d'], [7, '1 wk'], [30.44, '1 mo'], [YRD, '1 yr']]
  const gz = gZ.map(([g]) => `M${P.x0} ${n1(zy(g))}H${P.x1}`).join('') + years.map((y) => `M${n1(zx(G.dz(`${y}-01-01`)))} ${P.y0}V${P.y1}`).join('')
  const xNow = zx(0), band = { x0: zx(G.dz(M.range.lo)), x1: zx(G.dz(M.range.hi)) }
  const labZ = []
  for (const [g, t] of gZ) labZ.push({ x: P.x0, y: zy(g), text: t, cls: 'yt' })
  for (const y of years) labZ.push({ x: zx(G.dz(`${y}-01-01`)), y: P.y1, text: String(y), cls: y % 2 ? 'xt n3' : 'xt' })
  const obZ = [...zPts.concat(zOpen).map((dot) => ({ dot, r: 4 })), ...segsOf(fitZs), ...segsOf(fitZd), { dot: om, r: 7 }, { seg: [[xNow, P.y0], [xNow, P.y1]] }]
  // the open gap's arrow (up: the wait is at least this long)
  const [ox, oy] = zOpen[0] || [0, 0], arrowTop = oy - 22
  if (zOpen[0]) obZ.push({ seg: [[ox, oy], [ox, arrowTop]] })
  // fixed labels, checked like the rest: the snapshot line (top, left of it), the band (top, inside it), the omega point
  // (left of the snapshot line, in the strip under the 1-day waits), the first pick
  const fixed = [
    { L: { x: xNow, y: P.y0, text: `${fmt(M.asOf)} · snapshot`, cls: 'bg', anchor: null }, order: ['sw'], inside: P },
    { L: { x: (band.x0 + band.x1) / 2, y: P.y0, text: '50 %\nrange', cls: 'a', align: 'center' }, order: ['s'], inside: { x0: band.x0 - 2, x1: band.x1 + 2, y0: P.y0, y1: P.y1 } },
    { L: { x: xNow, y: P.y1, text: `Omega point\n${fmt(M.omega.iso)} (fitted)`, cls: 'a', align: 'right' }, order: ['nw'], inside: P },
    { L: { x: zPts[0][0], y: zPts[0][1], text: M.first.model, cls: 'c' }, order: ['e', 'se', 'ne'], inside: P },
  ]
  for (const { L, order, inside } of fixed) {
    const C = place(L, order, obZ, inside)
    if (!C) { problems.push(`no clear place for the zoomed label "${L.text.replace('\n', ' ')}"`); continue }
    labZ.push(C); obZ.push({ label: C })
  }
  if (problems.length) throw new Error(`tools/plot.mjs: ${problems.join('; ')}`)

  // ================================================================ write
  const T = `translate(${n2(zt.tx)}px,${n2(zt.ty)}px) scale(${n2(zt.sx)},${n2(zt.sy)})`
  const I = `translate(${n2(-zt.tx / zt.sx)}px,${n2(-zt.ty / zt.sy)}px) scale(${n2(1 / zt.sx)},${n2(1 / zt.sy)})`
  const k = facts['sing.data'], o = facts['sing.omega'], r = facts['sing.range'], a = facts['sing.asof']
  const title = `Wait until the next milestone, log scale: Kurzweil's ${k.kurzweil} milestones, then ${k.picks} AI model releases from ${k.first} to ${k.last}. The quadratic fit reaches zero wait at the omega point, ${o.value} (fitted; 50 percent range ${r.lo} to ${r.hi}), ${a.days} days after this snapshot of ${a.value}.`
  const svg = `<svg class="s9" viewBox="0 0 ${VB} ${VB}" role="img" aria-labelledby="f9-t" style="--zt:${T};--zi:${I}"><title id="f9-t">${title}</title>`
    + `<defs><clipPath id="f9c"><rect x="${P.x0 - 6}" y="${P.y0 - 6}" width="${P.x1 - P.x0 + 14}" height="${P.y1 - P.y0 + 12}"/></clipPath></defs><g clip-path="url(#f9c)">`
    // stroke widths, dashes and opacities are presentation attributes here; chapter.css gives only the colours
    + `<g class="al"><path class="gr" d="${gA}"/><rect class="box" stroke-dasharray="4 3" x="${n1(box.x0)}" y="${n1(box.y0)}" width="${n1(box.x1 - box.x0)}" height="${n1(box.y1 - box.y0)}"/>`
    + `<path class="fit" stroke-width="2" d="${poly(fitA)}"/><g class="kz" stroke-width="9"><path id="f9k" d="${dots(kzPts)}"/></g><use href="#f9k" class="in" stroke-width="5.5"/>`
    + `<path class="pk" stroke-width="6" d="${dots(aiPts)}"/><g class="pk op" stroke-width="9"><path id="f9a" d="${dots(aiOpen)}"/></g><use href="#f9a" class="in" stroke-width="5.5"/></g>`
    + `<g class="zl"><path class="gr" d="${gz}"/><rect class="bd" opacity=".1" x="${n1(band.x0)}" y="${P.y0}" width="${n1(band.x1 - band.x0)}" height="${P.y1 - P.y0}"/>`
    + `<path class="be" stroke-dasharray="2 3" d="M${n1(band.x0)} ${P.y0}V${P.y1}M${n1(band.x1)} ${P.y0}V${P.y1}"/><path class="now" d="M${n1(xNow)} ${P.y0}V${P.y1}"/>`
    + `<path class="fit" stroke-width="2" d="${poly(fitZs)}"/><path class="fit" stroke-width="2" stroke-dasharray="5 4" d="${poly(fitZd)}"/><path class="pk" stroke-width="6" d="${dots(zPts)}"/>`
    + (zOpen[0] ? `<path class="ar" stroke-width="1.5" d="M${n1(ox)} ${n1(oy - 6)}V${n1(arrowTop)}M${n1(ox - 3.5)} ${n1(arrowTop + 4)}l3.5-4 3.5 4"/><g class="pk op" stroke-width="9"><path id="f9z" d="${dots(zOpen)}"/></g><use href="#f9z" class="in" stroke-width="5.5"/>` : '')
    + `<path class="fit" stroke-width="20" opacity=".25" d="M${n1(om[0])} ${n1(om[1])}h0"/><path class="fit" stroke-width="10" d="M${n1(om[0])} ${n1(om[1])}h0"/></g></g>`
    + `<path class="ax" d="M${P.x0} ${P.y0}V${P.y1}H${P.x1}"/></svg>`
  const html = svg + `<div class="lb s-all" aria-hidden="true">${labA.map(lab).join('')}</div><div class="lb s-zm" aria-hidden="true">${labZ.map(lab).join('')}</div>`
  // the screen-reader summary table: counts, first and last events, the omega point and its range
  const ago = (y) => (y >= 1e9 ? `${+(y / 1e9).toPrecision(2)} billion years ago` : y >= 1e6 ? `${+(y / 1e6).toPrecision(2)} million years ago` : `${Math.round(y).toLocaleString('en-US')} years ago`)
  const k0 = S.kurzweil.rows[0], kN = S.kurzweil.rows[S.kurzweil.rows.length - 1], openRow = M.open[0]
  const tr = (h, ...c) => `<tr><th scope="row">${h}</th>${c.map((x) => `<td>${x}</td>`).join('')}</tr>`
  // (a table ignores width:1px and overflow, so the sr-only box is a div around it)
  const table = `<div class="sr-only"><table><caption>{{fig:singularity}} in numbers</caption><tr><th scope="col">Series</th><th scope="col">Events</th><th scope="col">First</th><th scope="col">Last</th></tr>`
    + tr("Kurzweil's milestones", M.counts.kurzweil, `${k0.label}, ${ago(k0.years_before_today)}`, `${kN.label}, ${ago(kN.years_before_today)}`)
    + tr('AI model releases', M.counts.picks, `${M.first.model}, ${fmt(M.first.date)}, next ${M.picks[0].g} days later`, `${M.lastRow.model}, ${fmt(M.lastRow.date)}${openRow ? `, no next yet after ${openRow.g} days` : ''}`)
    + tr('Omega point, fitted', 1, fmt(M.omega.iso), `50 percent range ${fmt(M.range.lo)} to ${fmt(M.range.hi)}`) + '</table></div>'
  return [{ marker: 'f9', html }, { marker: 'f9t', html: table }]
}
