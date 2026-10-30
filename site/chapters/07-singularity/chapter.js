// Side project controller. Fig. 9 "When does the wait hit zero?": a DOM/SVG figure on the shared stage. The HTML is authored
// in its final state (zoomed in); this file writes data-state, aria-pressed, the caption's state word and the live sentence
// (both sentences live in the figure's <template>, so no number is typed here). Buttons zoom with CSS transitions (late.css,
// motion on only). Intro (motion on, once, below the fold): all history held 1.2 s, then the 1.6 s zoom, 4 WAAPI animations
// on transform and opacity, 0 rAF, 0 timers; the transforms are the ones tools/plot.mjs wrote on the <svg> (--zt, --zi).
import { anim, fadeIn, finished, stopAll, wireControls, announce } from '../../shell/stage/dom-figure.js'

const WORD = { all: 'all history', zoomed: 'zoomed in' }

export default function setup({ stage, root }) {
  const fig = root.querySelector('#fig-singularity')
  if (!fig) return
  const $ = (s) => fig.querySelector(s)
  const svg = $('.s9'), al = $('.al'), zl = $('.zl'), cap = $('figcaption .state'), live = $('[data-live]')
  const say = {}
  for (const i of $('template').content.children) say[i.dataset.k] = i.textContent
  let ran = false, snap = false
  const c = wireControls(fig, { onSet: (s) => stage.setState('singularity', s), onReplay: () => stage.replay('singularity') })
  // a press that settles a pending or running intro (stage: settle, then set, in one task) lands at once: the picture never
  // zooms away from what was on screen and back
  const now = (el, s) => { const pre = el.classList.contains('pre'); el.classList.add('pre'); el.dataset.state = s; void getComputedStyle(al).opacity; if (!pre) el.classList.remove('pre') }
  function set(el, s, quiet) {
    if (snap && el.dataset.state !== s) now(el, s)
    el.dataset.state = s
    c.pressed(s)
    if (cap) cap.textContent = WORD[s]
    if (!quiet) announce(el, say[s])
  }
  stage.registerDom({
    id: 'singularity', kind: 'dom', fig, final: 'zoomed', intro: { at: 0.4, delay: 250 },
    // armed (motion on, below the fold): all history, without transitions; the live region attaches after the intro
    arm(el) { live.removeAttribute('aria-live'); el.classList.add('pre'); set(el, 'all', true) },
    play(el) {
      ran = true
      const cs = getComputedStyle(svg), T = cs.getPropertyValue('--zt').trim(), I = cs.getPropertyValue('--zi').trim()
      // the final state's CSS now (under .pre: no transition); each animation holds its first frame, the all-history
      // picture, through its delay. The buttons and the caption follow in settle(), when the zoom has ended.
      el.dataset.state = 'zoomed'
      const o = { dur: 1600, delay: 1200, easing: 'cubic-bezier(.55,0,.25,1)' }
      anim(al, [{ transform: 'none', opacity: 1 }, { opacity: 0, offset: 0.65 }, { transform: T, opacity: 0 }], o)
      anim(zl, [{ transform: I, opacity: 0 }, { opacity: 0, offset: 0.3 }, { transform: 'none', opacity: 1 }], o)
      anim($('.s-all'), [{ opacity: 1 }, { opacity: 0 }], { dur: 240, delay: 1200 })
      fadeIn($('.s-zm'), { dur: 240, delay: 2560 })
      return finished(el)
    },
    settle(el) {
      stopAll(el)
      // to the final state with no transition: under .pre, style resolved, then .pre off (nothing left to transition)
      if (el.dataset.state !== 'zoomed') now(el, 'zoomed')
      el.classList.remove('pre')
      live.setAttribute('aria-live', 'polite')
      set(el, 'zoomed', !ran)
      ran = false
      snap = true
      queueMicrotask(() => { snap = false })
    },
    set,
  })
}
