// tools/layers-svg.mjs (Team IT): declared generator for Fig. 7 "The System Model" (SPEC-C §8.4, A6, A11).
// Pure and deterministic: evaluates geom(W, H) for the two build-time variants (regular 360 × 450, 4:5; narrow 360 × 480,
// 3:4) and writes, between <!--gen:f7:start--> and <!--gen:f7:end--> in chapter.html:
//   - one glyph <defs> SVG (PC, switch, router, cloud, server), referenced by <use> from both variants
//   - the two drawing SVGs (.vr / .vn; CSS shows one, by the figure's container query)
//   - the DOM label layer (A6): one set of labels for both variants, placed by --x/--y (regular) and --xn/--yn (narrow)
//     in % of the drawing box. Intro groups that mix marks and words (a8, a12, a15) carry a small overlay SVG per variant.
// No JS geometry at run time. Every string comes from facts['it.key'] through layers.model.js.
import { geom, layers, words } from '../layers.model.js'

const f = (x) => { const r = Math.round(x * 10) / 10; return String(Object.is(r, -0) ? 0 : r) }
const pt = ([x, y]) => `${f(x)} ${f(y)}`
const line = (...pts) => 'M' + pts.map(pt).join('L')
const add = ([x, y], dx, dy = 0) => [x + dx, y + dy]
// arrowhead: tip at p, pointing along angle a (radians), 7 long, 7 wide
function head(p, a, L = 7, w = 3.5) {
  const [x, y] = p, c = Math.cos(a), s = Math.sin(a)
  const b = [x - L * c, y - L * s]
  return `M${pt(p)}L${pt([b[0] + w * s, b[1] - w * c])}L${pt([b[0] - w * s, b[1] + w * c])}z`
}
// a quadratic arc from a to b bulging d units to the left of a→b (screen-up for a left-to-right segment)
function arc(a, b, d) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy)
  return `M${pt(a)}Q${pt([mx + (dy / L) * d, my - (dx / L) * d])} ${pt(b)}`
}
const use = (id, p, cls) => `<use href="#it-${id}" x="${f(p[0])}" y="${f(p[1])}"${cls ? ` class="${cls}"` : ''}/>`

// the glyphs: plane-local, upright icons, 1.25 px non-scaling strokes; fill/stroke/color come from the <use>
const NS = ' vector-effect="non-scaling-stroke"'
const DEFS = '<svg class="dfs" aria-hidden="true" width="0" height="0"><defs>' +
  `<g id="it-pc"><path${NS} d="M-7-9h14v10h-14zM-4 3h8"/></g>` +
  `<g id="it-sw"><path${NS} d="M-12-4h24v8h-24z"/><path fill="currentColor" stroke="none" d="M-9-1h3v2h-3zM-4-1h3v2h-3zM1-1h3v2h-3zM6-1h3v2h-3z"/></g>` +
  `<g id="it-rt"><circle${NS} r="7"/><path${NS} d="M-3.5 0h7M0-3.5v7"/></g>` +
  `<g id="it-cl"><path${NS} d="M-11 4a5 5 0 0 1 3-9a6 6 0 0 1 11-1a5 5 0 0 1 8 6a4 4 0 0 1-2 4z"/></g>` +
  `<g id="it-sv"><path${NS} d="M-6-12h12v15h-12zM-3-7h6M-3-3h6"/></g>` +
  '</defs></svg>'

function variant(W, H, v, K) {
  const G = geom(W, H), { N, o1, o2, ghost, pd, planes } = G
  const Y = (i) => planes[i].yf                       // plane origin (global y of its front edge)
  const gl = (i, p) => [p[0], p[1] + Y(i)]            // plane-local → global
  const poly = G.poly.map(pt).join(' ')
  const glyphs = (i, list) => list.map(([id, p, c]) => use(id, p, c)).join('')
  const plane = (i, inner) => `<g class="p${planes[i].n}" transform="translate(0 ${f(Y(i))})"><polygon class="pl" points="${poly}"/>${inner}</g>`
  // L1: PC-3 (ink) and two faint PCs fan into the switch (4 occupied ports), then switch → router → ISP; portal faint
  const L1 = plane(0,
    `<path class="w" d="${line(o1, N[1])}${line(o2, N[1])}${line(N[0], N[1], N[2], N[3])}"/>` +
    `<path class="w f" d="${line(N[3], N[4])}"/>` +
    `<path class="t t1" d="${line(add(N[0], 7), add(N[1], -12))}"/>` +
    glyphs(0, [['pc', o1, 'f'], ['pc', o2, 'f'], ['pc', N[0]], ['sw', N[1]], ['rt', N[2]], ['cl', N[3]], ['sv', N[4], 'f']]))
  // L2: switch in ink. ARP request: broadcast fan from the switch to its 3 other occupied ports; reply: unicast router → PC-3
  const L2 = plane(1,
    `<path class="w" d="${line(o1, N[1])}${line(o2, N[1])}${line(N[0], N[1], N[2])}"/>` +
    `<path class="w f" d="${line(N[2], N[3], N[4])}"/>` +
    `<path class="t t2" d="${line(add(N[2], -7), N[1], add(N[0], 8))}"/>` +
    `<g class="a10"><path class="fan" d="${arc(add(N[1], -6, -4), add(o1, 5, 2), -6)}"/>` +
    `<path class="fan" d="${arc(add(N[1], -8, 4), add(o2, 7, -2), 6)}"/>` +
    `<path class="fan" d="${arc(add(N[1], 12, -4), add(N[2], -5, -5), 9)}"/></g>` +
    glyphs(1, [['pc', o1, 'f'], ['pc', o2, 'f'], ['pc', N[0]], ['sw', N[1]], ['rt', N[2]], ['cl', N[3], 'f'], ['sv', N[4], 'f']]))
  // L3: the switch is faint (not a hop). Route PC-3 → router → ISP → portal by address
  const L3 = plane(2,
    `<path class="w f" d="${line(N[0], N[1], N[2], N[3], N[4])}"/>` +
    `<path class="t t3" d="${line(add(N[0], 7), N[1], N[2], N[3], add(N[4], -8))}"/>` +
    glyphs(2, [['pc', N[0]], ['sw', N[1], 'f'], ['rt', N[2]], ['cl', N[3]], ['sv', N[4]]]))
  // L7: router and ISP faint (ink after the fix). Trace: dashed fail arrow to the retired server box at .10.
  // Fix: solid path PC-3 → router (DNS forwarder) → ISP resolver.
  const fa0 = add(N[0], 9, -5), fa1 = add(ghost, -9, -1), fx1 = add(N[3], -13)
  const L7 = plane(3,
    `<path class="w f" d="${line(N[0], N[2], N[3])}"/>` +
    `<path class="fx" d="${line(add(N[0], 7), N[2], fx1)}"/><path class="fx fxh" d="${head(fx1, 0)}"/>` +
    glyphs(3, [['pc', N[0]], ['rt', N[2], 'f f7'], ['cl', N[3], 'f f7']]) +
    `<g class="a18"><path class="fa" d="${line(fa0, fa1)}"/><path class="fh" d="${head(fa1, Math.atan2(fa1[1] - fa0[1], fa1[0] - fa0[0]))}"/>` +
    `<rect class="rb" x="${f(ghost[0] - 6)}" y="${f(ghost[1] - 8)}" width="12" height="15"/></g>`)
  // probe: dotted, up PC-3's column, revealed through a mask (pathLength 1) so the dots never move
  const pr = [0, 1, 2].map((i) => [gl(i, add(N[0], 0, -10)), gl(i + 1, add(N[0], 0, 5))])
  const mask = `<defs><mask id="it-m${v}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">` +
    pr.map(([a, b], i) => `<path class="pm m${i + 1}" pathLength="1" d="${line(a, b)}"/>`).join('') + '</mask></defs>'
  const svg = `<svg class="sm v${v}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${K.alt}">${mask}${L1}${L2}${L3}${L7}` +
    `<path class="pr" mask="url(#it-m${v})" d="${pr.map(([a, b]) => line(a, b)).join('')}"/></svg>`
  // overlay marks (global coords), one small SVG per intro group and variant
  const ov = (body) => `<svg class="ov v${v}" viewBox="0 0 ${W} ${H}">${body}</svg>`
  // break mark: the probe jumps from L3 to L7 (TCP/IP has no layers 5 and 6; UDP 53 is L4), so the two ticks cross the
  // probe in the free gap BETWEEN the L7 front edge and the L3 back edge (above the L3 name row), never on a plane
  const brk = [N[0][0], Y(3) + (v === 'n' ? 14 : 11.5)]
  const marks = {
    a8: ov(`<circle class="led" cx="${f(N[0][0] + 10)}" cy="${f(Y(0) + N[0][1])}" r="3"/><circle class="led" cx="${f(N[1][0] - 15)}" cy="${f(Y(0) + N[1][1])}" r="3"/>`),
    a12: ov(`<path class="ah" d="${head(gl(1, add(N[0], 8)), Math.PI)}"/>`),
    a15: ov(`<path class="ah" d="${head(gl(2, add(N[4], -8)), 0)}"/><path class="bk" d="M${pt(add(brk, -3, 3.25))}l6-3M${pt(add(brk, -3, -0.25))}l6-3"/>`),
  }
  // label anchors (global vb units)
  const lab = {
    row: planes.map((p) => p.bandTop + 12), pnX: N[0][0] + 12, sy: G.yTop - (v === 'n' ? 13 : 18), cn: G.yBot + 12,
    cx: N.map((p) => p[0]), brk: [N[0][0] - 7, brk[1]], ip3: [N[4][0] + 6, Y(2) - 7],
    // the transport of the L7 test, on the L7 plane under PC-3's DNS query (left of the plane-name column)
    dq: [N[0][0] + 12, Y(3) - (v === 'n' ? 13 : 14)],
    rb: [ghost[0] + 10, Y(3) + ghost[1] - 5.5], fe: [G.xr - 4, Y(3) - 7],
  }
  return { svg, marks, lab, G }
}

export default async function gen({ facts }) {
  const k = facts['it.key'], L = layers(k), Wd = words(k)
  const K = {
    alt: `Simulated fault trace on a small-office network, tested bottom up. Layer 1: link light, ${k.speed}, pass. ` +
      `Layer 2: gateway MAC found, pass. Layer 3: ping by address ${k.target}, ${Wd.rt}, pass. ` +
      `Layer 7: name lookup of ${k.name}, no answer; PC-3 still asks ${k.cause}, a retired server.`,
  }
  const R = variant(360, 450, 'r', K), Nn = variant(360, 480, 'n', K)
  const a = R.lab, b = Nn.lab
  // a label: class, regular [x, y], narrow [x, y], html. x omitted (null) for labels right-aligned at 12 px from the edge
  const lbl = (cls, ra, na, html) => {
    const st = []
    if (ra[0] != null) st.push(`--x:${f(ra[0])}`)
    st.push(`--y:${f(ra[1])}`)
    if (na[0] != null && f(na[0]) !== f(ra[0])) st.push(`--xn:${f(na[0])}`)
    if (f(na[1]) !== f(ra[1])) st.push(`--yn:${f(na[1])}`)
    return `<span class="l ${cls}" style="${st.join(';')}">${html}</span>`
  }
  const row = (i) => [[null, a.row[i]], [null, b.row[i]]]
  const ok = '{{icon:check}}', no = '{{icon:cross}}'
  const val = (i, html) => lbl('r v' + L[i].n, ...row(i), html)
  const html =
    DEFS + R.svg + Nn.svg +
    '<div class="lb" aria-hidden="true">' +
    // #5 plane names + their test names (the documented model)
    '<div class="g a5">' + L.map((t, i) => lbl('pn', [a.pnX, a.row[i]], [b.pnX, b.row[i]], t.name) + lbl('tn tn' + t.n, ...row(i), t.test)).join('') + '</div>' +
    // model state: every test reads "not run"
    '<div class="g mo">' + L.map((t, i) => lbl('r nr', ...row(i), 'not run')).join('') + '</div>' +
    // #6 symptom (narrow: short form)
    lbl('a6 sy', [12, a.sy], [12, b.sy], '<b>SYMPTOM</b> <span class="wr">PC-3: “internet is down” · others fine</span><span class="wn">PC-3 “internet down”</span>') +
    // #8 L1 marks: 2 LEDs + check + speed
    `<div class="g a8">${R.marks.a8}${Nn.marks.a8}${val(0, `<b class="ok">${L[0].val}</b>${ok}`)}</div>` +
    // #12 L2 marks: reply arrowhead + check + found
    `<div class="g a12">${R.marks.a12}${Nn.marks.a12}${val(1, `<b class="ok">${L[1].val}</b>${ok}`)}</div>` +
    // #15 L3 marks: arrowhead + check + 18 ms (fine-pointer hover: raw echoes) + break mark (ticks + L4–6, in the L3–L7 gap,
    // left of the probe) + the pinged address
    `<div class="g a15">${R.marks.a15}${Nn.marks.a15}${val(2, `<b class="ok x" data-raw="${Wd.raw}">${L[2].val}</b>${ok}`)}` +
    lbl('e bk', a.brk, b.brk, 'L4–6') + lbl('e ip', a.ip3, b.ip3, k.target) + '</div>' +
    // #19 L7 marks: cross + no answer (fix: check + answered)
    `<div class="g a19">${val(3, `<span class="tr"><b class="bad">${L[3].val}</b>${no}</span><span class="fx"><b class="ok">${L[3].fix}</b>${ok}</span>`)}</div>` +
    // #20 retired-box label + front edge (fix: not used; = target in the accent) + the query's transport, DNS · UDP 53 (trace)
    `<div class="g a20">${lbl('dq', a.dq, b.dq, 'DNS · UDP 53')}${lbl('rb', a.rb, b.rb, `<span class="tr bad">${k.cause}<span class="sx"> · retired</span></span><span class="fx">${k.cause}<span class="sx"> · not used</span></span>`)}` +
    lbl('e fe', a.fe, b.fe, `<span class="tr">${k.name} = ?</span><span class="fx ok"><span class="sx">${k.name}&nbsp;</span>= ${k.target}</span>`) + '</div>' +
    // column names under the stack
    '<div class="g cn">' + ['PC-3', 'SWITCH', 'ROUTER', 'ISP', '<span class="wr">PORTAL</span><span class="wn">WEB</span>'].map((t, j) =>
      lbl(j === 0 ? '' : j === 4 ? 'e' : 'm', [a.cx[j] + (j === 0 ? -7 : j === 4 ? 7 : 0), a.cn], [b.cx[j] + (j === 0 ? -7 : j === 4 ? 7 : 0), b.cn], t)).join('') + '</div>' +
    '</div>'
  return [{ marker: 'f7', html }]
}

