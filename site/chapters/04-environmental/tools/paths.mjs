// Declared generator (chapter.json "generators"): Fig. 6 "The Run" (SPEC-C §7.4). Writes the SVG geometry and the DOM
// labels (A6: in-plot text is DOM, placed in % of the 360 × 450 drawing box from the same model as the geometry) between
// <!--gen:f6:start--> and <!--gen:f6:end--> in this chapter's chapter.html. Pure and deterministic. Every number it prints
// comes from chromatogram.model.mjs and must equal facts.json (env.key), or the build fails here.
//
// Paths: RDP (tolerance 0.12 u) in a warped space (x stretched ×9 inside the 2.75–3.75 min zoom window, y ×1.5) so the
// zoomed states stay smooth; vertices forced at whole minutes (the sample's 8 one-minute pen segments join exactly);
// relative encoding on a 0.01 / 0.1 u integer grid (no drift).
//
// Layers, bottom to top: window band (std) · clipped zoom group [six back injections (fill + line), the sample (fill,
// spike, nitrate area, integration, 8 pen segments)] · static (unscaled) frames per state: stack axis + scale bar, std
// ladder leaders, spike ladder leaders + found band, zoom axis + scale bar. Then the DOM label groups. Text never sits
// inside a scaled group, and never on a stroke: clearance() fails the build if any label box meets a drawn line in any
// state at 320–1440 px (tools/ink.mjs measures the same thing in rendered pixels).
import * as M from '../chromatogram.model.mjs'

const { G, xs, ys, zxs, zys } = M
const LX = 262 // ladder label column (std, spike)

// ---- number formatting: shortest form, no leading zero; separators only where the grammar needs them
const num = (v, d) => { let s = (Math.round(v * 10 ** d) / 10 ** d).toFixed(d).replace(/\.?0+$/, ''); if (s === '-0' || s === '') s = '0'; return s.replace(/^(-?)0\./, '$1.') }
function join(list) {
  let out = '', last = ''
  for (const s of list) {
    if (out && !(s[0] === '-' || (s[0] === '.' && last.includes('.')))) out += ' '
    out += s; last = s
  }
  return out
}
// absolute points → "M x y l dx dy dx dy …" on an integer grid, so relative steps never drift. Inside the zoom window
// (shown ×9 / ×1.5) x is on a 0.02 u grid and y on 0.1 u; outside it (shown ×1) x on 0.1 u and y on 0.2 u. Every
// quantisation error is under 0.3 px at the largest plate; printed with at most 2 (x) / 1 (y) decimals.
const inWin = (x) => x >= xs(G.W0 - 0.25) && x <= xs(G.W0 + 1.15)
function rel(pts) {
  const X = pts.map((p) => (inWin(p[0]) ? Math.round(p[0] * 50) * 2 : Math.round(p[0] * 10) * 10))
  const Y = pts.map((p) => (inWin(p[0]) ? Math.round(p[1] * 10) : Math.round(p[1] * 5) * 2))
  const parts = []
  for (let i = 1; i < pts.length; i++) parts.push(num((X[i] - X[i - 1]) / 100, 2), num((Y[i] - Y[i - 1]) / 10, 1))
  return `M${join([num(X[0] / 100, 2), num(Y[0] / 10, 1)])}l${join(parts)}`
}
const warp = (t) => (t < G.W0 ? t : t > G.W0 + 1 ? t + (G.ZX - 1) : G.W0 + (t - G.W0) * G.ZX)
function simplify(pts, tol) {
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1
  pts.forEach((p, i) => { if (Math.abs(p.t - Math.round(p.t)) < 1e-9) keep[i] = 1 })
  const st = [[0, pts.length - 1]]
  while (st.length) {
    const [a, b] = st.pop()
    let md = 0, mi = -1
    const [ax, ay] = pts[a].w, [bx, by] = pts[b].w, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1
    for (let i = a + 1; i < b; i++) { const [px, py] = pts[i].w; const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / L; if (d > md) { md = d; mi = i } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]) }
  }
  return pts.filter((_, i) => keep[i])
}
// shift: the injection's retention drift (min). Applied inside the zoom window's margins (2.5–3.9 min, baseline at both
// ends), the only place a few thousandths of a minute can be seen; outside it the standards keep their shared vertices.
function trace(areas, t0 = 0, t1 = M.RUN.runMin, dt = 0.0025, shift = 0) {
  const n = Math.round((t1 - t0) / dt), pts = []
  for (let i = 0; i <= n; i++) { const t = +(t0 + i * dt).toFixed(6), v = M.signal(t >= G.W0 - 0.25 && t <= G.W0 + 1.15 ? t - shift : t, areas); pts.push({ t, v, w: [warp(t) * G.PPM, G.S * (t >= G.W0 && t <= G.W0 + 1 ? G.ZY : 1) * v] }) }
  return simplify(pts, 0.12)
}
const xy = (p) => [xs(p.t), ys(p.v)]
// DOM label: anchor point in viewBox units; cls: e = end-anchored, m = centred, bt = bottom-anchored, pk = peak name (leader),
// dn = peak name under the baseline on an elbow leader (w: west of the foot), a/k = colour. Position in whole view-box units
// (CSS turns them into % of the box: ≤ 0.5 u = 0.7 px at the largest plate). Labels are objects first, so the clearance
// check below measures exactly what is printed.
const lbl = (x, y, html, cls = '', extra = '', t) => ({ x: Math.round(x), y: Math.round(y), html, cls, extra, t })
const out = (l) => `<i${l.t != null ? ` data-t="${l.t}"` : ''}${l.cls ? ` class="${l.cls}"` : ''} style="--x:${l.x};--y:${l.y}${l.extra}">${l.html}</i>`
const cqw = (u) => `${num((u / G.W) * 100, 2)}cqw`

// ---- clearance check (A6: no text over a drawn stroke). Each label's box from the shell's label metrics (mono, 7 px advance,
// line-height 1; 1.3 for two-line labels) at the measured plate scale and font size of each test width, against every stroke
// visible in each state (traces, axes, scale bars, leaders; occluding fills ignored, so the check is conservative), clipped
// as drawn. Also: labels never overlap each other, stay inside the plate and clear of the corner rows (10 px + 11 px + 2 px).
const CW = 7
const CFG = [[320, 0.8, 10.5], [360, 0.9111, 10.5], [390, 0.9944, 11], [412, 1.0556, 11], [768, 1.7778, 11.5], [1280, 1.0311, 11.5], [1440, 1.4311, 11.5]]
const lines = (html, narrow) => html.replace(narrow ? /<b class="wd">.*?<\/b>/g : /<br class="nw">/g, '').split(/<br[^>]*>/).map((x) => [...x.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')].length)
function box(l, [, u, fs]) {
  const n = lines(l.html, fs < 11), w = (Math.max(...n) * CW) / u, h = (n.length * (n.length > 1 ? 1.3 : 1) * fs) / u, c = l.cls.split(' ')
  let x0 = c.includes('e') ? l.x - w : c.includes('m') ? l.x - w / 2 : l.x, y0 = c.includes('bt') ? l.y - h : l.y - h / 2
  if (c.includes('pk')) x0 = c.includes('dn') ? (c.includes('w') ? l.x - 6 / u - w : l.x + 6 / u) : l.x + 9 / u
  return { x0, x1: x0 + w, y0, y1: y0 + h }
}
// Liang–Barsky: does segment a→b cross the rectangle r?
function hits(a, b, r) {
  let t0 = 0, t1 = 1
  const dx = b[0] - a[0], dy = b[1] - a[1]
  for (const [p, q] of [[-dx, a[0] - r.x0], [dx, r.x1 - a[0]], [-dy, a[1] - r.y0], [dy, r.y1 - a[1]]]) {
    if (p === 0) { if (q < 0) return false; continue }
    const t = q / p
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t } else { if (t < t0) return false; if (t < t1) t1 = t }
  }
  return true
}
function clearance(states) {
  const bad = []
  for (const [state, labels, strokes, clip] of states) for (const cfg of CFG) {
    const [vw, u] = cfg, pad = 0.75 / u, edge = 23 / u
    const bx = labels.map((l) => ({ l, r: box(l, cfg) }))
    for (const { l, r } of bx) {
      const name = l.html.replace(/<[^>]+>/g, '').trim()
      if (r.x0 < 0 || r.x1 > G.W || r.y0 < edge || r.y1 > G.H - edge) bad.push(`${state} ${vw}: "${name}" outside the plate or in a corner row`)
      const E = { x0: r.x0 - pad, x1: r.x1 + pad, y0: r.y0 - pad, y1: r.y1 + pad }
      const C = { x0: Math.max(E.x0, clip.x0), x1: Math.min(E.x1, clip.x1), y0: Math.max(E.y0, clip.y0), y1: Math.min(E.y1, clip.y1) }
      for (const [id, pl] of strokes) {
        const R = /trace/.test(id) ? C : E // traces are drawn inside the clip group; axes, scale bars and leaders outside it
        if (R.x0 < R.x1 && R.y0 < R.y1) for (let i = 1; i < pl.length; i++) if (hits(pl[i - 1], pl[i], R)) { bad.push(`${state} ${vw}: "${name}" sits on a stroke (${id})`); break }
      }
    }
    for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) {
      const a = bx[i].r, b = bx[j].r
      if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.5 / u && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0.5 / u) bad.push(`${state} ${vw}: labels overlap "${bx[i].l.html}" × "${bx[j].l.html}"`)
    }
  }
  if (bad.length) throw new Error(`paths: Fig. 6 label clearance\n  ${[...new Set(bad)].join('\n  ')}`)
}
const HEAD = 'NO<sub>3</sub>-N, mg/L'

export default async function gen({ facts }) {
  const N = M.numbers(), k = facts['env.key']
  const want = { sample: k.value, spike: k.spike.found, gap: k.spike.gap, added: k.spike.added, recovery: k.spike.recovery, window: k.window, rt: k.rt }
  for (const [key, v] of Object.entries(want)) if (N[key] !== v) throw new Error(`paths: ${key} computes "${N[key]}" but facts.json env.key says "${v}"`)
  if (k.cal.m !== M.CAL.m.toFixed(4) || k.cal.b !== M.CAL.b.toFixed(3) || k.area !== M.AREA.sample.toFixed(3) || k.spike.area !== M.AREA.spike.toFixed(3)) throw new Error('paths: calibration or areas differ from facts.json')
  if (k.cal.levels.join() !== M.STD_N.join() || k.cal.areas.join() !== M.STD_AREA.join()) throw new Error('paths: standards differ from facts.json')

  // ---- traces: k0 sample (front), k1 blank, k2..k6 the five standards (each with its own small retention drift)
  const sampleA = M.sampleAreas(), spikeA = M.sampleAreas(M.AREA.spike)
  const back = [{ k: 1, areas: {}, dt: 0 }, ...M.STD_AREA.map((_, i) => ({ k: i + 2, areas: M.standardAreas(i), dt: M.STD_DT[i] }))]
  const lines6 = {} // polylines, as drawn (before the stack offset or the zoom), for the clearance check
  let zoom = ''
  for (const tr of [...back].reverse()) {
    // the fill (hidden-line occlusion of the injections behind) is a <use> of the line: one copy of the data
    const pts = trace(tr.areas, 0, M.RUN.runMin, 0.0025, tr.dt).map(xy)
    lines6[tr.k] = pts
    zoom += `<g class="trk k${tr.k}"><use href="#f6${tr.k}" class="f"/><path id="f6${tr.k}" class="ln" d="${rel(pts)}"/></g>`
  }
  const sp = trace(sampleA)
  lines6[0] = sp.map(xy)
  let s0 = `<path class="f" d="${rel(sp.map(xy))}"/>`
  const spkPts = trace(spikeA, 2.95, 3.6, 0.002).map(xy)
  s0 += `<g class="spk"><use href="#f6s" class="sf"/><path id="f6s" class="sl" d="${rel(spkPts)}"/></g>`
  const s3 = M.sigma(M.RT), ta = M.RT - 3 * 0.85 * s3, tb = M.RT + 3 * 1.15 * s3
  const ar = trace({ NO3: M.AREA.sample }, ta, tb, 0.002)
  s0 += `<path class="ar" d="${rel(ar.map(xy))}V${G.Y0}H${num(xs(ta), 2)}Z"/>`
  s0 += `<path class="ig" d="M${num(xs(ta), 2)} ${G.Y0 + 3}V${G.Y0 - 3}M${num(xs(tb), 2)} ${G.Y0 + 3}V${G.Y0 - 3}M${num(xs(ta), 2)} ${G.Y0}H${num(xs(tb), 2)}"/>`
  for (let m = 0; m < M.RUN.runMin; m++) s0 += `<path class="seg" d="${rel(sp.filter((q) => q.t >= m - 1e-9 && q.t <= m + 1 + 1e-9).map(xy))}"/>`
  zoom += `<g class="trk k0">${s0}</g>`

  // ---- static frames. The stack's time axis sits AX below the baselines: the strip between holds two peak names.
  const AX = 28, ZX1 = zxs(M.RT + 0.55) // zoomed views: data clipped to the axis, 2.75–3.75 min
  const wa = zxs(M.RT - 3 * M.RTSD), wb = zxs(M.RT + 3 * M.RTSD)
  const hN = (A) => M.height('NO3', A)
  const yStd = M.STD_AREA.map((A) => zys(hN(A))), ySmp = zys(hN(M.AREA.sample)), ySpk = zys(hN(M.AREA.spike))
  const lead = (y) => `M${num(zxs(M.RT) + 4, 1)} ${num(y, 1)}H${LX - 5}`
  const stackAxis = `M${xs(0)} ${G.Y0 + AX}H${xs(8)}` + Array.from({ length: 9 }, (_, i) => `M${num(xs(i), 1)} ${G.Y0 + AX}v4`).join('')
  const bar = (h) => `M24 120v${num(h, 1)}M20 120h8M20 ${num(120 + h, 1)}h8`
  const zoomAxis = `M${G.X0} ${G.Y0 + 8}H${num(zxs(3.75), 1)}` + [2.8, 3, 3.2, 3.4, 3.6].map((t) => `M${num(zxs(t), 1)} ${G.Y0 + 8}v4`).join('')
  const br = M.by('Br'), brX = zxs(br.tR + M.STD_DT[4]), brTop = zys(M.height('Br', M.standardAreas(4).Br))
  let svg = `<svg class="cg" viewBox="0 0 ${G.W} ${G.H}" role="img" aria-labelledby="f6-t">`
  svg += `<title id="f6-t">Simulated anion chromatograms, five standards behind the sample: nitrate ${N.sample} mg/L as N at ${N.rt} min, below the MCL of ${k.mcl}; matrix spike recovery ${N.recovery} percent.</title>`
  // the clip rect narrows to the zoom axis (x 58–337) in the zoomed states (CSS x / width, moving with the zoom)
  svg += `<defs><clipPath id="f6c"><rect class="cr" y="40" width="${G.W}" height="340"/></clipPath></defs>`
  svg += `<g class="s-std"><rect class="win" x="${num(wa, 1)}" y="60" width="${num(wb - wa, 1)}" height="${G.Y0 - 60}"/></g>`
  svg += `<g clip-path="url(#f6c)"><g class="zm">${zoom}</g></g>`
  svg += `<g class="s-stack"><path class="ax" d="${stackAxis}"/><path class="sb" d="${bar(G.S * 20)}"/></g>`
  svg += `<g class="s-std"><path class="ld" d="${[...yStd, ySmp].map(lead).join('')}M${num(brX, 1)} ${num(brTop - 4, 1)}v-10"/></g>`
  svg += `<g class="s-spk"><path class="ld" d="${[ySpk, ySmp].map(lead).join('')}"/><rect class="fb" x="${LX - 9}" y="${num(ySpk, 1)}" width="4" height="${num(ySmp - ySpk, 1)}"/></g>`
  svg += `<g class="s-zoom"><path class="ax" d="${zoomAxis}"/><path class="sb" d="${bar(G.S * G.ZY * 20)}"/></g>`
  svg += `</svg>`

  // ---- DOM labels. Stack: the column header, one label per injection (4 u left of its baseline), the peak names
  const st = [lbl(14, G.Y0 + G.DY * 6 - 16, HEAD)]
  const names = ['Sample', 'Blank', ...M.STD_N]
  names.forEach((n, i) => { st.push(lbl(G.X0 + G.DX * i - 4, G.Y0 + G.DY * i, n, i ? 'e' : 'e k')) })
  // Peak names live on the sample's own row, in strips no other trace enters (A6, measured below at 320–1440 px):
  // nitrate and sulfate between the blank and the sample baselines, on a short leader from the peak's right flank;
  // fluoride and chloride (0.5 min apart: no room for either name between them) under the sample baseline, on elbow
  // leaders from each peak's foot, fluoride to the west and chloride to the east.
  const yA = (G.Y0 + G.Y0 + G.DY) / 2, yD = G.Y0 + 16
  const flank = (id) => { let t = M.by(id).tR; while (M.signal(t, sampleA) > (G.Y0 - yA) / G.S) t += 0.0005; return xs(t) + 1.5 }
  const lv = `;--lv:${cqw(yD - G.Y0 - 1.5)}`
  st.push(lbl(xs(M.by('F').tR), yD, 'Fluoride', 'pk dn w', lv, M.by('F').tR))
  st.push(lbl(xs(M.by('Cl').tR), yD, 'Chloride', 'pk dn', lv, M.by('Cl').tR))
  st.push(lbl(flank('NO3'), yA, 'Nitrate', 'pk a', '', M.RT))
  st.push(lbl(flank('SO4'), yA, 'Sulfate', 'pk', '', M.by('SO4').tR))
  for (const t of [0, 2, 4, 6, 8]) st.push(lbl(xs(t), G.Y0 + AX + 14, String(t), 'm'))
  st.push(lbl(xs(8) + 9, G.Y0 + AX + 14, 'min'))
  st.push(lbl(32, 120 + G.S * 10, '20 µS'))

  const sd = [lbl(LX, 62, HEAD), lbl(wb + 50, 48, `Window ${N.window} min`, 'e a')]
  M.STD_N.forEach((n, i) => { sd.push(lbl(LX, yStd[i], n)) })
  sd.push(lbl(LX, ySmp, `${N.sample} sample`, 'a'))
  // two lines; three under a 330 px figure, where "Bromide · 2.90 min" would reach the 10.0 standard's nitrate flank
  const brT = `${br.name} · ${br.tR.toFixed(2)} min`
  sd.push(lbl(12, brTop - 16, `${brT.replace(' · ', '<b class="wd"> · </b><br class="nw">')}<br>outside window`, 'two bt'))

  const sk = [lbl(LX, ySpk - 22, HEAD), lbl(LX, ySpk, `${N.spike} spiked`, 'a'), lbl(LX, (ySpk + ySmp) / 2, `+${N.gap} found`, 'a'), lbl(LX, ySmp, `${N.sample} sample`, 'k')]

  const zl = []
  for (const t of [2.8, 3, 3.2, 3.4, 3.6]) zl.push(lbl(zxs(t), G.Y0 + 22, t.toFixed(1), 'm'))
  zl.push(lbl(zxs(3.6) + 16, G.Y0 + 22, 'min'))
  zl.push(lbl(32, 120 + G.S * G.ZY * 10, '20 µS'))

  // ---- clearance: every label against every stroke it could sit on, in every state, at 320–1440 px
  const off = (k) => (p) => [p[0] + G.DX * k, p[1] + G.DY * k], Z = (p) => [G.ZX * p[0] + M.ZOOM.tx, G.ZY * p[1] + M.ZOOM.ty]
  const P = (d) => { const o = []; let c = [0, 0]; for (const [, cmd, a] of d.matchAll(/([MHVhv])([-\d. ]+)/g)) { const v = a.trim().split(/\s+/).map(Number); if (cmd === 'M') { o.push(null); c = v } else if (cmd === 'H') c = [v[0], c[1]]; else if (cmd === 'V') c = [c[0], v[0]]; else if (cmd === 'h') c = [c[0] + v[0], c[1]]; else c = [c[0], c[1] + v[0]]; o.push(c) } return o }
  const segs = (d) => P(d).reduce((a, p) => { if (p === null) a.push([]); else a[a.length - 1].push(p); return a }, []).filter((x) => x.length > 1)
  const frame = (id, d) => segs(d).map((pl) => [id, pl])
  const traces = (zoomed, ks) => ks.map((k) => [k ? `trace k${k}` : 'sample trace', lines6[k].map(zoomed ? Z : off(k))])
  const full = { x0: 0, x1: G.W, y0: 40, y1: 380 }, zc = { x0: G.X0, x1: ZX1, y0: 40, y1: 380 }
  const zFrames = [...frame('zoom axis', zoomAxis), ...frame('scale bar', bar(G.S * G.ZY * 20))]
  clearance([
    ['sample', st, [...traces(false, [0, 1, 2, 3, 4, 5, 6]), ...frame('stack axis', stackAxis), ...frame('scale bar', bar(G.S * 20))], full],
    ['std', [...sd, ...zl], [...traces(true, [0, 1, 2, 3, 4, 5, 6]), ...zFrames, ...frame('leader', [...yStd, ySmp].map(lead).join('') + `M${num(brX, 1)} ${num(brTop - 4, 1)}v-10`)], zc],
    ['spike', [...sk, ...zl], [...traces(true, [0]), ['spiked trace', spkPts.map(Z)], ...zFrames, ...frame('leader', [ySpk, ySmp].map(lead).join(''))], zc],
  ])

  const html = `${svg}` + [['stack', st], ['std', sd], ['spk', sk], ['zoom', zl]].map(([c, h]) => `<div class="lb s-${c}" aria-hidden="true">${h.map(out).join('')}</div>`).join('')
  return [{ marker: 'f6', html }]
}
