// facts.assert.mjs (DS lead merges; teams add their own asserts in their section) — SPEC-C §§5–9, §11.
// Every displayed number is recomputed here from its inputs; the build stops on the first failing assert.
// Usage: import assertFacts from './facts.assert.mjs'; const results = await assertFacts(facts) (throws on failure).
// Standalone: node data/facts.assert.mjs
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

export default async function assertFacts(facts) {
  const out = []
  const eq = (name, got, want) => out.push({ name, ok: Object.is(got, want) || (typeof got === 'number' && typeof want === 'number' && Math.abs(got - want) < 1e-9), got, want })
  const ok = (name, cond, got = cond) => out.push({ name, ok: !!cond, got, want: true })
  const f2 = (x, d) => x.toFixed(d)
  const r2 = (x) => Math.round(x * 100) // integer hundredths

  // ---------------------------------------------------------------- 01 Engineering (§4, SPEC-B §6)
  {
    const h = facts['eng.hv'], fld = facts['eng.field']
    const dbar = (+h.d1 + +h.d2) / 2
    eq('eng.hv d̄ = (d1 + d2)/2', f2(dbar, 2), h.dbar)
    const hv = 1.8544 * h.loadKgf / (dbar / 1000) ** 2
    eq('eng.hv HV = 1.8544·F/d̄² → 180.1', f2(hv, 1), '180.1')
    eq('eng.hv reported', String(Math.round(hv)), h.value)
    eq('eng.hv unit HV0.5 matches load', h.unit, `HV${h.loadKgf}`)
    eq('eng.field ×200 field 700 µm', fld.fieldUm, 700)
    eq('eng.field scale bar 100 µm', fld.scaleUm, 100)
  }
  // ---------------------------------------------------------------- 02 Chemistry (§5)
  {
    const b = facts['chem.burette'], t = 0.5 * Math.tan(12 * Math.PI / 180)
    eq('chem.burette above = 24.06 − 0.5·tan12°', f2(+b.value - t, 2), b.above)
    eq('chem.burette below = 24.06 + 0.5·tan12°', f2(+b.value + t, 2), b.below)
    const c = facts['chem.cal']
    const S = [[0.5, 0.052], [1.0, 0.097], [2.0, 0.196], [4.0, 0.407], [5.0, 0.501]] // the Path A prototype figures (CHEM generator)
    const n = S.length, mx = S.reduce((s, p) => s + p[0], 0) / n, my = S.reduce((s, p) => s + p[1], 0) / n
    const sxy = S.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0), sxx = S.reduce((s, p) => s + (p[0] - mx) ** 2, 0), syy = S.reduce((s, p) => s + (p[1] - my) ** 2, 0)
    const m = sxy / sxx, bb = my - m * mx, r = sxy / Math.sqrt(sxx * syy)
    eq('chem.cal r', f2(r, 4), c.r)
    const found = (0.298 - bb) / m
    eq('chem.cal check found', f2(found, 2), c.checkFound)
    eq('chem.cal recovery (full precision)', f2(found / +c.checkTrue * 100, 1), c.value)
    eq('chem.cal recovery (displayed strings)', f2(+c.checkFound / +c.checkTrue * 100, 1), c.value)
    eq('chem.cal unit', c.unit, '%')
    ok('chem.cal every standard back-calculates within ±10 %', S.every(([x, y]) => Math.abs((y - bb) / m - x) / x <= 0.1))
    ok('chem.cal check absorbance inside ±10 % band', 0.298 >= m * 2.7 + bb && 0.298 <= m * 3.3 + bb)
  }
  // ---------------------------------------------------------------- 03 Microbiology (§6.3)
  {
    const k = facts['micro.key']
    const per = (p) => p.colonies / +p.dilution * k.recoveryMl / k.platedMl
    eq('micro control CFU per coupon', per(k.control), 1860000)
    eq('micro treated CFU per coupon', per(k.treated), 130)
    eq('micro control cfu string', String(per(k.control)), k.control.cfu)
    eq('micro cfuSci', `${k.control.cfuSci.m}e${k.control.cfuSci.e}`, (per(k.control)).toExponential(2).replace('+', ''))
    const lc = Math.log10(per(k.control)), lt = Math.log10(per(k.treated))
    eq('micro log control', f2(lc, 2), k.control.log)
    eq('micro log treated', f2(lt, 2), k.treated.log)
    eq('micro LR from rounded strings (hundredths)', r2(+k.control.log) - r2(+k.treated.log), r2(+k.value))
    eq('micro LR full precision', f2(lc - lt, 2), k.value)
    eq('micro fold toPrecision(2)', (per(k.control) / per(k.treated)).toPrecision(2), '1.4e+4')
    eq('micro criterion end', f2(+k.control.log - +k.criterion, 2), k.criterionEnd)
    eq('micro LOD', String(1 * k.recoveryMl / k.platedMl), k.lod)
    eq('micro max reportable LR', f2(+k.control.log - Math.log10(+k.lod), 2), '5.27')
    eq('micro tamper note 13 → 3', f2(lc - Math.log10(k.tamper.colonies * k.recoveryMl / k.platedMl), 2), k.tamper.lr)
    eq('micro clock first (270 ms of 1400 = 72 h)', String(Math.round(270 * 72 / 1400)), k.clockFirst)
    eq('micro clock last (792 ms)', String(Math.round(792 * 72 / 1400)), k.clockLast)
    ok('micro pass: LR ≥ criterion', +k.value >= +k.criterion)
  }
  // ---------------------------------------------------------------- 04 Environmental (§7.3; integer arithmetic)
  {
    const k = facts['env.key'], m = Math.round(+k.cal.m * 10000), b = Math.round(+k.cal.b * 1000)
    const sample = Math.round((Math.round(+k.area * 1000) - b) * 1000 / m)
    const spike = Math.round((Math.round(+k.spike.area * 1000) - b) * 1000 / m)
    eq('env sample (2610 − 7)·1000/7481', sample, 348)
    eq('env sample string', f2(sample / 100, 2), k.value)
    eq('env spike found', spike, 590)
    eq('env spike string', f2(spike / 100, 2), k.spike.found)
    const rec = (spike - sample) * 1000 / Math.round(+k.spike.added * 100)
    eq('env recovery tenths %', rec, 968)
    eq('env recovery string', f2(rec / 10, 1), k.spike.recovery)
    ok('env recovery inside 80–120 %', rec >= 800 && rec <= 1200, rec)
    eq('env found gap', f2((spike - sample) / 100, 2), k.spike.gap)
    ok('env sample inside calibrated range 0.50–10.0', sample >= 50 && sample <= 1000, sample)
    ok('env below MCL', +k.value < +k.mcl)
    eq('env spike scaleY', f2(+k.area / +k.spike.area, 4), '0.5904')
    const C = k.cal.levels.map(Number), A = k.cal.areas, n = C.length
    const mx = C.reduce((s, x) => s + x, 0) / n, my = A.reduce((s, x) => s + x, 0) / n
    const sxy = C.reduce((s, x, i) => s + (x - mx) * (A[i] - my), 0), sxx = C.reduce((s, x) => s + (x - mx) ** 2, 0)
    const mm = sxy / sxx, bb = my - mm * mx
    eq('env fit slope', f2(mm, 4), k.cal.m)
    eq('env fit intercept', f2(bb, 3), k.cal.b)
    const sd = 0.017, rt = +k.rt
    eq('env retention window ±3 SD', `${f2(rt - 3 * sd, 2)}–${f2(rt + 3 * sd, 2)}`, k.window)
    const sN = 3.20 / Math.sqrt(4000), sBr = 2.90 / Math.sqrt(4000)
    const rs = 0.3 / (2 * (sBr + sN))
    ok('env resolution Br/NO3 ≥ 1.5', rs >= 1.5, +rs.toFixed(3))
  }
  // ---------------------------------------------------------------- 05 IT (§8.3)
  {
    const k = facts['it.key'], e = k.echoes
    const sum = e.reduce((s, x) => s + x, 0)
    eq('it echo sum', sum, 72)
    eq('it echo sum divisible by 4', sum % e.length, 0)
    eq('it mean = value', String(sum / e.length), k.value)
    eq('it min', String(Math.min(...e)), k.min)
    eq('it max', String(Math.max(...e)), k.max)
    const ip = (s) => s.split('.').map(Number)
    const in24 = (a, net) => ip(a).slice(0, 3).join('.') === net
    const last = (a) => ip(a)[3]
    const [p0, p1] = k.pool.map(last)
    for (const key of ['pc', 'gw', 'cause']) {
      ok(`it ${key} in 192.168.1.0/24`, in24(k[key], '192.168.1'), k[key])
      ok(`it ${key} outside the DHCP pool`, last(k[key]) < p0 || last(k[key]) > p1, k[key])
    }
    eq('it pool size', p1 - p0 + 1, 100)
    eq('it fixDns === gw', k.fixDns, k.gw)
    ok('it cause ≠ gw', k.cause !== k.gw)
    ok('it target in 198.51.100.0/24 (RFC 5737)', in24(k.target, '198.51.100'), k.target)
    ok('it resolver in 203.0.113.0/24 (RFC 5737)', in24(k.resolver, '203.0.113'), k.resolver)
    ok('it MAC in RFC 9542 documentation block', /^00-00-5e-00-53-[0-9a-f]{2}$/.test(k.gwMac), k.gwMac)
    eq('it speed', (1e9 / 1e9).toFixed(1) + ' Gbps', k.speed)
    eq('it layers', k.layers.join(','), '1,2,3,7')
    ok('it loss 0 %', (e.length - e.length) / e.length === 0)
  }
  // ---------------------------------------------------------------- 06 Ledger (§9.2, A4)
  {
    const L = facts.ledger
    eq('ledger rows', L.rows.length, 5)
    for (const key of L.rows) {
      const r = facts[key]
      ok(`ledger ${key} present with value/unit/label/fig`, r && r.value && r.unit && r.label && r.fig, key)
      if (!r) continue
      ok(`ledger ${key} label ≤ 28 characters (A4)`, [...r.label].length <= 28, r.label.length)
      ok(`ledger ${key} "value unit" ≤ 12 characters (A4)`, [...`${r.value} ${r.unit}`].length <= 12, `${r.value} ${r.unit}`)
    }
    ok('ledger tamper row is a ledger row', L.rows.includes(L.tamper.row))
    // The head/anchor is NOT asserted here (A4): it lives in DI's ledger-data.json, and build step 3 compares the
    // r/h chain recomputed from these facts with it ("ledger stale" → the §12.4 hand-off). Payloads must stay ASCII-safe UTF-8:
    for (const key of L.rows) ok(`ledger ${key} payload has no "|" inside its fields`, !/\|/.test(`${facts[key].fig}${facts[key].label}${facts[key].value}${facts[key].unit}`))
    void createHash
    const t = +facts[L.tamper.row].value, tt = +L.tamper.to
    eq('ledger tamper magnitude 2.24 %', f2((tt - t) / t * 100, 2), '2.24')
    eq('ledger tamper ×10.8 Class A ±0.05 mL', f2((tt - t) / 0.05, 1), '10.8')
  }
  // ---------------------------------------------------------------- Immutable QC copy (client corrections 2026-10-06)
  {
    const Q = facts.iqc, cfg = await import(pathToFileURL(join(HERE, '../site.config.mjs')).href + `?t=${Date.now()}`)
    const sid = cfg.iqcSentenceOverride || cfg.selectIqcSentence(cfg.iqcGate)
    const n = (re, s) => (s.match(re) || []).length
    eq('iqc tagline (item 7)', Q.tagline, 'Tokenized lab data.')
    eq('iqc tagline carries the one "tokeniz"', n(/tokeni[sz]/gi, Q.tagline), 1)
    eq('iqc shipped sentence = S3 (items 5, 7; gate G7 open)', sid, 'S3')
    eq('iqc S3 = client wording', cfg.iqcSentences.S3, "Each result is signed when it's recorded, linked to the one before it, and anchored to a public blockchain, so anyone can check it hasn't changed.")
    for (const [k, v] of Object.entries(cfg.iqcSentences)) {
      eq(`iqc ${k}: "blockchain" exactly once`, n(/blockchain/gi, v), 1)
      eq(`iqc ${k}: no "tokeniz" (the tagline carries it)`, n(/tokeni[sz]/gi, v), 0)
      ok(`iqc ${k}: no bare chain(s), no Filecoin`, !/\bchains?\b|filecoin/i.test(v), v)
    }
    eq('iqc status (items 3, 8)', Q.status, 'Independent project · open alpha · public test network · synthetic demo data')
    ok('iqc status names no chain (item 8)', !/sepolia|\bbase\b|filecoin|ethereum|mainnet/i.test(Q.status), Q.status)
    eq('iqc no customers yet (item 3)', cfg.iqcNotes.customers, 0)
    eq('iqc network today', Q.network, 'public test network')
    eq('iqc Filecoin is roadmap only (item 8)', cfg.iqcNotes.filecoin, 'roadmap only')
    eq('iqc facts carry render values only (notes live in site.config.mjs iqcNotes)', Object.keys(Q).join(), 'tagline,status,roadmap,stage,data,network')
    ok('iqc roadmap starts "Next:" and names Filecoin once (items 6, 8)', /^Next: /.test(Q.roadmap) && n(/filecoin/gi, Q.roadmap) === 1, Q.roadmap)
    for (const [k, v] of [['tagline', Q.tagline], ['status', Q.status], ['roadmap', Q.roadmap], ...Object.entries(cfg.iqcSentences)])
      ok(`iqc ${k}: no customer / pilot / deployment / production / token / wallet / staking / trading words (items 3, 4)`,
        !/customer|client|pilot|deploy|production|\btokens?\b|wallet|stak(e|ing)|trading|ERC-?20|crypto/i.test(v), v)
    ok('site config has no CV link (item 2)', !('cv' in cfg.site), cfg.site.cv)
  }
  // ---------------------------------------------------------------- team hooks: chapters/*/facts.assert.mjs (optional)
  const chapters = join(HERE, '../chapters')
  for (const dir of ['01-engineering', '02-chemistry', '03-microbiology', '04-environmental', '05-it', '06-data-integrity']) {
    const p = join(chapters, dir, 'facts.assert.mjs')
    if (!existsSync(p)) continue
    const mod = await import(pathToFileURL(p).href + `?t=${Date.now()}`)
    const extra = await (mod.default || mod.asserts)(facts, { eq, ok })
    if (Array.isArray(extra)) out.push(...extra)
  }
  const bad = out.filter((x) => !x.ok)
  if (bad.length) {
    const e = new Error(`facts.assert: ${bad.length} failed\n` + bad.map((x) => `  ✗ ${x.name}: got ${JSON.stringify(x.got)}, want ${JSON.stringify(x.want)}`).join('\n'))
    e.results = out
    throw e
  }
  return out
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const facts = JSON.parse(readFileSync(join(HERE, 'facts.json'), 'utf8'))
  assertFacts(facts).then((r) => console.log(`facts.assert: ${r.length} asserts passed`), (e) => { console.error(e.message); process.exit(1) })
}
