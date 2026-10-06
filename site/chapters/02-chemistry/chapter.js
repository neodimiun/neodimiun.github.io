// Chapter 02 Chemistry controller (Team CHEM, eager). Registers Fig. 3 (the burette, a GL scene on the shared stage)
// and Fig. 4 (the calibration line, DOM/SVG) and wires their DOM: readout, Look-from buttons, live region, caption state.
// The pixels live in the lazy burette.gl.js; the numbers come from burette.model.js + facts.json, so the DOM is right
// without WebGL (posters, reduced motion, no JS).
import { wireControls, announce, draw, fadeIn, finished, stopAll } from '../../shell/stage/dom-figure.js'
import { R, TILT, DEG, LOOK, STATES, STATUS, say, readingText, lookOf } from './burette.model.js'

export default function setup({ stage, facts, root }) {
  const b = root.querySelector('#fig-burette')
  if (b) burette(stage, facts, b)
  const c = root.querySelector('#fig-calibration')
  if (c) calibration(stage, c)
}

function burette(stage, facts, fig) {
  const TRUE = +facts['chem.burette'].value
  fig.__burette = { R, TILT, LOOK, DEG, readingText, lookOf, TRUE_ML: TRUE } // handed to the lazy scene (see burette.gl.js)
  const val = fig.querySelector('[data-fact-readout]')
  const status = fig.querySelector('.readout .status')
  const cap = fig.querySelector('figcaption .state')
  let shown = { value: val.textContent.trim(), look: 'level', lit: 'level' }
  // write only what changed: the reading, the status word (accent only at the true reading), the lit button
  function show(value, look, lit) {
    if (shown.value !== value) val.textContent = value
    if (shown.look !== look) {
      status.textContent = STATUS[look]
      status.classList.toggle('is-true', look === 'level')
      if (cap) cap.textContent = look
    }
    if (shown.lit !== lit) c.pressed(lit) // null: no button lit while the eye travels
    shown = { value, look, lit }
  }
  const c = wireControls(fig, {
    onSet(s) {
      show(readingText(TRUE, LOOK[s]), s, s) // the DOM is right at once; the drawing follows when it is live
      stage.setState('burette', s)
      announce(fig, say(TRUE, s))
    },
  })
  let phase = ''
  stage.register({
    id: 'burette', kind: 'gl', fig, host: fig.querySelector('.host'),
    states: STATES, initial: 'level', final: 'level',
    load: () => import('./burette.gl.js'),
    intro: { at: 0.4, delay: 450, maxMs: 2600 },
    pointer: 'fine-hover', // desktop: the mouse over the plate is the eye (a reading); phones: intro once, then buttons
    onState(snap) {
      const r = snap.readout
      if (r) {
        show(r.value, r.look, r.lit)
        if (phase === 'intro' && r.phase !== 'intro') announce(fig, say(TRUE, 'level')) // the intro's final value
        phase = r.phase
      } else if (snap.state) show(readingText(TRUE, LOOK[snap.state]), snap.state, snap.state)
    },
  })
}

// Fig. 4 (SPEC-C §5.3): one state, no controls; the entry draws the fit line, the standards, then the check group and
// the pass word. 8 WAAPI animations, 1.2 s, 0 rAF. Authored final; arm() hides only the drawing (never the readout).
function calibration(stage, fig) {
  stage.registerDom({
    id: 'calibration', kind: 'dom', fig, final: 'drawn',
    intro: { at: 0.4, delay: 250 },
    arm(el) { el.classList.add('pre') },
    play(el) {
      el.classList.remove('pre')
      // the strokes are non-scaling, so dashes are in screen pixels: draw over the line's on-screen length
      const fit = el.querySelector('.fit'), svg = fit.ownerSVGElement
      const len = Math.ceil(fit.getTotalLength() * (svg.getBoundingClientRect().width / svg.viewBox.baseVal.width)) + 2
      draw(fit, { dur: 700, easing: 'cubic-bezier(.35,.6,.25,1)' }, len)
      el.querySelectorAll('.draw > svg .pt').forEach((p, i) => fadeIn(p, { dur: 250, delay: i * 40 }))
      fadeIn(el.querySelector('.late'), { dur: 300, delay: 700 })
      fadeIn(el.querySelector('.readout .status.is-true'), { dur: 200, delay: 1000 })
      return finished(el)
    },
    settle(el) { stopAll(el); el.classList.remove('pre') },
    set(el, s) { el.dataset.state = s },
  })
}
