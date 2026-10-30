#!/usr/bin/env node
// Hand-run (never listed in chapter.json "generators"): refresh Fig. 9's data from a build of the tracker behind
// singularity.joseqc.com. Reads the tracker's built dist/data/main_chart.json (the file the public site serves), keeps
// only what Fig. 9 shows, and writes
//   chapters/07-singularity/data/snapshot.json   the trimmed snapshot + provenance (source revision, sha256 of the input)
//   data/facts.json "sing.*"                       the displayed values, recomputed by singularity.model.mjs
// Then: node build.mjs --gen --chapter singularity (redraws the figure) and npm run build -- --strict.
//
//   node chapters/07-singularity/tools/snapshot.mjs <tracker>/site/dist/data/main_chart.json --rev=<tracker commit> [--dry]
//
// Nothing internal leaves the tracker: no notes, file paths or source strings, only labels, dates, waits, the refits'
// named dates and the 50 % band's two multipliers.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { factsOf, model } from '../singularity.model.mjs'

const HERE = dirname(fileURLToPath(import.meta.url)), CH = join(HERE, '..'), SITE = join(CH, '../..')
const args = process.argv.slice(2), opt = (k) => (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1]
const src = args.find((a) => !a.startsWith('--')), rev = opt('rev'), dry = args.includes('--dry')
if (!src || !rev) { console.error('usage: node chapters/07-singularity/tools/snapshot.mjs <dist>/data/main_chart.json --rev=<tracker commit> [--dry]'); process.exit(2) }
const buf = readFileSync(resolve(src)), D = JSON.parse(buf.toString('utf8'))
const need = (c, m) => { if (!c) { console.error(`snapshot: ${m}`); process.exit(1) } }
need(D.status === 'ok' && D.schema === 'main_chart/1', `unexpected schema ${D.schema}`)
need(D.kurzweil?.status === 'ok' && D.lists?.status === 'ok' && D.track_record?.status === 'ok' && D.card_range?.status === 'ok', 'a section is not ok')
need(D.lists.v3?.kind === 'hand-picked', 'lists.v3 is not the hand-picked list')
need(D.card_range.reference_list === 'v3', 'card_range is not for v3')

const v3 = D.lists.v3
const refits = D.track_record.rows.filter((r) => r.method === 'calendar' && r.list === 'v3')
  .sort((a, b) => (a.refit_date < b.refit_date ? -1 : a.refit_date > b.refit_date ? 1 : 0)).slice(-4)
const b50 = D.card_range.bands['50']
const S = {
  _about: 'Fig. 9 data: a trimmed, dated snapshot of the main chart on singularity.joseqc.com. Written by tools/snapshot.mjs; do not edit by hand.',
  provenance: { source: `fabreu08/singularity-tracker@${rev} site/build.py -> dist/data/main_chart.json`, sha256: createHash('sha256').update(buf).digest('hex'), as_of: D.today },
  as_of: D.today,
  kurzweil: { rows: D.kurzweil.rows.map((r) => ({ label: r.label, years_before_today: r.years_before_today, time_to_next_event_years: r.time_to_next_event_years, key: !!r.key })) },
  lists: { v3: {
    label: v3.label,
    rows: v3.rows.map((r) => ({ model: r.model, date: r.date, frozen: r.frozen !== false, gap_to_next_days: r.gap_to_next_days })),
    open_days_at_today: v3.open_days_at_today, open_gap_is_lower_bound: !!v3.open_gap_is_lower_bound,
  } },
  omega: { list: 'v3', method: 'calendar', refits: refits.map((r) => ({ refit_date: r.refit_date, point: r.point, pinned: r.pinned })) },
  band50: { lower_mult: b50.lower_mult, upper_mult: b50.upper_mult },
}
const M = model(S)
need(M.omega.pinned === 'none', 'the latest refit is pinned to its grid edge: no omega point to show')
need(M.fit.quad, 'the fit is the straight line (c > 0): the copy says quadratic')
const F = factsOf(S)
console.log(`snapshot ${S.as_of} · ${M.counts.kurzweil} + ${M.counts.picks} events · omega ${F['sing.omega'].value} (${F['sing.omega'].days} days) · 50 % ${F['sing.range'].value} · sha256 ${S.provenance.sha256.slice(0, 12)}…`)
if (dry) process.exit(0)
// one row per line: every object without nested objects or arrays is printed on one line
const flat = JSON.stringify(S, null, 1).replace(/\{\n\s*([^{}[\]]*?)\n\s*\}/g, (_, body) => `{ ${body.split(/,\n\s*/).join(', ')} }`)
writeFileSync(join(CH, 'data/snapshot.json'), flat + '\n')
// facts.json is hand-formatted: replace only the "sing.*" lines (one line per key, appended last), leave the rest as it is
const fp = join(SITE, 'data/facts.json')
const lines = readFileSync(fp, 'utf8').replace(/\n$/, '').split('\n').filter((l) => !/^ {2}"sing\.\w+":/.test(l))
const end = lines.lastIndexOf('}')
need(end > 0, 'data/facts.json: no closing brace')
lines[end - 1] = lines[end - 1].replace(/,\s*$/, '') + ','
const one = (k, v) => `  ${(JSON.stringify(k) + ':').padEnd(15)}{ ${Object.entries(v).map(([a, x]) => `${JSON.stringify(a)}:${JSON.stringify(x)}`).join(', ')} }`
lines.splice(end, 0, Object.entries(F).map(([k, v]) => one(k, v)).join(',\n'))
const text = lines.join('\n') + '\n'
JSON.parse(text) // still valid JSON
writeFileSync(fp, text)
console.log('wrote chapters/07-singularity/data/snapshot.json and data/facts.json sing.*; next: node build.mjs --gen --chapter singularity')
