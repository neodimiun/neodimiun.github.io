// Chapter 03 asserts (Team MICRO), run by data/facts.assert.mjs on every build. SPEC-C §6.3 build asserts plus §14 items 4–6:
// every string Fig. 5 shows is recomputed from the model, the generated layout and the markup, and compared with facts.json.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STUDY, perCoupon, r2, frac, SAY, T, hoursAt } from './disinfectant.model.js'
import gen, { CTRL, TRT, stats, ladderNumbers } from './tools/f5-layout.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

export default async function (facts, { eq, ok }) {
  const k = facts['micro.key']
  const Nc = perCoupon(STUDY.control), Nt = perCoupon(STUDY.treated)
  const lc = Math.log10(Nc), lt = Math.log10(Nt), LR = lc - lt
  const h = (x) => Math.round(x * 100) // integer hundredths
  // ---- arithmetic (§6.3 table)
  eq('micro: model inputs = facts (colonies, dilutions, volumes, criterion)', JSON.stringify([STUDY.control.colonies, STUDY.treated.colonies, STUDY.control.dilution, STUDY.treated.dilution, STUDY.recoveryMl, STUDY.platedMl, STUDY.criterionLog.toFixed(1)]),
    JSON.stringify([k.control.colonies, k.treated.colonies, +k.control.dilution, +k.treated.dilution, k.recoveryMl, k.platedMl, k.criterion]))
  eq('micro: perCoupon(control) = 1,860,000', Nc, 1860000)
  eq('micro: perCoupon(treated) = 130', Nt, 130)
  eq('micro: 186 × 10³ × 10 from the displayed strings', k.control.colonies * 1000 * k.recoveryMl, +k.control.cfu)
  eq('micro: 1.86 × 10⁶ (cfuSci) = cfu', +`${k.control.cfuSci.m}e${k.control.cfuSci.e}`, +k.control.cfu)
  eq('micro: log control 6.27', r2(lc), k.control.log)
  eq('micro: log treated 2.11', r2(lt), k.treated.log)
  eq('micro: r2(lc) − r2(lt) = r2(LR) = 4.16 (hundredths)', h(+k.control.log) - h(+k.treated.log), h(LR))
  eq('micro: LR string', r2(LR), k.value)
  eq('micro: fold toPrecision(2)', (Nc / Nt).toPrecision(2), '1.4e+4')
  eq('micro: "about 14,000-fold" from 1,860,000 / 130', (Math.round(Nc / Nt / 1000) * 1000).toLocaleString('en-US'), k.fold)
  eq('micro: criterion end r2(lc) − 3 = 3.27', ((h(+k.control.log) - 300) / 100).toFixed(2), k.criterionEnd)
  eq('micro: margin 4.16 − 3.0 = 1.16', ((h(+k.value) - h(+k.criterion)) / 100).toFixed(2), '1.16')
  eq('micro: LOD 1 × 10 ÷ 1 = 10 CFU per coupon', String(1 * k.recoveryMl / k.platedMl), k.lod)
  eq('micro: max reportable LR 6.27 − 1.00 = 5.27', ((h(+k.control.log) - h(Math.log10(+k.lod))) / 100).toFixed(2), '5.27')
  eq('micro: tamper note 13 → 3 gives 4.79', r2(Math.log10(1860000) - Math.log10(k.tamper.colonies * k.recoveryMl / k.platedMl)), k.tamper.lr)
  ok('micro: pass (LR ≥ criterion)', +k.value >= +k.criterion)
  // ---- generated layout (§6.4 measured table)
  const C = stats(CTRL), D = stats(TRT)
  eq('micro: control n / surface', `${C.n}/${C.surface}`, '186/56')
  eq('micro: treated n / surface', `${D.n}/${D.surface}`, '13/4')
  eq('micro: control colonies per cohort', C.cohorts.join(' '), '4 11 32 30 42 24 16 27')
  eq('micro: treated colonies per cohort', D.cohorts.join(' '), '0 0 1 2 1 6 1 2')
  eq('micro: control dots per row (cumulative)', C.rows.map((r) => r[2]).join(' '), '7 23 50 81 109 141 161 180 186')
  eq('micro: treated dots per row (cumulative)', D.rows.map((r) => r[2]).join(' '), '3 5 9 10 13')
  ok('micro: every colony within 40.5 mm of its dish centre (as written)', C.extent <= 40.5 && D.extent <= 40.5, `${C.extent.toFixed(2)} / ${D.extent.toFixed(2)}`)
  ok('micro: minimum edge gap ≥ 0.6 mm (as written)', C.minGap >= 0.6 && D.minGap >= 0.6, `${C.minGap.toFixed(3)} / ${D.minGap.toFixed(3)}`)
  ok('micro: every count dot sits inside its colony', C.dotInside && D.dotInside)
  ok('micro: dot radius 0.24–0.42 mm', C.dotMin >= 0.23 && Math.max(C.dotMax, D.dotMax) <= 0.42)
  // ---- the clock and the intro (§6.1 item 1, §14 item 6)
  eq('micro: methods "about 14 h" = first cohort start 270 ms of 1400 = 72 h', String(hoursAt(T.GROW0)), k.clockFirst)
  eq('micro: methods "about 41 h" = last colony start in the layout', String(hoursAt(Math.max(C.lastStart, D.lastStart))), k.clockLast)
  ok('micro: last colony start < 1400 ms (all grown before "72 h")', Math.max(C.lastStart, D.lastStart) < T.INCUBATED)
  ok('micro: last cohort ends ≤ 1400 ms', T.GROW0 + 7 * T.COHORT + T.GROW_DUR <= 1400, T.GROW0 + 7 * T.COHORT + T.GROW_DUR)
  const lastRow = (S) => T.COUNT0 + (S.rows.at(-1)[2] - S.rows.at(-1)[1]) / S.n * T.COUNT_SPAN + T.ROW_DUR
  ok('micro: last dot row ends ≤ 2700 ms', Math.max(lastRow(C), lastRow(D)) <= 2700, Math.max(lastRow(C), lastRow(D)))
  eq('micro: clock steps 12 … 72 h', T.CLOCK.map((ms) => 12 * Math.round(hoursAt(ms) / 12)).join(' '), '12 24 36 48 60 72')
  const nonEmpty = (S) => S.cohorts.filter(Boolean).length
  eq('micro: 32 intro animations (cohorts + dot rows + 3 fades + 1 bar)', nonEmpty(C) + nonEmpty(D) + C.rows.length + D.rows.length + 4, 32)
  ok('micro: intro ends ≤ 3.6 s', T.BAR_DELAY + T.BAR_DUR <= 3600 && T.AFTER + 2 * T.AFTER_STAGGER + T.AFTER_DUR <= T.END)
  // ---- the ladder: x(v) = 20 + v·(w − 40)/7; §6.5 gives x at inner width 334
  const L = ladderNumbers(facts), at = (f, w) => 20 + f * (w - 40)
  ok('micro: ladder ends at 334 px = 283.3 / 157.3 / 108.6 (±0.5)', Math.abs(at(L.fC, 334) - 283.3) <= 0.5 && Math.abs(at(L.fE, 334) - 157.3) <= 0.5 && Math.abs(at(L.fD, 334) - 108.6) <= 0.5)
  eq('micro: ladder fractions from facts', [L.fC, L.fD, L.fE].map((f) => f.toFixed(5)).join(' '), [frac(6.27), frac(2.11), frac(3.27)].map((f) => f.toFixed(5)).join(' '))
  eq('micro: hover readings (unrounded)', Object.values(L.tips).join(' | '), 'log 6.2695 | log 2.1139 | LR 4.1556 | criterion end 3.27')
  // ---- the live sentences carry the facts
  ok('micro: counted sentence carries 186, 1 in 1,000, 1.86 million, 13, 130, 4.16, 3.0',
    [`Control ${k.control.colonies} colonies at 1 in 1,000`, `${k.control.cfuSci.m} million CFU per coupon`, `Disinfected ${k.treated.colonies} colonies undiluted, ${k.treated.cfu} CFU per coupon`, `Log reduction ${k.value}; criterion ${k.criterion}; pass.`].every((s) => SAY.counted.includes(s)))
  // ---- markup: generated regions current, node counts, strings authored outside placeholders
  const html = readFileSync(join(HERE, 'chapter.html'), 'utf8')
  // node counts on the generator's output (the build itself fails a full build whose committed regions are stale)
  const out = Object.fromEntries((await gen({ facts, root: HERE })).map((x) => [x.marker, x.html]))
  ok('micro: chapter.html has the f5c / f5t / f5l markers', ['f5c', 'f5t', 'f5l'].every((m) => html.includes(`<!--gen:${m}:start-->`)))
  const nodes = (svg, grp) => ((svg.match(new RegExp(`<g class="${grp}">([\\s\\S]*?)</g></g>`)) || [])[1] || '').match(/<(circle|ellipse)\b/g)?.length || 0
  eq('micro: control colony / dot nodes', `${nodes(out.f5c, 'gc')}/${nodes(out.f5c, 'gm')}`, '186/186')
  eq('micro: treated colony / dot nodes', `${nodes(out.f5t, 'gc')}/${nodes(out.f5t, 'gm')}`, '13/13')
  ok('micro: SVG nodes ≤ 600', (out.f5c + out.f5t + out.f5l).match(/<(?!\/)[a-z]/gi).length <= 600)
  ok('micro: readout hover reads "LR 4.1556"', html.includes(`<span class="tip">${L.tips.lr}</span>`))
  ok('micro: methods: about 14 h, about 41 h, 4.79, 5.27', ['about {{fact:micro.key.clockFirst}} h', 'about {{fact:micro.key.clockLast}} h', '{{fact:micro.key.tamper.lr}}', 'more than 5.27'].every((s) => html.includes(s)))
  ok('micro: methods say "not an employer result"', html.includes('Simulated, not an employer result.'))
  ok('micro: "required" never appears in chapter 03', !/required/i.test(html))
  ok('micro: body credits the study "from execution through the co-authored report"', html.includes('carried a facility-wide disinfectant efficacy study from execution through the co-authored report'))
  // ---- typography a microbiologist checks (review round 2): binomials italic and unbroken, unit symbols never uppercased,
  // no headings inside the figure, print copies for every JS-written string
  ok('micro: every "S. aureus" is italic with a no-break space', (html.match(/S\.(?:&nbsp;| )aureus/g) || []).length === 3 && (html.match(/<i(?: class="nt")?>S\.&nbsp;aureus<\/i>/g) || []).length === 3)
  ok('micro: corner and dish units keep their case (h, min) under the uppercase corners', html.includes('<span class="nt">h</span></span><span class="corner bl">') && html.includes('10&nbsp;<span class="nt">min</span>') && html.includes('72&nbsp;<span class="nt">h</span> · not yet counted'))
  ok('micro: no headings inside Fig. 5', !/<h[1-6]\b/.test(html.slice(html.indexOf('<figure'), html.indexOf('</figure>'))))
  ok('micro: print copies (.pf) for the 2 tallies, 2 readout values, the clock and the caption state', (html.match(/class="(?:val |state )?pf"/g) || []).length === 6)
  ok('micro: table row 1,860,000 = cfu', html.includes(`<td>${(+k.control.cfu).toLocaleString('en-US')}</td>`))
}
