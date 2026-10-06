// chapter.js (Team ENG, eager): registers Fig. 1 (×200 field) and Fig. 2 (×500 eyepiece band) on the shared stage and
// keeps their DOM (buttons, caption state, readout, live region) in step with the picture. The pixels are in the lazy
// field.gl.js; the numbers come from field.model.js, so the DOM is right with or without WebGL.
import { wireControls, announce } from '../../shell/stage/dom-figure.js'
import { model } from './field.model.js'

export default function setup({ stage, facts, root }) {
  const M = model(facts)
  for (const id of ['fig-field', 'fig-indent']) { const f = root.querySelector('#' + id); if (f) f.__field = M } // for field.gl.js
  const load = () => import('./field.gl.js')

  // ---- Fig. 1: polished · etched -----------------------------------------------------------------------------------
  const f1 = root.querySelector('#fig-field')
  if (f1) {
    const cap = f1.querySelector('figcaption .state')
    const show = (s, phase) => { c.pressed(s); const t = phase === 'etching' ? 'etching' : s; if (cap.textContent !== t) cap.textContent = t }
    const c = wireControls(f1, { onSet: (s) => { show(s); stage.setState('field', s); announce(f1, M.announceField(s)) } })
    stage.register({
      id: 'field', kind: 'gl', fig: f1, host: f1.querySelector('.host'), states: ['polished', 'etched'], initial: 'polished', final: 'etched',
      load, intro: { at: 0.4, delay: 450, maxMs: 2600 }, pointer: 'fine-hover',
      onState(snap) { if (snap.state) show(snap.state, snap.phase) },
    })
  }

  // ---- Fig. 2: etched · indented · measured · replay ------------------------------------------------------------------
  const f2 = root.querySelector('#fig-indent')
  if (f2) {
    const cap = f2.querySelector('figcaption .state')
    const out = Object.fromEntries(['d1', 'd2', 'dm'].map((k) => [k, f2.querySelector(`[data-r="${k}"]`)]))
    out.hv = f2.querySelector('[data-fact-readout="eng.hv"]')
    const status = f2.querySelector('.readout .status'), word = status.querySelector('.w')
    const put = (el, v) => { if (el.textContent !== v) el.textContent = v }
    // values only once the crosshairs sit on the corners (the scene says when); otherwise from the state alone
    const show = (s, ro) => {
      c.pressed(s)
      put(cap, s)
      const r = ro || M.readout(s)
      for (const k of ['d1', 'd2', 'dm', 'hv']) put(out[k], r[k])
      // 'measured' is pressed but the crosshairs are still closing: no number and no check yet
      const done = s === 'measured' && r.hv !== '—'
      put(word, s === 'measured' && !done ? 'Measuring' : M.status[s])
      status.classList.toggle('is-true', done)
    }
    const c = wireControls(f2, {
      onSet: (s) => { show(s); stage.setState('indent', s); announce(f2, M.announceIndent(s)) },
      onReplay: () => stage.replay('indent'),
    })
    stage.register({
      id: 'indent', kind: 'gl', fig: f2, host: f2.querySelector('.host'), states: ['etched', 'indented', 'measured'], initial: 'etched', final: 'measured',
      load, intro: { at: 0.4, delay: 450, maxMs: 3600 }, pointer: null,
      onState(snap) { if (snap.state) show(snap.state, snap.readout) },
    })
  }
}
