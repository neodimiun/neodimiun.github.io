// Chapter 06 controller (Team DI, eager, small). Registers Fig. 8 "The Record" as a DOM figure and wires its buttons.
// Everything heavy (the verifier, WebCrypto, the intro, ledger-data.json) is the lazy ledger.js chunk, fetched when the
// figure comes within half a screen (one IntersectionObserver, no scroll listener). Without JS the authored HTML is the
// final "recorded" ledger as checked at build.
import { wireControls, anim, draw, fadeIn, finished, stopAll, announce } from '../../shell/stage/dom-figure.js'

export default function setup({ stage, root }) {
  const fig = root.querySelector('#fig-record')
  if (!fig) return
  let L = null, P = null
  const c = wireControls(fig, { onSet: (s) => stage.setState('record', s), onReplay: () => stage.replay('record') })
  const load = () => P || (P = import('./ledger.js').then((m) => (L = m.attach(fig, { stage, pressed: c.pressed, fx: { anim, draw, fadeIn, finished, stopAll, announce } }))))
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); load() } }, { rootMargin: '50% 0px' })
  io.observe(fig)
  stage.registerDom({
    id: 'record', kind: 'dom', fig, final: 'recorded', intro: { at: 0.4, delay: 300 }, load,
    arm(el) { el.classList.add('pre') },
    play: () => load().then((l) => l.play()),
    settle(el) { if (L) L.settle(); else el.classList.remove('pre') },
    set(el, s) { el.dataset.state = s; c.pressed(s); load().then((l) => l.set(s)) },
  })
}
