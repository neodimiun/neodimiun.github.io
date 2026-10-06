// facts.assert.mjs (Team ENG): chapter 01 asserts, run by data/facts.assert.mjs on every build. Every number Figs. 1 and 2
// draw or print is recomputed here from facts.json through field.model.js (the same code the page runs), and the
// hand-typed constants in chapter.html / chapter.css are checked against it.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
// field.model.js is the browser's own module (a .js file in a package without "type": "module"); importing it as a data
// URL runs the identical source as ESM without node's module-type warning on every build
const loadModel = () => import('data:text/javascript;base64,' + Buffer.from(readFileSync(join(HERE, 'field.model.js'))).toString('base64'))

export default async function (facts, { eq, ok }) {
  const { model, TRI } = await loadModel()
  const M = model(facts), H = facts['eng.hv'], F = facts['eng.field']
  const html = readFileSync(join(HERE, 'chapter.html'), 'utf8')
  const css = readFileSync(join(HERE, 'chapter.css'), 'utf8')
  // the readout strings
  eq('eng: d1 drawn (2·A1) = fact', M.d1, H.d1)
  eq('eng: d2 drawn (2·A2) = fact', M.d2, H.d2)
  eq('eng: d̄ of the displayed diagonals = fact', M.dbar, H.dbar)
  eq('eng: HV = 1.8544·0.5/0.07175² (1 dp)', M.hvExact.toFixed(1), '180.1')
  eq('eng: HV reported = fact', M.hv, H.value)
  eq('eng: readout at rest (measured)', M.readout('measured').hv, H.value)
  ok('eng: no number before the crosshairs close', ['etched', 'indented'].every((s) => Object.values(M.readout(s)).every((v) => v === '—')))
  // crosshairs sit exactly on the drawn corners: lines at ±A1, ±A2 are the indent's half-diagonals
  eq('eng: crosshair separation x = d1', (2 * M.A1).toFixed(1), H.d1)
  eq('eng: crosshair separation y = d2', (2 * M.A2).toFixed(1), H.d2)
  // the microscope: one field number, ×200 → ×500
  eq('eng: Fig. 1 field 700 µm at ×200', M.HERO.field, 700)
  eq('eng: Fig. 2 field = 700 · 200/500 = 280 µm', M.BAND.field, 280)
  eq('eng: Fig. 1 magnification', M.HERO.mag, 200)
  eq('eng: Fig. 2 magnification', M.BAND.mag, 500)
  eq('eng: Fig. 1 scale bar 100 µm = 1/7 of the field', M.barFrac(M.HERO), 100 / 700)
  eq('eng: Fig. 2 scale bar 50 µm = 5/28 of the field', M.barFrac(M.BAND), 50 / 280)
  ok('eng: Fig. 1 --bar in chapter.html = scaleUm / fieldUm (facts)', html.includes('--bar: {{fact:eng.field.scaleUm}} / {{fact:eng.field.fieldUm}}'))
  ok(`eng: Fig. 2 --bar in chapter.html = ${M.BAND.bar} / ${M.BAND.field}`, html.includes(`--bar: ${M.BAND.bar} / ${M.BAND.field}`))
  ok(`eng: Fig. 2 scale label ${M.BAND.bar} µm`, html.includes(`>${M.BAND.bar} µm<`) && html.includes(`Scale bar, ${M.BAND.bar} micrometers`))
  ok('eng: the indent is inside the ×500 field', M.A1 < M.BAND.field / 2 && M.A2 < M.BAND.field / 2)
  ok('eng: the band shows the centre of the hero field', M.BAND.field < M.HERO.field)
  // methods line constants
  eq('eng: F = 0.5 kgf = 4.903 N', (H.loadKgf * 9.80665).toFixed(3), '4.903')
  eq('eng: d̄ in mm', (+H.dbar / 1000).toFixed(5), '0.07175')
  ok('eng: methods prints 4.903 N, 0.07175 and 180.1', /4\.903 N/.test(html) && /0\.07175<sup>2<\/sup> = 180\.1/.test(html))
  // corners and caption
  eq('eng: Fig. 1 TR corner', F.mag, '×200')
  eq('eng: Fig. 2 TR corner magnification', H.mag, '×500')
  ok('eng: captions say ×200 / ×500 nominal', html.includes(`${F.mag} nominal`) && html.includes(`${H.mag} nominal`))
  // reduced-motion small multiples: DOM label positions = the poster's disc centres
  const pc = (v) => +(v * 100).toFixed(1)
  TRI.cx.forEach((x, i) => ok(`eng: tri label ${i + 1} under disc ${i + 1} (${pc(x)}%, ${pc(TRI.cy[i] + TRI.d / 2)}% + 10px)`,
    css.includes(`span:nth-child(${i + 1}){left:${pc(x)}%;top:calc(${pc(TRI.cy[i] + TRI.d / 2)}% + 10px)`)))
  // the three fields fit the square, do not touch, and leave room for the labels (≥ 0.06 of the plate under each disc)
  ok('eng: tri discs inside the square', TRI.cx.every((x, i) => x - TRI.d / 2 > 0 && x + TRI.d / 2 < 1 && TRI.cy[i] - TRI.d / 2 > 0 && TRI.cy[i] + TRI.d / 2 < 0.94))
  ok('eng: tri discs apart', [[0, 1], [1, 2], [0, 2]].every(([a, b]) => Math.hypot(TRI.cx[a] - TRI.cx[b], TRI.cy[a] - TRI.cy[b]) > TRI.d + 0.05))
  // reduced-motion scale bar: each tri disc is one whole ×500 field (280 µm) at TRI.d of the plate, so the 50 µm bar is
  // TRI.d × 50/280 of the plate (the live disc fills the plate: 50/280); the CSS factor must be TRI.d
  ok(`eng: tri scale bar = TRI.d (${TRI.d}) × ${M.BAND.bar}/${M.BAND.field} of the plate`,
    css.includes(`.scalebar .bar{width:calc(var(--d) * var(--bar) * ${String(TRI.d).replace(/^0/, '')})}`))
  // LCP: the polished field shows from first paint with motion on; Chrome ignores an image under 0.05 bits per CSS px of
  // its displayed area, so every polished poster must carry ≥ 0.05 bpp at Fig. 1's largest size (chapter.json sizes)
  const big = Math.max(...(JSON.parse(readFileSync(join(HERE, 'chapter.json'), 'utf8')).figures.find((f) => f.id === 'field').sizes.replace(/\([^)]*\)/g, '').match(/\d+(?=px)/g) || [0]).map(Number))
  const pol = readdirSync(join(HERE, 'posters')).filter((f) => /^field-polished-\d+\.(avif|webp)$/.test(f))
  ok(`eng: polished posters present (${pol.length})`, pol.length >= 4)
  for (const f of pol) { const bpp = (statSync(join(HERE, 'posters', f)).size * 8) / (big * big); ok(`eng: ${f} ${bpp.toFixed(3)} bpp at ${big} px ≥ 0.05 (LCP-eligible)`, bpp >= 0.05) }
  ok('eng: tri scale bar says it applies to each field', /<span class="per">[^<]*each field<\/span>/.test(html))
}
