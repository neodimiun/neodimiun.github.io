// Side project asserts, run by data/facts.assert.mjs on every build. Every number Fig. 9 and its copy show (facts.json
// "sing.*": the omega point, its days, the 50 % range, the counts, the open gap, the fit) is recomputed here from
// data/snapshot.json, twice: once by singularity.model.mjs (the port of the tracker's chart code) and once by the
// independent arithmetic below. The snapshot itself is checked against the tracker's own rules (the wait rule, the open
// gap, the latest refit), and the chapter's files against the copy rules.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { factsOf, model, fmt, lsq as lsqFit } from './singularity.model.mjs'
import gen from './tools/plot.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const DAY = 864e5, ms = (iso) => Date.parse(`${iso}T00:00:00Z`), iso = (t) => new Date(t).toISOString().slice(0, 10)

export default async function (facts, { eq, ok }) {
  const S = JSON.parse(readFileSync(join(HERE, 'data/snapshot.json'), 'utf8'))
  const M = model(S), F = factsOf(S), L = S.lists.v3, rows = L.rows
  // ---- provenance: a dated copy of the tracker's public main_chart.json, nothing internal
  ok('sing: provenance names the tracker revision and the built file', /^fabreu08\/singularity-tracker@[0-9a-f]{7,40} site\/build\.py -> dist\/data\/main_chart\.json$/.test(S.provenance.source), S.provenance.source)
  ok('sing: provenance sha256 is 64 hex', /^[0-9a-f]{64}$/.test(S.provenance.sha256))
  eq('sing: provenance as_of = snapshot as_of', S.provenance.as_of, S.as_of)
  ok('sing: no notes, paths or source strings vendored', !/"(source|note|date_note|estimate|input|src)"\s*:/.test(JSON.stringify({ ...S, provenance: null })))
  // ---- the snapshot against the tracker's rules
  eq('sing: Kurzweil 2005 table has 22 rows', S.kurzweil.rows.length, 22)
  eq('sing: 8 key milestones labelled', S.kurzweil.rows.filter((r) => r.key).map((r) => r.label).join(', '), 'Life, Cambrian, Homo sapiens, Agriculture, Writing, wheel, Printing, Computer, Personal computer')
  ok('sing: Kurzweil rows run oldest first, each wait shorter than the time before', S.kurzweil.rows.every((r, i, a) => (!i || r.years_before_today < a[i - 1].years_before_today) && r.time_to_next_event_years < r.years_before_today))
  ok('sing: picks sorted by date', rows.every((r, i) => !i || r.date >= rows[i - 1].date))
  const dates = [...new Set(rows.map((r) => r.date))]
  ok('sing: wait = days to the next distinct release date (every closed row)', rows.every((r) => { const nx = dates.find((d) => d > r.date); return nx ? r.gap_to_next_days === (ms(nx) - ms(r.date)) / DAY : r.gap_to_next_days == null }))
  eq('sing: the open gap = as-of − last release, days', L.open_days_at_today, (ms(S.as_of) - ms(rows[rows.length - 1].date)) / DAY)
  ok('sing: the open gap is a lower bound', L.open_gap_is_lower_bound === true)
  const refits = [...S.omega.refits].sort((a, b) => (a.refit_date < b.refit_date ? -1 : 1)), last = refits[refits.length - 1]
  ok('sing: the latest refit is on or before the snapshot and not pinned', last.refit_date <= S.as_of && last.pinned === 'none', last)
  ok('sing: every refit is badged backtest or live refit; the latest is live', refits.every((x) => x.kind === 'backtest' || x.kind === 'live_refit') && last.kind === 'live_refit', refits.map((x) => x.kind))
  ok('sing: the list was fixed after its fixed rows and on or before the snapshot', rows.filter((x) => x.frozen).every((x) => x.date <= L.frozen_on) && L.frozen_on <= S.as_of, L.frozen_on)
  // ---- facts = the model, key by key (tools/snapshot.mjs writes them; a stale copy fails here)
  for (const [k, v] of Object.entries(F)) eq(`sing: facts ${k} = recomputed from snapshot.json`, JSON.stringify(facts[k]), JSON.stringify(v))
  // ---- independent arithmetic
  const o = facts['sing.omega'], r = facts['sing.range'], a = facts['sing.asof'], d = facts['sing.data']
  eq('sing: omega = the latest refit\'s named date', o.iso, last.point)
  eq('sing: omega date as shown', o.value, fmt(last.point))
  eq('sing: days from the snapshot to the omega point', a.days, String((ms(last.point) - ms(S.as_of)) / DAY))
  eq('sing: readout days = omega days', a.days, o.days)
  const tl = rows.filter((x) => x.frozen && x.date <= last.refit_date).map((x) => x.date).sort().pop()
  const R = (ms(last.point) - ms(tl)) / DAY
  eq('sing: range tl = last frozen release on or before the refit day', r.tl, fmt(tl))
  eq('sing: range R = omega − tl', r.R, String(R))
  eq('sing: range low = tl + round(R × lower)', r.lo, fmt(iso(ms(tl) + Math.round(R * S.band50.lower_mult) * DAY)))
  eq('sing: range high = tl + round(R × upper)', r.hi, fmt(iso(ms(tl) + Math.round(R * S.band50.upper_mult) * DAY)))
  eq('sing: range shown', r.value, `${r.lo} – ${r.hi}`)
  ok('sing: the range brackets the omega point', ms(tl) + Math.round(R * S.band50.lower_mult) * DAY < ms(last.point) && ms(last.point) < ms(tl) + Math.round(R * S.band50.upper_mult) * DAY)
  eq('sing: as-of shown', a.value, fmt(S.as_of))
  eq('sing: counts 22 + picks', `${d.kurzweil} + ${d.picks}`, `${S.kurzweil.rows.length} + ${rows.length}`)
  eq('sing: frozen + added = picks', +d.frozen + +d.added, rows.length)
  eq('sing: the fit reads the waits between frozen release dates', +d.waits, new Set(rows.filter((x) => x.frozen).map((x) => x.date)).size - 1)
  eq('sing: fit points = Kurzweil rows + frozen waits', +d.n, S.kurzweil.rows.length + +d.waits)
  // the fit again, by Cramer's rule on the raw (uncentred) normal equations
  const fr = [...new Set(rows.filter((x) => x.frozen).map((x) => x.date))].sort(), tsD = (ms(last.point) - ms(S.as_of)) / DAY
  const pts = S.kurzweil.rows.map((x) => [-x.years_before_today * 365.2425, x.time_to_next_event_years * 365.2425])
    .concat(fr.slice(0, -1).map((x, i) => [(ms(x) - ms(S.as_of)) / DAY, (ms(fr[i + 1]) - ms(x)) / DAY]))
  const X = pts.map(([dd]) => Math.log(tsD - dd)), Y = pts.map(([, g]) => Math.log(g))
  const s = (f) => X.reduce((q, x, i) => q + f(x, Y[i]), 0)
  const m3 = [[pts.length, s((x) => x), s((x) => x * x)], [s((x) => x), s((x) => x * x), s((x) => x ** 3)], [s((x) => x * x), s((x) => x ** 3), s((x) => x ** 4)]], v3 = [s((x, y) => y), s((x, y) => x * y), s((x, y) => x * x * y)]
  const det = (A) => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
  const col = (j) => m3.map((row, i) => row.map((x, k) => (k === j ? v3[i] : x))), D0 = det(m3)
  const [ca, cb, cc] = [0, 1, 2].map((j) => det(col(j)) / D0)
  ok('sing: the fit is the quadratic (c ≤ 0)', M.fit.quad && cc <= 0, cc)
  ok('sing: model fit = independent fit (a, b, c within 1e-6)', Math.abs(ca - M.fit.a) < 1e-6 && Math.abs(cb - M.fit.b) < 1e-6 && Math.abs(cc - M.fit.c) < 1e-6, [ca, cb, cc])
  eq('sing: fit coefficients shown', [facts['sing.fit'].a, facts['sing.fit'].b, facts['sing.fit'].c].join(' '), [ca.toFixed(3), cb.toFixed(3), cc.toFixed(4)].join(' ').replace(/-/g, '−'))
  ok('sing: the curve falls to under 0.2 day (the zoomed floor) before the omega point', M.fit.g(tsD - 1) < 0.2 && M.fit.g(0) > M.fit.g(tsD / 2))
  // Methods: the named date is where the curve fits best once the open wait since the last fixed-list release (a lower
  // bound up to the refit day) also counts, as the tracker's censored refit does (quadfit.py: the open gap adds a residual
  // only while the curve predicts a shorter wait). Scanned here over whole days, then to 0.05 day around the best; the
  // tracker's own grid is not whole days, so the best must round to within a day of the named date
  const cg = (ms(last.refit_date) - ms(tl)) / DAY, cu = (ms(tl) - ms(S.as_of)) / DAY
  eq('sing: the censored open wait = refit day − last fixed-list release', facts['sing.omega'].open, String(cg))
  const sseAt = (ts) => {
    const xs = X.map((_, i) => Math.log(ts - pts[i][0])), uc = Math.log(ts - cu), lc = Math.log(cg)
    const fit = (inc) => { const xx = inc ? xs.concat([uc]) : xs, yy = inc ? Y.concat([lc]) : Y, q = M.fit.quad ? lsqFit(xx, yy, 2) : null; return q && q[2] <= 0 ? q : lsqFit(xx, yy, 1) }
    let inc = false, q = fit(false)
    for (let it = 0; it < 30; it++) { const ni = q[0] + q[1] * uc + q[2] * uc * uc < lc; if (ni === inc) break; inc = ni; q = fit(inc) }
    const pc = q[0] + q[1] * uc + q[2] * uc * uc
    return xs.reduce((a, x, i) => a + (Y[i] - q[0] - q[1] * x - q[2] * x * x) ** 2, 0) + Math.max(0, lc - pc) ** 2
  }
  let best = 1, bs = Infinity
  for (let dd = 1; dd <= 3000; dd++) { const v = sseAt(dd); if (v < bs) { bs = v; best = dd } }
  for (let dd = best - 1; dd <= best + 1; dd += 0.05) { const v = sseAt(dd); if (v < bs) { bs = v; best = dd } }
  ok('sing: the named date is where the curve fits best with the open wait counted (within a day)', Math.abs(best - tsD) <= 1, best.toFixed(2))
  // the readout's one days-count (the tracker's rule): the days to the date at the snapshot beside the same count at the
  // refit before the latest
  const pv = refits[refits.length - 2]
  eq('sing: previous refit\'s count = its date − its refit day', a.prevDays, String((ms(pv.point) - ms(pv.refit_date)) / DAY))
  eq('sing: previous refit day as shown', a.prevRefit, fmt(pv.refit_date).replace(/, \d{4}$/, ''))
  ok('sing: the previous refit is not pinned', pv.pinned === 'none')
  // the caveats the figure carries, from the tracker's own data: the AI-only fit at the latest refit names no bounded date,
  // the series' status label says so, and on the held-out waits the plain exponential beats the curve
  ok('sing: AI models alone give no near-term date (the latest AI-only fit is unbounded or pinned)', last.ai_only && (last.ai_only.bounded === false || last.ai_only.pinned !== 'none'), last.ai_only)
  ok('sing: the status label says the AI-only fit gives no near-term date', /AI-only fit gives no near-term date/.test(S.verdict.label), S.verdict.label)
  eq('sing: status label quoted', facts['sing.verdict'].value, S.verdict.label)
  ok('sing: on the held-out waits the plain exponential scores better than the curve', S.heldout.better === 'plain_exponential' && S.heldout.plain_exponential < S.heldout.quadratic, S.heldout)
  eq('sing: held-out numbers shown', [facts['sing.heldout'].n, facts['sing.heldout'].exp, facts['sing.heldout'].quad].join(' '), [S.heldout.n, S.heldout.plain_exponential.toFixed(3), S.heldout.quadratic.toFixed(3)].join(' '))
  eq('sing: the range is calibrated on the held-out errors (n)', facts['sing.range'].n, String(S.band50.n))

  // ---- the chapter's files
  const html = readFileSync(join(HERE, 'chapter.html'), 'utf8')
  const gens = await gen({ facts, root: HERE })
  for (const { marker, html: g } of gens) {
    const mm = html.match(new RegExp(`<!--gen:${marker}:start-->([^]*?)<!--gen:${marker}:end-->`))
    ok(`sing: generated ${marker} markup is current (node build.mjs --gen --chapter singularity)`, !!mm && mm[1] === g)
  }
  const g9 = gens[0].html
  const nDots = (cls) => ((g9.match(new RegExp(`<path class="${cls}"[^>]* d="([^"]*)"`, 'g')) || []).map((p) => (p.match(/h0/g) || []).length))
  eq('sing: dots drawn: all history (closed picks), zoomed (closed picks)', nDots('pk').join(' '), `${M.counts.closed} ${M.counts.closed}`)
  eq('sing: Kurzweil rings drawn', (g9.match(/id="f9k" d="([^"]*)"/)[1].match(/h0/g) || []).length, 22)
  eq('sing: open gap drawn hollow in both views', (g9.match(/<g class="pk op"/g) || []).length, 2)
  const text = html.replace(/<!--gen:(\w+):start-->[^]*?<!--gen:\1:end-->/g, '').replace(/<!--[^]*?-->/g, '') // the copy, without generated markup
  const typed = text.replace(/\{\{[^}]*\}\}/g, '').match(/\b(41|22|39|38|60|31|15|11|172|169|187|2027|2028)\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d/)
  ok('sing: every number in the copy is a placeholder (no typed dates or counts)', !typed, typed && typed[0])
  ok('sing: "intelligence explosion" stays in chapter 06 only', !/intelligence explosion/i.test(text))
  ok('sing: never "simulated" (real data)', !/simulated/i.test(text))
  ok('sing: "A fitted estimate, not a forecast" under the readout and in Methods', (text.match(/A fitted estimate, not a forecast\./g) || []).length === 2)
  ok('sing: the line under the readout says AI models alone give no near-term date', /<p class="fe">A fitted estimate, not a forecast\. AI models alone give no near-term date; the date comes from adding Kurzweil's milestones\.<\/p>/.test(text))
  ok('sing: Methods quotes the status label, the held-out result and the censored open wait', text.includes('{{fact:sing.verdict}}') && text.includes('{{fact:sing.heldout.exp}}') && text.includes('{{fact:sing.omega.open}}'))
  ok('sing: no countdown ("to go", "left", "remaining") and no pass style on a fitted value', !/\b(to go|days left|remaining)\b/i.test(text.replace(/days left to the omega point/, '')) && !/class="status is-true"/.test(text))
  ok('sing: no claim that ASI arrives on the date', !/\b(will|guarantee|certain|predicts?)\b/i.test(text.replace(/<template>[^]*?<\/template>/, '')))
  ok('sing: title, kicker and link as specified', text.includes('<h2 id="sing-t">When does the wait hit zero?</h2>') && text.includes('<span class="no">Side project</span> <span class="yrs">· 2026–</span>') && text.includes('Visit singularity.joseqc.com {{icon:arrow-ne}}'))
  ok('sing: credits (Kurzweil 2005, Geogristle on X)', /Kurzweil[^]*2005/.test(text) && text.includes('Geogristle (@geogristle) on X'))
  ok('sing: US spelling', !/colour|analys(e|ed|ing)\b|centre/i.test(text.replace(/<!--[^]*?-->/g, '')))
  const bridge = readFileSync(join(HERE, '../06-data-integrity/chapter.html'), 'utf8').match(/<p class="bridge">([^<]*)<\/p>/)
  eq('sing: chapter 06 bridges to the side project', bridge && bridge[1], 'How close is recursive self-improvement? I refit that every week.')
}
