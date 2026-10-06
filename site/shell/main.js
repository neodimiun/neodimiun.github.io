// main.js (DS lead) — eager shell runtime: creates the stage, runs each chapter's setup() in site order, then starts the
// stage. Also: active-chapter locator (ONE IntersectionObserver, zero scroll listeners), phone index dialog, seams (draw
// once), the footer Motion switch, print, and the dev HUD.
import facts from '../data/facts.json'
import { createStage } from './stage/stage.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

export function boot(chapters, { dev = false } = {}) {
  const params = new URLSearchParams(location.search)
  const C = window.__C || {}
  const stage = createStage({ params, dev })
  for (const [slug, setup] of chapters) {
    const root = document.getElementById(slug)
    if (!root || typeof setup !== 'function') continue
    try { setup({ stage, facts, root, dev, params }) } catch (e) { console.error(`[${slug}] setup failed`, e) }
  }
  jumps()
  // the rest in its own task: module evaluation + every chapter's setup is one task, the stage start (one layout read
  // pass) + locator + seams another, so neither goes past 80 ms on a 4x-throttled phone (SPEC-C §14 item 33)
  const rest = () => {
    stage.start()
    const lateNow = late(C)
    nav(C.ch || [], lateNow)
    seams(stage)
    motionSwitch(stage)
    addEventListener('beforeprint', () => { lateNow(); layoutAll(); for (const d of $$('details.methods')) d.open = true; stage.settleAll('print') })
    if (dev && params.get('hud') !== '0' && !params.has('poster')) hud(stage)
  }
  if (typeof MessageChannel === 'function') { const c = new MessageChannel(); c.port1.onmessage = rest; c.port2.postMessage(0) } else setTimeout(rest, 0)
  return stage
}

function nav(list, lateNow) {
  const secs = list.map((c) => document.getElementById(c.slug)).filter(Boolean)
  const locLinks = $$('.loc a')
  const label = $('.loc-lbl .v')
  const idx = $('.idx')
  const strip = $$('.strip i')
  const n = list.length
  let cur = null
  const show = (c, transient) => {
    if (!label || label.textContent === c.nav) return
    label.classList.add('swap')
    setTimeout(() => { label.textContent = c.nav; label.classList.remove('swap') }, transient ? 0 : 120)
  }
  function setCur(c) {
    if (!c || c === cur) return
    cur = c
    for (const a of locLinks) { if (a.dataset.slug === c.slug) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current') }
    show(c)
    for (const i of strip) i.classList.toggle('on', i.dataset.slug === c.slug)
    if (idx) {
      $('.n', idx).textContent = `${c.no}/${String(n).padStart(2, '0')}`
      $('.l', idx).textContent = c.nav
      $('.s', idx).textContent = c.short || c.nav
      idx.setAttribute('aria-label', `Chapter index, current: ${c.no} ${c.nav}`)
    }
  }
  if (secs.length) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) setCur(list.find((c) => c.slug === e.target.id))
    }, { rootMargin: '-45% 0px -54% 0px' })
    secs.forEach((s) => io.observe(s))
  }
  // hover / focus on a locator number previews its name in the label slot
  for (const a of locLinks) {
    const c = list.find((x) => x.slug === a.dataset.slug)
    const back = () => cur && show(cur, true)
    a.addEventListener('pointerenter', () => c && show(c, true)); a.addEventListener('focus', () => c && show(c, true))
    a.addEventListener('pointerleave', back); a.addEventListener('blur', back)
  }
  // index dialog (below 1024). No JS: the button is a link to #contents.
  const dlg = $('#idx-dlg')
  if (idx && dlg && typeof dlg.showModal === 'function') {
    idx.setAttribute('role', 'button'); idx.setAttribute('aria-haspopup', 'dialog'); idx.setAttribute('aria-expanded', 'false')
    // the dialog's styles are in late.css: pressed before it has loaded, the dialog opens once it has (≤ 1.5 s)
    idx.addEventListener('click', (e) => { e.preventDefault(); lateNow().then(() => { if (!dlg.open) { dlg.showModal(); idx.setAttribute('aria-expanded', 'true') } }) })
    idx.addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); idx.click() } })
    dlg.addEventListener('close', () => idx.setAttribute('aria-expanded', 'false'))
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('a') || e.target.closest('.x')) dlg.close() })
  }
}

// after the load event + idle: late.css (the Newsreader italic face, the index dialog, contact + footer, print) and
// html.late, which lets the posters of the other states load (motion off). Neither is part of the first load
// (SPEC-C §14 item 34).
function late(C) {
  let ready = null
  const go = () => {
    if (!ready) {
      ready = !C.late ? Promise.resolve() : new Promise((res) => {
        const l = document.createElement('link')
        l.rel = 'stylesheet'; l.href = C.late; l.dataset.late = ''
        l.onload = l.onerror = () => res()
        setTimeout(res, 1500) // never hold the dialog longer than this
        document.head.appendChild(l)
      })
    }
    document.documentElement.classList.add('late')
    return ready
  }
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2000 }) : setTimeout(go, 200))
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true })
  // contact + footer are styled by late.css: load it before they can be seen (scrolling near, a jump, a #contact link)
  // (also any element marked data-needs-late, e.g. a figure whose fallback-path rules ship in late.css)
  const ends = $$('#contact,[data-needs-late]')
  if (ends.length) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go() } }, { rootMargin: '150% 0px' })
    ends.forEach((e) => io.observe(e))
  }
  addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[href*="#contact"]')) go() }, { capture: true })
  if (location.hash === '#contact') go()
  return go
}

// chapters, contact and footer are content-visibility:auto (chapter.css): off-screen ones keep an estimated height until
// they near the viewport. An in-page jump (a #fragment link, a load or history step with a hash) must land on real
// heights, so every chapter lays out once, before the browser scrolls (one layout, at the jump; none at boot).
// (print too, before the page is paginated)
const layoutAll = () => { document.documentElement.classList.remove('c0'); for (const s of $$('main > .ch, #contact, .site-ft')) s.style.contentVisibility = 'visible' }
function jumps() {
  if (location.hash) layoutAll()
  addEventListener('hashchange', layoutAll)
  addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href*="#"]'); if (a && a.hash && a.pathname === location.pathname) layoutAll() }, { capture: true })
}

// seam bar draws once per seam (A14): IntersectionObserver .in at 0.6, then unobserve
function seams(stage) {
  const all = $$('.seam')
  if (!stage.motion()) { all.forEach((s) => s.classList.add('in')); return }
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
  }, { threshold: 0.6 })
  all.forEach((s) => io.observe(s))
}

function motionSwitch(stage) {
  const btn = $('[data-motion]')
  if (!btn) return
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)')
  const sync = () => {
    const sys = mqReduce.matches
    btn.setAttribute('aria-pressed', String(stage.motion()))
    btn.disabled = sys
    $('.v', btn).textContent = sys ? 'off · system setting' : stage.motion() ? 'on' : 'off'
  }
  btn.addEventListener('click', () => { stage.setMotion(!stage.motion()); sync() })
  stage.onMotion(sync)
  sync()
}

function hud(stage) {
  const el = document.createElement('pre')
  el.className = 'hud'
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:90;margin:0;max-width:min(440px,calc(100% - 16px));padding:8px 10px;background:rgba(12,13,15,.86);color:#E8E9EA;font:400 10.5px/1.45 monospace;white-space:pre-wrap;pointer-events:none'
  document.body.appendChild(el)
  const draw = () => {
    const s = stage.stats.state()
    el.textContent = `active ${s.active} · lock ${s.lock} · raf ${s.raf}\nrenders ${s.renders} · frames ${s.frames} · cpu ${s.cpuMs} ms · ${s.mp} MP · calls ${s.drawCalls}\n${s.quality}${s.reason ? ' · ' + s.reason : ''}\n${s.figs}`
  }
  draw()
  setInterval(draw, 1000)
}
