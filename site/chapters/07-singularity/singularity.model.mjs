// Side project, Fig. 9 "When does the wait hit zero?" — the model (build-time only: tools/plot.mjs, tools/snapshot.mjs and
// facts.assert.mjs import it; the browser never does). Pure functions over data/snapshot.json, a trimmed copy of the data
// singularity.joseqc.com serves. Every rule here is a port of the tracker's own chart code (site/src/main_chart.js at the
// snapshot's revision): the wait rule (picks), the omega point (OMEGA.of), the 50 % range (calBand) and the fit (lsq, fitFor).

export const DAY = 864e5
export const YRD = 365.2425 // days per year, the tracker's YRD
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const isoMs = (iso) => Date.parse(`${iso}T00:00:00Z`)
export const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10)
export const addDays = (iso, n) => isoOf(isoMs(iso) + n * DAY)
export const daysBetween = (a, b) => Math.round((isoMs(b) - isoMs(a)) / DAY)
// "Apr 20, 2027"; short: "Apr 20"
export const fmt = (iso) => { const d = new Date(isoMs(iso)); return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}` }
export const fmtShort = (iso) => { const d = new Date(isoMs(iso)); return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}` }
export const fmtMonth = (iso) => { const d = new Date(isoMs(iso)); return `${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}` }

// least squares of ys on 1, x (and x^2 when deg is 2), x centred for conditioning; [a, b, c] in uncentred x (c = 0 for
// deg 1), or null when the normal equations are singular. Verbatim port of main_chart.js lsq().
export function lsq(xs, ys, deg) {
  const n = xs.length, k = deg + 1, m = xs.reduce((q, v) => q + v, 0) / n
  const A = Array.from({ length: k }, () => new Array(k + 1).fill(0))
  for (let i = 0; i < n; i++) {
    const x = xs[i] - m, pw = [1, x, x * x]
    for (let r = 0; r < k; r++) { for (let q = 0; q < k; q++) A[r][q] += pw[r] * pw[q]; A[r][k] += pw[r] * ys[i] }
  }
  for (let q = 0; q < k; q++) { // Gauss-Jordan with partial pivoting
    let pv = q
    for (let r = q + 1; r < k; r++) if (Math.abs(A[r][q]) > Math.abs(A[pv][q])) pv = r
    if (Math.abs(A[pv][q]) < 1e-12) return null
    ;[A[q], A[pv]] = [A[pv], A[q]]
    for (let r = 0; r < k; r++) if (r !== q) { const f = A[r][q] / A[q][q]; for (let w = q; w <= k; w++) A[r][w] -= f * A[q][w] }
  }
  const v = A.map((row, r) => row[k] / row[r]), b = v[1], c = deg === 2 ? v[2] : 0
  return [v[0] - b * m + c * m * m, b - 2 * c * m, c]
}

// everything Fig. 9 shows, from the snapshot. Days are relative to the as-of date (negative = past), as in the tracker.
export function model(S) {
  const T0 = isoMs(S.as_of), dOf = (iso) => (isoMs(iso) - T0) / DAY
  const L = S.lists.v3
  // Kurzweil's 22 rows: x = time before the as-of date, y = his time to the next event (days)
  const kz = S.kurzweil.rows.map((r) => ({ label: r.label, key: !!r.key, d: -r.years_before_today * YRD, g: r.time_to_next_event_years * YRD }))
  // the picks (main_chart.js picks()): a closed wait is gap_to_next_days (to the next distinct date on the list, display-only
  // rows included); the last row's wait is still open: the days so far, a lower bound
  const picks = [], open = []
  L.rows.forEach((r, i) => {
    const o = { model: r.model, date: r.date, frozen: r.frozen !== false, d: dOf(r.date), g: r.gap_to_next_days }
    if (r.gap_to_next_days != null) { if (o.g > 0) picks.push(o) } else if (i === L.rows.length - 1 && L.open_days_at_today > 0) { o.g = L.open_days_at_today; o.lower = !!L.open_gap_is_lower_bound; open.push(o) }
  })
  // the omega point (OMEGA.of): the latest calendar refit of the list, by refit date; its named date
  const refits = [...S.omega.refits].sort((a, b) => (a.refit_date < b.refit_date ? -1 : a.refit_date > b.refit_date ? 1 : 0))
  const last = refits[refits.length - 1], prevR = refits[refits.length - 2] || null
  const omega = { iso: last.point, refit: last.refit_date, pinned: last.pinned, kind: last.kind, aiOnly: last.ai_only || null, d: dOf(last.point), days: daysBetween(S.as_of, last.point) }
  // the tracker's one days-count rule: the days from the as-of date to the date, next to the same count at the previous
  // refit (its date minus its own refit day)
  const prev = prevR && { refit: prevR.refit_date, point: prevR.point, kind: prevR.kind, pinned: prevR.pinned, days: daysBetween(prevR.refit_date, prevR.point), ago: daysBetween(prevR.refit_date, S.as_of) }
  // the 50 % range (calBand): tl = the list's last FROZEN release on or before the refit day; R = point − tl (days, both at
  // mid-day); lo / hi = tl + round(R × lower_mult / upper_mult) days
  let tl = null
  L.rows.forEach((r) => { if (r.frozen === true && r.date <= last.refit_date && (tl == null || r.date > tl)) tl = r.date })
  // the refit also counts the open wait since that release up to the refit day: a censored lower bound (quadfit.py)
  omega.open = daysBetween(tl, last.refit_date)
  const R = daysBetween(tl, last.point), b = S.band50
  const loN = Math.round(R * b.lower_mult), hiN = Math.round(R * b.upper_mult)
  const range = { tl, R, loN, hiN, lo: addDays(tl, loN), hi: addDays(tl, hiN), lower: b.lower_mult, upper: b.upper_mult, n: b.n }
  // the fit (fitFor): least squares of ln(wait) on u = ln(days left to the omega date) and u^2 over Kurzweil's rows and the
  // closed waits between the FROZEN rows' distinct dates; quadratic when c <= 0, else the straight line
  const ds = [...new Set(L.rows.filter((r) => r.frozen !== false).map((r) => r.date))].sort()
  const fpts = ds.slice(0, -1).map((day, i) => ({ d: dOf(day), g: dOf(ds[i + 1]) - dOf(day) }))
  const xs = [], ys = []
  for (const p of kz.concat(fpts)) { const u = omega.d - p.d; if (!(u > 0) || !(p.g > 0)) continue; xs.push(Math.log(u)); ys.push(Math.log(p.g)) }
  const q2 = lsq(xs, ys, 2), quad = !!q2 && q2[2] <= 0, cf = quad ? q2 : lsq(xs, ys, 1)
  const [fa, fb, fc] = cf
  const fit = { a: fa, b: fb, c: fc, quad, n: xs.length, waits: fpts.length, g: (d) => { const u = Math.log(omega.d - d); return Math.exp(fa + fb * u + fc * u * u) } }
  return {
    asOf: S.as_of, kz, picks, open, omega, prev, range, fit, refits, list: L,
    counts: { kurzweil: kz.length, picks: L.rows.length, frozen: L.rows.filter((r) => r.frozen !== false).length, added: L.rows.filter((r) => r.frozen === false).length, closed: picks.length },
    first: L.rows[0], lastRow: L.rows[L.rows.length - 1],
  }
}

// the facts.json "sing.*" values, exactly as the page prints them (tools/snapshot.mjs writes them; facts.assert.mjs compares)
export function factsOf(S) {
  const M = model(S), f3 = (x) => x.toFixed(3).replace('-', '−'), f4 = (x) => x.toFixed(4).replace('-', '−'), H = S.heldout
  return {
    'sing.omega': { value: fmt(M.omega.iso), iso: M.omega.iso, refit: fmt(M.omega.refit), days: String(M.omega.days), open: String(M.omega.open), label: 'Omega point (fitted)' },
    'sing.range': { value: `${fmt(M.range.lo)} – ${fmt(M.range.hi)}`, lo: fmt(M.range.lo), hi: fmt(M.range.hi), tl: fmt(M.range.tl), R: String(M.range.R), lower: M.range.lower.toFixed(3), upper: M.range.upper.toFixed(3), loN: String(M.range.loN), hiN: String(M.range.hiN), n: String(M.range.n) },
    'sing.asof': { value: fmt(M.asOf), iso: M.asOf, days: String(M.omega.days), prevRefit: fmtShort(M.prev.refit), prevDays: String(M.prev.days) },
    'sing.data': {
      kurzweil: String(M.counts.kurzweil), picks: String(M.counts.picks), frozen: String(M.counts.frozen), added: String(M.counts.added), frozenOn: fmt(M.list.frozen_on),
      waits: String(M.fit.waits), n: String(M.fit.n), open: String(M.open[0] ? M.open[0].g : 0),
      first: fmt(M.first.date), firstModel: M.first.model, last: fmt(M.lastRow.date), lastModel: M.lastRow.model, firstYear: M.first.date.slice(0, 4),
    },
    'sing.fit': { kind: M.fit.quad ? 'quadratic' : 'straight line', a: f3(M.fit.a), b: f3(M.fit.b), c: f4(M.fit.c) },
    'sing.refits': refitText(M.refits),
    // the rolling held-out test (mean |ln(predicted next wait / actual)|, lower is better) and the tracker's own status
    // label for this series, quoted in Methods
    'sing.heldout': { n: String(H.n), exp: H.plain_exponential.toFixed(3), quad: H.quadratic.toFixed(3) },
    'sing.verdict': { value: S.verdict.label },
  }
}

// "a, b, c and d"
const and = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`)
// the refits before the latest as prose: the most recent run of one kind (at most three; the tracker badges each row
// "backtest", refit later with only the releases before its day, or "live refit"), their named dates ("Mar 24, Apr 9 and
// Apr 13, 2027"), their refit days ("Oct 17, 24 and 26, 2026") and the direction the dates moved in up to the latest refit
// ("later" when every one named a later date than the one before)
export function refitText(refits) {
  const yr = (iso) => iso.slice(0, 4), mo = (iso) => iso.slice(0, 7)
  const dates = (l) => {
    const oneYear = l.every((x) => yr(x) === yr(l[0])), oneMonth = oneYear && l.every((x) => mo(x) === mo(l[0]))
    const parts = l.map((x, i) => (oneMonth && i ? String(+x.slice(8)) : fmtShort(x)))
    return oneYear ? `${and(parts)}, ${yr(l[0])}` : and(l.map(fmt))
  }
  const last = refits[refits.length - 1], prev = refits.slice(0, -1), run = []
  for (let i = prev.length - 1; i >= 0 && run.length < 3 && prev[i].kind === prev[prev.length - 1].kind; i--) run.unshift(prev[i])
  const pts = run.concat([last]).map((r) => r.point), up = pts.every((p, i) => !i || p > pts[i - 1]), down = pts.every((p, i) => !i || p < pts[i - 1])
  return { value: dates(run.map((r) => r.point)), refits: dates(run.map((r) => r.refit_date)), n: String(run.length), kind: run[0].kind === 'backtest' ? 'Backtests' : 'Live refits', drift: up ? 'later' : down ? 'earlier' : 'back and forth' }
}
