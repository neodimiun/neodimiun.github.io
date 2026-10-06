// Chapter 03 Microbiology (Team MICRO): the Fig. 5 controller (SPEC-C §6.5). SVG/DOM only: no canvas, no rAF, no WebGL.
// The HTML is authored counted (final); JS writes data-state and text, and the intro is 32 WAAPI animations on group
// opacity (14 cohorts, 14 dot rows, 3 result fades) plus one stroke-dashoffset, with 6 text-only clock timeouts.
// JS-written strings live in .lv / the first .val / .clk / the first .state; their authored final copies (.pf) show in print.
import { anim, draw, stopAll, timers, wireControls, announce } from '../../shell/stage/dom-figure.js'
import { SAY, T } from './disinfectant.model.js'

const ID = 'disinfectant'
const OP = [{ opacity: 0 }, { opacity: 1 }]
const LABEL = { plated: 'nothing grown yet', incubated: 'colonies grown, not yet counted' }

export default function setup({ stage, root, facts }) {
  const fig = root.querySelector('#fig-' + ID)
  if (!fig) return
  const k = facts['micro.key']
  const $ = (s) => fig.querySelector(s)
  const t = timers()
  const clk = $('.clk'), cap = $('figcaption .state'), live = $('[data-live]')
  const [v1, v2] = fig.querySelectorAll('.readout .val:not(.pf)')
  const dishes = [...fig.querySelectorAll('.dish')].map((d, i) => ({
    n: d.querySelector('.n .lv'), svg: d.querySelector('.petri'), count: String([k.control, k.treated][i].colonies),
    name: ['Control plate, 1 in 1,000', 'Disinfected plate, undiluted'][i],
    cohorts: [...d.querySelectorAll('.gc > g')], rows: [...d.querySelectorAll('.gm > g')],
  }))
  let gen = 0 // bumped by arm/play/settle: late promise callbacks from an older run never write text

  const c = wireControls(fig, {
    onSet: (s) => { stage.setState(ID, s); announce(fig, SAY[s]) },
    onReplay: () => stage.replay(ID),
  })
  // state word, pressed button, caption, clock, readout values (tallies are separate: they step during the intro)
  function ui(s) {
    fig.dataset.state = s
    c.pressed(s)
    if (cap) cap.textContent = s
    clk.textContent = s === 'plated' ? '0' : '72'
    const on = s === 'counted'
    v1.textContent = on ? k.value : '—'
    v2.textContent = on ? k.treated.cfu : '—'
    // the dish labels follow the state: no count is claimed before the dots are shown
    for (const d of dishes) d.svg.setAttribute('aria-label', `${d.name}, ${LABEL[s] || `${d.count} colonies counted`}`)
  }
  function set(el, s) {
    ui(s)
    for (const d of dishes) d.n.textContent = s === 'counted' ? d.count : '—'
  }

  function arm(el) {
    gen++; t.clear()
    live.removeAttribute('aria-live') // attached again after the intro (or by settle)
    el.classList.add('pre')
    set(el, 'plated')
  }
  function play(el) {
    const g = ++gen
    t.clear(); stopAll(el)
    el.classList.add('intro')
    set(el, 'plated')
    el.classList.remove('pre')
    const A = []
    // growth: cohort j fades in at 270 + 66.25·j over 600 ms (8 control + 6 treated groups); the last ends at 1333.75
    for (const d of dishes) for (const grp of d.cohorts) A.push(anim(grp, OP, { dur: T.GROW_DUR, delay: T.GROW0 + T.COHORT * +grp.getAttribute('class').slice(1) }))
    // the incubator clock: 12 → 72 h, text only
    T.CLOCK.forEach((ms, i) => t.set(() => {
      if (g !== gen) return
      clk.textContent = String(12 * (i + 1))
      if (ms === T.INCUBATED) ui('incubated')
    }, ms))
    // counting: each dot row appears at 1500 + (dots before it / n)·1080 over 120 ms; the tally steps to the dots shown
    let counted = false
    for (const d of dishes) {
      const n = d.rows.reduce((s, r) => s + r.childElementCount, 0)
      let cum = 0
      for (const r of d.rows) {
        const delay = T.COUNT0 + cum / n * T.COUNT_SPAN
        const shown = String(cum += r.childElementCount)
        const a = anim(r, OP, { dur: T.ROW_DUR, delay })
        A.push(a)
        a.finished.then(() => {
          if (g !== gen) return
          if (!counted) { counted = true; ui('counted') }
          d.n.textContent = shown
        }, () => {})
      }
    }
    // results: arithmetic, ladder, readout fade in 80 ms apart; the achieved bar draws right to left
    const after = ['.eqs', '.lw', '.readout'].map((s, i) => anim($(s), OP, { dur: T.AFTER_DUR, delay: T.AFTER + i * T.AFTER_STAGGER }))
    after[2].finished.then(() => { if (g === gen) live.setAttribute('aria-live', 'polite') }, () => {})
    A.push(...after, draw($('.ach'), { dur: T.BAR_DUR, delay: T.BAR_DELAY }))
    return Promise.all(A.map((a) => a.finished.catch(() => null))).then(() => { if (g === gen) announce(fig, SAY.counted) })
  }
  function settle(el) {
    gen++; t.clear(); stopAll(el)
    el.classList.remove('pre', 'intro')
    set(el, 'counted')
    live.setAttribute('aria-live', 'polite')
  }

  stage.registerDom({ id: ID, kind: 'dom', fig, final: 'counted', intro: { at: 0.4, delay: 300 }, arm, play, settle, set })
  // no global listeners (SYSTEM-C §6.2): a hidden tab mid-intro is settled by the stage; print shows the counted state
  // from CSS alone (chapter.css @media print swaps every JS-written string for its authored final copy, .pf)
}
