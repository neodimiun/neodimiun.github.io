// Declared generator (chapter.json "generators"): Fig. 4 "Calibration, checked" (SPEC-C §5.3), ported from Path A's
// a/tools/figs.mjs. Writes the SVG geometry and the DOM labels (A6: in-plot text is DOM, placed in % of the 400 × 248
// drawing box from the same model as the geometry) between <!--gen:cal:start--> and <!--gen:cal:end--> in this chapter's
// chapter.html. Pure and deterministic. Every number it prints is computed from calibration.model.js and must equal
// facts.json (chem.cal), or the build fails here.
//
// Layers, bottom to top (so the intro needs exactly 8 animations, §5.3):
//   svg (first)  grid, axes, ticks, the fit line (the only dash path), the five standards
//   .lbl.base    tick numerals and axis titles (static frame, never hidden)
//   div.late     ONE opacity group: its own svg (band + edges, a copy of the fit line across the band so the band's
//                tint never covers the line, the check diamond, the leader) and the check / r / ±10 % labels
import { numbers, STD, CHECK_RESP, CHECK_TRUE, LIM, BOX, X, Y } from '../calibration.model.js'

const p = (v) => String(Math.round(v)) // whole units: ≤ 0.6 px at the largest (×1.16) drawing
const pc = (v, of) => `${(Math.round((v / of) * 1000) / 10).toFixed(1).replace(/\.0$/, '')}%` // 0.1 % of the box: ≤ 0.5 px
const at = (x, y) => `left:${pc(x, BOX.W)};top:${pc(y, BOX.H)}`

export default async function gen({ facts }) {
  const N = numbers()
  const f = facts['chem.cal']
  const want = { rTxt: f.r, foundTxt: f.checkFound, trueTxt: f.checkTrue, recTxt: f.value, limTxt: f.limit }
  for (const [k, v] of Object.entries(want)) if (N[k] !== v) throw new Error(`calibration-svg: ${k} computes "${N[k]}" but facts.json chem.cal says "${v}"`)
  if (!N.pass) throw new Error('calibration-svg: the check standard does not pass')
  if (!N.backCalc.every((x) => Math.abs(x - 100) <= LIM)) throw new Error('calibration-svg: a standard back-calculates outside the window')
  const { L, R, T, B, W, H } = BOX
  const bx = X(CHECK_TRUE), cy = Y(CHECK_RESP)
  if (!(m3(N, CHECK_TRUE + 0.3) > N.lo + 0.03)) throw new Error('calibration-svg: the ±10 % label would touch the fit line')

  // ---- base geometry
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="cal-t">`
  s += `<title id="cal-t">Calibration line through five standards, correlation r = ${N.rTxt}. An independent check standard of ${N.trueTxt} mg/L reads ${N.foundTxt} mg/L, a recovery of ${N.recTxt} percent, inside its plus or minus ${LIM} percent band: pass. Simulated data.</title>`
  s += `<path class="grid" d="${[0.1, 0.2, 0.3, 0.4, 0.5].map((v) => `M${L} ${p(Y(v))}H${R}`).join('')}"/>`
  s += `<path class="axis" d="M${L} ${T}V${B}H${R}`
  for (const v of [0, 1, 2, 3, 4, 5]) s += `M${p(X(v))} ${B}v4`
  s += `"/>`
  // regression line across the calibrated range only (no extrapolation past the lowest and highest standard)
  const x0 = STD[0][0], x1 = STD[STD.length - 1][0]
  const fitD = `M${p(X(x0))} ${p(Y(m3(N, x0)))}L${p(X(x1))} ${p(Y(m3(N, x1)))}`
  s += `<path class="fit" d="${fitD}"/>`
  for (const [x, y] of STD) s += `<circle class="pt" cx="${p(X(x))}" cy="${p(Y(y))}" r="3.4"/>`
  s += `</svg>`

  // ---- base labels (anchor point in % of the box; the class says which corner of the label sits on it, offsets in px)
  let lb = ''
  for (const v of [0, 1, 2, 3, 4, 5]) lb += `<span class="pl xt" style="${at(X(v), B)}">${v}</span>`
  for (const v of [0, 0.2, 0.4]) lb += `<span class="pl yt" style="${at(L, Y(v))}">${v.toFixed(1)}</span>`
  lb += `<span class="pl xa" style="${at(R, B)}">concentration, mg/L</span>`
  lb += `<span class="pl ya" style="${at(L, T)}">absorbance</span>`

  // ---- the late group: band, line across it, check, leader, and the three result labels
  const bw = 9
  let g = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`
  g += `<rect class="band" x="${p(bx - bw)}" y="${p(Y(N.hi))}" width="${2 * bw}" height="${p(Y(N.lo) - Y(N.hi))}"/>`
  g += `<path class="bandedge" d="M${p(bx - bw)} ${p(Y(N.hi))}h${2 * bw}M${p(bx - bw)} ${p(Y(N.lo))}h${2 * bw}"/>`
  g += `<path class="fit2" d="M${p(bx - bw)} ${p(Y(m3(N, CHECK_TRUE - bw / ((R - L) / 5.5))))}L${p(bx + bw)} ${p(Y(m3(N, CHECK_TRUE + bw / ((R - L) / 5.5))))}"/>`
  g += `<path class="chk" d="M${p(bx)} ${p(cy - 5)}L${p(bx + 5)} ${p(cy)}L${p(bx)} ${p(cy + 5)}L${p(bx - 5)} ${p(cy)}Z"/>`
  g += `<path class="lead" d="M${p(bx - 13)} ${p(cy - 13)}L${p(bx - 6)} ${p(cy - 5)}"/>`
  g += `</svg>`
  g += `<span class="pl chk-l" style="${at(bx - 13, cy - 13)}"><span>check ${N.trueTxt}</span> <span>{{icon:arrow-r}}${N.foundTxt}</span></span>`
  g += `<span class="pl r-l" style="${at(X(4.5), Y(0.55))}">r = ${N.rTxt}</span>`
  g += `<span class="pl lim-l" style="${at(bx + 12, Y(N.lo) + 7)}">±${LIM}&nbsp;%</span>`

  const html = `${s}${lb}<div class="late">${g}</div>`
  return [{ marker: 'cal', html }]
}

function m3(N, x) { return N.m * x + N.b }
