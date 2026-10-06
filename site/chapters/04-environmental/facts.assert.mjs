// Chapter 04 asserts (Team ENV), run by data/facts.assert.mjs on every build. SPEC-C §7.3 / §7.4 / §14 items 7, 8, 21.
// Every number Fig. 6 shows (readout panels, calc lines, in-plot labels, live sentences, hover reading, methods) is recomputed
// here from chromatogram.model.mjs and compared with facts.json and with the strings in this chapter's own files.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as M from './chromatogram.model.mjs'
import gen from './tools/paths.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
// {{fact:env.key.cal.m}} → facts['env.key'].cal.m (fact keys contain a dot)
const lookup = (o, p) => { const key = Object.keys(o).filter((x) => p === x || p.startsWith(x + '.')).sort((a, b) => b.length - a.length)[0]; return key == null ? undefined : p.slice(key.length + 1).split('.').filter(Boolean).reduce((x, k) => (x == null ? undefined : x[k]), o[key]) }

export default async function (facts, { eq, ok }) {
  const k = facts['env.key'], N = M.numbers(), f2 = (x, d) => x.toFixed(d)
  // ---- §7.3 integer arithmetic (areas in thousandths, slope in ten-thousandths, results in hundredths)
  eq('env: sample round((2610 − 7)·1000/7481) = 348', M.hundredths(+k.area), 348)
  eq('env: spike round((4421 − 7)·1000/7481) = 590', M.hundredths(+k.spike.area), 590)
  eq('env: recovery (590 − 348)·1000/250 = 968 tenths of a percent', N.recTenths, 968)
  ok('env: recovery inside 80–120 % (800 ≤ 968 ≤ 1200)', N.recTenths >= 800 && N.recTenths <= 1200)
  ok('env: sample inside the calibrated range (50 ≤ 348 ≤ 1000)', N.s >= 50 && N.s <= 1000)
  for (const [key, want] of [['sample', k.value], ['spike', k.spike.found], ['gap', k.spike.gap], ['added', k.spike.added], ['recovery', k.spike.recovery], ['window', k.window], ['rt', k.rt]]) eq(`env: model ${key} = facts`, N[key], want)
  // ---- the refit (§7.3): five standards with realistic residuals; full precision agrees with the displayed strings
  const F = M.fit()
  eq('env: OLS slope 0.748106 → 0.7481', f2(F.m, 4), k.cal.m)
  eq('env: OLS intercept 0.006997 → 0.007', f2(F.b, 3), k.cal.b)
  ok('env: r = 0.99997 (never displayed; not exactly on the line)', F.r > 0.9999 && F.r < 0.99999, F.r)
  eq('env: model calibration = facts', [f2(M.CAL.m, 4), f2(M.CAL.b, 3)].join(), [k.cal.m, k.cal.b].join())
  eq('env: standards = facts', M.STD_N.join() + '|' + M.STD_AREA.join(), k.cal.levels.join() + '|' + k.cal.areas.join())
  const cs = (A) => (A - +k.cal.b) / +k.cal.m, cf = (A) => (A - F.b) / F.m
  eq('env: sample (2.610 − 0.007)/0.7481 = 3.4795 → 3.48', f2(cs(+k.area), 4), '3.4795')
  eq('env: spike (4.421 − 0.007)/0.7481 = 5.9003 → 5.90', f2(cs(+k.spike.area), 4), '5.9003')
  eq('env: recovery (5.9003 − 3.4795)/2.50 = 96.83 % → 96.8', f2(((cs(+k.spike.area) - cs(+k.area)) / +k.spike.added) * 100, 2), '96.83')
  eq('env: the unrounded fit gives the same strings', [f2(cf(+k.area), 2), f2(cf(+k.spike.area), 2), f2(((cf(+k.spike.area) - cf(+k.area)) / +k.spike.added) * 100, 1)].join(), [k.value, k.spike.found, k.spike.recovery].join())
  eq('env: recovery from the displayed strings', f2(((+k.spike.found - +k.value) / +k.spike.added) * 100, 1), k.spike.recovery)
  eq('env: found gap 5.90 − 3.48', f2(+k.spike.found - +k.value, 2), k.spike.gap)
  eq('env: back-calculated standards', M.STD_AREA.map((a) => f2((a - F.b) / F.m, 3)).join(' '), '0.491 1.007 2.474 5.045 9.984')
  eq('env: residuals against the fit, %', M.STD_AREA.map((a, i) => f2(((a - (F.m * +M.STD_N[i] + F.b)) / (F.m * +M.STD_N[i] + F.b)) * 100, 2)).join(' '), '-1.85 0.65 -1.03 0.89 -0.16')
  eq('env: theory check 0.7481 / 0.7518 = 99.5 %', f2((+k.cal.m / M.THEORY.NO3) * 100, 1) + ' ' + f2(M.THEORY.NO3, 4), '99.5 0.7518')
  // ---- heights, hover, spike growth (H = A / (σ·√2π), σ·√2π = 0.126826 for nitrate)
  eq('env: σ(NO3) = 3.20/√4000', f2(M.sigma(M.RT), 6), '0.050596')
  eq('env: σ·√2π (NO3)', f2(M.sigma(M.RT) * M.SQ2PI, 6), '0.126826')
  eq('env: sample nitrate apex 20.58 µS', f2(N.apex, 2), '20.58')
  eq('env: spike nitrate apex 34.86 µS', f2(N.apexSpike, 2), '34.86')
  eq('env: standard nitrate apexes', M.STD_AREA.map((a) => f2(M.height('NO3', a), 2)).join(' '), '2.95 5.99 14.65 29.81 58.95')
  const sa = M.sampleAreas()
  eq('env: sample Cl / SO4 / F apexes (unchanged)', ['Cl', 'SO4', 'F'].map((id) => f2(M.height(id, sa[id]), 1)).join(' '), '30.4 11.6 3.4')
  eq('env: hover at rest reads the nitrate apex', M.readingText(M.reading(3.2, sa)), '3.20 min · 20.6 µS · Nitrate')
  eq('env: hover snaps within ±0.05 min', M.readingText(M.reading(3.24, sa)), '3.20 min · 20.6 µS · Nitrate')
  ok('env: hover does not snap outside ±0.05 min', M.reading(3.26, sa).name === '' && M.reading(3.14, sa).name === '')
  eq('env: hover on the spiked injection', M.readingText(M.reading(3.2, M.sampleAreas(M.AREA.spike))), '3.20 min · 34.9 µS · Nitrate')
  ok('env: the apex is the maximum of the drawn sample trace near 3.2 min', [3.18, 3.19, 3.21, 3.22].every((t) => M.signal(t, sa) < M.signal(3.2, sa)))
  eq('env: spike scaleY = 2.610 / 4.421', N.scaleY, '0.5904')
  eq('env: same σ, so the height ratio equals the area ratio', f2(N.apex / N.apexSpike, 4), N.scaleY)
  eq('env: Rs(Br/NO3) = 0.3/(2·(0.04585 + 0.05060)) = 1.555 → 1.56', f2(N.rs, 2), '1.56')
  ok('env: Rs ≥ 1.5', N.rs >= 1.5, N.rs)
  const rs = (a, b) => (M.by(b).tR - M.by(a).tR) / (2 * (M.sigma(M.by(a).tR) + M.sigma(M.by(b).tR)))
  eq('env: Rs(Cl/NO2) = 2.56', f2(rs('Cl', 'NO2'), 2), '2.56')
  ok('env: every neighbouring pair resolved (Rs ≥ 1.5)', M.ANIONS.slice(1).every((a, i) => rs(M.ANIONS[i].id, a.id) >= 1.5))
  eq('env: retention window 3.20 ± 3 × 0.017 = 3.149–3.251', `${f2(M.RT - 3 * M.RTSD, 3)}–${f2(M.RT + 3 * M.RTSD, 3)}`, '3.149–3.251')
  ok('env: bromide (2.90 min) is outside the nitrate window', M.by('Br').tR < M.RT - 3 * M.RTSD)
  ok('env: below the MCL (3.48 < 10)', +k.value < +k.mcl && String(M.MCL) === k.mcl)
  ok('env: every drawn sample analyte lies inside its standard range', [...Object.entries(M.SAMPLE), ['NO3', +k.value]].every(([id, c]) => { const a = M.by(id); return c >= a.top * M.LEVELS[0] && c <= a.top }))
  eq('env: zoom transform translate(−1231.25, −184) scale(9, 1.5)', `${M.ZOOM.tx},${M.ZOOM.ty},${M.G.ZX},${M.G.ZY}`, '-1231.25,-184,9,1.5')

  // ---- the chapter's own files carry exactly these numbers
  const css = readFileSync(join(HERE, 'chapter.css'), 'utf8'), html = readFileSync(join(HERE, 'chapter.html'), 'utf8')
  ok('env: CSS zoom = model zoom', css.includes(`translate(${M.ZOOM.tx}px,${M.ZOOM.ty}px) scale(${M.G.ZX},${M.G.ZY})`))
  ok('env: CSS spike scaleY = 0.5904 about the baseline', css.includes(`translateY(${M.G.Y0}px) scaleY(${N.scaleY.replace(/^0/, '')}) translateY(-${M.G.Y0}px)`))
  ok('env: CSS stack offsets = k·(DX, DY)', [1, 2, 3, 4, 5, 6].every((i) => css.includes(`.k${i}{transform:translate(${M.G.DX * i}px,${M.G.DY * i}px)}`)))
  const R = html.replace(/\{\{fact:([\w.]+)\}\}/g, (_, p) => { const v = lookup(facts, p); return v == null ? `{{${p}}}` : typeof v === 'object' ? v.value : String(v) }).replace(/&nbsp;/g, ' ').replace(/\{\{icon:[\w-]+\}\}/g, '').replace(/<[^>]+>/g, '|').replace(/\|+/g, '|')
  const has = (s) => R.includes(s.replace(/&nbsp;/g, ' '))
  const want = [
    // §7.4 readout panels (sample · std · spike) and calc lines, exactly
    '|Nitrate as N|3.48|mg/L|Below MCL 10|', '|Retention|3.20|min|In window|',
    '|(2.610 − 0.007) ÷ 0.7481 = |3.48|', '|fit to 5 standards, 0.50–10.0 mg/L; blank run separately|',
    '|Identity 3.20 in 3.15–3.25 · Amount in range · Spike 96.8 % in 80–120|',
    '|Nitrate as N|3.48|mg/L|In range|', '|Window|3.15–3.25|min|±3 SD|',
    '|Area = 0.7481 × C + 0.007|', '|5 standards, 0.50–10.0 mg/L; blank run separately|', '|Nitrate is identified by time, sized by area|',
    '|Spike recovery|96.8|%|In 80–120 %|', '|Spike found|2.42|mg/L|Of 2.50 added|',
    '|(5.90 − 3.48) ÷ 2.50 = |96.8 %|', '|EPA 300.0 LFM (matrix spike) 80–120 %|', '|the same water with a known addition|',
    // in-plot labels written by the generator
    '|Sample|Blank|0.50|1.00|2.50|5.00|10.0|', '|Fluoride|', '|Chloride|', '|Nitrate|', '|Sulfate|',
    '|Window 3.15–3.25 min|', '|3.48 sample|', '|5.90 spiked|+2.42 found|3.48 sample|', '|Bromide| · |2.90 min|outside window|',
    // methods (§7.2)
    'area = 0.7481 × C + 0.007 (area in µS·min, C in mg/L as N). Sample (2.610 − 0.007) ÷ 0.7481 = 3.48 mg/L. Laboratory fortified sample matrix (LFM, the matrix spike) 2.50 mg/L: found 5.90, (5.90 − 3.48) ÷ 2.50 = 96.8 % (80–120 %). Retention window 3.20 ± 3 SD = 3.15–3.25 min.',
    'nitrate calibrated 0.50–10.0 mg/L as N, fit to 5 standards (blank run separately)', 'Drinking-water MCL 10 mg/L as N (40 CFR 141.62)',
  ]
  for (const s of want) ok(`env: chapter.html shows "${s.replace(/\|/g, ' ').trim().slice(0, 60)}"`, has(s))
  ok('env: data-fact-readout="env.key" sits on the sample panel\'s value', /<div class="p p-smp">[^]*?data-fact-readout="env\.key">\{\{fact:env\.key\}\}</.test(html) && (html.match(/data-fact-readout/g) || []).length === 1)
  ok('env: US spelling in the chapter copy (liter, color, analyzed)', !/litre|colou?r(?<=colour)|analys(e|ed|ing)\b/i.test(html + M.say(k).sample + M.say(k).std + M.say(k).spike))
  ok('env: E. coli is set in italics', /<i>E\.&nbsp;coli<\/i>/.test(html) && !/[^>]E\.(&nbsp;| )coli/.test(html))
  ok('env: standards drift a few thousandths of a minute, inside the window', M.STD_DT.length === 5 && new Set(M.STD_DT).size === 5 && M.STD_DT.every((d) => Math.abs(d) <= 0.006 && Math.abs(d) < 3 * M.RTSD))
  ok('env: "bracket" never appears; "MCL" does (§14 item 21)', !/bracket/i.test(html) && /MCL/.test(html))
  // ---- live sentences, exactly as §7.4
  const S = M.say(k)
  eq('env: live sentence (sample)', S.sample, 'Sample: nitrate as nitrogen 3.48 milligrams per liter, below the drinking-water MCL of 10 milligrams per liter as nitrogen.')
  eq('env: live sentence (std)', S.std, 'Standards: the sample\'s nitrate peak sits inside the calibrated range, 0.50 to 10 milligrams per liter, at 3.20 minutes, inside the nitrate window.')
  eq('env: live sentence (spike)', S.spike, 'Matrix spike: 2.42 of 2.50 milligrams per liter found, 96.8 percent recovery, inside 80 to 120.')
  // ---- the generated drawing in chapter.html is the generator's current output (the full build checks this too)
  const [{ marker, html: g }] = await gen({ facts, root: HERE })
  const m = html.match(new RegExp(`<!--gen:${marker}:start-->([^]*?)<!--gen:${marker}:end-->`))
  ok('env: generated Fig. 6 markup is current (node build.mjs --gen --chapter environmental)', !!m && m[1] === g)
  eq('env: 8 one-minute pen segments', (g.match(/class="seg"/g) || []).length, 8)
  eq('env: six injections behind the sample', (g.match(/class="trk k[1-6]"/g) || []).length, 6)
}
