// Chapter 02 asserts (Team CHEM), run by data/facts.assert.mjs on every build. Every number Figs. 3 and 4 show, and every
// number written into this chapter's own HTML by hand (poster alt text, the methods line's 0.5 and 12°), is recomputed here
// from the models and compared with facts.json.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { R, TILT_DEG, LOOK, readingText, lookOf, say } from './burette.model.js'
import { numbers, STD, LIM } from './calibration.model.js'

const HERE = dirname(fileURLToPath(import.meta.url))

export default function (facts, { eq, ok }) {
  const b = facts['chem.burette'], T = +b.value
  // ---- Fig. 3: the model the controller, the scene and the posters share
  eq('chem: Fig. 3 level reading (model)', readingText(T, LOOK.level), b.value)
  eq('chem: Fig. 3 above = 24.06 − 0.5·tan 12° (model)', readingText(T, LOOK.above), b.above)
  eq('chem: Fig. 3 below = 24.06 + 0.5·tan 12° (model)', readingText(T, LOOK.below), b.below)
  eq('chem: Fig. 3 above unrounded', (T - R * Math.tan(LOOK.above)).toFixed(4), '23.9537')
  eq('chem: Fig. 3 below unrounded', (T - R * Math.tan(LOOK.below)).toFixed(4), '24.1663')
  ok('chem: Fig. 3 status agrees with each state', lookOf(T, LOOK.above) === 'above' && lookOf(T, LOOK.level) === 'level' && lookOf(T, LOOK.below) === 'below')
  ok('chem: Fig. 3 reads low from above, high from below', +b.above < T && +b.below > T)
  eq('chem: Fig. 3 above/below are symmetric about the true reading', ((+b.above + +b.below) / 2).toFixed(2), b.value)
  ok('chem: Fig. 3 spoken sentences carry the readings', say(T, 'above').includes(b.above) && say(T, 'below').includes(b.below) && say(T, 'level').includes(b.value))
  // ---- Fig. 4: the calibration model (also the generator's input)
  const c = facts['chem.cal'], N = numbers()
  eq('chem: Fig. 4 r (model)', N.rTxt, c.r)
  eq('chem: Fig. 4 check found (model)', N.foundTxt, c.checkFound)
  eq('chem: Fig. 4 check true (model)', N.trueTxt, c.checkTrue)
  eq('chem: Fig. 4 recovery, full precision (model)', N.recTxt, c.value)
  eq('chem: Fig. 4 recovery from the displayed strings', ((+c.checkFound / +c.checkTrue) * 100).toFixed(1), c.value)
  eq('chem: Fig. 4 window (model)', N.limTxt, c.limit)
  eq('chem: Fig. 4 five standards', String(STD.length), '5')
  ok('chem: Fig. 4 check passes (inside ±10 %, absorbance inside the band)', N.pass)
  ok('chem: Fig. 4 every standard back-calculates within ±10 %', N.backCalc.every((x) => Math.abs(x - 100) <= LIM))
  // ---- numbers authored in chapter.html outside {{fact}} placeholders
  const html = readFileSync(join(HERE, 'chapter.html'), 'utf8')
  const alt = (s) => (html.match(new RegExp(`\\{\\{poster:burette ${s} "([^"]*)"\\}\\}`)) || [])[1] || ''
  ok('chem: poster alt "above" names 12° and 23.95', alt('above').includes(`${TILT_DEG} degrees above`) && alt('above').includes(b.above))
  ok('chem: poster alt "level" names 24.06', alt('level').includes(b.value))
  ok('chem: poster alt "below" names 12° and 24.17', alt('below').includes(`${TILT_DEG} degrees below`) && alt('below').includes(b.below))
  ok('chem: poster alt "tri" names all three readings', [b.above, b.value, b.below].every((v) => alt('tri').includes(v)) && alt('tri').includes(`${TILT_DEG} degrees`))
  ok('chem: methods line uses the model radius and angle', html.includes(`− ${R} · tan`) && html.includes(`±${TILT_DEG}°`))
  ok('chem: generated Fig. 4 markup carries the facts', [`r = ${c.r}`, `check ${c.checkTrue}`, `${c.checkFound}</span>`, `±${c.limit}&nbsp;%`].every((s) => html.includes(s)))
}
