// Chapter 04 Environmental science controller (Team ENV). Fig. 6 "The Run" (SPEC-C §7.4): a DOM/SVG figure on the shared
// stage. The HTML is authored in its final state (sample); this file only writes data-state, aria-pressed, the caption's
// state word and the live sentence (the readout panels are stacked in the markup, so no readout text is ever rewritten).
// Intro: WAAPI on opacity, transform and stroke-dashoffset, 23 animations, 8 dash paths, 2.14 s, 0 rAF, 0 timers.
// Fine pointer: a time cursor on the front trace reads signal() (snapped to an apex within ±0.05 min); never the readout.
import { anim, fadeIn, finished, stopAll, wireControls, announce } from '../../shell/stage/dom-figure.js'
import { G, sampleAreas, AREA, reading, readingText, numbers, say } from './chromatogram.model.mjs'

const WORD = { std: 'standards', sample: 'sample', spike: 'spike' }

export default function setup({ stage, facts, root }) {
  const fig = root.querySelector('#fig-chromatogram')
  if (!fig) return
  const $ = (s) => fig.querySelector(s), $$ = (s) => [...fig.querySelectorAll(s)]
  const cap = $('figcaption .state'), live = $('[data-live]')
  const SAY = say(facts['env.key'])
  let ran = false
  const c = wireControls(fig, { onSet: (s) => stage.setState('chromatogram', s), onReplay: () => stage.replay('chromatogram') })
  function set(el, s, quiet) {
    el.dataset.state = s
    c.pressed(s)
    if (cap) cap.textContent = WORD[s]
    if (!quiet) announce(el, SAY[s])
  }
  stage.registerDom({
    id: 'chromatogram', kind: 'dom', fig, final: 'sample', intro: { at: 0.4, delay: 300 },
    // live region attaches after the intro (§14 item 25); everything the intro reveals starts hidden
    arm(el) { live.removeAttribute('aria-live'); set(el, 'sample', true); el.classList.add('pre') },
    play(el) {
      ran = true
      const k = el.getBoundingClientRect().width ? $('.cg').getBoundingClientRect().width / G.W : 1
      // 0–650 ms: the blank and the five standards rise, 70 ms apart, 300 ms each (front to back = injection order)
      for (let i = 1; i <= 6; i++) {
        const base = `translate(${G.DX * i}px,${G.DY * i}px)`
        anim($(`.k${i}`), [{ opacity: 0, transform: `${base} translateY(10px)` }, { opacity: 1, transform: base }], { dur: 300, delay: (i - 1) * 70 })
      }
      for (const g of $$('.s-stack')) fadeIn(g, { dur: 400, delay: 200 })
      // 650–1850 ms: the sample's pen, 8 one-minute segments × 150 ms (non-scaling strokes: dash in screen px)
      $$('.seg').forEach((p, i) => {
        const L = Math.ceil(p.getTotalLength() * k) + 2
        anim(p, [{ strokeDasharray: `${L} ${L}`, strokeDashoffset: L }, { strokeDasharray: `${L} ${L}`, strokeDashoffset: 0 }], { dur: 150, delay: 650 + i * 150, easing: 'linear' })
      })
      fadeIn($('.k0 > .f'), { dur: 1200, delay: 650, easing: 'linear' })
      // each peak's name as the pen passes it; then (1900–2140 ms) the nitrate area and the integration ticks
      for (const n of $$('.pk')) fadeIn(n, { dur: 200, delay: Math.round(650 + (+n.dataset.t + 0.25) * 150) })
      fadeIn($('.ar'), { dur: 240, delay: 1900 }); fadeIn($('.ig'), { dur: 240, delay: 1900 })
      el.classList.remove('pre')
      return finished(el)
    },
    settle(el) {
      stopAll(el)
      el.classList.remove('pre')
      live.setAttribute('aria-live', 'polite')
      set(el, 'sample', !ran)
      ran = false
    },
    set,
  })
  hover(fig)
  if (__DEV__) {
    // dev self-check (§7.4): the browser recomputes 3.48, 5.90 and 96.8 and compares them with facts and the resting readout
    const N = numbers(), k = facts['env.key'], ro = $('[data-fact-readout="env.key"]').textContent.trim()
    const ok = N.sample === k.value && N.spike === k.spike.found && N.recovery === k.spike.recovery && ro === k.value
    console.assert(ok, 'env: Fig. 6 self-check failed', { N, k, ro })
    if (ok) console.info(`env: Fig. 6 self-check ${N.sample} / ${N.spike} / ${N.recovery} = facts = readout`)
  }
}

// fine pointer (mouse) over the plate: x → time on the front trace (the spiked injection in the spike state) → signal();
// none in the standards state
function hover(fig) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const plate = fig.querySelector('.plate')
  const A = { sample: sampleAreas(), spike: sampleAreas(AREA.spike) }
  let cur = null
  const hide = () => { if (cur) cur.hidden = true }
  plate.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    const r = plate.getBoundingClientRect(), s = fig.dataset.state, z = s !== 'sample', u = r.width / G.W
    // standards: the visible peaks there belong to the standards (bromide has no sample peak), so no single-trace reading
    if (s === 'std') return hide()
    const x = (e.clientX - r.left) / u
    const t = z ? G.W0 + (x - G.X0) / (G.PPM * G.ZX) : (x - G.X0) / G.PPM
    if (t < (z ? 2.55 : 0) || t > (z ? 3.8 : 8)) return hide()
    const p = reading(t, A[s === 'spike' ? 'spike' : 'sample'])
    if (!cur) {
      cur = document.createElement('div'); cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true')
      cur.innerHTML = '<i class="h"></i><i class="d"></i><span class="t"></span>'
      plate.append(cur)
    }
    cur.hidden = false
    const px = (z ? G.X0 + (p.t - G.W0) * G.PPM * G.ZX : G.X0 + G.PPM * p.t) * u
    const py = (G.Y0 - G.S * (z ? G.ZY : 1) * p.v) * u
    const [h, d, lab] = cur.children
    h.style.transform = `translateX(${px}px)`
    d.style.transform = `translate(${px}px,${py}px)`
    lab.textContent = readingText(p)
    lab.style.transform = `translateX(${Math.max(8, Math.min(r.width - lab.offsetWidth - 8, px - lab.offsetWidth / 2))}px)`
  })
  plate.addEventListener('pointerleave', hide)
}
