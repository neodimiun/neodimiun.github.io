// Chapter 05 IT controller (Team IT). Fig. 7 "The System Model" (SPEC-C §8.4): a DOM/SVG figure on the shared stage.
// The HTML is authored final (trace). This file writes data-state, aria-pressed, the readout text, the caption's state word
// and the live sentence. Intro: exactly the 21 WAAPI animations of the INTRO table (10 dash paths), 3.3 s; opacity and
// stroke-dashoffset only, so no text ever moves. No rAF, no timers, no ResizeObserver, no scroll or touch listeners.
import { anim, fadeIn, finished, stopAll, wireControls, announce } from '../../shell/stage/dom-figure.js'
import { INTRO, readout, words } from './layers.model.js'

export default function setup({ stage, facts, root }) {
  const fig = root.querySelector('#fig-layers')
  if (!fig) return
  const k = facts['it.key'], W = words(k), RO = readout(k)
  const $ = (s) => fig.querySelector(s)
  const rows = [$('.a16'), $('.a21')], cap = $('figcaption .state'), plate = $('.plate')
  let ran = false
  const c = wireControls(fig, { onSet: (s) => stage.setState('layers', s), onReplay: () => stage.replay('layers') })
  function set(el, s, quiet) {
    el.dataset.state = s
    c.pressed(s)
    RO[s].forEach(([v, u, w, t], i) => {
      const r = rows[i], st = r.querySelector('.status')
      r.querySelector('.val').textContent = v
      r.querySelector('.unit').textContent = u
      st.querySelector('.w').textContent = w
      st.classList.toggle('is-true', !!t)
    })
    if (cap) cap.textContent = s
    if (!quiet) announce(el, W.say[s])
  }
  stage.registerDom({
    id: 'layers', kind: 'dom', fig, final: 'trace', intro: { at: 0.4, delay: 250 },
    arm(el) { set(el, 'trace', true); el.classList.add('pre') },
    play(el) {
      ran = true
      const V = [...el.querySelectorAll('svg.sm')].find((s) => s.getBoundingClientRect().width > 0)
      const sc = V ? V.getBoundingClientRect().width / 360 : 1
      for (const [delay, dur, sel, kind] of INTRO) {
        const t = sel[0] === '%' ? V && V.querySelector(sel.slice(1)) : el.querySelector(sel)
        if (!t) continue
        if (kind === 'o') { fadeIn(t, { dur, delay }); continue }
        // non-scaling strokes dash in screen px; the probes' mask paths use pathLength 1
        const L = kind === 'm' ? 1 : Math.ceil(t.getTotalLength() * sc) + 2
        anim(t, [{ strokeDasharray: `${L} ${L}`, strokeDashoffset: L }, { strokeDasharray: `${L} ${L}`, strokeDashoffset: 0 }], { dur, delay, easing: 'linear' })
      }
      el.classList.remove('pre')
      return finished(el)
    },
    settle(el) {
      stopAll(el)
      el.classList.remove('pre')
      set(el, 'trace', !ran)
      ran = false
    },
    set,
  })
  // fine pointer only: hovering the L3 result swaps the summary for the four echoes (a reading, not decoration)
  const v3 = $('.lb .v3'), x = v3 && v3.querySelector('.x')
  if (x && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const sum = x.textContent
    const show = (raw) => { x.textContent = raw ? x.dataset.raw : sum; plate.classList.toggle('raw', raw) }
    v3.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(true) })
    v3.addEventListener('pointerleave', () => show(false))
  }
}
